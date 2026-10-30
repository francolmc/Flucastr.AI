# task-03 — Una corrida real en Claude Code: coordinador y subagentes con el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
`WORKFLOW.md` §7 dejó pendiente comprobar con una corrida real que un subagente de Claude Code usa el `model` de su archivo generado. Esta tarea añade un lanzador mínimo y hace **una sola corrida**: el `coordinador` (agente principal) delega en `planificador` y en `constructor`, y se lee del registro estructurado qué modelo respondió cada uno. El constructor es el que discrimina (bajo: `claude-haiku-5-5`; los otros dos, medio: `claude-sonnet-5-5`).

## Contexto
- Repo único. Leídos: `pruebas/lanzar-claude.sh` y `pruebas/lanzar-constructor-claude.sh` (patrón de `claude -p --agent X --permission-mode dontAsk --permission-prompts none --no-session-persistence --output-format stream-json --verbose --allowedTools …`, registro en `$FLUCASTR_RECORD_FILE`, binario en `${FLUCASTR_CLAUDE_BIN:-claude}`), `pruebas/comprobaciones/registro.mjs` (`claudeEvents` toma `model` del evento `system`/`init` o del primer `assistant`: solo el agente principal), `agentes/coordinador.md` (`tools: Agent(arquitecto, planificador, constructor), …`; el coordinador debe abrirse como agente principal), `modelos.json`. Claude Code instalado: 2.1.308.
- Archivo a crear: `pruebas/lanzar-modelos-claude.sh`. El resultado queda en *Evidencia* (no se crea otro archivo).
- **Inferido, no ejecutado:** en el `stream-json` los eventos `assistant` de un subagente traen `parent_tool_use_id` igual al `id` del `tool_use` de `Agent` y `message.model` con el modelo real. Esta tarea lo confirma o lo corrige; si el formato real difiere, se informa en *Notas* lo observado y no se inventa.

## Decisiones ya tomadas
- Es la única herramienta y el único escenario con modelo: no se repite 3 veces ni se añaden escenarios. Si falla por una causa del lanzador (permisos, prompt), se corrige el lanzador y se repite una vez más como máximo (sin contar las corridas por fuente de la decisión siguiente).
- Se ejecuta desde una carpeta temporal vacía (`mktemp -d`), no desde el repo.
- Prompt fijo del lanzador: «Esto es una comprobación de modelos, no un flujo de trabajo: no leas archivos ni escribas nada. Usa la herramienta Agent, sin pasar el parámetro model, para llamar primero al subagente planificador y después al subagente constructor; a cada uno pídele que responda solo la palabra OK sin usar herramientas. Al terminar responde LISTO.»
- Permisos: `--allowedTools 'Agent(planificador)' 'Agent(constructor)'` y nada más.
- Antes de correr: `node pruebas/comprobaciones/modelos-agentes.mjs` debe dar 0 (si no, `bash instalar.sh` es de Franco: el constructor se detiene con `BLOQUEO: rol=Franco; motivo=la instalación en ~/.claude está desactualizada, falta correr bash instalar.sh`). Además `CLAUDE_CODE_SUBAGENT_MODEL` no debe estar definida (esa variable fuerza el modelo de todos los subagentes y invalidaría la prueba): si lo está, se informa en *Notas* y se detiene con `BLOQUEO: rol=Franco; motivo=CLAUDE_CODE_SUBAGENT_MODEL está definida`.
- **Fuente del modelo del subagente (decisión de Franco, 2026-10-29, opción 2):** la primera corrida mostró que el `stream-json` de `claude -p` no trae el modelo del subagente. Se busca otra fuente fiable **generada por Claude Code, no autodeclarada** (nunca se le pregunta al subagente qué modelo es). Se prueban en orden y la búsqueda se detiene en la primera que muestre `model` de los mensajes `assistant` del subagente: (1) transcripciones en `~/.claude/projects/`; (2) `stream-json` con `--include-partial-messages` o `--debug`/`--debug-file`; (3) modo no interactivo sin `-p`, solo si aplica. Si ninguna lo muestra, la conclusión es «no verificable» y se entrega el hallazgo a Franco; no se da el criterio 3 por cumplido.
- **Hipótesis a descartar primero (inferida, no ejecutada):** el lanzador usa `--no-session-persistence`, que probablemente es la causa de que no existan `subagents/agent-<id>.jsonl`. La fuente (1) exige una corrida sin esa bandera.
- Sobre `~/.claude/projects/`: solo se leen los `.jsonl` de esta corrida (los que lleven su `session_id`), y solo se extraen los campos `type`, `message.model`, `isSidechain`, `agentId`/`parent_tool_use_id` y nombre del agente. Nunca `.env`, llaves ni credenciales; no se pega contenido de conversación en la *Evidencia*.
- Se permiten como máximo **una corrida adicional por fuente** (hasta tres en total), con el mismo prompt fijo y la misma carpeta temporal por corrida. Las fuentes (1) y (2) pueden compartir una corrida si el lanzador activa ambas.
- El criterio es observable y exacto: modelo del principal = `claude-sonnet-5-5`; subagente `constructor` = `claude-haiku-5-5`; subagente `planificador` = `claude-sonnet-5-5` (esos valores salen de `modelos.json`; si Franco los cambió, rige lo que resuelva `node scripts/resolver.mjs modelo <agente> claude-code`).

