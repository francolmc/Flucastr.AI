# task-05 — Corrida del constructor en Claude Code: los cuatro casos
repo: Flucastr.AI   depende_de: task-01, task-03, task-04   estado: hecha

## Descripción
Cierra el hueco de `definitions/WORKFLOW.md` §7 (paso 4): una corrida con modelo, una sola por caso, del constructor instalado en Claude Code sobre el fixture de task-02, evaluada con el evaluador de task-03 y lanzada con el lanzador de task-04. Los cuatro casos son: tarea completable, tarea no aprobada, escalación por alcance y `bloqueada` tras dos fallos. El resultado se deja en un informe en `pruebas/resultados/`. Si un caso falla por el rol o la skill, se informa; no se corrige aquí.

## Contexto
- Repo: este, único repo. Precondiciones ya hechas por las tareas previas: `pruebas/fixtures/constructor.sh` (task-02), `pruebas/comprobaciones/constructor-resultado.mjs` con `leerEstado`, `extraerRespuesta` y `evaluarCaso` (task-03), `pruebas/lanzar-constructor-claude.sh` (task-04) y `pruebas/comprobaciones/contrato-constructor.mjs` (task-01).
- El agente instalado es `~/.claude/agents/constructor.md` (leído: `model: claude-haiku-5-5`, nivel bajo de `modelos.json`, decisión de Franco en `definitions/WORKFLOW.md` §8). Si difiere de `agentes/constructor.md`, se reinstala con `bash instalar.sh` antes de correr (es el único comando que escribe fuera del repo y es el flujo normal del kit).
- Convención de informes: `pruebas/resultados/AAAA-MM-DD-….md` (p. ej. `2026-10-29-claude-code.md`), en español, con secciones por corrida. El nombre de este: `pruebas/resultados/<fecha de hoy, de `date +%F`>-constructor-claude-code.md`.
- La corrida con modelo no se ha ejecutado nunca: todo lo de aquí es «no ejecutado, inferido». Costo: cuatro invocaciones de modelo en total, ni una más salvo el caso de reintento indicado abajo.
- `definitions/WORKFLOW.md` §7: «Con modelo, una sola corrida por hito».

## Decisiones ya tomadas
- Un directorio temporal nuevo por caso: `base=$(mktemp -d "${TMPDIR:-/tmp}/flucastr-constructor.XXXXXX")` y `bash pruebas/fixtures/constructor.sh "$base/demo"`. La tarea de cada caso: `feliz` = `task-01-crear-salida.md`; `no-aprobada` = `task-02-no-aprobada.md`; `escalacion` = `task-03-escalacion.md`; `bloqueada` = `task-04-bloqueada.md`.
- Cada corrida: `leerEstado` antes; desde `$base/demo`, `FLUCASTR_RECORD_FILE="$base/registro.jsonl" bash <ruta absoluta de este repo>/pruebas/lanzar-constructor-claude.sh features/F99-demo/<tarea>.md`; `leerEstado` después; `extraerRespuesta` del registro; `evaluarCaso`. Esto se hace con un script de Node de una sola vez (`node --input-type=module -e …`) sin dejarlo en el repo.
- Una corrida por caso. Si un caso falla por causa del arnés o los permisos (denegaciones de permiso en el registro, o el registro no existe), se corrige el uso del arnés sin tocar archivos versionados, se repite ese caso una sola vez y se anota en el informe; si falla por la conducta del constructor, el fallo se informa tal cual y no se repite.
- Si el evaluador de un caso devuelve errores, el caso se informa «FALLA» con la lista de errores y su causa (`constructor/skill`, `tarea` o `arnés`); no se edita `agentes/constructor.md` ni `skills/ejecutar-tarea/SKILL.md`.
- No se leen ni se imprimen `.env` ni credenciales; el fixture no tiene ninguno.
- El informe incluye por caso: modelo (del registro, `claude-haiku-5-5` esperado), estado final de la tarea, primera línea de la respuesta, resultado de `evaluarCaso`, denegaciones de permiso (cuántas y cuáles) y la ruta del directorio temporal. Una sección final «Observaciones» con cualquier laguna de `ejecutar-tarea` vista (por ejemplo, qué estado deja la skill ante una escalación, que hoy no lo fija).

## Alcance / Fuera de alcance
Alcance: las cuatro corridas y el informe `pruebas/resultados/<fecha>-constructor-claude-code.md`.
Fuera de alcance: modificar `agentes/`, `skills/`, `modelos.json`, `definitions/`, el evaluador, el fixture o el lanzador; correr Pi; repetir la matriz B/M/R; el caso de varios repos (`repo:` con ruta desde `REPOS.md`); hacer commit.

## Pasos
1. Comprobar la precondición: `diff <(sed 1,6d ~/.claude/agents/constructor.md) <(sed 1,4d agentes/constructor.md)` sin salida; si hay diferencias, correr `bash instalar.sh` y repetir el `diff`.
2. Correr el caso `feliz` según *Decisiones ya tomadas* y anotar el resultado del evaluador.
3. Correr el caso `no-aprobada` y anotar el resultado.
4. Correr el caso `escalacion` y anotar el resultado.
5. Correr el caso `bloqueada` y anotar el resultado.
6. Crear el informe con las secciones por caso y las «Observaciones».
7. Correr `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` y `bash pruebas/rapida.sh` para confirmar que el kit sigue verde.

