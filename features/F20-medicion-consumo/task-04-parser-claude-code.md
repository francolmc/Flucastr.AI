# task-04 — Parser de sesión de Claude Code: turnos, tokens, tipos de turno y KB leídos
repo: Flucastr.AI   depende_de: task-03   estado: aprobada

## Descripción
Misma medición que task-01 a 03 para los logs de Claude Code (`~/.claude/projects/<proyecto>/`): sesión principal y subagentes. Claude Code no registra costo por mensaje, así que el costo queda «no disponible» y la comparación usa tokens, turnos y KB leídos. Reutiliza la clasificación de turnos y el cálculo de tramos de Pi.

## Contexto
Formato leído en `~/.claude/projects/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5.jsonl` (confirmado, solo campos):
- Una línea JSON por registro, con `type`, `timestamp` (ISO) y `sessionId`. Registro `{type:"agent-setting", agentSetting:"coordinador"}` da el rol de la sesión principal.
- Turnos: `{type:"assistant", message:{id, model, content:[...], usage:{input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens}}}`. Un mismo `message.id` aparece en varios registros (uno por bloque de contenido; 820 registros, 445 ids): se cuenta una vez por `message.id`. Se omite `model:"<synthetic>"`. `content` mezcla `text`, `thinking` y `tool_use {id, name, input}`; nombres vistos: `Read` (`input.file_path`), `Edit`, `Write`, `Bash`, `Agent` (`input.subagent_type`).
- Resultados de `Read`: registro `{type:"user", message:{content:[{type:"tool_result", tool_use_id}]}, toolUseResult:{file:{filePath, content, numLines}}}`; el `tool_use_id` coincide con el `id` del `tool_use`.
- Subagentes: `<sesión>/subagents/agent-<agentId>.jsonl` (mismo formato, `isSidechain:true`) y `agent-<agentId>.meta.json` con `agentType` (ej. `constructor`).
- Leer `scripts/consumo.mjs` (task-01 a 03). Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs`, `pruebas/comprobaciones/consumo.test.mjs`.

## Decisiones ya tomadas
- Refactor mínimo: extraer de `analizarSesionPi` la función interna `clasificarTurno(llamadas)` (llamadas = `[{name, ruta}]` con nombres en minúscula) y `tramoDeContexto(n)`, y usarlas desde ambos parsers. Los resultados de Pi no cambian (sus pruebas deben seguir pasando).
- Normalización de nombres: `Read`→`read`, `Edit`→`edit`, `Write`→`write`, `Agent`→`subagent`, el resto en minúscula; ruta = `input.file_path`. No existe `subagents_enable` en Claude Code (queda 0).
- Nueva función exportada `analizarSesionClaude(texto, { hasta } = {})` → misma forma que Pi con `herramienta:"claude-code"`, `rol` (el `agentSetting`, o `"desconocido"` si falta), `costo:null`, y `tokens:{input, output, cacheRead, cacheWrite}` tomando `input_tokens`, `output_tokens`, `cache_read_input_tokens` y `cache_creation_input_tokens`. Contexto de un turno = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. En `tramos`, `costo:null`; en `tiposDeTurno`, `costo:null`. `llamadasSubagente` = llamadas `Agent`.
- KB leídos: bytes (`Buffer.byteLength`) de `toolUseResult.file.content`, emparejado por `tool_use_id`; misma forma `lecturas` que Pi.
- Nueva función exportada `analizarSubagentesClaude(dirSubagentes)` → `{ porRol: { <agentType>: { corridas, turnos, tokens, kbTotal, porArchivo } }, modelos }`; `turnos` = ids únicos de `message.id` de cada archivo. Si la carpeta no existe, devuelve `porRol:{}`. Ignora el campo `description` del meta.
- El generador de fixtures agrega `turnoClaude`, `resultadoReadClaude`, `metaSubagenteClaude`; los textos llevan `CENTINELA_TEXTO`.

## Alcance / Fuera de alcance
Alcance: parsers de Claude Code y refactor de las dos funciones compartidas.
Fuera de alcance: estimar costo con precios (no hay fuente confirmada); CLI e informe (task-05); detectar carpetas; documentación.

## Pasos
1. Extraer `clasificarTurno` y `tramoDeContexto` en `scripts/consumo.mjs` sin cambiar los resultados de Pi.
2. Implementar `analizarSesionClaude` y `analizarSubagentesClaude`.
3. Agregar helpers de Claude en `consumo-fixtures.mjs`.
4. En `consumo.test.mjs` agregar: el mismo `message.id` repetido 3 veces cuenta 1 turno; `<synthetic>` no cuenta; tramos con tokens 20k/45k/70k; `Read` de 2048 bytes en `definitions/PROJECT.md` → `kbPorCategoria.definiciones` 2; `Agent` → `llamadasSubagente` 1 y tipo `delegar`; rol tomado de `agent-setting`; subagentes: dos metas `constructor` → `corridas` 2; carpeta inexistente → `porRol:{}`; `JSON.stringify` de los resultados sin el centinela.
5. Correr las pruebas.

## Criterios de aceptación
1. Se deduplica por `message.id` y se omite `<synthetic>` (pruebas de Pasos 4).
2. Tokens, tramos y tipos de turno correctos en los casos de Pasos 4.
3. KB leídos y subagentes por rol correctos.
4. `costo` es `null` (no 0) en Claude Code.
5. Todas las pruebas anteriores de Pi siguen pasando.

## Verificación
`node --test pruebas/comprobaciones/consumo.test.mjs` → `fail 0`.

## Evidencia
(lo llena el constructor; solo la cola relevante, ≤1,5 KB)

## Notas
(lo llena el constructor)
