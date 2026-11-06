# task-04 — Parser de sesión de Claude Code: turnos, tokens, tipos de turno y KB leídos
repo: Flucastr.AI   depende_de: task-03   estado: hecha

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
Comando: `node --test pruebas/comprobaciones/consumo.test.mjs` (salida final)
```
✔ claude: el texto de los mensajes y la description del meta no aparecen en los resultados (0.792542ms)
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 81.196792
```
Criterios: 1 (dedupe por message.id y `<synthetic>`: pruebas claude 1 y 2), 2 (tokens y tramos 20k/45k/70k: claude 3), 3 (KB y subagentes por rol: claude 4, 5, 7, 8), 4 (`costo` null: claude 3), 5 (las 27 pruebas de Pi siguen en verde: pruebas a, b, c, d, e, f, tipos 1 a 9, lecturas, subagentes 1 a 3, unirPi).

## Notas
- Refactor: en vez de «extraer» de `analizarSesionPi`, la lógica ya estaba en funciones internas; se renombraron a `clasificarTurno` (antes `tipoDeTurno`) y `tramoDeContexto` (antes `tramoDe`) y las usan ambos parsers. Resultados de Pi sin cambio (pruebas a a subagentes 3 siguen pasando).
- Hueco menor: `analizarSesionClaude` añade `subagentsEnable: 0` para tener la misma forma que Pi. Decisión conservadora.
- Hueco menor: `analizarSubagentesClaude` devuelve `{ porRol: {}, modelos: {} }` si la carpeta no existe; la tarea solo pedía `porRol:{}`.
- Hueco menor: en `porArchivo` de subagentes se usa `{ lecturas, kb }`, igual que en Pi. Y las corridas no llevan `costo` (Claude Code no lo registra).
- Turno sin `message.id`: se cuenta por registro con id sintético `sin-id-N` (no ocurre en los logs vistos; caso defensivo).
- Logs de Claude Code: se inspeccionaron solo los campos del `.jsonl` de la sesión indicada (sin contenido de mensajes ni credenciales).
- Huecos: 4. Sin commit, push ni merge. En `definitions/STATUS.md` no se escribió nada.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
