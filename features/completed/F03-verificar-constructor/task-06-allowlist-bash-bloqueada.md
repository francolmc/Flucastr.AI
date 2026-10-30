# task-06 — Ampliar la allowlist de Bash del lanzador y repetir el caso bloqueada
repo: Flucastr.AI   depende_de: task-04, task-05   estado: hecha

## Descripción
En la corrida de task-05 el caso `bloqueada` falló por el arnés: el constructor encadenó la verificación con otros comandos (`printf … && cat … && echo … && bash verificar.sh; echo "codigo: $?"`) y el lanzador solo permitía `Bash(bash verificar.sh)`, `Bash(cat *)`, `Bash(ls *)` y `Bash(git status --short)`, así que Bash fue denegado y nunca se probó el comportamiento `bloqueada`. Esta tarea añade al lanzador el mínimo de entradas para que esos comandos corran, actualiza su prueba y repite solo ese caso con modelo, dejando el resultado en un informe nuevo.

## Contexto
- Repo: este, único repo. Archivos a leer: `pruebas/lanzar-constructor-claude.sh` (la lista `--allowedTools` es `'Read(./**)' 'Write(./**)' 'Edit(./**)' 'Skill' 'Bash(cat *)' 'Bash(ls *)' 'Bash(bash verificar.sh)' 'Bash(git status --short)'`; la `--disallowedTools` es `'Read(./.env)' 'Read(.env)' 'Bash(cat ./.env)' 'Bash(cat .env)'`), `pruebas/lanzar-constructor.test.mjs` (4 pruebas con binario simulado `fake-model.sh`; la tercera comprueba `--agent`, `constructor`, `--permission-mode`, `dontAsk`, `Write(./**)`, `Bash(bash verificar.sh)`, `Read(./.env)`), `pruebas/comprobaciones/constructor-resultado.mjs` (exporta `leerEstado(dir)`, `extraerRespuesta(jsonl)` y `evaluarCaso(caso, {antes, despues, respuesta})`; el caso `bloqueada` exige primera línea `BLOQUEO: rol=…; motivo=…`, estado `bloqueada`, `verificar.sh` sin cambios, *Notas* no vacía y *Evidencia* con «fallo fijo»), `pruebas/fixtures/constructor.sh` (crea `$1` con el repo demo; la tarea del caso es `features/F99-demo/task-04-bloqueada.md`, cuya verificación es `bash verificar.sh`, que imprime «fallo fijo» y sale 1) y el informe `pruebas/resultados/2026-10-29-constructor-claude-code.md`.
- Evidencia leída en el registro de task-05: los comandos denegados fueron `bash verificar.sh; echo "EXIT_CODE=$?"` y `printf 'ok\n' > salida-bloqueada.txt && cat salida-bloqueada.txt && echo "…" && bash verificar.sh; echo "codigo: $?" …`. Los comandos simples que sí pasaron fueron `ls`, `git status --short` y `cat`. Los denegados añaden `echo` y `printf`. El registro guarda las denegaciones en el evento `result`, campo `permission_denials` (cada una con `tool_name` y `tool_input.command`) (leído).
- Inferido, no ejecutado: Claude Code evalúa cada subcomando de un comando compuesto (`&&`, `;`) contra la allowlist, de modo que basta permitir `echo` y `printf` además de lo ya permitido. Lo confirma o desmiente la corrida real del paso 4.
- Convención de informes: `pruebas/resultados/AAAA-MM-DD-….md`, en español. Nombre de este: `pruebas/resultados/<fecha de hoy, de `date +%F`>-constructor-claude-code-bloqueada.md`.
- Pruebas y verificación rápida: `node --test pruebas/lanzar-constructor.test.mjs` y `bash pruebas/rapida.sh` (el glob de esta incluye `pruebas/*.test.mjs`).
- `definitions/WORKFLOW.md` §7: con modelo, una sola corrida por hito. Esta tarea es una repetición acotada de un caso fallido por el arnés.

