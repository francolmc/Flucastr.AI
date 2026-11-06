# task-04 — Comprobación del formato de BACKLOG.md y STATUS.md
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`BACKLOG.md` y `STATUS.md` son los archivos con los que el coordinador decide el paso siguiente; si cambian de forma, el flujo se desorienta sin avisar. Esta tarea (tras task-03, que ya añadió un archivo de prueba) añade validadores deterministas de su estructura (`definitions/WORKFLOW.md` §3 y §4) y una prueba que los aplica a los archivos reales si existen. Entra en la verificación rápida por el glob de `rapida.sh`.

## Contexto
- Repo: este, único repo. Node 25, ESM, `node:test`, `node:assert/strict`. Sin dependencias.
- `definitions/BACKLOG.md` (leído): tabla con encabezado `| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |`, filas `| F01 | … |`, una línea `Estado del documento: aprobado`, una sola fila marcada con `→` en la última columna. `WORKFLOW.md` §4: estados `pendiente`, `en curso`, `hecha`; la primera pendiente va marcada. `skills/crear-backlog/SKILL.md`: máximo 6 features.
- `definitions/STATUS.md` (leído): título `# Estado del flujo` y secciones `##` en este orden: `Escalación`, `Paso actual`, `Espera a Franco`, `Bloqueos abiertos`, `Última actualización` (con fecha `YYYY-MM-DD`). `Escalación` puede estar vacía.
- Ambos archivos son estado de ejecución y `WORKFLOW.md` §7 dice que los de prueba se borran antes de la corrida real; por eso la prueba sobre los reales se omite si el archivo no existe.
- Archivos a crear: `pruebas/comprobaciones/formato-flujo.mjs` y `pruebas/comprobaciones/formato-flujo.test.mjs`.

## Decisiones ya tomadas
- `formato-flujo.mjs` exporta `validarBacklog(texto)` y `validarStatus(texto)`; ambos devuelven un arreglo de mensajes de error en español (vacío = válido) y no lanzan.
- Reglas de `validarBacklog`:
  1. Existe una fila de encabezado cuyas 8 celdas, recortadas, son exactamente: `ID`, `Feature`, `Tipo (habilitante / producto)`, `Valor`, `Esfuerzo`, `Por qué en esta posición`, `Estado`, `Siguiente`, y la sigue una fila separadora `|---|…`.
  2. Las filas de datos son las líneas que cumplen `/^\| F\d{2} \|/`; hay entre 1 y 6, cada una con 8 celdas (separar por `|` sin barras escapadas), IDs únicos.
  3. `Tipo` ∈ {`habilitante`, `producto`}; `Estado` ∈ {`pendiente`, `en curso`, `hecha`}; `Siguiente` es vacío o `→`.
  4. Si alguna fila tiene estado distinto de `hecha`, hay exactamente un `→` y está en la primera fila con estado distinto de `hecha`; si todas son `hecha`, no hay ninguno.
  5. Existe una línea que cumple `/^Estado del documento: (borrador|aprobado)\s*$/m`.
- Reglas de `validarStatus`:
  1. La primera línea es `# Estado del flujo`.
  2. Las líneas `## ` son exactamente `Escalación`, `Paso actual`, `Espera a Franco`, `Bloqueos abiertos`, `Última actualización`, en ese orden.
  3. `Paso actual`, `Espera a Franco`, `Bloqueos abiertos` y `Última actualización` tienen cuerpo no vacío; `Escalación` puede estar vacía.
  4. El cuerpo de `Última actualización` cumple `/^\d{4}-\d{2}-\d{2}\s*$/m`.
