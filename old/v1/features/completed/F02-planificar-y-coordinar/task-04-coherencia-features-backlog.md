# task-04 — Comprobación de coherencia entre features/ y BACKLOG.md
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`features/` y `definitions/BACKLOG.md` llevan el mismo estado en dos sitios: una carpeta `F03-…` sin fila en el backlog, una feature `hecha` con tareas sin cerrar, o dos tareas con el mismo número dejarían al coordinador decidiendo con datos contradictorios. Esta tarea añade un validador determinista de esa coherencia y una prueba que lo aplica al repo real. Entra sola en `pruebas/rapida.sh` por su glob.

## Contexto
- Repo: este, único repo. Node 25, ESM, `node:test`, sin dependencias; mismo estilo que `pruebas/comprobaciones/formato-flujo.mjs` y `formato-tarea.mjs` (validador que devuelve un arreglo de errores en español; vacío = válido) y `formato-flujo.test.mjs` (raíz con `fileURLToPath(new URL('../../', import.meta.url))`).
- Estructura real leída: `features/F01-base-verificacion-rapida/task-01…05-*.md` y `features/F02-planificar-y-coordinar/task-0N-*.md`. Carpeta de cierre prevista: `features/completed/` (`definitions/WORKFLOW.md` §5; hoy no existe).
- Primera línea de tarea: `# task-NN — título`; segunda: `repo: …   depende_de: …   estado: …` (formato de `formato-tarea.mjs`).
- Filas del backlog: `| F01 | … | hecha | |` (celdas separadas por `|`; la de ID es la primera, la de Estado la séptima).
- Archivos a crear: `pruebas/comprobaciones/coherencia-features.mjs` y `pruebas/comprobaciones/coherencia-features.test.mjs`.

## Decisiones ya tomadas
- `coherencia-features.mjs` exporta `validarCoherencia({ backlog, features })` y devuelve un arreglo de errores en español; no lanza. `backlog` es el texto de `BACKLOG.md`. `features` es un arreglo de `{ carpeta, tareas }` donde `carpeta` es el nombre (`F02-planificar-y-coordinar`) y `tareas` un arreglo de `{ archivo, texto }` (nombre del archivo y su contenido). El módulo no lee el disco; solo la prueba lo hace.
- Reglas, cada una con mensaje propio:
  1. El nombre de carpeta cumple `/^F\d{2}-[a-z0-9-]+$/` y su ID (`F02`) existe como fila en el backlog.
  2. Los nombres de archivo de tarea cumplen `/^task-(\d{2})-[a-z0-9-]+\.md$/`; los números son únicos y consecutivos desde 01; el número de la primera línea del texto (`# task-NN`) coincide con el del nombre del archivo.
  3. Cada ID en `depende_de` (o `—`) corresponde a una tarea de la misma carpeta con número menor al de la tarea.
  4. Si la feature está `hecha` en el backlog, todas sus tareas tienen `estado: hecha`.
  5. Si una tarea está `en curso`, `lista para revisión` o `bloqueada`, la feature no está `hecha` en el backlog.
- Se ignora la carpeta `features/completed/` (la prueba no la incluye en `features`).
- La prueba hace tres cosas: (a) una muestra válida (backlog de dos features y dos carpetas) da `[]`; (b) una variante por regla (cinco; la regla 2 con tres variantes: número repetido, hueco, primera línea distinta del nombre), cada una devuelve al menos un error; (c) lee `definitions/BACKLOG.md` y los `features/F*/task-*.md` reales (excluyendo `completed`) y exige `[]`, con al menos dos carpetas.
- Estados de tarea: se leen con `/^repo: .*estado: (.+?)\s*$/m`.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar `BACKLOG.md`, las tareas existentes, `rapida.sh`, `formato-flujo.mjs` o `formato-tarea.mjs`; reutilizar o cambiar sus reglas; mover carpetas a `features/completed/`; hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/coherencia-features.mjs` con `validarCoherencia` y las cinco reglas.
2. Crear `pruebas/comprobaciones/coherencia-features.test.mjs` con la muestra válida y las siete variantes negativas.
3. En el mismo archivo de prueba, añadir la prueba sobre el repo real, leyendo con `fs.readdirSync`.
4. Correr solo el archivo nuevo y confirmar que pasa.
5. Correr `bash pruebas/rapida.sh` y confirmar que sigue en 0, bajo 30 s y con un archivo más que antes.

## Criterios de aceptación
1. `validarCoherencia` acepta la muestra y rechaza las siete variantes. Se comprueba con la primera orden de *Verificación*.
2. El repo real pasa la validación con al menos dos carpetas de feature. Se comprueba con la primera orden.
3. Una alteración en memoria del backlog real (renombrar el ID `F02` a `F09`) se rechaza. Se comprueba con la segunda orden.
4. `bash pruebas/rapida.sh` sale con 0, bajo 30 s, e incluye el archivo nuevo. Se comprueba con la tercera orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --input-type=module -e 'import fs from "node:fs"; import {validarCoherencia} from "./pruebas/comprobaciones/coherencia-features.mjs"; const b=fs.readFileSync("definitions/BACKLOG.md","utf8").replace("| F02 |","| F09 |"); const f=fs.readdirSync("features").filter(d=>/^F\d{2}-/.test(d)).map(c=>({carpeta:c,tareas:fs.readdirSync("features/"+c).filter(n=>n.endsWith(".md")).map(n=>({archivo:n,texto:fs.readFileSync("features/"+c+"/"+n,"utf8")}))})); console.log(validarCoherencia({backlog:b,features:f}).length>0?"RECHAZADO":"ACEPTADO")'
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `ℹ fail 0` con `ℹ pass` igual a `ℹ tests` (al menos 9); `RECHAZADO`; y `ℹ fail 0` seguido de `rapida: K archivos en M s (tope 30 s)` con M ≤ 30, donde K es una unidad mayor que el valor previo a la tarea (hoy son 9 archivos).

## Evidencia

Archivos nuevos: `pruebas/comprobaciones/coherencia-features.mjs` y `pruebas/comprobaciones/coherencia-features.test.mjs`. No se tocó ningún otro archivo de la tarea.

Paso 4 — `node --test pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`:
```
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

