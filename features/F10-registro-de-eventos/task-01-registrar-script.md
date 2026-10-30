# task-01 — `scripts/registrar.mjs`: esquema cerrado, extracción desde git y pruebas
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Crea `scripts/registrar.mjs`, el único escritor de `registro/eventos.jsonl`: lee los archivos de la tarea, `BACKLOG.md`, `STATUS.md` y el historial de git, y añade eventos validados contra un esquema cerrado (sin texto libre, sin datos personales). Cubre los eventos que salen solo de git (`tarea_estado`, `puerta`, `feature_estado`, `feature_archivada`, `escalacion`); la línea `Registro:` y el evento `ejecucion` son de task-02. El objetivo es recolectar datos para detectar errores y mejorar el flujo; no hay informe (es F11).

## Contexto
Diseño completo en `definitions/REGISTRO.md` (§1 eventos, §2 formato, §5 privacidad, §6 pruebas); léelo entero antes de empezar. Leídos en el repo: `scripts/archivar.mjs` (patrón a imitar: funciones exportadas, `--raiz <dir>`, guarda de ejecución `if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE)`, regex `RE_ESTADO = /^repo: .*estado: (.+?)\s*$/m`, filas de backlog `/^\| F\d{2} \|/` con `celdas()`); `pruebas/comprobaciones/archivar.test.mjs` (estilo de pruebas: `node:test`, `node:assert/strict`, `fs.mkdtempSync(os.tmpdir())`, `spawnSync`); `pruebas/rapida.sh` (corre `pruebas/comprobaciones/*.test.mjs`, `pruebas/*.test.mjs`, `capa1/instalacion` y `capa1/copia`; tarda ~24 s de un tope de 30 s). Node v25 y git 2.54 instalados. Los 6 estados de tarea y los 3 de feature están en `definitions/WORKFLOW.md` §6 y `formato-flujo.mjs` (`pendiente`, `en curso`, `hecha`). `STATUS.md` tiene la sección `## Escalación` vacía cuando no hay escalación.
Formato de `git log` ya probado a mano: `git log --follow --name-only --format='%x01%H%x09%ct' -- <ruta>` imprime por commit una línea `\x01<sha completo>\t<epoch>`, una línea en blanco y la ruta que el archivo tenía en ese commit.
A crear: `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`. A tocar: nada más. (`registro/` se crea al correrlo; queda ignorado por git por su propio `.gitignore`.)

