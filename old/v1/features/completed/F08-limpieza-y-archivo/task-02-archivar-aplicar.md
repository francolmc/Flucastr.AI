# task-02 — `scripts/archivar.mjs --aplicar`: mover features terminadas
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Añade al script el modo `--aplicar [Fxx]`, que mueve la carpeta completa de cada feature candidata a `features/completed/`. Lo ejecuta Franco, nunca un agente (`definitions/WORKFLOW.md` §10.2). Solo renombra carpetas: no sobrescribe, no borra, no toca `BACKLOG.md`, `STATUS.md`, ramas ni git. Los cambios quedan sin commit para que Franco los revise y los commitee.

## Contexto
- Leídos: `definitions/WORKFLOW.md` §5 y §10.2; `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs` (creados en task-01; si no existen, detenerse con `BLOQUEO: rol=constructor; motivo=task-01 sin hacer`).
- A tocar: `scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs`. Comando de prueba: `node --test pruebas/comprobaciones/archivar.test.mjs`.
- `features/completed/` no existe hoy; el script la crea al mover.
- Reutiliza `chequear(raiz)`: la lista `candidatas` y las `inconsistentes` ya aplican las cuatro condiciones de candidata; `--aplicar` no repite esa lógica.
- La verificación real **no** corre `--aplicar` sobre este repo (movería F01–F07 a mano de Franco): se prueba solo en raíces temporales.

## Decisiones ya tomadas
- **Supuesto de Franco (recomendación del arquitecto):** se archiva después del PR de la feature, en su propio commit `chore/`. El script no impone cuándo; el mensaje final lo recuerda.
- Sintaxis: `node scripts/archivar.mjs --aplicar` mueve todas las candidatas; `node scripts/archivar.mjs --aplicar F03` mueve solo F03; `--raiz <dir>` sigue disponible. `--aplicar` y los argumentos se leen de `process.argv.slice(2)`; el ID debe cumplir `/^F\d{2}$/`; cualquier otro argumento desconocido → `error: argumento desconocido '<x>'` por stderr y código 1 sin mover nada.
- API exportada nueva: `aplicar(raiz, ids)` (ids = arreglo de IDs, o `null` para todas) devuelve `{ movidas: [{ id, desde, hasta }], omitidas: [{ id, motivo }] }`. Mueve con `fs.mkdirSync(completed, { recursive: true })` y `fs.renameSync(carpeta, destino)`; nada más (no copia, no borra, no `rmSync`).
- Un ID pedido que no es candidata se omite con su motivo (el de `inconsistentes`, o «no tiene fila hecha» / «no existe la fila»); en el CLI, si se pidió un ID concreto y no se movió, código 1. Con `--aplicar` sin ID y sin candidatas: imprime «Nada que archivar.» y código 0.
- Salida del CLI: una línea `movida: features/F01-… -> features/completed/F01-…` por feature, las omitidas con su motivo, y al final: «Cambios sin commit. Revisa con `git status` y commitéalos en su propio commit chore/ (después del PR de la feature).».
- Antes de mover, `aplicar` vuelve a calcular `chequear(raiz)` (no confía en un resultado previo) y no mueve nada de una feature si dejó de ser candidata.

## Alcance / Fuera de alcance
Alcance: `--aplicar`, `aplicar()` y sus pruebas.
Fuera de alcance: modificar `BACKLOG.md`, `STATUS.md` o estados de tareas; mover tareas sueltas; `git add`/commit; deshacer movimientos; ejecutar `--aplicar` en el repo real; cambios en agentes, skills o README (task-03 y task-04).

## Pasos
1. En `scripts/archivar.mjs`, implementar `aplicar(raiz, ids)` según *Decisiones*. Resultado: `node --check scripts/archivar.mjs` sin salida.
2. Extender el CLI con `--aplicar [Fxx]`, la validación de argumentos y los códigos de salida. Resultado: `node scripts/archivar.mjs --aplicar --raiz <temporal>` mueve y termina en 0.
3. En `archivar.test.mjs`, reutilizar la raíz temporal de task-01 y añadir: (a) `--aplicar` sin ID mueve la candidata completa (con sus `task-*.md` y un `refinado.md` de prueba) a `features/completed/Fxx-…` y la carpeta original ya no existe; (b) `--aplicar F02` mueve solo F02 y deja F01; (c) una feature `hecha` con una tarea `en curso` no se mueve y el CLI informa el motivo; (d) con el destino ya existente no se mueve ni se sobrescribe (el contenido del destino no cambia); (e) `--aplicar F09` sin candidata → código 1 y nada movido; (f) argumento desconocido → código 1 y stderr con `argumento desconocido`; (g) tras mover, `BACKLOG.md` y `definitions/STATUS.md` de la raíz temporal tienen exactamente el mismo contenido que antes; (h) el modo chequeo sigue sin mover nada. Resultado: pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. `--aplicar` mueve la carpeta completa (tareas y `refinado.md`) a `features/completed/Fxx-nombre/` solo si es candidata. Casos (a)/(c)/(d).
2. `--aplicar Fxx` mueve únicamente esa feature. Caso (b).
3. No sobrescribe, no borra y no modifica `BACKLOG.md` ni `STATUS.md`. Casos (d)/(g).
4. Los IDs no candidatos y los argumentos inválidos terminan en 1 sin mover nada. Casos (e)/(f).
5. `bash pruebas/rapida.sh` sigue pasando dentro del tope de 30 s.