Verificación 1 (muestra válida, las siete variantes y el repo real), salida completa de la prueba:
```
✔ muestra válida: no hay errores
✔ regla 1: ID de carpeta ausente del backlog se rechaza
✔ regla 2: número de tarea repetido se rechaza
✔ regla 2: hueco en la numeración se rechaza
✔ regla 2: primera línea con número distinto al del archivo se rechaza
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza
✔ regla 4: feature hecha con una tarea sin hacer se rechaza
✔ regla 5: tarea bloqueada en una feature hecha se rechaza
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

Verificación 2 (alteración en memoria del backlog real, `F02` → `F09`):
```
RECHAZADO
```
Con el backlog real sin alterar, `validarCoherencia` devuelve `[]`, con 2 carpetas de feature (F01, F02).

Verificación 3 (`bash pruebas/rapida.sh`):
```
ℹ fail 0
rapida: 10 archivos en 14 s (tope 30 s)
bash pruebas/rapida.sh 2>&1  8.27s user 4.29s system 90% cpu 13.820 total
exit=0
```
Antes eran 9 archivos; ahora 10. Tiempo 14 s, bajo el tope de 30 s.

Criterios de aceptación:
1. Muestra aceptada y siete variantes rechazadas: cumplido (9/9 pasan, incluidas las siete variantes negativas).
2. Repo real con al menos dos carpetas y sin errores: cumplido (`[]`).
3. Renombrar `F02` a `F09` en el backlog real: cumplido (`RECHAZADO`).
4. `rapida.sh` sale con 0, bajo 30 s, con el archivo nuevo incluido: cumplido (`exit=0`, 14 s, 10 archivos).

Nota sobre el estado del árbol: `git status` muestra cambios en `agentes/coordinador.md`, `definitions/BACKLOG.md`, `definitions/STATUS.md` y `skills/descomponer-feature/SKILL.md` que no son de esta tarea (pertenecen a otros constructores o a trabajo previo). No se tocaron.

## Notas
- Huecos menores resueltos:
  - Regla 1: la comprobación «ID presente en el backlog» se implementó en la misma regla que el nombre de carpeta; la variante negativa de esa regla es la alteración `F02` → `F09`.
  - Reglas 4 y 5: solo se aplican cuando el backlog tiene estado para el ID de la carpeta. Si falta la fila, la regla 1 ya lo reporta.
  - Regla 5: sus violaciones siempre van acompañadas de violaciones de la regla 4 (solo se puede incumplir si la feature está `hecha`, y entonces alguna tarea no es `hecha`). La variante de la regla 5 comprueba su propio mensaje; la de la regla 4 usa `aprobada` para aislar su mensaje.
  - Las tareas que no cumplen `task-NN-nombre.md` se reportan en la regla 2 y se excluyen de las reglas 3 a 5.
  - Regla 2: «consecutivos desde 01» se comprueba sobre los números únicos ordenados, de modo que un número repetido no genera además un falso hueco.
- El módulo no lee el disco; la prueba real es la única que lo hace, con `fs.readdirSync`.
- Sin señal de tarea incompleta: los huecos fueron pocos y menores.