## Decisiones ya tomadas
- Un solo archivo ESM sin dependencias. Exporta `ESQUEMA`, `validarEvento(evento)` (devuelve arreglo de errores en español, vacío = válido), `extraer(raiz)` (devuelve `{ eventos, descartados }`) y `registrar({ raiz, reconstruir })` (devuelve `{ nuevos, total, descartados, bytes }`). CLI: `node scripts/registrar.mjs [--raiz <dir>] [--reconstruir]`; raíz por defecto `process.cwd()`. Opción desconocida: código 1 y uso en stderr.
- Solo se lee lo que está **en commits** (`git show <sha>:<ruta>`); los cambios sin commitear no generan eventos. Raíz que no es repositorio git (`git rev-parse --git-dir` falla): mensaje `error: <raiz> no es un repositorio git` en stderr y código 1.
- Claves de cada línea, en este orden y solo las presentes: `v` (siempre `1`), `id`, `t`, `fuente`, `evento`, `feature`, `tarea`, `sha`, luego los campos propios del evento. `t` = `%ct` del commit convertido con `new Date(epoch*1000).toISOString()` sin milisegundos (`AAAA-MM-DDThh:mm:ssZ`). `sha` = primeros 7 hex del commit. Nunca se usa `%an`, `%ae`, `%s`, `%b` ni ramas.
- Patrones del validador: `id` `^[0-9a-f]{12}$`; `t` el patrón de arriba y `Date.parse` válido; `fuente` ∈ `git`, `notas`, `status`; `feature` `^F\d{2}$`; `tarea` `^\d{2}$`; `sha` `^[0-9a-f]{7}$`. `ESQUEMA` es un objeto `evento → { fuente, requeridos, campos }` para poder sumar eventos (task-02 agrega `ejecucion`). Una clave que no esté en el esquema del evento, un valor fuera de patrón o un evento desconocido = error; el evento se descarta y se cuenta.
- Eventos de esta tarea (todos `fuente: git`, salvo `escalacion`, que es `status`):
  - `tarea_estado`: requiere `feature`, `tarea`, `sha`; campos `de` (uno de los 6 estados o `null` si es la primera versión vista), `a` (uno de los 6), `por` (`franco`, `constructor` o `planificador`: `a=aprobada`→`franco`, `a=en curso`→`constructor`, `a=lista para revisión`→`constructor`, `a=hecha`→`franco`, `a=bloqueada`→`constructor`, `a=borrador`→`planificador`; es inferido y así se dice en el comentario de cabecera).
  - `puerta`: requiere `feature`, `tarea`, `sha`; campos `n` (`3` o `4` como entero), `resultado` (`aprobada` o `devuelta`), `por` (siempre `franco`; detectar yolo queda fuera). Derivado de `tarea_estado` con `de` no nulo: `borrador→aprobada` = `n=3`, `aprobada`; `lista para revisión→hecha` = `n=4`, `aprobada`; `lista para revisión→aprobada` o `lista para revisión→en curso` = `n=4`, `devuelta`.
  - `feature_estado`: requiere `feature`, `sha`; campos `de` (`pendiente`, `en curso`, `hecha` o `null`), `a`. Sale del historial de `definitions/BACKLOG.md` (columna 7 de las filas `| Fxx |`), un evento por cambio de cada feature.
  - `feature_archivada`: requiere `feature`, `sha`; sin campos propios. Sale de `git log --reverse -M --diff-filter=R --name-status --format='%x01%H%x09%ct'`: líneas `R<nn>\t<antes>\t<después>` donde `antes` empieza por `features/Fxx-` y `después` por `features/completed/Fxx-`; un evento por (feature, commit).
  - `escalacion`: `fuente: status`; requiere `sha`, sin `feature`; sin campos propios. Sale del historial de `definitions/STATUS.md`: cuerpo de la sección `## Escalación` (desde ese título hasta el siguiente `## `) vacío en la versión anterior (o primera versión) y con texto en esta. El texto nunca se guarda.
- Tareas = archivos `features/Fxx-*/task-NN-*.md` y `features/completed/Fxx-*/task-NN-*.md` presentes hoy en el árbol de trabajo (`feature` y `tarea` salen de la ruta; ruta que no calza = se ignora). Se recorre el historial con `git log --follow --reverse --name-only --format='%x01%H%x09%ct' -- <ruta>` y `git show <sha>:<ruta que tenía en ese commit>`. Un estado que no sea de los 6 se descarta y se cuenta; no actualiza el estado previo.
- `id` = primeros 12 hex del SHA-1 (`node:crypto`) de `fuente|feature|tarea|sha|evento|clave` con `tarea` vacía si no aplica y `clave` = `de>a` para `tarea_estado` y `feature_estado` (usa la cadena `null` si `de` es nulo), `n|resultado` para `puerta`, vacía para `feature_archivada` y `escalacion`. No incluye la ruta: así un renombre no duplica eventos.
- Archivo: `registro/eventos.jsonl` bajo la raíz, UTF-8, un JSON por línea terminado en `\n`. `registro/.gitignore` con exactamente `*\n`, creado si falta (y la carpeta). Modo normal: lee los `id` ya presentes (líneas que no se pueden leer como JSON se dejan intactas) y **anexa** solo los eventos con `id` nuevo, ordenados por `t` y luego `id`; si no hay nuevos no reescribe el archivo. `--reconstruir`: arma todos los eventos, los ordena por `t` e `id`, escribe `registro/eventos.jsonl.tmp` y lo renombra sobre el definitivo. No escribe en ninguna otra ruta.
- Salida por stdout, una línea: `registrar: <n> eventos nuevos; <m> en total; <d> descartados`. Si el archivo supera 1048576 bytes agrega una segunda línea `AVISO: registro/eventos.jsonl pesa <k> KB (más de 1024 KB)`. Código 0.
- Privacidad por construcción: el escritor solo serializa las claves del esquema; no existe ningún campo de texto libre. El script no abre `.env*`, llaves ni nada fuera de `features/`, `definitions/` (vía git) y `registro/`; el archivo fuente no contiene la cadena `.env`.
- Pruebas en `pruebas/capa1/registrar.test.mjs` (**fuera de `rapida.sh`**, que no lo recoge por su lista; se corre aparte, como `remoto.test.mjs`). Ayudante de prueba: `git init -q -b main` en `os.tmpdir()`, y cada commit con `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` fijos y `-c commit.gpgsign=false`. Exactamente 6 pruebas, cada una con control negativo.
- `rapida.sh` no se modifica.