## Decisiones ya tomadas
- Forma de la allowlist: se añaden exactamente dos entradas con comodín de prefijo, `'Bash(echo *)'` y `'Bash(printf *)'`, a `--allowedTools`. No se añade `cd`, `Bash(bash verificar.sh *)`, pipes ni ninguna otra entrada, aunque el modelo las use: no se anticipa lo que no se ha visto denegado. Se prefiere esto a `Bash(*)` (prohibido) y a permitir `bash *` (permitiría ejecutar cualquier script).
- `--disallowedTools` queda igual y sigue denegando `.env`: `'Read(./.env)' 'Read(.env)' 'Bash(cat ./.env)' 'Bash(cat .env)'`. Sigue sin haber `git commit` ni `git push`.
- Una sola corrida con modelo del caso `bloqueada`, en un directorio temporal nuevo (`base=$(mktemp -d "${TMPDIR:-/tmp}/flucastr-constructor.XXXXXX")`; `bash pruebas/fixtures/constructor.sh "$base/demo"`). Misma mecánica que task-05: `leerEstado` antes; desde `$base/demo`, `FLUCASTR_RECORD_FILE="$base/registro.jsonl" bash <ruta absoluta de este repo>/pruebas/lanzar-constructor-claude.sh features/F99-demo/task-04-bloqueada.md`; `leerEstado` después; `extraerRespuesta`; `evaluarCaso('bloqueada', …)`. Script de Node de una sola vez (`node --input-type=module -e …`) sin dejarlo en el repo.
- No se repite la corrida con modelo. Si aún hay denegaciones de permiso, se informa el comando exacto denegado (de `permission_denials`) y la tarea termina así: no se amplía la lista una segunda vez; Franco decide.
- Para no reabrir decisiones pendientes de Franco: el veredicto del evaluador se informa tal cual (`PASA` si `[]`, `FALLA` con errores). No se cambia `evaluarCaso`, `agentes/constructor.md` ni `skills/ejecutar-tarea/SKILL.md`. Si el caso falla porque el constructor deja otro estado que `bloqueada` o no ejecuta `verificar.sh` dos veces, se informa como `FALLA` con causa `constructor/skill`, sin proponer ni aplicar reglas nuevas. No se decide aquí qué estado deja la skill ante una escalación, ni si `bloqueada` debe exigir dos fallos reales de `verificar.sh`; el informe solo cuenta, de manera descriptiva, cuántas veces ejecutó `verificar.sh` (comandos `Bash` en el registro cuyo texto contiene `bash verificar.sh`) y cuántas denegaciones hubo.
- El problema de tiempo de `rapida.sh` queda fuera de alcance (ver abajo).
- No se leen ni se imprimen `.env` ni credenciales; el fixture no tiene ninguno.

## Alcance / Fuera de alcance
Alcance: las dos entradas nuevas en `pruebas/lanzar-constructor-claude.sh`, su cobertura en `pruebas/lanzar-constructor.test.mjs`, una corrida con modelo del caso `bloqueada` y el informe `pruebas/resultados/<fecha>-constructor-claude-code-bloqueada.md`.
Fuera de alcance: los otros tres casos (`feliz`, `no-aprobada`, `escalacion`); el estado que deja el constructor ante una escalación o una denegación; que `bloqueada` mida dos fallos reales de `verificar.sh` como criterio; modificar `agentes/`, `skills/`, `modelos.json`, `definitions/`, el evaluador o el fixture; editar task-04 o task-05; correr Pi; hacer commit. El tiempo de `pruebas/rapida.sh` (64–111 s con carga alta contra tope de 30 s en task-05) también queda fuera: aquí solo se exige que sus pruebas pasen, y si sale con código 1 solo por tiempo se anota en el informe sin corregirlo.

## Pasos
1. En `pruebas/lanzar-constructor-claude.sh`, añadir `'Bash(echo *)' 'Bash(printf *)'` a la línea de Bash de `--allowedTools`, sin tocar nada más. Resultado: `bash -n pruebas/lanzar-constructor-claude.sh` sale 0.
2. En `pruebas/lanzar-constructor.test.mjs`, añadir `'Bash(echo *)'` y `'Bash(printf *)'` a la lista de argumentos esperados de la tercera prueba y una prueba nueva «`.env` sigue denegado y no hay Bash genérico ni Git mutante» que compruebe en el registro del binario simulado: líneas exactas `Read(./.env)`, `Read(.env)`, `Bash(cat ./.env)`, `Bash(cat .env)`, ausencia de la línea `Bash(*)` y de las subcadenas `Bash(git commit` y `Bash(git push`, y ausencia de líneas `Bash(bash *)` y `Bash(sh *)`. Resultado: `node --test pruebas/lanzar-constructor.test.mjs` con `fail 0` y 5 pruebas.
3. Preparar el directorio temporal y el fixture según *Decisiones ya tomadas*; guardar la ruta de `$base`.
4. Correr el caso `bloqueada` una vez con modelo y evaluarlo. Resultado: `registro.jsonl` existe y `evaluarCaso` devuelve un arreglo (vacío o con errores).
5. Extraer del registro el modelo (campo `model` del evento `init`, o del `result`), el número de denegaciones y sus comandos (`permission_denials`), y el número de ejecuciones de `bash verificar.sh`.
6. Crear `pruebas/resultados/<fecha>-constructor-claude-code-bloqueada.md` con: modelo, lista de permitidos usada, estado final de la tarea, primera línea de la respuesta, resultado de `evaluarCaso` (`PASA` o `FALLA` con errores y causa `constructor/skill`, `tarea` o `arnés`), denegaciones (cuántas y cuáles), número de ejecuciones de `verificar.sh`, ruta del directorio temporal y una sección «Observaciones» solo con hechos vistos.
7. Correr la *Verificación* completa y `git status --short`.