## Alcance / Fuera de alcance
Alcance: el lanzador, una corrida y su evidencia.
Fuera de alcance: modificar `instalar.sh`, agentes o `modelos.json`; extractor reutilizable (task-05); Pi (task-04); ejercitar el flujo real del coordinador.

## Pasos
Los pasos 1 a 4 ya se hicieron (ver *Evidencia*, corrida 1). Quedan los pasos 5 a 10, que reemplazan al antiguo «extraer del registro».

1. (hecho) Crear `pruebas/lanzar-modelos-claude.sh`.
2. (hecho) Comprobar las dos precondiciones. **Repetirlas antes de cada corrida nueva**: `node pruebas/comprobaciones/modelos-agentes.mjs` debe dar 0 y `env | grep -c '^CLAUDE_CODE_SUBAGENT_MODEL='` debe dar 0 (si no, `BLOQUEO: rol=Franco; motivo=CLAUDE_CODE_SUBAGENT_MODEL está definida` o el de instalación desactualizada, como en *Decisiones*).
3. (hecho) Corrida 1 (`-p`, `--no-session-persistence`, `stream-json --verbose`): sin modelo de subagente.
4. (hecho) Tabla y líneas mínimas de la corrida 1.
5. **Ajustar el lanzador sin romper el comportamiento por defecto.** En `pruebas/lanzar-modelos-claude.sh`: (a) quitar `--no-session-persistence` solo cuando `FLUCASTR_PERSISTIR_SESION=1`; (b) reenviar a `claude` los argumentos extra del lanzador (`"$@"`) antes de `-- "$prompt"`, para poder pasar `--include-partial-messages` o `--debug-file <ruta>`. Sin variable ni argumentos, la invocación queda idéntica a la corrida 1. Resultado: `bash -n` sin salida.
6. **Fuente 1, transcripciones de Claude Code.** Correr desde una carpeta nueva `d=$(mktemp -d)`: `FLUCASTR_PERSISTIR_SESION=1 FLUCASTR_RECORD_FILE=$d/registro.jsonl bash -c 'cd "$0" && bash <ruta-absoluta-del-repo>/pruebas/lanzar-modelos-claude.sh --include-partial-messages --debug-file "$0/debug.log"' "$d"`. Tomar `session_id` del evento `system`/`init` del registro. Calcular la carpeta del proyecto: ruta real de `$d` (`cd "$d" && pwd -P`, en macOS `/private/var/...`) con `/` y `.` cambiados por `-`; si no existe, listar `~/.claude/projects/` por nombre y elegir la carpeta cuyo `.jsonl` lleva ese `session_id`. Buscar `*.jsonl` de esa sesión, incluidos `~/.claude/projects/<proyecto>/<session_id>/subagents/agent-*.jsonl` y `…/<session_id>.jsonl`. Extraer con `node -e` (sin dependencias) por cada línea `assistant`: `isSidechain`, `agentId` o equivalente, `message.model`, y el `subagent_type` del `tool_use` de `Agent` que la originó (por `tool_use_id` / `parent_tool_use_id`). Si aparecen `message.model` del `planificador` y del `constructor`, pegar la tabla y las líneas mínimas en *Evidencia* y **saltar al paso 9**.
7. **Fuente 2, `stream-json` ampliado y depuración** (misma corrida del paso 6, si no hubo modelo en las transcripciones). Del registro (con `--include-partial-messages`) buscar eventos `stream_event` / `message_start` con `message.model` y `parent_tool_use_id` no nulo. De `debug.log` filtrar solo líneas que contengan `claude-haiku`, `claude-sonnet` o `model` junto a `subagent`/`constructor`/`planificador` (`grep -n` con esos patrones; no pegar el log entero). Si alguna línea muestra el modelo efectivo de cada subagente por Claude Code, pegar solo esas líneas en *Evidencia* y **saltar al paso 9**. Si el `--debug-file` no se aceptó, anotar el error exacto y probar `--debug api` una vez en una corrida nueva; si tampoco, seguir.
8. **Fuente 3, modo no interactivo sin `-p`, solo si aplica.** Aplica únicamente si `claude --help` (leído en esta sesión) muestra una forma de dar el prompt y salir sin `-p` que no abra interfaz interactiva (por ejemplo, entrada por stdin con `--output-format`). Si no existe, anotar «no aplica: <motivo según claude --help>» y seguir. Si existe, una corrida con el mismo prompt y las mismas banderas de sesión y salida, y repetir la extracción del paso 6 y del 7. Una sesión interactiva con TUI **no** se prueba (no es automatizable en esta tarea).
9. **Conclusión.** En *Evidencia* escribir una de dos: (A) «fuente: <1|2|3>» con la tabla `agente | modelo observado | modelo de resolver.mjs` y las líneas JSON mínimas (sin contenido de conversación ni credenciales), para task-05; o (B) «**no verificable**: ninguna fuente de Claude Code muestra el modelo del subagente», con lo probado en cada fuente (comando, qué se buscó, qué apareció) como hallazgo para decisión de Franco. En el caso B el criterio 3 queda **no verificado** y no se marca cumplido, ni se infiere el modelo del subagente por el archivo instalado, por `modelos.json` ni por lo que el subagente diga de sí mismo.
10. Limpiar nada fuera de la carpeta temporal; no se borran transcripciones de `~/.claude/projects/`. Dejar en *Notas* lo que difiera de lo inferido (formato, ruta de transcripciones, efecto de `--no-session-persistence`).

