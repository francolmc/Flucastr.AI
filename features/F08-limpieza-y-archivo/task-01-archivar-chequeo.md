# task-01 — `scripts/archivar.mjs`: modo chequeo (solo lectura)
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Crea el script `scripts/archivar.mjs` con su modo por defecto, el **chequeo**: imprime cuánto pesa lo que los agentes leen siempre, qué filas `hecha` del backlog son largas, qué features son candidatas a archivar y cuáles son inconsistentes. Es solo lectura, sin efectos sobre archivos, y siempre termina con código 0 (es un aviso, no una puerta). Es la base del archivado (task-02) y de los avisos del `coordinador` (task-03). Diseño en `definitions/WORKFLOW.md` §10.2 y §10.4.

## Contexto
- Leídos: `definitions/WORKFLOW.md` §4, §5, §10 (diseño); `scripts/resolver.mjs` (estilo: Node ESM, sin dependencias, `import { … } from "node:fs"`, cabecera de uso en comentarios, `process.exit`); `pruebas/comprobaciones/coherencia-features.mjs` (cómo se leen filas `| Fxx |` del backlog con `celdas()` y el estado de una tarea con `RE_ESTADO = /^repo: .*estado: (.+?)\s*$/m`); `pruebas/comprobaciones/formato-flujo.mjs` (columnas del backlog: `c[0]`=ID, `c[5]`=«Por qué en esta posición», `c[6]`=Estado); `pruebas/rapida.sh` (corre `pruebas/comprobaciones/*.test.mjs` con `node --test`).
- A crear: `scripts/archivar.mjs`, `pruebas/comprobaciones/archivar.test.mjs`. Estilo de prueba: `node:test` + `node:assert/strict` (ver `pruebas/comprobaciones/formato-flujo.test.mjs`) y, para el CLI, `spawnSync` como en `pruebas/lanzadores.test.mjs`.
- Estructura real: `features/F01-…` a `features/F07-…` con `task-NN-nombre.md`; `features/completed/` **no existe aún**; no hay `refinado.md` en ninguna feature. `AGENTS.md` en la raíz del repo; `definitions/{PROJECT,REPOS,ARCHITECTURE,WORKFLOW,BACKLOG,STATUS}.md`.
- Estado actual de `pruebas/rapida.sh`: 17 archivos en ~22 s con tope 30 s: las pruebas nuevas deben ser rápidas (sin procesos pesados; crear directorios temporales con `fs.mkdtempSync`).
- Comando de prueba: `node --test pruebas/comprobaciones/archivar.test.mjs`.

## Decisiones ya tomadas
- **Supuestos de Franco, según las recomendaciones del arquitecto (Franco no respondió las preguntas abiertas de §10.6):** los umbrales son punto de partida a calibrar (`STATUS.md` > 3 KB, `BACKLOG.md` > 8 KB, `AGENTS.md` > 2 KB, fila `hecha` > 300 caracteres; `definitions/*.md` > 30 KB solo informativo); y se archiva después del PR, en su propio commit `chore/` (esto último no afecta al código del script).
- 1 KB = 1024 caracteres. Se mide en caracteres (`String.length` del texto UTF-8 leído) y líneas (`split('\n').length`, sin contar una línea vacía final).
- Umbrales como constantes con nombre al inicio del archivo (`UMBRALES`): `STATUS.md` 3072, `BACKLOG.md` 8192, `AGENTS.md` 2048, `FILA_HECHA` 300 y `DEFINICION_INFORMATIVO` 30720.
- Archivos medidos (rutas relativas a la raíz): `AGENTS.md`, `definitions/STATUS.md`, `definitions/BACKLOG.md` (con umbral de aviso) y el resto de `definitions/*.md` (solo informativo, con el umbral de 30720). Si un archivo no existe, se informa «no existe» y no es error.
- Largo de una fila `hecha` = largo de la celda «Por qué en esta posición» (`c[5]`); se marca si supera `FILA_HECHA`.
- Raíz: por defecto el directorio padre de `scripts/` (`join(dirname(fileURLToPath(import.meta.url)), "..")`); la opción `--raiz <dir>` la reemplaza (existe para las pruebas).
- API exportada: `chequear(raiz)` devuelve `{ archivos: [{ ruta, caracteres, lineas, umbral, excede, existe }], filasHecha: [{ id, largo, excede }], candidatas: [id…], inconsistentes: [{ id, motivo }], carpetasSinFilaHecha: [carpeta…] }` y `formatearInforme(resultado)` devuelve el texto. El CLI imprime `formatearInforme(chequear(raiz))` y termina en 0. Solo se ejecuta el CLI cuando el archivo es el punto de entrada (`process.argv[1]` resuelve a este archivo).
- **Candidata (todas, o no):** (1) la fila de la feature está `hecha`; (2) existe exactamente una carpeta `features/Fxx-*` con el ID de la fila; (3) esa carpeta tiene al menos un `task-*.md` y todos tienen estado `hecha`; (4) no existe `features/completed/Fxx-*`. Si falla alguna, es **inconsistente** con un motivo en español (por ejemplo «fila hecha, pero task-03 está en curso», «fila hecha sin carpeta en features/ ni en features/completed/», «carpeta sin tareas», «el destino features/completed/F01-… ya existe», «más de una carpeta F01-*»). Una fila `hecha` sin carpeta en `features/` pero con carpeta en `features/completed/` está ya archivada: no es candidata ni inconsistente.
- `carpetasSinFilaHecha`: carpetas `features/Fxx-*` con todas las tareas `hecha` pero cuya fila no está `hecha` (solo informa; el estado lo decide Franco).
- El chequeo nunca lee `features/completed/**` salvo para comprobar que existe el destino. Nunca escribe, mueve ni corrige estados.
- Informe en español, con secciones «Tamaño de lo que se lee», «Filas hechas del backlog», «Candidatas a archivar», «Inconsistentes» y «Features con tareas hechas y fila no hecha». Cada archivo que excede su umbral lleva la marca `AVISO`.

