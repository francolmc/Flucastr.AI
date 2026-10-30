# task-05 — Extractor de modelos por actor en el registro estructurado
repo: Flucastr.AI   depende_de: task-03, task-04   estado: hecha

## Descripción
`registro.mjs` devuelve un solo `model` (el del agente principal). Esta tarea añade `modelosPorActor(source, tool)`, que devuelve qué modelo respondió cada actor (principal y subagentes por nombre) según el formato **observado** en task-03 y task-04. En Pi el modelo del subagente sale del propio registro (`details.results[].model` de la herramienta `subagent`, task-04). En Claude Code el `stream-json` del lanzador no trae el modelo del subagente (task-03, corrida 2): sale de las transcripciones de Claude Code. Por eso `source` puede ser el registro principal, las líneas de transcripción, o ambos concatenados. Se prueba con líneas acotadas de esas evidencias, sin formatos inventados y sin contenido de conversación.

## Contexto
- Repo único. Leídos: `pruebas/comprobaciones/registro.mjs` (`parseLines` ignora líneas que no son JSON; `claudeEvents`, `piEvents`, `analyzeRecord`, `analyzeRecordFile`) y `pruebas/comprobaciones/registro.test.mjs` (estilo: helper `line`, `node:test`, `assert/strict`).
- Archivos a tocar: `pruebas/comprobaciones/registro.mjs` (añadir una exportación) y `pruebas/comprobaciones/registro.test.mjs` (añadir pruebas). Comando: `node --test pruebas/comprobaciones/registro.test.mjs`.
- **Claude Code, confirmado en task-03 (*Evidencia* «Corridas por fuente» y *Notas*):**
  - Generadas solo sin `--no-session-persistence` (lanzador: `FLUCASTR_PERSISTIR_SESION=1`) en `~/.claude/projects/<proyecto>/<session_id>/subagents/agent-<id>.jsonl`, más la sesión principal `<session_id>.jsonl` en `~/.claude/projects/<proyecto>/`.
  - Transcripción de subagente: líneas `type=assistant`, `isSidechain=true`, `agentId`, `message.model` (ej. `agentId=a95dcac8507d1467b`, `claude-haiku-5-5`, x2; `agentId=aafe78eb84b12fc39`, `claude-sonnet-5-5`, x1).
  - Sesión principal: línea con `toolUseResult` que lleva `agentType` (`planificador`/`constructor`), `agentId` y `resolvedModel`; es el mapeo agente→id. También líneas `assistant` con `isSidechain=false`, `message.model=claude-sonnet-5-5` (principal).
  - `stream-json` del lanzador: `assistant` con `parent_tool_use_id: null` y `message.model` (solo principal); los subagentes no traen `message.model`; `task_started` trae `subagent_type`.
  - **Inferido, a confirmar en el paso 1:** la posición exacta de las claves (nivel superior de la línea vs. dentro de `message`) no está pegada literalmente en task-03, solo los campos.
- **Pi, confirmado en task-04 (*Evidencia* y *Notas*) y releído en el registro de esa corrida (solo campos necesarios):**
  - Principal: `{"type":"turn_end","message":{"role":"assistant","provider":"openai","model":"gpt-6.1-sol"}}` (igual forma en `message_start`). El modelo viene sin proveedor; se compone `provider/model` = `openai/gpt-6.1-sol`.
  - Subagentes: `{"type":"tool_execution_end","toolName":"subagent","result":{"details":{"results":[{"agent":"planificador","model":"openai/gpt-6.1-sol","requestedModel":"openai/gpt-6.1-sol"}]}}}` y la del `constructor` con `"model":"openai/gpt-6-sol"` (en la corrida real esa línea no trae `requestedModel`; no se usa). El `model` del subagente ya incluye proveedor. `results` es un arreglo: puede haber más de un elemento por línea.

## Decisiones ya tomadas
- Firma: `export function modelosPorActor(source, tool)` → `{ principal: string|null, subagentes: { [nombre]: string[] } }` (lista sin duplicados, en orden de aparición). `tool` es `claude-code` o `pi`; otra herramienta lanza `Error('Herramienta de registro no soportada: …')`, como `analyzeRecord`.
- **Claude Code, dos fuentes en la misma entrada (`source`):**
  - `principal`: modelo del evento `system`/`init` o, si no hay, del primer `assistant` que no sea de subagente (`isSidechain` distinto de `true` y `parent_tool_use_id` nulo o ausente).
  - Nombre del subagente: solo de un `toolUseResult.agentType` con su `agentId` (nunca se adivina; `subagent_type` de `task_started` no tiene modelo ni `agentId`, no se usa).
  - Modelo del subagente: `message.model` de las líneas `assistant` con `isSidechain: true` y ese `agentId`. Solo si no hay ninguna para ese `agentId`, se usa `toolUseResult.resolvedModel`. Una línea sidechain cuyo `agentId` no tiene `toolUseResult` se ignora.
  - Si `source` trae solo el registro principal (sin transcripciones), `subagentes` es `{}` (o solo lo que dé `resolvedModel`): no se inventa nada.