## Criterios de aceptación
1. `bash -n pruebas/lanzar-modelos-claude.sh` termina con 0, también tras el paso 5; sin la variable ni argumentos extra, el comando de `claude` es el de la corrida 1.
2. Quedan identificados dos subagentes distintos (`planificador`, `constructor`) en la fuente que se use (`task_started.subagent_type` o transcripción).
3. Caso A: los modelos observados de `planificador` y `constructor` en una fuente generada por Claude Code coinciden con `node scripts/resolver.mjs modelo <agente> claude-code`. Caso B: la conclusión «no verificable» y el hallazgo están en *Evidencia*, y el criterio queda como «no verificado».
4. Cada corrida usó el agente instalado (precondición del paso 2 en 0 antes de esa corrida) y sin `CLAUDE_CODE_SUBAGENT_MODEL`.
5. En *Evidencia* consta qué fuentes se probaron, en qué orden, y en cuál se detuvo la búsqueda.

## Verificación
```
bash -n pruebas/lanzar-modelos-claude.sh
node pruebas/comprobaciones/modelos-agentes.mjs
env | grep -c '^CLAUDE_CODE_SUBAGENT_MODEL='
for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a claude-code; done
git status --short
```
Esperado: sin salida / `modelos de agentes instalados vigentes` / `0` (grep sin coincidencias; sale con código 1, es lo esperado) / tres modelos (`claude-sonnet-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` salvo cambio en `modelos.json`) que coinciden con la tabla de *Evidencia* en el caso A / solo cambios en `pruebas/lanzar-modelos-claude.sh` y en esta tarea. Las corridas son «no ejecutado, inferido» hasta que el constructor pegue su salida real.

## Evidencia

### Corrida 1 (historial, 2026-10-29; sin modelo de subagente)
Las secciones siguientes hasta *Notas* son la evidencia de la corrida 1 y se conservan. La evidencia de las fuentes nuevas (pasos 5 a 9) se añade debajo, en «Corridas por fuente».

Precondiciones (paso 2), salida real:
```
$ node pruebas/comprobaciones/modelos-agentes.mjs
modelos de agentes instalados vigentes
exit:0
$ env | grep -c '^CLAUDE_CODE_SUBAGENT_MODEL='
0        (grep sin coincidencias: la variable no está definida)
```