## Alcance / Fuera de alcance
Alcance: el script, el esquema cerrado de 5 eventos, `registro/.gitignore`, `--reconstruir`, `--raiz` y las 6 pruebas.
Fuera de alcance: línea `Registro:` y evento `ejecucion` (task-02); `modelo`; cualquier cambio en agentes, skills, `README.md`, `pruebas/README.md`, `definitions/**` o `rapida.sh`; el informe (F11); rotación de archivo; detección de yolo; tareas borradas del árbol de trabajo; reconstruir tras reescribir historial (los `sha` cambian: se usa `--reconstruir`).

## Pasos
1. `scripts/registrar.mjs`: cabecera con uso y `ESQUEMA` + `validarEvento` + utilidades de `id`, `t` y `sha`. Resultado: `node -e "import('./scripts/registrar.mjs').then(m=>console.log(m.validarEvento({v:1,id:'0123456789ab',t:'2026-10-30T10:00:00Z',fuente:'git',evento:'feature_archivada',feature:'F01',sha:'abcdef0'})))"` imprime `[]`, y con una clave extra `autor` imprime un error.
2. `scripts/registrar.mjs`: ayudantes de git (`rev-parse`, `log` con `%ct`, `show`) con `spawnSync('git', [...], { cwd: raiz })`, sin shell. Resultado: función que devuelve `[{sha, epoch, ruta}]` para un archivo con `--follow`.
3. `scripts/registrar.mjs`: `tarea_estado` y `puerta` sobre las tareas de `features/**`. Resultado: en un repo de prueba una tarea con 4 estados da 4 `tarea_estado` y 2 `puerta`.
4. `scripts/registrar.mjs`: `feature_estado` (BACKLOG), `feature_archivada` (renombres) y `escalacion` (STATUS). Resultado: cada uno produce su evento en el repo de prueba.
5. `scripts/registrar.mjs`: `registrar()` (anexar, idempotente, `--reconstruir` con temporal y renombre, `registro/.gitignore`, aviso de 1 MB) y la CLI con guarda de ejecución. Resultado: `node scripts/registrar.mjs --raiz <repo>` imprime la línea de resumen y crea `registro/eventos.jsonl`.
6. `pruebas/capa1/registrar.test.mjs`: las 6 pruebas: (1) estados→eventos con devolución y control negativo (un commit que solo cambia la *Descripción* no genera evento); (2) idempotencia byte a byte, commit nuevo anexa solo lo suyo, `--reconstruir` reproduce el mismo contenido; (3) privacidad: autor con nombre y correo canario, título de tarea con cliente canario, *Evidencia* y *Notas* con una llave canario y mensaje de commit con otra: ninguno aparece en `eventos.jsonl`, y `validarEvento` rechaza a mano un evento con campo `autor` y otro con `t: "ayer"`; (4) aislamiento: `registro/.gitignore` vale `*\n`, `git status --porcelain` no lista `registro/`, un `.env` canario con modo `0o000` no impide que el script termine bien (se omite esa comprobación si `process.getuid() === 0`), el fuente no contiene `.env` y el listado de archivos fuera de `registro/` y `.git/` es idéntico antes y después; (5) renombre con `git mv` a `features/completed/` (como `archivar.mjs`): historial conservado sin duplicar y un `feature_archivada`; (6) `feature_estado` desde cambios de la fila en `BACKLOG.md` y `escalacion` cuando la sección pasa de vacía a con texto (control negativo: pasar de con texto a vacío no genera evento).
7. Humo en el repo real: `node scripts/registrar.mjs` dos veces. Resultado: la primera crea eventos de F01–F09; la segunda dice `0 eventos nuevos`.
8. Correr la *Verificación* y pegar la salida real en *Evidencia*.

