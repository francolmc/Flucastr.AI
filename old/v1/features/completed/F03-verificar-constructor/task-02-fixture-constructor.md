# task-02 — Fixture con cuatro tareas para ejercitar al constructor
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Para comprobar al constructor hacen falta cuatro tareas pequeñas y un repo desechable donde ejecutarlas: una que se puede completar, una no aprobada, una que exige cambiar el alcance y una cuya verificación siempre falla. Esta tarea crea el generador de ese repo (`pruebas/fixtures/constructor.sh`) y una prueba rápida que garantiza que las cuatro tareas cumplen la plantilla y que el repo queda limpio y commiteado. No ejecuta ningún modelo.

## Contexto
- Repo: este, único repo. Los fixtures existentes (`pruebas/fixtures/basico.sh`, `medio.sh`, `real.sh`) reciben un directorio, hacen `set -euo pipefail` y reutilizan `pruebas/fixtures/_comun.sh` (`inicializar_repo DIR NOMBRE REMOTO`: `git init -q -b main`, configura `user.name` y `user.email` locales, hace dos commits y, con remoto vacío `''`, no crea remoto). Se usa tal cual; no se edita.
- Validador de tareas: `pruebas/comprobaciones/formato-tarea.mjs` exporta `validarTarea(texto)` (arreglo de errores; vacío = válida): primera línea `# task-NN — título`, segunda `repo: X   depende_de: Y   estado: Z` (tres espacios), las nueve secciones `##` en orden, «Fuera de alcance:» con texto, 1–8 pasos numerados, 1–5 criterios numerados, y sin marcadores de pendiente fuera de código.
- Pruebas: `node:test` en `pruebas/comprobaciones/*.test.mjs`, que `bash pruebas/rapida.sh` recoge por glob (sin modelo ni red, tope 30 s). Raíz: `fileURLToPath(new URL('../../', import.meta.url))`.
- Archivos a crear: `pruebas/fixtures/constructor.sh` (ejecutable, `chmod +x`) y `pruebas/comprobaciones/fixture-constructor.test.mjs`. Aún no existen: ejecución «no ejecutado, inferido».

## Decisiones ya tomadas
- Uso: `pruebas/fixtures/constructor.sh DIRECTORIO` crea `DIRECTORIO` con un repo Git (llamando a `inicializar_repo "$out" 'Demo constructor' ''`) y añade, en un tercer commit `tareas`:
  - `datos.json` con exactamente `{"v":1}` y salto de línea.
  - `verificar.sh` con `#!/usr/bin/env bash`, `echo "fallo fijo" >&2` y `exit 1`.
  - cuatro tareas en `features/F99-demo/`, todas con `repo: demo` y `depende_de: —`, cada una con 2 pasos y 1–2 criterios, cumpliendo `validarTarea`:
    1. `task-01-crear-salida.md`, estado `aprobada`. Crear `salida.txt` con una línea `hola`. Verificación: `cat salida.txt`, esperado `hola`. Fuera de alcance: cualquier otro archivo.
    2. `task-02-no-aprobada.md`, estado `borrador`. Crear `no-debe-existir.txt` con una línea `x`. Verificación: `cat no-debe-existir.txt`. Fuera de alcance: cualquier otro archivo.
    3. `task-03-escalacion.md`, estado `aprobada`. Crear `salida-escalacion.txt` con `v=2`; criterio 2: `datos.json` debe quedar exactamente `{"v":2}`. Fuera de alcance: modificar `datos.json` (contradicción deliberada con el criterio 2: cumplirla exige cambiar el alcance). Verificación: `cat datos.json`.
    4. `task-04-bloqueada.md`, estado `aprobada`. Crear `salida-bloqueada.txt` con `ok`; verificación `bash verificar.sh`, esperado código 0. Fuera de alcance: modificar `verificar.sh` (siempre falla por la misma causa).
- Las verificaciones son una sola orden simple cada una (sin `&&`, `;`, pipes ni subshells): el permiso de Bash del lanzador (task-04) acepta solo órdenes simples.
- Ningún texto de las tareas del fixture dice cómo debe reaccionar el constructor; eso lo fija `skills/ejecutar-tarea/SKILL.md`.
- La carpeta es `F99-demo` y el repo ficticio se llama `demo`; no se añade fila a `definitions/BACKLOG.md` porque el fixture vive fuera de este repo (en un directorio temporal).