Lanzador, comprobación de sintaxis:
```
$ bash -n pruebas/lanzar-modelos-claude.sh
bash-n exit:0          (sin salida)
```

Corrida (paso 3), una sola vez:
```
$ d=$(mktemp -d); FLUCASTR_RECORD_FILE=$d/registro.jsonl bash -c 'cd "$0" && bash /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/lanzar-modelos-claude.sh' "$d"
Warning: no stdin data received in 3s, proceeding without it. ...
launcher exit:0
lines: 21
```
Registro: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.P9dVMX6NgH/registro.jsonl` (temporal, fuera del repo). El `init` reporta `model: claude-sonnet-5-5` y los agentes instalados (`arquitecto`, `constructor`, `coordinador`, `planificador`, …). `permission_denied`: 0.

Tabla (paso 4), extraída con `node -e` del registro:
```
parent_tool_use_id | subagent_type | message.model
null | (agente principal: coordinador) | claude-sonnet-5-5
null | (agente principal: coordinador) | claude-sonnet-5-5
null | (agente principal: coordinador) | claude-sonnet-5-5
```
Líneas JSON mínimas con `model` (las tres del agente principal; no hay ninguna de subagente):
```
{"type":"assistant","parent_tool_use_id":null,"model":"claude-sonnet-5-5"}
{"type":"assistant","parent_tool_use_id":null,"model":"claude-sonnet-5-5"}
{"type":"assistant","parent_tool_use_id":null,"model":"claude-sonnet-5-5"}
```
Identidad de los subagentes (sin modelo), eventos `task_started`:
```
{"subtype":"task_started","tool_use_id":"toolu_01WZZ2T2vV8NLju4srA7hVMo","subagent_type":"planificador"}
{"subtype":"task_started","tool_use_id":"toolu_017fmozu9ckymjFeYsBCpDy6","subagent_type":"constructor"}
```

Verificación de la tarea, salida real:
```
$ bash -n pruebas/lanzar-modelos-claude.sh
bash -n exit:0
$ node pruebas/comprobaciones/modelos-agentes.mjs
modelos de agentes instalados vigentes
modelos exit:0
$ for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a claude-code; done
claude-sonnet-5-5
claude-sonnet-5-5
claude-haiku-5-5
```

Criterios de aceptación:
1. `bash -n` termina con 0: **cumple**.
2. El registro contiene eventos de dos subagentes distintos (`planificador`, `constructor`): **cumple parcialmente**. Están identificados por `task_started.subagent_type` y `tool_use_id`, pero sus mensajes `assistant` no aparecen en el registro.
3. Los modelos observados coinciden con `resolver.mjs` para cada agente: **no verificado**. El registro no contiene el modelo de ningún subagente. El modelo del principal (`claude-sonnet-5-5`) coincide con el resuelto para `coordinador`, pero `planificador` (`claude-sonnet-5-5`) y `constructor` (`claude-haiku-5-5`) no se pueden comparar con lo observado.
4. La corrida usó el agente instalado: **cumple** (precondición de instalación en 0).

### Corridas por fuente (pasos 5 a 9)

Paso 5, ajuste del lanzador (sin cambiar el comportamiento por defecto):
```
$ bash -n pruebas/lanzar-modelos-claude.sh
bash -n exit:0          (sin salida)
```
El lanzador ahora quita `--no-session-persistence` solo con `FLUCASTR_PERSISTIR_SESION=1` y reenvía `"$@"` antes de `--allowedTools`. Sin variable ni argumentos, el argv de `claude` es el de la corrida 1.

Precondiciones antes de la corrida nueva (paso 2):
```
$ node pruebas/comprobaciones/modelos-agentes.mjs
modelos de agentes instalados vigentes
exit:0
$ env | grep -c '^CLAUDE_CODE_SUBAGENT_MODEL='
0
```

Paso 6, fuente 1 (transcripciones), corrida 2 (`FLUCASTR_PERSISTIR_SESION=1`, `--include-partial-messages`, `--debug-file`):
```
$ d=$(mktemp -d); FLUCASTR_PERSISTIR_SESION=1 FLUCASTR_RECORD_FILE=$d/registro.jsonl bash -c 'cd "$0" && bash /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/lanzar-modelos-claude.sh --include-partial-messages --debug-file "$0/debug.log"' "$d"
launcher exit:0
registro: 60 líneas
session_id (system/init): 30c267d6-8b27-4e60-af85-3bf5910c9613
```
Carpeta temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.AB4DDRjpjY` (fuera del repo). Carpeta de transcripciones: `~/.claude/projects/-private-var-folders-dm-9-88kbsd41150-nxzrxl4yw00000gn-T-tmp-AB4DDRjpjY/` (solo los `.jsonl` de la sesión `30c267d6-…`: `<sid>.jsonl` y `<sid>/subagents/agent-*.jsonl`, dos archivos).

