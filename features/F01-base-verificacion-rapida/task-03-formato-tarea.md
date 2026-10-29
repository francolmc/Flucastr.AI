# task-03 — Comprobación del formato de las tareas
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Una tarea mal formada (sin «Fuera de alcance», con 12 pasos, con un marcador de pendiente) obliga al constructor a detenerse o adivinar. Esta tarea añade un validador determinista de la plantilla de `definitions/WORKFLOW.md` §6 y una prueba que lo aplica a todas las tareas de `features/`. Entra en la verificación rápida sin tocar `rapida.sh`, porque esta recoge por glob los `*.test.mjs` de `pruebas/comprobaciones/`.

## Contexto
- Repo: este, único repo. Node 25, módulos ESM, `node:test` y `node:assert/strict` (convención de `pruebas/capa1/instalacion.test.mjs`). Sin dependencias externas.
- Plantilla (leída en `definitions/WORKFLOW.md` §6 y `skills/descomponer-feature/SKILL.md`): primera línea `# task-NN — título`; segunda línea `repo: …   depende_de: …   estado: …` separada por tres espacios; nueve secciones `##` en orden: `Descripción`, `Contexto`, `Decisiones ya tomadas`, `Alcance / Fuera de alcance`, `Pasos`, `Criterios de aceptación`, `Verificación`, `Evidencia`, `Notas`. Estados válidos: `borrador`, `aprobada`, `en curso`, `lista para revisión`, `hecha`, `bloqueada`.
- Tareas reales a las que se aplicará: `features/F01-base-verificacion-rapida/task-0*.md` (existen; en `borrador`, con `Evidencia` y `Notas` vacías).
- Archivos a crear: `pruebas/comprobaciones/formato-tarea.mjs` y `pruebas/comprobaciones/formato-tarea.test.mjs`.
- Estilo de las pruebas existentes: nombres de prueba en español; controles negativos con `assert.throws`/`assert.ok` sobre una muestra alterada.

## Decisiones ya tomadas
- `formato-tarea.mjs` exporta `validarTarea(texto)`, que devuelve un arreglo de mensajes de error en español (vacío = válida). No lanza excepciones.
- Reglas, cada una con mensaje propio:
  1. La primera línea cumple `/^# task-\d{2} — \S/`.
  2. La segunda línea cumple `/^repo: (\S.*?) {2,}depende_de: (\S.*?) {2,}estado: (borrador|aprobada|en curso|lista para revisión|hecha|bloqueada)\s*$/`, y `depende_de` es `—` o una lista `task-NN` separada por `, `.
  3. Las líneas que empiezan por `## ` (ignorando bloques de código delimitados por tres comillas invertidas) son exactamente las nueve secciones, en ese orden.
  4. Todas las secciones salvo `Evidencia` y `Notas` tienen cuerpo no vacío; `Evidencia` no puede estar vacía si el estado es `lista para revisión` o `hecha`.
  5. El cuerpo de `Alcance / Fuera de alcance` cumple `/Fuera de alcance:\s*\S/`.
  6. `Pasos` tiene entre 1 y 8 líneas que cumplen `/^\d+\. /`.
  7. `Criterios de aceptación` tiene entre 1 y 5 líneas que cumplen `/^\d+\. /`.
  8. El texto, tras quitar bloques de código y fragmentos entre comillas invertidas, no contiene `/\b(TBD|a definir|según corresponda)\b/i`.