## Verificación
```
node --check scripts/archivar.mjs
node --test pruebas/comprobaciones/archivar.test.mjs
node scripts/archivar.mjs; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera sin salida; la segunda con `fail 0`; la tercera (modo chequeo sobre el repo real, sin `--aplicar`) imprime el informe y `salida=0`; la cuarta termina con `rapida: N archivos en S s (tope 30 s)` y código 0. `ls features` sigue mostrando `F01-…` a `F08-…` y ningún `completed/` creado por la tarea.

## Evidencia

Rama actual (sin `git switch`): `feature/F08-limpieza-y-archivo`.

`node --check scripts/archivar.mjs` → sin salida, código 0.

`node --test pruebas/comprobaciones/archivar.test.mjs`:
```
ℹ tests 20
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
```
Incluye los casos (a)–(h) de la tarea y los de la API `aplicar()`. Los casos (a)–(h) de la tarea pasan (`✔ (a)` … `✔ (h)`).

Paso 2, sobre una raíz temporal en el scratchpad (no el repo real):
```
$ node scripts/archivar.mjs --aplicar --raiz <temporal>
movida: features/F01-base -> features/completed/F01-base
Cambios sin commit. Revisa con `git status` y commitéalos en su propio commit chore/ (después del PR de la feature).
salida=0
$ find <temporal>   (tras mover)
.../features/completed
.../features/completed/F01-base
.../features/completed/F01-base/refinado.md
.../features/completed/F01-base/task-01-base.md
(features/F01-base ya no existe)
$ node scripts/archivar.mjs --aplicar --raiz <temporal>   (segunda vez)
Nada que archivar.
salida=0
```

Verificación, modo chequeo sobre el repo real (sin `--aplicar`):
```
$ node scripts/archivar.mjs; echo "salida=$?"
Chequeo de contexto y archivo (solo lectura; definitions/WORKFLOW.md §10)
## Tamaño de lo que se lee
- AGENTS.md: 1141 caracteres, 10 líneas (umbral 2048)
- definitions/STATUS.md: 2024 caracteres, 31 líneas (umbral 3072)
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
- F01 … F07
## Inconsistentes
- ninguna
## Features con tareas hechas y fila no hecha
- ninguna
salida=0
```

`bash pruebas/rapida.sh` (cola de la salida, código de salida aparte):
```
ℹ tests 178
ℹ pass 178
ℹ fail 0
rapida: 18 archivos en 21 s (tope 30 s)
rapida_exit=0
```

Comprobación de que `features/` real no cambió por esta tarea:
```
$ ls features
F01-base-verificacion-rapida  F02-planificar-y-coordinar  F03-verificar-constructor  F04-readme-al-dia
F05-ramas-y-refinado  F06-modo-yolo  F07-modelo-por-agente  F08-limpieza-y-archivo
$ ls features/completed
ls: features/completed: No such file or directory
$ git status --short
 M definitions/STATUS.md
 M features/F08-limpieza-y-archivo/task-01-archivar-chequeo.md
 M features/F08-limpieza-y-archivo/task-02-archivar-aplicar.md
 M pruebas/comprobaciones/archivar.test.mjs
 M scripts/archivar.mjs
```
`definitions/STATUS.md` ya estaba modificado antes de esta tarea (no lo toqué). `task-01-…` también estaba modificado al empezar; esta tarea solo cambió el campo `estado` de `task-02-…`. `archivar.test.mjs` y `scripts/archivar.mjs` son de task-01 modificados aquí por task-02 (la base ya estaba en la rama).

Criterios de aceptación:
1. `--aplicar` mueve la carpeta completa solo si es candidata: comprobado por (a) y (c), y en la raíz temporal anterior.
2. `--aplicar Fxx` mueve solo esa feature: (b).
3. No sobrescribe, no borra, no toca BACKLOG.md ni STATUS.md: (d) y (g).
4. IDs no candidatos y argumentos inválidos → código 1 sin mover: (e) y (f).
5. `rapida.sh` pasa en 21 s, dentro del tope de 30 s: `rapida_exit=0`.

## Notas

- Huecos menores resueltos:
  1. Sin ID, las features `inconsistentes` aparecen como `omitida:` con sus motivos (unidos con «; »); no se mueven. Con ID, la misma información sale para ese ID.
  2. Antes de cada `renameSync` se comprueba `existsSync` del destino, porque en POSIX renombrar sobre un directorio vacío lo sustituye en silencio. Es la protección extra contra sobrescribir.
  3. «Nada que archivar.» se imprime cuando no se mueve nada sin ID, aunque haya inconsistentes listadas antes.
  4. `features/completed/` solo se crea si hay algo que mover; el chequeo no la crea.
  5. Un argumento desconocido pasa de «aviso y sigue con código 0» (task-01) a `error:` por stderr con código 1, como pide la tarea. Un ID (`Fxx`) sin `--aplicar` también es error. `--raiz` sin valor también es error.
- No se ejecutó `--aplicar` sobre el repo real. Las features F01–F07 siguen en `features/`.
- No se escribió en `definitions/STATUS.md`. No hubo commit, push, PR, merge ni switch de rama.