Campos extraídos (sin contenido de conversación):
```
main <sid>.jsonl: type=assistant, isSidechain=false, parent_tool_use_id=null, model=claude-sonnet-5-5 (x3)
main <sid>.jsonl: tool_use Agent subagent_type=planificador, tool_use_id=toolu_01E61M6DtsEQ81RoWbLBgbEu
main <sid>.jsonl: tool_use Agent subagent_type=constructor,  tool_use_id=toolu_016z1YSZ5m4DBtLS2vkfFu2p
main <sid>.jsonl: toolUseResult agentType=planificador, agentId=aafe78eb84b12fc39, resolvedModel=claude-sonnet-5-5
main <sid>.jsonl: toolUseResult agentType=constructor,  agentId=a95dcac8507d1467b, resolvedModel=claude-haiku-5-5
subagents/agent-aafe78eb84b12fc39.jsonl: type=assistant, isSidechain=true, agentId=aafe78eb84b12fc39, model=claude-sonnet-5-5 (x1)
subagents/agent-a95dcac8507d1467b.jsonl: type=assistant, isSidechain=true, agentId=a95dcac8507d1467b, model=claude-haiku-5-5 (x2)
```

Tabla (fuente 1, Claude Code, no autodeclarada):
```
agente       | modelo observado (transcripción) | modelo de resolver.mjs (claude-code)
coordinador  | claude-sonnet-5-5 (agente principal) | claude-sonnet-5-5
planificador | claude-sonnet-5-5                 | claude-sonnet-5-5
constructor  | claude-haiku-5-5                  | claude-haiku-5-5
```
Registro `stream-json` de esta corrida (solo para comparar): los `assistant` con `parent_tool_use_id: null` son los del principal (`message.model: claude-sonnet-5-5`); los subagentes aparecen como `user` con `parent_tool_use_id` no nulo y sin `message.model`. Por eso la fuente 1 fue necesaria.

Paso 7, fuente 2: no hizo falta. La fuente 1 ya mostró el modelo de ambos subagentes. Se anota que `--debug-file` se aceptó sin error, y que `debug.log` (95 KB) no se extrajo.

Paso 8, fuente 3: no ejecutada. `claude --help` indica que `--input-format`, `--output-format`, `--include-partial-messages`, `--json-schema` y `--max-budget-usd` solo funcionan con `--print`, y que sin `-p` la sesión es interactiva por defecto. No hay forma no interactiva sin `-p` documentada; no se probó porque la fuente 1 ya resolvió el criterio.

Conclusión (paso 9): **fuente: 1** (transcripciones de Claude Code en `~/.claude/projects/`). Caso A.

Verificación de la tarea, salida real:
```
$ bash -n pruebas/lanzar-modelos-claude.sh
bash -n exit:0
$ node pruebas/comprobaciones/modelos-agentes.mjs
modelos de agentes instalados vigentes
modelos exit:0
$ env | grep -c '^CLAUDE_CODE_SUBAGENT_MODEL='
0
$ for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a claude-code; done
claude-sonnet-5-5
claude-sonnet-5-5
claude-haiku-5-5
$ git status --short
 M definitions/STATUS.md
 M features/F07-modelo-por-agente/task-02-modelos-instalados.md
 M features/F07-modelo-por-agente/task-03-corrida-claude-code.md
?? pruebas/lanzar-modelos-claude.sh
```
(`STATUS.md` y `task-02` ya estaban modificados antes de empezar; esta tarea no los tocó.)