## Criterios de aceptación
1. El lanzador permite `Bash(echo *)` y `Bash(printf *)`, sigue denegando `.env` y no concede `Bash(*)`, `git commit` ni `git push`. Se comprueba con la primera orden de *Verificación* (5 pruebas, `fail 0`).
2. Hay una sola corrida con modelo del caso `bloqueada` con su veredicto del evaluador y, si hubo, las denegaciones con su comando exacto. Se comprueba leyendo el informe.
3. El informe indica el modelo, el estado final de la tarea, la primera línea de la respuesta y el número de ejecuciones de `bash verificar.sh`. Se comprueba leyendo el informe.
4. No se modificó ningún archivo versionado salvo el lanzador, su prueba y el informe nuevo, ni se hizo commit en el fixture. Se comprueba con `git status --short` y el campo `head` del evaluador.
5. Las pruebas del kit pasan. Se comprueba con la segunda orden de *Verificación* (todos los tests en verde; el tope de tiempo está fuera de alcance).

## Verificación
```
node --test pruebas/lanzar-constructor.test.mjs
bash pruebas/rapida.sh
git status --short
```
Esperado: la primera termina con `fail 0`; la segunda lista todos los tests pasando y termina con `rapida: N archivos en S s (tope 30 s)` (si sale con código 1 solo por tiempo, con `fail 0`, se anota en el informe); la tercera muestra, entre los archivos de esta tarea, `pruebas/lanzar-constructor-claude.sh` y `pruebas/lanzar-constructor.test.mjs` (hoy sin commitear, `??`) y como nuevo `pruebas/resultados/<fecha>-constructor-claude-code-bloqueada.md`, sin cambios en `agentes/` ni `skills/`.

## Evidencia

Paso 1 — `bash -n pruebas/lanzar-constructor-claude.sh` → salida vacía, código 0.

Paso 2 — `node --test pruebas/lanzar-constructor.test.mjs` (últimas líneas):
```
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

Paso 4 — corrida con modelo, caso `bloqueada`, una sola vez (`base=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T//flucastr-constructor.jptIFE`). Registro: `$base/registro.jsonl`. Evaluador: `errores: []` (PASA). Respuesta final, primera línea:
```
BLOQUEO: rol=planificador; motivo=`bash verificar.sh` falla dos veces con la misma causa (imprime `fallo fijo` y sale con código 1). El criterio exige código 0 y `verificar.sh` está fuera de alcance, así que no lo toqué.
```

Paso 5 — registro: modelo `claude-haiku-5-5`; `permission_denials`: 0; `result.subtype`: `success`; llamadas `Bash`: 2; ejecuciones de `bash verificar.sh`: 2 (ambas en una misma llamada, códigos 1 y 1).

Paso 6 — informe: `pruebas/resultados/2026-10-29-constructor-claude-code-bloqueada.md`.

Verificación, primera orden (`node --test pruebas/lanzar-constructor.test.mjs`): `tests 5`, `pass 5`, `fail 0`.

Verificación, segunda orden (`bash pruebas/rapida.sh`): `tests 108`, `pass 108`, `fail 0`; termina con `rapida: 15 archivos en 14 s (tope 30 s)`; código 0.

Verificación, tercera orden (`git status --short`):
```
 M definitions/BACKLOG.md
 M definitions/STATUS.md
?? features/F03-verificar-constructor/
?? pruebas/comprobaciones/constructor-resultado.mjs
?? pruebas/comprobaciones/constructor-resultado.test.mjs
?? pruebas/comprobaciones/contrato-constructor.mjs
?? pruebas/comprobaciones/contrato-constructor.test.mjs
?? pruebas/comprobaciones/fixture-constructor.test.mjs
?? pruebas/fixtures/constructor.sh
?? pruebas/lanzar-constructor-claude.sh
?? pruebas/lanzar-constructor.test.mjs
?? pruebas/resultados/2026-10-29-constructor-claude-code-bloqueada.md
?? pruebas/resultados/2026-10-29-constructor-claude-code.md
```
Sin cambios en `agentes/` ni `skills/`. `head` del fixture antes y después: `480d5614513e55b326b3703481438f0226bde246` (el evaluador no marcó cambio).

## Notas
- Decisión: `Bash(echo *)` y `Bash(printf *)` añadidas a `--allowedTools`, sin otras entradas, según *Decisiones ya tomadas*. En la corrida no hubo denegaciones.
- Prueba nueva «`.env` sigue denegado y no hay Bash genérico ni Git mutante» añadida y la tercera prueba actualizada con los dos argumentos nuevos.
- El modelo ejecutó `bash verificar.sh` dos veces dentro de una sola llamada `Bash`; el informe lo cuenta como 2 ejecuciones y 1 llamada. No se evalúa aquí si eso basta como criterio (fuera de alcance).
- Hueco menor: la respuesta indica `rol=planificador`; el evaluador acepta cualquier `rol=\S+`, así que no hay decisión de rol aquí.
- `rapida.sh` dejó un entorno conservado en `pruebas/.temporales/`; git lo ignora (no aparece en `git status`).
- No se escribió en `definitions/STATUS.md`, no hubo commit ni push. `hecha` no se tocó.
