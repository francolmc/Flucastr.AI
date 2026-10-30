# task-05 — Extractor de modelos por actor en el registro estructurado
repo: Flucastr.AI   depende_de: task-03, task-04   estado: aprobada

## Descripción
`registro.mjs` devuelve un solo `model` (el del agente principal). Esta tarea añade `modelosPorActor(source, tool)`, que devuelve qué modelo respondió cada actor (principal y subagentes por nombre) según el formato **observado** en task-03 y task-04. En Claude Code el `stream-json` del lanzador no trae el modelo del subagente (task-03, corrida 2): sale de las transcripciones de Claude Code. Por eso `source` puede ser el registro principal, las líneas de transcripción, o ambos concatenados. Se prueba con líneas acotadas de esas evidencias, sin formatos inventados y sin contenido de conversación.

## Contexto
- Repo único. Leídos: `pruebas/comprobaciones/registro.mjs` (`parseLines` ignora líneas que no son JSON; `claudeEvents`, `piEvents`, `analyzeRecord`, `analyzeRecordFile`) y `pruebas/comprobaciones/registro.test.mjs` (estilo: helper `line`, `node:test`, `assert/strict`).
- Archivos a tocar: `pruebas/comprobaciones/registro.mjs` (añadir una exportación) y `pruebas/comprobaciones/registro.test.mjs` (añadir pruebas). Comando: `node --test pruebas/comprobaciones/registro.test.mjs`.
- **Claude Code, confirmado en task-03 (*Evidencia* «Corridas por fuente» y *Notas*):**
  - Generadas solo sin `--no-session-persistence` (lanzador: `FLUCASTR_PERSISTIR_SESION=1`) en `~/.claude/projects/<proyecto>/<session_id>/subagents/agent-<id>.jsonl`, más la sesión principal `<session_id>.jsonl` en `~/.claude/projects/<proyecto>/`.
  - Transcripción de subagente: líneas `type=assistant`, `isSidechain=true`, `agentId`, `message.model` (ej. `agentId=a95dcac8507d1467b`, `claude-haiku-5-5`, x2; `agentId=aafe78eb84b12fc39`, `claude-sonnet-5-5`, x1).
  - Sesión principal: línea con `toolUseResult` que lleva `agentType` (`planificador`/`constructor`), `agentId` y `resolvedModel`; es el mapeo agente→id. También líneas `assistant` con `isSidechain=false`, `message.model=claude-sonnet-5-5` (principal).
  - `stream-json` del lanzador: `assistant` con `parent_tool_use_id: null` y `message.model` (solo principal); los subagentes no traen `message.model`; `task_started` trae `subagent_type`.
  - **Inferido, a confirmar en el paso 1:** la posición exacta de las claves (nivel superior de la línea vs. dentro de `message`) no está pegada literalmente en task-03, solo los campos.
- **Pi:** task-04 aún no tiene *Evidencia*; su hallazgo manda (ver *Decisiones*).

## Decisiones ya tomadas
- Firma: `export function modelosPorActor(source, tool)` → `{ principal: string|null, subagentes: { [nombre]: string[] } }` (lista sin duplicados, en orden de aparición). `tool` es `claude-code` o `pi`; otra herramienta lanza `Error('Herramienta de registro no soportada: …')`, como `analyzeRecord`.
- **Claude Code, dos fuentes en la misma entrada (`source`):**
  - `principal`: modelo del evento `system`/`init` o, si no hay, del primer `assistant` que no sea de subagente (`isSidechain` distinto de `true` y `parent_tool_use_id` nulo o ausente).
  - Nombre del subagente: solo de un `toolUseResult.agentType` con su `agentId` (nunca se adivina; `subagent_type` de `task_started` no tiene modelo ni `agentId`, no se usa).
  - Modelo del subagente: `message.model` de las líneas `assistant` con `isSidechain: true` y ese `agentId`. Solo si no hay ninguna para ese `agentId`, se usa `toolUseResult.resolvedModel`. Una línea sidechain cuyo `agentId` no tiene `toolUseResult` se ignora.
  - Si `source` trae solo el registro principal (sin transcripciones), `subagentes` es `{}` (o solo lo que dé `resolvedModel`): no se inventa nada.