Criterios de aceptación:
1. `bash -n` termina con 0 tras el paso 5, y el argv por defecto no cambia: **cumple**.
2. Dos subagentes distintos identificados por `task_started` / `subagent_type` y `agentType` del `toolUseResult`: **cumple**.
3. Caso A: `planificador` observado `claude-sonnet-5-5` y `constructor` observado `claude-haiku-5-5` coinciden con `resolver.mjs`: **cumple**. Fuente: transcripción de Claude Code (`message.model` y `resolvedModel`), no autodeclaración.
4. Precondición en 0 antes de la corrida, `CLAUDE_CODE_SUBAGENT_MODEL` no definida: **cumple**.
5. Fuentes probadas y orden: fuente 1 (corrida 2) → se detuvo aquí. Fuente 2 no necesaria. Fuente 3 no ejecutada (ver paso 8). Corrida 1 (historial) probó solo el stream-json de `-p` sin modelo de subagente.

## Notas

- **Corrida 2 (2026-10-30, fuente 1):** resuelta con transcripciones de Claude Code. Hallazgo: con `--no-session-persistence` no se crean `subagents/agent-*.jsonl` (hipótesis confirmada); sin esa bandera sí se crean, y en ellas el `message.model` de cada subagente es el que Claude Code usó. Además, en `toolUseResult` del `tool_result` de `Agent` aparecen `agentType`, `agentId` y `resolvedModel`, que sirven para mapear sin ambigüedad.
- **Diferencia con lo inferido:** el formato del `stream-json` sigue como en la corrida 1 (los subagentes no traen `message.model` en ese stream, ni con `--include-partial-messages`). La fuente que sirvió fue la transcripción, no el stream.
- **Ajuste del lanzador:** quitar `--no-session-persistence` solo con `FLUCASTR_PERSISTIR_SESION=1`, y `"$@"` reenviado a `claude`; con `set -u` en bash 3.2 se usa `${extra[@]+"${extra[@]}"}` para el array vacío.
- **Aviso para task-05:** la corrida 2 deja transcripciones de subagentes en `~/.claude/projects/` (sesión `30c267d6-…`). No se borraron. Un extractor tendrá que buscar `subagents/agent-*.jsonl` y mapear por `toolUseResult.agentId`.
- **Reescritura 2026-10-29:** Franco eligió buscar otra fuente fiable del modelo del subagente (no autodeclaración). Se reescribieron *Decisiones*, *Pasos*, *Criterios* y *Verificación*; lo de abajo y la corrida 1 son historial. Hipótesis nueva: `--no-session-persistence` impidió que existieran `subagents/agent-<id>.jsonl` (inferido, a comprobar en el paso 6).
- **Notas de la corrida 1 (historial):**
- **Formato real distinto de lo inferido.** Lo inferido era que los `assistant` de un subagente traen `parent_tool_use_id` igual al `id` del `tool_use` de `Agent` y `message.model` con el modelo real. Observado: en el `stream-json` de `claude -p` no aparecen `assistant` de subagentes. Solo hay `assistant` del principal (`parent_tool_use_id: null`). Los subagentes se ven en `task_started` / `task_notification` (`tool_use_id`, `subagent_type`, `usage`), y el resultado llega en un `user` con `tool_result` («[Subagent hand-back] … OK»). Ninguno trae campo de modelo.
- **Transcripciones de subagente no disponibles.** Los `tasks/<id>.output` son enlaces simbólicos a `~/.claude/projects/…/subagents/agent-<id>.jsonl`, pero esos archivos no existen tras una corrida con `-p`. Por eso no hay otra fuente local del modelo de subagente. Para task-05 hay que decidir una fuente: una sesión interactiva, o transcripciones en disco, o aceptar que el modelo de subagente no es observable en `-p`. Es decisión de Franco.
- **No se repitió la corrida.** La corrida terminó con 0 y sin denegaciones; el hueco es de formato, no de lanzador. La tarea pide repetir solo si falla una causa del lanzador.
- **Hueco menor resuelto:** el lanzador usa `--agent coordinador` para que el coordinador sea el agente principal (la tarea lo exige). El prompt fijo va en línea, con el texto de *Decisiones ya tomadas*.
- **Aviso no bloqueante de Claude Code:** «no stdin data received in 3s» (stderr). No afectó a la corrida; el lanzador no redirige stdin. Anotado sin cambiar nada.
- Estado: `lista para revisión`. El criterio 3 queda sin verificar; Franco decide si acepta el formato observado o si task-05 debe resolver la fuente del modelo de subagente.
