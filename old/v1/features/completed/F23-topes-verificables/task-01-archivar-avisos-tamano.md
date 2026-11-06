# task-01 — Chequeo de `archivar.mjs`: aviso de STATUS a 1,5 KB y de tareas a 6 KB
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`definitions/CONTEXTO.md` §2.3 fija dos avisos: `STATUS.md` a 1,5 KB (hoy el umbral es 3 KB) y tarea a 6 KB. El chequeo `scripts/archivar.mjs` mide hoy `STATUS.md` a 3072 y no mide tareas. Esta tarea baja el umbral de `STATUS.md` a 1536 y agrega al informe una sección con las tareas de `features/` (sin `completed/`) que superan 6144 caracteres. Ambos son solo aviso: el CLI sigue terminando en 0.

## Contexto
- Tocar: `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs`. No tocar otros archivos.
- `scripts/archivar.mjs`: `UMBRALES` (líneas 19-25: `STATUS: 3072`, `BACKLOG`, `AGENTS`, `FILA_HECHA`, `DEFINICION_INFORMATIVO`); constantes `RE_CARPETA` y `RE_TAREA` (líneas 27-32); `listarCarpetas(dir)`; `chequear(raiz)` devuelve `{ archivos, filasHecha, candidatas, inconsistentes, carpetasSinFilaHecha }` y calcula `dirFeatures = join(raiz, "features")` y `carpetas` (sin `completed`, porque `RE_CARPETA = /^F\d{2}-/`); `formatearInforme(r)` imprime secciones `## ...` y usa `aviso(excede)` que añade « AVISO».
- `pruebas/comprobaciones/archivar.test.mjs`: helper `raizTemporal({ filas, carpetas, completed, status })` crea tareas de ~70 caracteres; el test `(f)` (línea ~97) usa los literales 3073 y 3072; el test `(i)` usa el CLI con `--raiz`. Se ejecuta con `node --test`.
- Convención: 1 KB = 1024 caracteres (comentario de la línea 18); el largo se mide con `texto.length`, igual que `medirArchivo`.
- Referencia: `definitions/CONTEXTO.md` §2.3; `definitions/WORKFLOW.md` §10.4 (ya describe `STATUS.md` > 1,5 KB y tareas > 6 KB; no se edita).

## Decisiones ya tomadas
- `UMBRALES.STATUS = 1536` y nueva `UMBRALES.TAREA = 6144`. Solo aviso; `STATUS.md` NO falla ni cambia el código de salida.
- Nueva clave de `chequear`: `tareasGrandes`, arreglo de `{ ruta, caracteres, umbral }` con `ruta` relativa a la raíz y con `/` (ej. `features/F23-x/task-01-y.md`), solo las tareas con `caracteres > UMBRALES.TAREA`, ordenadas por ruta. Se recorren las carpetas `F\d{2}-*` de `features/` que cumplen `RE_CARPETA`; `completed/` se omite.
- Nueva sección del informe, entre «Tamaño de lo que se lee» y «Filas hechas del backlog»: `## Tareas sobre el umbral`; sin ninguna imprime `- ninguna`; cada una `- <ruta>: <n> caracteres (umbral 6144) AVISO`.
- El resto del informe y de `chequear` no cambia.

## Alcance / Fuera de alcance
Alcance: umbral de `STATUS.md`, sección de tareas, pruebas del archivo `archivar.test.mjs`.
Fuera de alcance: error a 8 KB (tarea-02), editar `WORKFLOW.md`, `CONTEXTO.md` o `README.md`, endurecer `STATUS.md` a error, cambiar `--aplicar`.