- La prueba (`formato-tarea.test.mjs`) hace tres cosas: (a) una muestra válida en el propio archivo da `[]`; (b) nueve variantes de esa muestra, una por violación (regla 1, 2 con estado inválido, 2 con `depende_de` inválido, 3, 4, 5, 6 con 9 pasos, 7 con 6 criterios, 8), cada una devuelve al menos un error; (c) todos los `task-*.md` bajo `features/` (recorrido con `fs.readdirSync(dir, { recursive: true })`, raíz resuelta desde `import.meta.url` dos niveles arriba de `pruebas/comprobaciones/`) dan `[]`, y se exige que haya al menos uno.
- Además, para cada tarea real, cada ID en `depende_de` corresponde a un archivo `<ID>-*.md` en la misma carpeta.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar `rapida.sh`, `WORKFLOW.md`, las skills o las tareas existentes; validar el contenido semántico (que las rutas existan, que la verificación corra); validar `BACKLOG.md` o `STATUS.md` (task-04); hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/formato-tarea.mjs` con `validarTarea` y las ocho reglas de *Decisiones ya tomadas*.
2. Crear `pruebas/comprobaciones/formato-tarea.test.mjs` con la muestra válida y las nueve variantes negativas.
3. En el mismo archivo de prueba, añadir la prueba sobre las tareas reales de `features/` y la comprobación de `depende_de`.
4. Correr solo el archivo nuevo y confirmar que pasa.
5. Correr `bash pruebas/rapida.sh` y confirmar que sigue en 0 y bajo 30 s.

## Criterios de aceptación
1. `validarTarea` acepta la muestra válida y rechaza cada una de las nueve variantes. Se comprueba con la primera orden (todas las pruebas del archivo pasan).
2. Las tareas reales de `features/` pasan la validación y existe al menos una. Se comprueba con la primera orden.
3. Una tarea real con un defecto introducido (leída en memoria, sin modificar el archivo) se rechaza. Se comprueba con la segunda orden.
4. `bash pruebas/rapida.sh` sigue saliendo con 0, con `rapida: 8 archivos` y N ≤ 30. Se comprueba con la tercera orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/formato-tarea.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --input-type=module -e 'import fs from "node:fs"; import {validarTarea} from "./pruebas/comprobaciones/formato-tarea.mjs"; const t=fs.readFileSync("features/F01-base-verificacion-rapida/task-01-limpieza-pruebas.md","utf8").replace("Fuera de alcance:","Sin límites:"); console.log(validarTarea(t).length>0?"RECHAZADA":"ACEPTADA")'
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `ℹ fail 0` con `ℹ pass` igual a `ℹ tests` (al menos 11); `RECHAZADA`; y `ℹ fail 0` seguido de `rapida: 8 archivos en N s (tope 30 s)`.

## Evidencia

Corridas desde `/Users/franco/Codes/flucastr/Flucastr.AI`, Node v25.8.1, zsh.

Paso 4 (solo el archivo nuevo), `node --test pruebas/comprobaciones/formato-tarea.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`:
```
ℹ tests 13
ℹ pass 13
ℹ fail 0
```
Código de salida de esa misma prueba (corrida aparte): `0`.

Criterio 3, `node --input-type=module -e '...validarTarea...' ` sobre `task-01-limpieza-pruebas.md` con `Fuera de alcance:` cambiado por `Sin límites:`:
```
RECHAZADA
```

Paso 5, `bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"`:
```
ℹ fail 0
rapida: 8 archivos en 13 s (tope 30 s)
```
Código de salida de `bash pruebas/rapida.sh` (corrida aparte, `echo "codigo_salida_rapida=$?"`): `codigo_salida_rapida=0`.

Estado del árbol tras el trabajo (`git status --short`), sin tocar nada ajeno:
```
 M features/F01-base-verificacion-rapida/task-03-formato-tarea.md
?? pruebas/comprobaciones/formato-tarea.mjs
?? pruebas/comprobaciones/formato-tarea.test.mjs
```

Criterios de aceptación:
1. `validarTarea` acepta la muestra y rechaza las nueve variantes: sí, pruebas «la muestra válida no produce errores» y «rechaza una tarea con violación de …» pasan (13/13).
2. Las tareas reales de `features/` pasan y existen: sí, prueba «las tareas reales de features/ cumplen el formato» pasa (incluye `task-01` a `task-05` y esta).
3. Tarea real con defecto introducido en memoria se rechaza: sí, `RECHAZADA`.
4. `rapida.sh` sale con 0, `rapida: 8 archivos`, 13 s ≤ 30 s: sí.

## Notas
Decisiones menores tomadas (huecos no cubiertos por la tarea):
- Bloques de código: se reconocen por líneas que empiezan por tres comillas invertidas, con alternancia abierto/cerrado; dentro de ellos no se buscan encabezados `## ` ni marcadores.
- Regla 3: además del mensaje de orden exacto, cada sección ausente genera «Falta la sección «## …»», para que el error sea concreto.
- Regla 4: la exigencia de `Evidencia` no vacía se aplica solo con estado `lista para revisión` o `hecha`, tal como pide la tarea.
- Regla 8: se quitan bloques de código y fragmentos entre comillas invertidas (en una línea) antes de buscar `TBD`, `a definir` o `según corresponda`.
- Prueba extra no pedida: «exige Evidencia no vacía con estado «lista para revisión»», porque la regla 4 tiene esa parte y las nueve variantes no la cubren.
- La prueba de `depende_de` recorre las tareas reales y busca `<ID>-*.md` en la misma carpeta; se usa `.startsWith`/`.endsWith` sobre los nombres de los hermanos.
- `rapida.sh` no se modificó: el glob de `pruebas/comprobaciones/*.test.mjs` recogió el archivo nuevo; la corrida final cuenta 8 archivos, incluido el nuevo.

Huecos menores: los listados arriba, todos resueltos con la opción más conservadora. Son pocos, así que no aplica la señal de tarea incompleta.
