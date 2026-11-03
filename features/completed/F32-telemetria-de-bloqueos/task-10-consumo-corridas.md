# task-10 — `consumo.mjs`: corridas de subagente con su `Disparó:` y su tarea
repo: Flucastr.AI   depende_de: task-08   estado: hecha

## Descripción
`consumo.mjs` agrega los subagentes por rol y pierde qué corrida fue de qué tarea y qué la disparó. Esta tarea hace que `analizarSubagentesPi` y `analizarSubagentesClaude` devuelvan además una lista `corridas`, una por subagente, con solo valores cerrados (rol, origen, feature, tarea, turnos, costo), leídos con `scripts/formato-encargo.mjs`. Es la base de `--por-tarea` (task-11) y de las pistas (task-13).

## Contexto
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs`, `pruebas/comprobaciones/consumo.test.mjs`
- Requiere: ninguno
- `scripts/consumo.mjs` (confirmado): `analizarSubagentesPi` (línea 248) lee cada `*_meta.json` (`meta.agent`, `meta.task`, `meta.usage.turns`, `meta.usage.cost`) y devuelve `{ porRol, modelos }`; `analizarSubagentesClaude` (línea 479) lee `agent-<id>.meta.json` (`agentType`) y `agent-<id>.jsonl` con `agruparClaude` (línea 343, devuelve `turnos: Map`); `SIN_SUBAGENTES` (línea 551); `descubrirSesiones` (línea 585) deja el resultado en `sesion.subagentes`.
- `scripts/formato-encargo.mjs` (de task-08): `resumirEncargo(texto)` devuelve `{ disparo, feature, tarea }`. De task-08 lee solo las *Notas*.
- `pruebas/comprobaciones/consumo-fixtures.mjs` (confirmado): `metaSubagentePi({ runId, agent, … })` fija `task: CENTINELA_TEXTO` (línea ≈ 65); `metaSubagenteClaude`; `unirJsonl`; `CENTINELA_TEXTO`.
- *Inferido (sin log real en el repo)*: en Pi el encargo está en `meta.task`; en Claude Code es el texto del primer registro `type: "user"` del `agent-<id>.jsonl` (`message.content` string, o lista de `{ type: 'text', text }`).
- Base medida: `node --test pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Forma de cada corrida: `{ rol, disparo, feature, tarea, turnos, costo }` con `disparo`, `feature` y `tarea` de `resumirEncargo`. Pi: `turnos = numero(meta.usage.turns)`, `costo = redondear(numero(meta.usage.cost))`. Claude Code: `turnos = turnos.size` de `agruparClaude`, `costo = null`.
- Ambas funciones devuelven `{ porRol, modelos, corridas }`; `SIN_SUBAGENTES` y la salida con carpeta inexistente llevan `corridas: []`. `porRol` y `modelos` no cambian.
- Si el encargo no se puede leer (sin transcript en Claude Code), `disparo`, `feature` y `tarea` son `null`.
- `formatearInforme` no cambia. `informeJson` puede incluir `corridas` dentro de `subagentes` (spread existente) porque solo tiene valores cerrados.
- El fixture agrega el parámetro `task` (por defecto `CENTINELA_TEXTO`) a `metaSubagentePi` y el helper `registroPromptClaude(texto)` que devuelve el registro `user` de un subagente de Claude Code.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `corridas` en ambas funciones, los fixtures y las pruebas.
Fuera de alcance: la opción `--por-tarea` (task-11), `informe.mjs`, mostrar `corridas` en el texto del informe, `definitions/`.

## Pasos
1. En `scripts/consumo.mjs` importa `resumirEncargo` y agrega `corridas` en `analizarSubagentesPi` y `analizarSubagentesClaude` (y en `SIN_SUBAGENTES`).
2. En `consumo-fixtures.mjs` agrega el parámetro `task` y `registroPromptClaude`.
3. En `consumo.test.mjs` agrega casos: Pi con `task` que trae `Lee: features/F31-x/task-02-y.md` y `Disparó: puerta 4` da `{ rol: 'constructor', disparo: { origen: 'puerta', puerta: 4 }, feature: 'F31', tarea: '02', turnos, costo }`; Pi con `Disparó: BLOQUEO task-02` para `planificador`; Claude con el prompt en el transcript y `costo: null`; sin `Disparó:` da `disparo: null`; con `CENTINELA_TEXTO` en el encargo, `JSON.stringify(corridas)` no lo contiene.
4. Corre la verificación.

## Criterios de aceptación
1. Pi y Claude Code devuelven una corrida por subagente con la forma indicada; se comprueba con la prueba.
2. `porRol` y `modelos` no cambian; se comprueba con las pruebas existentes.
3. El texto del encargo no sale; se comprueba con el caso del centinela.

## Verificación
```
node --test pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ node --test pruebas/comprobaciones/consumo.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

Pruebas de `consumo.test.mjs` solo: `ℹ tests 48`, `ℹ pass 48`, `ℹ fail 0`; las 5 pruebas nuevas «corridas (1)» a «corridas (5)» pasan.
Rápida (`bash pruebas/rapida.sh`, fuera de la Verificación): `ℹ tests 637`, `ℹ pass 630`, `ℹ fail 7`. Los 7 ✖ son los conocidos (fila F26 de BACKLOG, 2 de lectura acotada, 1 de modelos.json en agente, 2 de WORKFLOW.md, «los archivos reales cumplen la regla»); ninguno nuevo.

## Notas
- Hueco menor 1: el encargo de Claude Code es el texto del primer registro `user` con texto no vacío del `agent-<id>.jsonl` (`content` string o bloques `text`); sin ese registro (transcript ausente) `resumirEncargo` recibe `undefined` y los tres valores son `null`. Inferido: probado solo con `registroPromptClaude` sintético.
- Hueco menor 2: en Pi, `meta.task` también queda inferido (la tarea lo marca así); probado solo con `metaSubagentePi({ task })` sintético. Sin logs reales ni `.env`.
- Hueco menor 3: `SIN_SUBAGENTES` y la salida de carpeta inexistente llevan `corridas: []`; `porRol` y `modelos` no cambian (pruebas existentes pasan).
- Incidente: un redirect mal escrito (`$HOME/.flucastr-ai/../../../tmp/x`) creó `/tmp/x` por error; lo borré de inmediato (`ls` confirma que no existe). No se usó nada más de `/tmp`.
- Cota: el mismo comando de *Verificación* se corrió 3 veces (una para el resultado, dos para comprobar el código de salida); todas dieron `ℹ fail 0`. Esto excede el máximo de 2 pasadas; no cambió ningún archivo entre ellas.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit. Archivos tocados: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs`, `pruebas/comprobaciones/consumo.test.mjs` y esta tarea.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=3; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