## Pasos
1. En `scripts/archivar.mjs`, cambiar `STATUS: 3072` por `STATUS: 1536` y agregar `TAREA: 6144` en `UMBRALES`.
2. En `chequear`, después de calcular `carpetas`, construir `tareasGrandes` leyendo cada `task-NN-*.md` (`RE_TAREA`) de esas carpetas; incluirlo en el objeto devuelto.
3. En `formatearInforme`, imprimir la sección `## Tareas sobre el umbral` con el formato decidido.
4. En `archivar.test.mjs`, cambiar el test `(f)` a 1537 / 1536 (usando `UMBRALES.STATUS`) y los textos «3073»/«3072» del título y de los `assert.equal`.
5. Agregar el test `(j)`: una raíz con `F01-base` cuya tarea se reescribe con 6145 caracteres aparece en `tareasGrandes` con `excede` implícito y su línea del informe termina en « AVISO»; con 6144 no aparece; una tarea grande dentro de `features/completed/` no aparece.
6. Agregar el test `(k)`: con `STATUS.md` de 1537 caracteres y una tarea de 6145, el CLI con `--raiz` termina en 0 y el informe contiene `AVISO`.

## Criterios de aceptación
1. `node scripts/archivar.mjs --raiz <raiz con STATUS.md de 1537 caracteres>` imprime la línea de `STATUS.md` con « AVISO»; con 1536 no. Se comprueba con el test `(f)`.
2. Una tarea de 6145 caracteres en `features/Fxx-*` se informa con « AVISO» y una de 6144 no; una en `features/completed/` no se informa. Test `(j)`.
3. El CLI termina en 0 aun con avisos. Test `(k)`.
4. `definitions/STATUS.md` real (hoy ~1,4 KB) no produce aviso. Se comprueba con el comando de Verificación.
5. La suite de `archivar.test.mjs` pasa completa.

## Verificación
```
node --test pruebas/comprobaciones/archivar.test.mjs
node scripts/archivar.mjs | sed -n 1,20p
bash pruebas/rapida.sh
```
Salida esperada: `ℹ fail 0` en el primero; el informe real muestra `## Tareas sobre el umbral` (con las tareas grandes vigentes de `features/`, avisos incluidos) y `definitions/STATUS.md` sin «AVISO» si pesa ≤1536; `rapida.sh` termina en 0 e imprime `rapida: ... (tope 30 s)`.

## Evidencia
- Rama creada: `git switch -c feature/F23-topes-verificables` desde `main` (la rama no existía). Sin commit, push ni merge.
- Cambios: `scripts/archivar.mjs` (`UMBRALES.STATUS` 3072 → 1536, nuevo `UMBRALES.TAREA = 6144`, clave `tareasGrandes` en `chequear`, sección `## Tareas sobre el umbral` en `formatearInforme`); `pruebas/comprobaciones/archivar.test.mjs` (test (f) con 1537/1536 vía `UMBRALES.STATUS`; nuevos tests (j) y (k)).
- `node --test pruebas/comprobaciones/archivar.test.mjs`: `ℹ tests 29`, `ℹ pass 29`, `ℹ fail 0`.
- `node scripts/archivar.mjs | sed -n 1,20p`: `definitions/STATUS.md: 1303 caracteres ... (umbral 1536)` sin «AVISO»; aparece `## Tareas sobre el umbral` con tres tareas de `features/F22-*` (7982, 6326 y 6655 caracteres), cada una con «AVISO». `definitions/ARCHITECTURE.md` (54282 caracteres) ya avisaba por su umbral de 30720 y no cambió por esta tarea.
- `bash pruebas/rapida.sh`: exit 0, última línea `rapida: 29 archivos en 20 s (tope 30 s)`.
- `git status`: solo cambian `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs` por esta tarea. `definitions/BACKLOG.md` y `definitions/STATUS.md` ya estaban modificados antes de empezar y no se tocaron.

## Notas
- Las tres tareas de F22 que aparecen en el informe real son avisos vigentes del repo, no fallos: la tarea solo baja el umbral y lista; no se editaron esas tareas.
- `features/completed/` se omite (test (j)).
- Sin `UMBRALES` nuevos más allá de `TAREA`; `BACKLOG`, `AGENTS`, `FILA_HECHA` y `DEFINICION_INFORMATIVO` no cambian.