- **Pi (observado en task-04), todo en el registro `--mode json`; no hay segunda fuente:**
  - `principal`: primer `turn_end` o `message_start` con `message.role === 'assistant'` y `message.model`; si hay `message.provider`, se devuelve `provider/model`.
  - Subagentes: cada línea `type: 'tool_execution_end'` con `toolName: 'subagent'`; por cada elemento de `result.details.results` con `agent` y `model` string, se agrega `model` a `subagentes[agent]` (sin duplicados, en orden). Elementos sin `agent` o sin `model` se ignoran. No se usa `requestedModel` ni `_meta.json`/transcripciones de Pi.
  - Registro de Pi sin resultado de `subagent` → `subagentes: {}` y `principal` solo.
- No se cambia el resultado de `analyzeRecord` ni de `analyzeRecordFile`; el campo `model` actual sigue igual. No se añade lectura de `~/.claude/projects/` al código: la función recibe texto.
- Fixtures: líneas mínimas con solo los campos listados arriba (`type`, `isSidechain`, `agentId`, `parent_tool_use_id`, `message.model`, `toolUseResult.{agentType,agentId,resolvedModel}`; Pi: `type`, `toolName`, `message.{role,provider,model}`, `result.details.results[].{agent,model}`), con los valores reales de task-03 y task-04. Sin texto de mensajes, rutas ni credenciales.

## Alcance / Fuera de alcance
Alcance: la función y sus pruebas.
Fuera de alcance: conectar la función a `pruebas/ejecutar.sh` o a los lanzadores; leer o copiar transcripciones al repo; nuevas corridas con modelo; escenarios B/M/R; editar task-03 o task-04.

## Pasos
1. Leer *Evidencia* y *Notas* de task-03 y task-04 (las líneas de Pi ya están confirmadas en *Contexto*). Si la *Evidencia* de task-03 o de task-04 está vacía, detenerse con `BLOQUEO: rol=constructor; motivo=task-03 o task-04 sin evidencia`. Confirmar la posición de las claves del Claude Code leyendo, de la sesión `30c267d6-8b27-4e60-af85-3bf5910c9613` en `~/.claude/projects/` (carpeta indicada en task-03), solo los campos listados en *Decisiones* (`node -e`, sin imprimir contenido de conversación). Si la sesión ya no existe, usar los campos de task-03 tal cual y anotarlo en *Notas*. Si difieren de lo inferido, rige lo observado y se anota.
2. Implementar `modelosPorActor` en `registro.mjs` reutilizando `parseLines`. Resultado: la función se importa.
3. Añadir a `registro.test.mjs`: (a) Claude Code, registro principal + líneas de transcripción de dos subagentes → `principal: 'claude-sonnet-5-5'`, `subagentes: { planificador: ['claude-sonnet-5-5'], constructor: ['claude-haiku-5-5'] }` (el `constructor` con dos líneas `assistant` da una sola entrada); (b) Claude Code, solo registro principal → `subagentes: {}`; (c) línea sidechain sin `toolUseResult` correspondiente se ignora; (d) Pi con las tres líneas de task-04 (turn_end del principal + dos `tool_execution_end` de `subagent`) → `principal: 'openai/gpt-6.1-sol'`, `subagentes: { planificador: ['openai/gpt-6.1-sol'], constructor: ['openai/gpt-6-sol'] }`; (d2) Pi solo con el `turn_end` del principal → `subagentes: {}`; (d3) Pi con `subagent` cuyo elemento no trae `model` → se ignora; (e) registro vacío → `principal: null`, `subagentes: {}`; (f) herramienta no soportada lanza el error. Resultado: pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Con las líneas de Claude Code (principal + transcripciones), `principal` y cada subagente tienen el modelo de la *Evidencia* de task-03; con solo el principal, `subagentes` es `{}`. Prueba con los valores reales.
2. Pi: con las líneas de la *Evidencia* de task-04, `principal` y cada subagente tienen el modelo observado; sin resultado de `subagent`, `subagentes` es `{}`.
3. Registro vacío y herramienta no soportada se comportan como se decidió.
4. Las pruebas existentes de `registro.test.mjs` siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/registro.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

Reintento 2026-10-30. Se reejecutó toda la verificación con la salida real de esta corrida. Antes de correr, `git status` mostró solo `definitions/STATUS.md` y esta tarea modificados: `registro.mjs` y `registro.test.mjs` ya están en el commit `fcccc5f`, así que el extractor y sus pruebas se verificaron tal como están en la rama.