## Criterios de aceptación
1. Un repo de prueba con una tarea que pasa por `borrador`, `aprobada`, `lista para revisión`, `hecha` da los `tarea_estado` y `puerta` esperados, y una devolución da `resultado=devuelta`. `node --test pruebas/capa1/registrar.test.mjs`.
2. Dos corridas seguidas dan el archivo idéntico byte a byte y `--reconstruir` reproduce el contenido. Misma prueba.
3. Ningún dato canario (autor, correo, título, llave, mensaje de commit) aparece en `eventos.jsonl` y el validador rechaza campos y valores fuera de esquema. Misma prueba.
4. `registro/` queda ignorado por git, el script no lee `.env*` ni escribe fuera de `registro/`. Misma prueba.
5. Sobre el repo real genera eventos de F01–F09 sin correos ni rutas absolutas, y la segunda corrida añade 0. Comandos del apartado *Verificación*.

## Verificación
```
node --test pruebas/capa1/registrar.test.mjs
```
Esperado: `pass 6`, `fail 0`.
```
node scripts/registrar.mjs && node scripts/registrar.mjs
```
Esperado: la primera línea `registrar: <n> eventos nuevos; ...` con `<n>` mayor que 0; la segunda `registrar: 0 eventos nuevos; ...`.
```
grep -c '@' registro/eventos.jsonl; grep -c '/Users' registro/eventos.jsonl; git status --porcelain | grep -c registro
```
Esperado: `0`, `0` y `0` (grep sale con código 1 al no encontrar; es lo esperado).
```
bash pruebas/rapida.sh
```
Esperado: termina con `rapida: ... (tope 30 s)` y código 0.

## Evidencia

Rama creada desde `main` (commit `040f4ce`, merge de F09): `git switch -c feature/F10-registro-de-eventos`; `git branch --show-current` → `feature/F10-registro-de-eventos`.

Paso 1 (validador):
```
$ node -e "import('./scripts/registrar.mjs').then(m=>console.log(m.validarEvento({v:1,id:'0123456789ab',t:'2026-10-30T10:00:00Z',fuente:'git',evento:'feature_archivada',feature:'F01',sha:'abcdef0'})))"
[]
$ ... (mismo evento con clave extra autor)
[ 'clave no permitida: autor' ]
```