- La prueba incluye: muestras válidas propias (no copias de los archivos reales); 6 variantes negativas de backlog (encabezado alterado, 7 features, Estado inválido, dos `→`, `→` en fila no primera pendiente, falta «Estado del documento») y 3 de status (sección faltante, orden cambiado, fecha inválida), cada una con al menos un error; y la aplicación a `definitions/BACKLOG.md` y `definitions/STATUS.md` reales, solo si existen (`fs.existsSync`; si no existen, `t.skip()`).

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos.
Fuera de alcance: modificar `BACKLOG.md`, `STATUS.md`, `WORKFLOW.md`, las skills o `rapida.sh`; validar el contenido de las celdas más allá de las reglas; validar tareas (task-03); hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/formato-flujo.mjs` con `validarBacklog` y `validarStatus` según las reglas.
2. Crear `pruebas/comprobaciones/formato-flujo.test.mjs` con las muestras válidas y las 9 variantes negativas.
3. Añadir en ese archivo las pruebas sobre `definitions/BACKLOG.md` y `definitions/STATUS.md` reales (omitidas si no existen).
4. Correr solo el archivo nuevo y confirmar que pasa.
5. Correr `bash pruebas/rapida.sh` y confirmar 0 y bajo 30 s.

## Criterios de aceptación
1. Ambos validadores aceptan sus muestras válidas y rechazan cada una de las 9 variantes. Se comprueba con la primera orden.
2. Los archivos reales `definitions/BACKLOG.md` y `definitions/STATUS.md` pasan hoy (existen en el árbol). Se comprueba con la segunda orden (debe imprimir `OK OK`).
3. El validador rechaza un backlog real alterado (dos `→`). Se comprueba con la tercera orden.
4. `bash pruebas/rapida.sh` sale con 0, con `rapida: 9 archivos en N s (tope 30 s)` y N ≤ 30. Se comprueba con la cuarta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --input-type=module -e 'import fs from "node:fs"; import {validarBacklog,validarStatus} from "./pruebas/comprobaciones/formato-flujo.mjs"; console.log(validarBacklog(fs.readFileSync("definitions/BACKLOG.md","utf8")).length===0?"OK":"MAL", validarStatus(fs.readFileSync("definitions/STATUS.md","utf8")).length===0?"OK":"MAL")'
node --input-type=module -e 'import fs from "node:fs"; import {validarBacklog} from "./pruebas/comprobaciones/formato-flujo.mjs"; const t=fs.readFileSync("definitions/BACKLOG.md","utf8").replace("| pendiente | |\n| F03","| pendiente | → |\n| F03"); console.log(validarBacklog(t).length>0?"RECHAZADO":"ACEPTADO")'
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `ℹ fail 0` con `ℹ pass` igual a `ℹ tests`; `OK OK`; `RECHAZADO`; y `ℹ fail 0` seguido de `rapida: 9 archivos en M s (tope 30 s)` con M ≤ 30.

## Evidencia

Corrida nueva desde `/Users/franco/Codes/flucastr/Flucastr.AI` (zsh). Se pega la salida real de cada orden de *Verificación* tal cual. No se usa `PIPESTATUS`: los códigos de salida se midieron en una corrida aparte con `>/dev/null` y `$?`.

Verificación 1, `node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`:
```
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

Verificación 2, `node --input-type=module -e '...validarBacklog... validarStatus...'` (sobre los archivos reales):
```
OK OK
```

Verificación 3, `node --input-type=module -e '...replace("| pendiente | |\n| F03","| pendiente | → |\n| F03")...'`:
```
RECHAZADO
```

Verificación 4, `bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"`:
```
ℹ fail 0
rapida: 9 archivos en 15 s (tope 30 s)
```

Códigos de salida (corridas aparte con `>/dev/null`):
```
exit test=0
exit rapida=0
```

Estado del árbol (`git status --short`), sin commit:
```
 M definitions/BACKLOG.md
 M definitions/STATUS.md
 M features/F01-base-verificacion-rapida/task-04-formato-backlog-status.md
?? pruebas/comprobaciones/formato-flujo.mjs
?? pruebas/comprobaciones/formato-flujo.test.mjs
```
`BACKLOG.md` y `STATUS.md` ya estaban modificados al empezar esta ejecución; no los toqué. Tampoco toqué los demás cambios sin commitear.

Criterios:
1. Cumplido: las muestras válidas y las 9 variantes negativas pasan en `formato-flujo.test.mjs` (13 de 13).
2. Cumplido: `OK OK` sobre `definitions/BACKLOG.md` (6 features, `Estado del documento: aprobado`) y `definitions/STATUS.md`.
3. Cumplido: el backlog real aprobado es válido (`OK` antes de alterarlo) y la alteración con dos `→` da `RECHAZADO`.
4. Cumplido: `rapida.sh` sale con 0, `ℹ fail 0` y `rapida: 9 archivos en 15 s (tope 30 s)`, con 15 ≤ 30.

## Notas
- Reabierta por Franco: estado `aprobada`, pasó a `en curso` y luego a `lista para revisión`.
- Bloqueo previo, resuelto (resumen): la ejecución anterior quedó `bloqueada` porque `definitions/BACKLOG.md` estaba en borrador con 7 features y con texto tras «borrador», y la regla 2 (1 a 6 features) y la regla 5 (`Estado del documento`) lo rechazaban. Franco corrigió el backlog a 6 features y lo aprobó (`Estado del documento: aprobado`). Esta corrida pasa; no edité `BACKLOG.md` ni `STATUS.md`.
- Revisión contra la tarea: `formato-flujo.mjs` y `formato-flujo.test.mjs` ya cubrían las reglas 1 a 5 de `validarBacklog`, las reglas 1 a 4 de `validarStatus`, las muestras válidas, las 9 variantes negativas y las dos pruebas sobre los archivos reales con `t.skip()`. No cambié código.
- Hueco menor: la tarea no decía si `aprobado` vale como estado de documento. El validador ya lo acepta (`/^Estado del documento: (borrador|aprobado)\s*$/m`), así que lo dejé como está; la prueba real pasa con esa línea.
- La verificación 3 ahora rechaza por la regla de dos `→` sobre un backlog real válido. Antes había un error previo, así que el rechazo no probaba esa regla.
- Códigos de salida medidos en corridas aparte, sin `PIPESTATUS`, como indica la tarea.
- Sin commit, push, PR, merge ni despliegue. En la tarea solo toqué *Evidencia*, *Notas* y `estado`.