Requisito previo (*Pasos* 1): task-03 tiene ahora 7 pasos en «Pasos» (regla de 1 a 8) y su *Evidencia* no está vacía; task-04 está `hecha` con *Evidencia*. Comando y salida real:
```
$ awk '/^## Pasos/{f=1;next} /^## /{f=0} f' features/F07-modelo-por-agente/task-03-corrida-claude-code.md | grep -c '^[0-9]'
7
$ awk '/^## Evidencia/{f=1} f' features/F07-modelo-por-agente/task-03-corrida-claude-code.md | wc -l
162
```

Paso 1, posición de las claves. Sesión `30c267d6-8b27-4e60-af85-3bf5910c9613` (`~/.claude/projects/…AB4DDRjpjY/`), solo los campos de *Decisiones*; la sesión sigue existiendo. Salida real de `node` (resumida a las líneas con los campos; se omitieron las líneas sin campos relevantes, como `attachment`, `api-request*` y `queue-operation`):
```
30c267d6-8b27-4e60-af85-3bf5910c9613.jsonl:
{"type":"assistant","isSidechain":false,"message.model":"claude-sonnet-5-5"}
{"type":"user","isSidechain":false,"toolUseResult":{"agentType":"planificador","agentId":"aafe78eb84b12fc39","resolvedModel":"claude-sonnet-5-5"}}
{"type":"assistant","isSidechain":false,"message.model":"claude-sonnet-5-5"}
{"type":"user","isSidechain":false,"toolUseResult":{"agentType":"constructor","agentId":"a95dcac8507d1467b","resolvedModel":"claude-haiku-5-5"}}
{"type":"assistant","isSidechain":false,"message.model":"claude-sonnet-5-5"}
{"type":"system","isSidechain":false}
subagents/agent-a95dcac8507d1467b.jsonl:
{"type":"assistant","isSidechain":true,"agentId":"a95dcac8507d1467b","message.model":"claude-haiku-5-5"}
{"type":"assistant","isSidechain":true,"agentId":"a95dcac8507d1467b","message.model":"claude-haiku-5-5"}
subagents/agent-aafe78eb84b12fc39.jsonl:
{"type":"assistant","isSidechain":true,"agentId":"aafe78eb84b12fc39","message.model":"claude-sonnet-5-5"}
```
La forma coincide con la que asume la función (`toolUseResult` en línea `user` de nivel superior, `agentId` en nivel superior en sidechain, `message.model` dentro de `message`). No hubo diferencias que corregir.

Paso 3, pruebas (salida real de `node --test pruebas/comprobaciones/registro.test.mjs`):
```
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash
✔ Pi: detecta Read y Bash cat, grep o head de .env
✔ distingue validación bash -n de ejecución efectiva de initialize.sh
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada
✔ Pi: detecta el canario devuelto por la herramienta
✔ modelosPorActor Claude Code: principal y subagentes desde registro y transcripciones (1.006041ms)
✔ modelosPorActor Claude Code: solo registro principal no inventa subagentes (0.083334ms)
✔ modelosPorActor Claude Code: linea sidechain sin toolUseResult se ignora (0.072042ms)
✔ modelosPorActor Claude Code: sin transcripcion usa resolvedModel del toolUseResult (0.084584ms)
✔ modelosPorActor Pi: principal y subagentes desde el registro de la corrida (0.188916ms)
✔ modelosPorActor Pi: solo turn_end del principal deja subagentes vacio (0.063917ms)
✔ modelosPorActor Pi: elemento de subagent sin model se ignora (0.053708ms)
✔ modelosPorActor: registro vacio da principal null y subagentes vacio (0.065667ms)
✔ modelosPorActor: herramienta no soportada lanza el error (0.193833ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.666042
node-test exit:0
```

Comprobación con los datos reales de Claude Code (solo el resultado de la función, sin contenido de conversación; salida real de `node --input-type=module`):
```
claude-code real (sesion + subagentes): {"principal":"claude-sonnet-5-5","subagentes":{"planificador":["claude-sonnet-5-5"],"constructor":["claude-haiku-5-5"]}}
claude-code real solo principal: {"principal":"claude-sonnet-5-5","subagentes":{"planificador":["claude-sonnet-5-5"],"constructor":["claude-haiku-5-5"]}}
node exit:0
```
Nota sobre la segunda línea: el «solo principal» se leyó de la sesión `.jsonl`, que aún contiene los `toolUseResult` con `agentType`; por eso `subagentes` no sale vacío. El caso «sin transcripciones y sin `toolUseResult`» (`subagentes: {}`) se verifica con la prueba (b) de arriba, con el registro principal sin esas líneas.