Pruebas nuevas (`node --test pruebas/capa1/registrar.test.mjs`):
```
✔ (1) estados → tarea_estado y puerta; un commit que solo cambia la Descripción no genera evento
✔ (2) idempotencia: dos corridas idénticas; un commit nuevo anexa solo lo suyo; --reconstruir reproduce
✔ (3) privacidad: ningún dato canario sale; el validador rechaza campos y valores fuera de esquema
✔ (4) aislamiento: registro/ queda ignorado, .env no se abre y nada fuera de registro/ cambia
✔ (5) renombre con git mv a features/completed/: historial sin duplicar y un feature_archivada
✔ (6) feature_estado desde BACKLOG y escalacion al pasar de vacía a con texto; control: de con texto a vacía no genera evento
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

Humo en el repo real (`node scripts/registrar.mjs && node scripts/registrar.mjs`), primera corrida:
```
registrar: 128 eventos nuevos; 128 en total; 0 descartados
```
Segunda corrida (repetida en la verificación, ya con todo escrito):
```
registrar: 0 eventos nuevos; 128 en total; 0 descartados
registrar: 0 eventos nuevos; 128 en total; 0 descartados
```
Por tipo (de `registro/eventos.jsonl`): `tarea_estado` 86, `puerta` 19, `feature_estado` 23; `feature_archivada` 0 y `escalacion` 0 en esta corrida. Las tareas de F01 a F09 salen; F10 solo aparece como fila de BACKLOG (su tarea aún no está en commits).

Privacidad y aislamiento:
```
$ grep -c '@' registro/eventos.jsonl
0
$ grep -c '/Users' registro/eventos.jsonl
0
$ git status --porcelain | grep -c registro
1
$ git status --porcelain | grep -c ' registro/'
0
$ git check-ignore -v registro/eventos.jsonl registro/.gitignore
registro/.gitignore:1:*	registro/eventos.jsonl
registro/.gitignore:1:*	registro/.gitignore
```
La única línea de `grep -c registro` es `?? features/F10-registro-de-eventos/` (carpeta de esta feature, ya sin commit; no es `registro/`). `grep -c ' registro/'` da 0.

Verificación rápida (`bash pruebas/rapida.sh`):
```
ℹ tests 186
ℹ pass 186
ℹ fail 0
rapida: 19 archivos en 25 s (tope 30 s)
exit=0
```
`pruebas/rapida.sh` no se modificó: la prueba nueva va aparte, en `pruebas/capa1/registrar.test.mjs`.

Criterios de aceptación:
1. Tarea por borrador, aprobada, lista para revisión, hecha con devolución: 6 `tarea_estado` y 3 `puerta` (`n=3 aprobada`, `n=4 devuelta`, `n=4 aprobada`). Cumple (prueba 1).
2. Dos corridas idénticas byte a byte; `--reconstruir` reproduce. Cumple (prueba 2).
3. Ningún canario (autor, correo, título, llave, mensaje de commit) en `eventos.jsonl`; el validador rechaza `autor` y `t: "ayer"`. Cumple (prueba 3).
4. `registro/` ignorado por git; `.env` con modo `0o000` no impide la ejecución; nada fuera de `registro/` cambia. Cumple (prueba 4).
5. Repo real: 128 eventos de F01–F09 sin correos ni rutas absolutas; la segunda corrida añade 0. Cumple (humo y `grep`).

## Notas
- Rama actual al empezar: `main`, tal como se esperaba tras el merge de F09. Se creó `feature/F10-registro-de-eventos` con `git switch -c`. Había cambios sin commit en `definitions/` y `features/F10-registro-de-eventos/` de antes; no los toqué.
- Hueco 1: el comando de la tarea `git log --follow --reverse --name-only` corta el historial de un renombre en git 2.54 (solo queda el commit del renombre, probado a mano con `dbg`). Se usó `git log --follow --name-only` sin `--reverse` y se invierte el orden en JavaScript. Mismo resultado cronológico, pruebas 5 y del humo.
- Hueco 2: la raíz debe ser la raíz del repositorio (no un subdirectorio). Si no, error `no es la raíz del repositorio git`, código 1 (la tarea solo pedía el caso «no es repositorio»). Se decidió así para que las rutas de `git show` sean del repo.
- Hueco 3: `fuente` debe coincidir con la del esquema del evento, además de estar en la lista de fuentes.
- Hueco 4: `tarea_estado.por` usa `franco`, `constructor` o `planificador`, como pide la tarea. `definitions/REGISTRO.md` §1 lista también `coordinador`; no hay evento que lo use hoy. Lo dejo anotado para que se alinee la definición.
- Hueco 5: los errores de línea de comandos muestran la raíz tal como se escribió (por defecto `.`), nunca una ruta absoluta. Los errores de sistema de archivos salen como código de error, sin ruta.
- Hueco 6: `--reconstruir` regenera el archivo y descarta las líneas que no son JSON; el modo normal las deja intactas.
- `rapida.sh` pasa en 25 s (antes ~24 s); el tope es 30 s. La prueba nueva no entra en ese conteo.
- Se creó `scripts/registrar.mjs` y `pruebas/capa1/registrar.test.mjs`. No se tocó `STATUS.md`, ni se hizo commit, push, PR ni merge.
- Señal: la tarea estaba incompleta. Faltaban dos cosas: que `--follow --reverse` falla con renombres en git 2.54 (el comando de la tarea no sirve para `feature_archivada` tal como está) y la regla de raíz del repositorio.