# task-03 — Subagentes de Pi: turnos, costo y KB leídos por rol
repo: Flucastr.AI   depende_de: task-02   estado: lista para revisión

## Descripción
Suma a la medición de Pi el trabajo de los subagentes (`arquitecto`, `planificador`, `constructor`): costo y turnos por rol, y KB leídos por rol y por archivo, para comprobar lo que cada rol lee (`definitions/CONTEXTO.md` §2.2). Calcula también los turnos del `coordinador` por llamada a subagente.

## Contexto
- Formato (confirmado en `~/.pi/agent/sessions/--Users-franco-Codes-flucastr-Flucastr.Cleaner--/subagent-artifacts/`): por cada corrida hay `<runId>_<agente>_meta.json` y `<runId>_<agente>_transcript.jsonl`. El meta trae `runId`, `parentSessionId` (igual al `id` del registro `session` de la sesión principal), `agent`, `model` y `usage: {input, output, cacheRead, cacheWrite, cost (número), turns}`. El transcript es JSONL con `recordType:"message"` y, según `sourceEventType:"message_end"`: `role:"assistant"` (con `message.content` que puede incluir `toolCall {id,name,arguments}` y `usage.cost.total`) o `role:"toolResult"` (con `toolCallId`, `toolName`, `isError` y `message.content[].text`). Existen también `recordType:"tool_start"`/`"tool_end"`, que se ignoran.
- Agentes vistos: `arquitecto`, `planificador`, `constructor`.
- Leer `scripts/consumo.mjs` (task-01/02) y reutilizar la lógica de lecturas por `toolCallId`.
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs` (helpers `metaSubagentePi`, `transcriptSubagentePi`), `pruebas/comprobaciones/consumo.test.mjs`.

## Decisiones ya tomadas
- Nueva función exportada `analizarSubagentesPi(dirArtefactos, { sesionId, hasta } = {})`: lee los `*_meta.json` de la carpeta, conserva los de `parentSessionId === sesionId` (si `sesionId` no se da, todos) y, con `hasta`, los de `timestamp` (milisegundos del meta) ≤ `Date.parse(hasta)`.
- Por corrida lee el transcript hermano `<runId>_<agent>_transcript.jsonl` (no usa `transcriptPath`, que es absoluta). Si falta, la corrida cuenta con `kb` 0 y `sinTranscript:true`.
- Resultado: `{ porRol: { <agent>: { corridas, turnos, costo, kbTotal, porArchivo:{<ruta>:{lecturas,kb}} } }, modelos: { <agent>: [<model>...] } }`. `turnos` y `costo` salen del meta (`usage.turns`, `usage.cost`); los KB, del transcript con la misma regla de task-02 (bytes del `text` de `toolResult` de `read`, sin errores, 1 decimal).
- Nueva función `unirPi(principal, subagentes)` que devuelve `{ ...principal, subagentes, turnosPorLlamada }` con `turnosPorLlamada = principal.turnos / principal.llamadasSubagente` (1 decimal; `null` si no hay llamadas).
- Ningún texto de los transcripts ni el campo `task` del meta (que puede traer el encargo) se copia al resultado.

## Alcance / Fuera de alcance
Alcance: lectura de `subagent-artifacts` y agregados por rol.
Fuera de alcance: CLI e informe; Claude Code (task-04); descubrir carpetas de sesiones (task-05); validar `acceptance` del meta.

## Pasos
1. En `consumo-fixtures.mjs`, agregar `metaSubagentePi` y `transcriptSubagentePi` (con `CENTINELA_TEXTO` en `task` y en los textos).
2. En `scripts/consumo.mjs`, implementar `analizarSubagentesPi` y `unirPi`.
3. En `consumo.test.mjs`, agregar: una carpeta temporal con 3 corridas (`constructor` ×2, `planificador` ×1, más una de otra sesión) → `porRol.constructor.corridas` 2 con costos y turnos sumados, la ajena excluida; KB de un `read` de `definitions/PROJECT.md` (2048 bytes) en el transcript del `planificador` → `kbTotal` 2; transcript ausente → `sinTranscript:true`; `turnosPorLlamada` con 30 turnos y 6 llamadas = 5; `JSON.stringify` del resultado no contiene `CENTINELA_TEXTO`.
4. Correr las pruebas.

## Criterios de aceptación
1. Agregados por rol correctos para el caso de 3 corridas (valores exactos de Pasos 3).
2. Las corridas de otra sesión se excluyen.
3. KB por rol y por archivo coinciden con los bytes del fixture.
4. El resultado no contiene el centinela.
5. Las pruebas de task-01 y task-02 siguen pasando.

## Verificación
`node --test pruebas/comprobaciones/consumo.test.mjs` → `fail 0`.

## Evidencia
$ node --test pruebas/comprobaciones/consumo.test.mjs   (desde la raíz del repo; pasada final, tras corregir un fallo propio)
✔ subagentes (1): tres corridas de S1 suman por rol; la de S2 se excluye
✔ subagentes (2): transcript ausente: KB 0 y sinTranscript:true
✔ subagentes (3): hasta descarta las corridas con timestamp posterior
✔ unirPi: 30 turnos y 6 llamadas dan turnosPorLlamada 5; sin llamadas, null
✔ subagentes: ni el resultado de subagentes ni el de unirPi contienen el centinela
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

## Notas
- Primera pasada de la Verificación: 3 pruebas fallaron con `conjuntoModelos.add is not a function`. Causa: `porRol` y `modelos` eran objetos planos y el rol `constructor` cae en `Object.prototype`. Corregido usando `Map` internamente y devolviendo objetos planos (intentos=2 en el registro).
- Huecos menores (decisiones):
  - `sinTranscript`: la tarea lo describe por corrida; en `porRol[rol]` se expone como `true` si al menos una corrida del rol no tiene transcript.
  - Campos del transcript: `recordType`, `message.role`, `message.toolCallId`, `message.isError` y `message.content`; comprobado solo con las claves de un artefacto real (sin leer valores ni texto).
  - Corridas sin `timestamp` numérico con `hasta` se descartan (criterio conservador).
  - Una carpeta inexistente hace fallar `readdirSync` (la tarea no lo define).
  - La cabecera de `scripts/consumo.mjs` decía «solo funciones puras / no lee archivos»; se actualizó porque `analizarSubagentesPi` lee la carpeta.
  - La lectura de `read` por `toolCallId` se reimplementó en `lecturasDeTranscript` (misma regla que task-02) en vez de extraerla de `analizarSesionPi`, para no tocar task-02.
- Señal: la tarea estaba incompleta. Faltaban: forma de `sinTranscript` por rol, qué campos del transcript leer y el comportamiento con carpeta inexistente o corridas sin timestamp.
- Fuera de alcance, no tocado: CLI, Claude Code, descubrimiento de carpetas, `acceptance`, `definitions/STATUS.md`, `registro/`, `features/completed/`, `.env`. Sin commit, push ni merge.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=6; resultado=lista; causa=ninguna