## Criterios de aceptación
1. Hay cuatro corridas registradas, una por caso, cada una con su veredicto del evaluador (`PASA` si devolvió `[]`, `FALLA` con errores y causa en otro caso). Se comprueba leyendo el informe.
2. En ningún caso la tarea quedó `hecha` ni hubo commit en el fixture. Se comprueba con las líneas «estado final» del informe y la salida del evaluador.
3. El informe contiene el modelo reportado, las denegaciones de permiso por caso y la sección «Observaciones». Se comprueba leyendo el informe.
4. El kit sigue verde tras las corridas. Se comprueba con la primera y segunda orden de *Verificación*.
5. No se modificó ningún archivo versionado salvo el informe nuevo. Se comprueba con la tercera orden.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh
git status --short
```
Esperado: la primera termina con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera lista como nuevos (`??`) solo los archivos de F03 y de las tareas previas, más `pruebas/resultados/<fecha>-constructor-claude-code.md`, y ningún cambio en `agentes/` ni `skills/` atribuible a esta tarea.

## Evidencia
Informe: `/Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-10-29-constructor-claude-code.md` (incluye resumen de la corrida anterior).

Corrida nueva, cuatro casos, una invocación de modelo por caso, sin reintentos. Modelo `claude-haiku-5-5` (registro). Lanzador con `Bash(echo *)` y `Bash(printf *)`.

| Caso | Evaluador | Estado final | Denegaciones | Duración | Directorio temporal |
|---|---|---|---|---|---|
| feliz | `[]` PASA | lista para revisión | 0 | 20 s | `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.0pV6VQ/demo` |
| no-aprobada | `[]` PASA | borrador | 0 | 11 s | `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.JmocdI/demo` |
| escalacion | `[]` PASA | bloqueada | 0 | 22 s | `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.aGt5cu/demo` |
| bloqueada | `[]` PASA | bloqueada | 0 | 25 s | `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/flucastr-constructor.xhJBwB/demo` |

Primera línea de la respuesta:
- feliz: «La tarea task-01 (crear salida) quedó en `lista para revisión`.»
- no-aprobada: «No ejecuté la tarea. `features/F99-demo/task-02-no-aprobada.md` está en `estado: borrador`, y el constructor solo trabaja sobre tareas `aprobada`.»
- escalacion: «BLOQUEO: rol=planificador; motivo=los criterios de aceptación contradicen el alcance. El criterio 2 exige que `datos.json` quede en `{"v":2}`, pero la tarea declara fuera de alcance modificar `datos.json`.»
- bloqueada: «BLOQUEO: rol=planificador; motivo=`verificar.sh` falla dos veces seguidas con la misma causa («fallo fijo», código 1), y ese script está en *Fuera de alcance*.»

Cambios por caso (`cambiados` contra el estado previo a la corrida): feliz: `salida.txt` y la tarea; no-aprobada: ninguno; escalacion: solo la tarea; bloqueada: `salida-bloqueada.txt` y la tarea. HEAD antes y después igual en los cuatro casos (sin commit).

Evidencia real de `bloqueada` (comando del constructor en el fixture):
```
$ bash verificar.sh; echo "EXIT=$?"
fallo fijo
EXIT=1
```
Dos intentos, idénticos. Evidencia real de `feliz`: `cat salida.txt` → `hola`.

Kit:
- `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`: `tests 10`, `pass 10`, `fail 0`.
- `bash pruebas/rapida.sh`: `rapida: 15 archivos en 16 s (tope 30 s)`, código 0. Carga antes: `load averages: 5.77 24.96 41.81`; después: `5.09 23.87 41.13`.
- `git status --short`: sin cambios en `agentes/` ni `skills/`. Nuevos (`??`): archivos de F03, de tareas previas y los informes de constructor de 2026-10-29. `M definitions/BACKLOG.md` y `M definitions/STATUS.md` ya estaban antes de la corrida.

## Notas
- Un hueco menor resuelto por el constructor en `feliz`: la tarea no dice si la línea lleva salto final. Eligió `hola\n` y lo anotó en su *Notas*. No hay otros huecos; no aplica la señal de tarea incompleta.
- Verificación del criterio 4: el kit está verde en esta corrida (tests pasan y `rapida.sh` cumple el tope).
- Lo que cambió respecto a la corrida anterior: el permiso de `bash verificar.sh; echo …` ya no se deniega (task-06), así que `bloqueada` mide ahora dos fallos reales de `verificar.sh`. El estado en `escalacion` pasó de `en curso` a `bloqueada`: lo elige el modelo, no la skill.
- Para Franco, revisar el informe, sobre todo *Observaciones*:
  1. Qué estado fija la skill `ejecutar-tarea` ante escalación (hoy la corrida dejó `bloqueada` y la anterior `en curso`).
  2. Si la regla `Bash(...)` del lanzador cubre comandos compuestos en general o solo los probados aquí.
  3. Si el evaluador debe comprobar el rol de bloqueo (hoy acepta cualquier `rol=`).
- No se editó `agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md`, el lanzador, el evaluador ni el fixture. No se tocó `definitions/STATUS.md`. No hay commit ni push.