- **Pi (condicional según task-04):**
  - Si la *Evidencia*/*Notas* de task-04 dicen «subagente no observable en el registro», el extractor para `pi` devuelve `principal` (modelo de `turn_end`/`message_start`, como `piEvents`) y `subagentes: {}`; la prueba lo documenta con una línea mínima real de task-04.
  - Si task-04 muestra el modelo del subagente en el registro (o en otra fuente generada por Pi que task-04 haya usado), el extractor lo lee de **esa** línea con el formato pegado allí, y la prueba usa esas líneas. Si la fuente es un archivo distinto del registro, `source` acepta las líneas concatenadas, igual que en Claude Code.
  - No se define aquí ningún formato de Pi que task-04 no haya observado.
- No se cambia el resultado de `analyzeRecord` ni de `analyzeRecordFile`; el campo `model` actual sigue igual. No se añade lectura de `~/.claude/projects/` al código: la función recibe texto.
- Fixtures: líneas mínimas con solo los campos listados arriba (`type`, `isSidechain`, `agentId`, `parent_tool_use_id`, `message.model`, `toolUseResult.{agentType,agentId,resolvedModel}`), con los valores reales de task-03. Sin texto de mensajes, rutas ni credenciales.

## Alcance / Fuera de alcance
Alcance: la función y sus pruebas.
Fuera de alcance: conectar la función a `pruebas/ejecutar.sh` o a los lanzadores; leer o copiar transcripciones al repo; nuevas corridas con modelo; escenarios B/M/R; editar task-03 o task-04.

## Pasos
1. Leer *Evidencia* y *Notas* de task-03 y task-04. Si la *Evidencia* de task-03 o de task-04 está vacía, detenerse con `BLOQUEO: rol=constructor; motivo=task-03 o task-04 sin evidencia`. Confirmar la posición de las claves del Claude Code leyendo, de la sesión `30c267d6-8b27-4e60-af85-3bf5910c9613` en `~/.claude/projects/` (carpeta indicada en task-03), solo los campos listados en *Decisiones* (`node -e`, sin imprimir contenido de conversación). Si la sesión ya no existe, usar los campos de task-03 tal cual y anotarlo en *Notas*. Si difieren de lo inferido, rige lo observado y se anota.
2. Implementar `modelosPorActor` en `registro.mjs` reutilizando `parseLines`. Resultado: la función se importa.
3. Añadir a `registro.test.mjs`: (a) Claude Code, registro principal + líneas de transcripción de dos subagentes → `principal: 'claude-sonnet-5-5'`, `subagentes: { planificador: ['claude-sonnet-5-5'], constructor: ['claude-haiku-5-5'] }` (el `constructor` con dos líneas `assistant` da una sola entrada); (b) Claude Code, solo registro principal → `subagentes: {}`; (c) línea sidechain sin `toolUseResult` correspondiente se ignora; (d) Pi según la rama de *Decisiones*; (e) registro vacío → `principal: null`, `subagentes: {}`; (f) herramienta no soportada lanza el error. Resultado: pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Con las líneas de Claude Code (principal + transcripciones), `principal` y cada subagente tienen el modelo de la *Evidencia* de task-03; con solo el principal, `subagentes` es `{}`. Prueba con los valores reales.
2. Pi: la prueba cubre la rama que corresponde al hallazgo de task-04 («no observable» → solo principal; observable → modelo del subagente con las líneas de su *Evidencia*).
3. Registro vacío y herramienta no soportada se comportan como se decidió.
4. Las pruebas existentes de `registro.test.mjs` siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/registro.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

## Notas
Reescrita 2026-10-30 a pedido de Franco tras el hallazgo de task-03 (el modelo del subagente de Claude Code sale de transcripciones, no del `stream-json`). La rama de Pi queda condicionada al resultado de task-04 (aún sin evidencia).