## Alcance / Fuera de alcance
Alcance: el chequeo y sus pruebas.
Fuera de alcance: `--aplicar` y cualquier movimiento de carpetas (task-02); cambios en agentes, skills, README o `definitions/` (task-03 y task-04); compactar filas `hecha` del backlog (lo hace el `planificador` por la puerta 2); modificar `pruebas/rapida.sh`; crear `features/completed/`.

## Pasos
1. Crear `scripts/archivar.mjs` con la cabecera de uso (`node scripts/archivar.mjs`, `--raiz <dir>`), `UMBRALES` y los helpers `celdas()` y `estadoTarea()` (mismos regex citados). Resultado: `node --check scripts/archivar.mjs` sin salida.
2. Implementar la medición de archivos (`archivos`) según *Decisiones*. Resultado: `chequear(raiz).archivos` lista `AGENTS.md`, `STATUS.md`, `BACKLOG.md` y los demás `definitions/*.md`.
3. Implementar `filasHecha` leyendo las filas `| Fxx |` del backlog. Resultado: una entrada por fila `hecha`, con `largo` y `excede`.
4. Implementar `candidatas`, `inconsistentes` y `carpetasSinFilaHecha` con las reglas de *Decisiones*. Resultado: cubierto por las pruebas del paso 6.
5. Implementar `formatearInforme` y el CLI (`--raiz`). Resultado: `node scripts/archivar.mjs` imprime las cinco secciones y termina con código 0.
6. Crear `pruebas/comprobaciones/archivar.test.mjs` con una raíz temporal armada por una función auxiliar (backlog mínimo, `AGENTS.md`, `definitions/STATUS.md`, carpetas de features con tareas de un estado dado) y estos casos: (a) feature `hecha` con todas sus tareas `hecha` → candidata; (b) fila `hecha` con una tarea `en curso` → inconsistente con el motivo que nombra la tarea; (c) fila `hecha` sin carpeta → inconsistente; (d) carpeta con todas las tareas `hecha` y fila `pendiente` → `carpetasSinFilaHecha`; (e) destino `features/completed/Fxx-*` ya existente → inconsistente; (f) `STATUS.md` de 3073 caracteres → `excede: true`, y de 3072 → `false`; (g) fila `hecha` con celda de 301 caracteres → `excede: true`; (h) archivo inexistente → `existe: false` sin lanzar; (i) el CLI con `--raiz` sobre la raíz temporal termina en 0, imprime «Candidatas a archivar» y **no cambia** el contenido del directorio (se compara la lista de rutas y tamaños antes y después). Resultado: pasan.
7. Añadir un caso que corra `node scripts/archivar.mjs` sin `--raiz` sobre el repo real: termina en 0 y la salida contiene «Tamaño de lo que se lee» (no se afirma qué features son candidatas: cambia cuando Franco archive). Resultado: pasa.
8. Correr la *Verificación*.

## Criterios de aceptación
1. En una raíz temporal con una feature `hecha` y todas sus tareas `hecha`, el informe la lista como candidata; con una tarea en otro estado la lista como inconsistente y nombra la tarea. Se comprueba con el caso (a)/(b) de la prueba.
2. Los umbrales de `STATUS.md` (3072) y de la fila `hecha` (300) marcan `AVISO` solo al superarlos. Casos (f)/(g).
3. El chequeo es solo lectura: el contenido del directorio no cambia y el código de salida es 0 también con inconsistencias. Caso (i).
4. `node scripts/archivar.mjs` en el repo real termina en 0 e imprime el informe. Caso del paso 7 y la *Verificación*.
5. `bash pruebas/rapida.sh` sigue pasando dentro del tope de 30 s.