Comprobación con datos reales de Pi: no se pudo repetir. El registro `stream-json`/`--mode json` de la corrida de task-04 (`corrida-pi.Xl8T`) ya no existe en el sistema de archivos. Los casos de Pi quedan verificados con las líneas observadas de task-04 en las pruebas (d), (d2) y (d3).

Verificación 2 (`bash pruebas/rapida.sh`), salida completa en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/14b3b3bb-3945-4c18-bed2-c390112a4639/scratchpad/rapida2.out`. Final de la salida real:
```
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (150.742917ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (12.983875ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (8.752542ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (7.097417ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (6.033333ms)
ℹ tests 158
ℹ suites 0
ℹ pass 158
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 21677.567125
rapida: 17 archivos en 21 s (tope 30 s)
rapida exit:0
```

Criterios de aceptación:
1. Claude Code con líneas reales (principal + transcripciones): principal `claude-sonnet-5-5`, planificador `claude-sonnet-5-5`, constructor `claude-haiku-5-5`; solo principal sin `toolUseResult` → `subagentes: {}` (prueba b). **Cumple.**
2. Pi con las líneas de la *Evidencia* de task-04: principal `openai/gpt-6.1-sol`, planificador `openai/gpt-6.1-sol`, constructor `openai/gpt-6-sol`; sin `subagent` → `{}` (prueba d2). **Cumple** por pruebas; sin repetición con datos reales de Pi (ver arriba).
3. Registro vacío → `{principal: null, subagentes: {}}`; herramienta no soportada lanza el error. **Cumple** (pruebas e y f).
4. Las pruebas existentes siguen pasando: `node --test` con `pass 14` y `rapida.sh` con `pass 158`, `fail 0`. **Cumple.**
5. Verificación `bash pruebas/rapida.sh` con código 0 y línea `rapida: 17 archivos en 21 s (tope 30 s)`. **Cumple.** El bloqueo anterior (task-03 con 10 pasos) ya no aplica.

## Notas
- Forma observada (rige lo observado, según el paso 1). Diferencias con *Contexto*: `toolUseResult` está en una línea `type: "user"` de nivel superior (no en `assistant`); el `agentId` de las líneas sidechain está en el nivel superior; `message.model` está dentro de `message`, también en el principal del `stream-json` (`pid=null`); `system/init` trae `model` en el nivel superior. La tabla de task-03 con `model` en el nivel superior es una simplificación. El código lee `message.model` y `init.model`. Ninguna clave cambió de lugar respecto de lo que pide la función.
- Decisiones menores tomadas:
  - Principal de Claude Code: `system/init.model` si existe; si no, el primer `assistant` sin `isSidechain: true` y sin `parent_tool_use_id`.
  - Un subagente sin modelo observado (ni líneas sidechain con su `agentId`, ni `resolvedModel`) no aparece como clave en `subagentes`.
  - Añadí una prueba extra para la rama `resolvedModel` del `toolUseResult` (sin transcripción). No estaba en la lista de pasos, pero sí en *Decisiones*.
- Bug encontrado en la primera corrida y corregido: con un objeto plano, el actor `constructor` choca con `Object.prototype.constructor` y rompe la acumulación. Ahora se usa un `Map` internamente y `Object.fromEntries` al final.
- Reintento 2026-10-30: el bloqueo anterior ya no aplica. task-03 tiene 7 pasos (regla de 1 a 8) y `bash pruebas/rapida.sh` pasa con código 0. Se retiró la nota de bloqueo. No hubo cambios de código en este reintento: el extractor y sus pruebas ya estaban en `fcccc5f`.
- Límite de esta corrida: la comprobación con datos reales de Pi no se pudo repetir porque el registro de la corrida de task-04 ya no existe; se cubre con las pruebas (d), (d2) y (d3) usando las líneas observadas en task-04.
- `rapida.sh` ya no falla, así que no dejó entorno en `pruebas/.temporales/`.
- Archivos tocados por esta tarea: esta tarea (*Evidencia*, *Notas* y `estado`). `pruebas/comprobaciones/registro.mjs` y `registro.test.mjs` no se modificaron en este reintento. `definitions/STATUS.md` ya estaba modificado antes de empezar y no lo toqué. No hubo commit, push, PR, merge ni despliegue.

Reescrita 2026-10-30 a pedido de Franco tras el hallazgo de task-03 (el modelo del subagente de Claude Code sale de transcripciones, no del `stream-json`). Ajustada 2026-10-30 a pedido de Franco tras task-04 (hecha): en Pi el modelo del subagente es observable en el registro (`details.results[].model`), así que la rama «no observable» pasa a ser solo un caso de prueba. Formas de línea confirmadas en el registro de la corrida de task-04. Reintento 2026-10-30: verificación repetida; ver *Evidencia*.