## Alcance / Fuera de alcance
Alcance: el script del fixture y su prueba rápida.
Fuera de alcance: modificar `pruebas/fixtures/_comun.sh` u otros fixtures, `pruebas/rapida.sh`, `agentes/`, `skills/`; crear `features/F99-demo` dentro de este repo; ejecutar modelos; hacer commit en este repo.

## Pasos
1. Crear `pruebas/fixtures/constructor.sh` (ejecutable) con la estructura de `basico.sh`: validar un argumento, `source _comun.sh`, `inicializar_repo`, escribir `datos.json`, `verificar.sh` y las cuatro tareas, y hacer el commit `tareas`.
2. Crear `pruebas/comprobaciones/fixture-constructor.test.mjs` que ejecuta el script en un directorio de `fs.mkdtempSync(path.join(os.tmpdir(), 'flucastr-fixture-constructor-'))`.
3. En la prueba, comprobar que cada una de las cuatro tareas devuelve `[]` en `validarTarea` y que los estados son `aprobada`, `borrador`, `aprobada`, `aprobada` en ese orden.
4. En la prueba, comprobar que `git status --short` del fixture está vacío, que hay 3 commits y que `datos.json` vale `{"v":1}\n`.
5. Correr solo el archivo de prueba y luego `bash pruebas/rapida.sh`.

## Criterios de aceptación
1. El script genera las cuatro tareas y las cumple `validarTarea`. Se comprueba con la primera orden de *Verificación*.
2. El repo del fixture queda limpio, con 3 commits. Se comprueba con la primera orden.
3. El script sin argumento falla con código 2 y mensaje `uso:`. Se comprueba con la segunda orden.
4. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la tercera orden.

## Verificación
```
node --test pruebas/comprobaciones/fixture-constructor.test.mjs
bash pruebas/fixtures/constructor.sh; echo "codigo=$?"
bash pruebas/rapida.sh
```
Esperado: la primera termina con `fail 0`; la segunda imprime `uso: constructor.sh DIRECTORIO` y `codigo=2`; la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia
Ejecutado (no inferido) en este repo, tras crear `pruebas/fixtures/constructor.sh` (chmod +x) y `pruebas/comprobaciones/fixture-constructor.test.mjs`.

Verificación 1: `node --test pruebas/comprobaciones/fixture-constructor.test.mjs`
```
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (209.714583ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (237.443542ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```
Verificación 2: `bash pruebas/fixtures/constructor.sh; echo "codigo=$?"`
```
uso: constructor.sh DIRECTORIO
codigo=2
```
Verificación 3: `bash pruebas/rapida.sh`
```
ℹ todo 0
ℹ duration_ms 15904.517417
rapida: 13 archivos en 16 s (tope 30 s)
codigo=0
```

Criterios:
1. Las cuatro tareas cumplen `validarTarea` y tienen los estados `aprobada`, `borrador`, `aprobada`, `aprobada`: cubierto por la primera prueba de la verificación 1 (`fail 0`).
2. Repo limpio con 3 commits: cubierto por la segunda prueba de la verificación 1 (`git status --short` vacío, `rev-list --count HEAD` = 3, `datos.json` = `{"v":1}\n`).
3. Sin argumento: código 2 y `uso:` (verificación 2).
4. Verificación rápida en 0 y bajo 30 s (16 s, verificación 3).

Repo tras el trabajo: `git status --short` muestra solo los archivos de esta tarea y los de task-01 (`pruebas/comprobaciones/contrato-constructor.*`, que no toqué). No se hizo commit ni se tocó `_comun.sh`, `rapida.sh` ni otros fixtures.

## Notas
- Hueco menor 1: la tarea da la verificación de task-02 sin resultado esperado. Puse «Esperado: `x`.» (coherente con el criterio). Mismo criterio para task-01 («hola»), task-03 («{"v":2}») y task-04 («código 0», tomado de la tarea).
- Hueco menor 2: la prueba lee el estado con una expresión regular sobre la segunda línea; los cuatro estados son una sola palabra, así que basta.
- Hueco menor 3: el *Contexto* de cada tarea del fixture y su *Descripción* son texto propio que escribí sin especificación explícita; cumplen la plantilla (`validarTarea` = []).
- Señal: no hace falta; los huecos fueron pocos y menores.