## Verificación
```
node --check scripts/archivar.mjs
node --test pruebas/comprobaciones/archivar.test.mjs
node scripts/archivar.mjs; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera sin salida; la segunda con `fail 0`; la tercera imprime el informe y `salida=0`; la cuarta termina con `rapida: N archivos en S s (tope 30 s)` y código 0. `git status --short` no muestra más cambios que `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs` (más los que ya estuvieran).

## Evidencia

Rama: `git branch --show-current` → `feature/F08-limpieza-y-archivo` (creada con `git switch -c` desde `main`, que era la rama actual al empezar).

`node --check scripts/archivar.mjs` (sin salida) → código `0`.

`node --test pruebas/comprobaciones/archivar.test.mjs` → `tests 10`, `pass 10`, `fail 0`. Casos (a) a (i) y el CLI sobre el repo real pasan.

`node scripts/archivar.mjs; echo "salida=$?"`:

```
Chequeo de contexto y archivo (solo lectura; definitions/WORKFLOW.md §10)

## Tamaño de lo que se lee
- AGENTS.md: 1141 caracteres, 10 líneas (umbral 2048)
- definitions/STATUS.md: 2056 caracteres, 30 líneas (umbral 3072)
- definitions/BACKLOG.md: 10023 caracteres, 28 líneas (umbral 8192) AVISO
- definitions/ARCHITECTURE.md: 8559 caracteres, 139 líneas (umbral 30720)
- definitions/PROJECT.md: 15195 caracteres, 136 líneas (umbral 30720)
- definitions/REPOS.md: 1757 caracteres, 30 líneas (umbral 30720)
- definitions/WORKFLOW.md: 37488 caracteres, 354 líneas (umbral 30720) AVISO

## Filas hechas del backlog
- F01: 155 caracteres (umbral 300)
- F02: 180 caracteres (umbral 300)
- F03: 897 caracteres (umbral 300) AVISO
- F04: 207 caracteres (umbral 300)
- F05: 901 caracteres (umbral 300) AVISO
- F06: 409 caracteres (umbral 300) AVISO
- F07: 550 caracteres (umbral 300) AVISO

## Candidatas a archivar
- F01
- F02
- F03
- F04
- F05
- F06
- F07

## Inconsistentes
- ninguna

## Features con tareas hechas y fila no hecha
- ninguna
salida=0
```

`bash pruebas/rapida.sh` → código `0`; última línea `rapida: 18 archivos en 22 s (tope 30 s)`; `tests 168`, `pass 168`, `fail 0`.

`git status --short` (tras la tarea): `?? pruebas/comprobaciones/archivar.test.mjs`, `?? scripts/archivar.mjs`, y lo ajeno ya presente (`M definitions/*.md`, `?? features/F08-limpieza-y-archivo/`), sin tocar por esta tarea.

Criterios: (1) feature hecha con tareas hechas → candidata; con tarea en otro estado → inconsistente que nombra la tarea (casos a y b). (2) `AVISO` solo al superar 3072 y 300 (casos f y g). (3) solo lectura y código 0 también con inconsistencias (caso i). (4) el repo real termina en 0 e imprime el informe (CLI). (5) `rapida.sh` pasa en 22 s, dentro de 30 s.

## Notas

- Rama: se creó `feature/F08-limpieza-y-archivo` desde `main` (rama actual). No existía antes, así que no hubo `CONFIRMAR:`.
- Antes de crear la rama, `git status --short` ya tenía cambios ajenos a la tarea: `M definitions/BACKLOG.md`, `M definitions/STATUS.md`, `?? features/F08-limpieza-y-archivo/`. No se tocaron. Después aparecieron `M` en `definitions/ARCHITECTURE.md`, `definitions/PROJECT.md` y `definitions/WORKFLOW.md`, que es la edición del arquitecto en paralelo; tampoco se tocaron. Git no ejecutó nada sobre ellos (solo `git switch -c`, que conserva el árbol de trabajo).
- Huecos menores resueltos: (1) el umbral informativo de 30720 se aplica a todos los `definitions/*.md` salvo `STATUS.md` y `BACKLOG.md`, en orden alfabético; (2) un argumento desconocido en el CLI va a stderr y no cambia el código 0; (3) el destino de `features/completed/` se compara por el prefijo `Fxx-`, así que una carpeta ya archivada con otro sufijo también cuenta como destino existente; (4) las motivos de una feature con varias tareas no hechas se listan una por línea en «Inconsistentes».
- Ninguna escritura fuera de `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs`, más el campo `estado` y *Evidencia*/*Notas* de la tarea. No hubo commit, push, PR, merge ni cambios a `definitions/STATUS.md`.
- El resultado del chequeo sobre el repo real marca F01 a F07 como candidatas: es correcto según las reglas, porque sus filas están `hecha` y sus carpetas tienen todas las tareas `hecha`. Franco decide cuándo archivar (task-02).
