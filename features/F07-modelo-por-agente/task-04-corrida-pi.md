# task-04 — Una corrida real en Pi: coordinador y subagentes con el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-02   estado: lista para revisión

## Descripción
Equivalente de task-03 para Pi: confirma con **una sola corrida** que `pi-coordinador` usa `--model` resuelto de `modelos.json` y que los subagentes lanzados con la herramienta `subagent` usan el `model` de su archivo generado en `~/.pi/agent/agents/`. `WORKFLOW.md` §7 ya observó esto una vez con el `arquitecto` pero solo en la prueba desechable; aquí queda como evidencia verificable para los tres roles.

## Contexto
- Repo único. Leídos: `pruebas/lanzar-pi.sh` (patrón: `"$pi_bin" --mode json --no-session -p "$prompt" > "$FLUCASTR_RECORD_FILE"` con tope de 300 s mediante `sleep`/`kill`, porque macOS no trae `timeout`), `pruebas/comprobaciones/registro.mjs` (`piEvents` toma `model` de `turn_end`/`message_start`), `instalar.sh` (lanzador `~/.local/bin/pi-<agente>`, ya existen `pi-coordinador`, `pi-planificador`, `pi-constructor`), `agentes/coordinador.md` (autoriza `subagent`; «si está detrás de `subagents_enable`, actívala»), `~/.pi/agent/settings.json` (paquete `npm:pi-subagents` instalado). Pi 1.4.0.
- Archivo a crear: `pruebas/lanzar-modelos-pi.sh`. El resultado queda en *Evidencia*.
- **Inferido, no ejecutado:** el registro `--mode json` del proceso principal puede mostrar el resultado de la herramienta `subagent` sin el modelo del subagente. Esta tarea lo averigua: busca el nombre del modelo en el registro (`grep -c`); si no aparece para los subagentes, busca el modelo en el resultado de la herramienta `subagent` y, si tampoco está, se informa en *Notas* qué hay y qué no.

## Decisiones ya tomadas
- Una sola corrida (máximo una repetición si el fallo es del lanzador). Misma carpeta temporal vacía y mismo prompt que task-03 con «herramienta `subagent`» en vez de «Agent» y sin el parámetro de modelo.
- Tope de tiempo: 300 s con el mismo mecanismo de `lanzar-pi.sh`; el binario es `${FLUCASTR_PI_BIN:-pi-coordinador}`.
- Precondición: `node pruebas/comprobaciones/modelos-agentes.mjs` da 0 (si no, `BLOQUEO: rol=Franco; motivo=la instalación de Pi está desactualizada, falta correr bash instalar.sh`).
- Criterio: modelo del principal = `openai/gpt-6.1-sol`; subagente `constructor` = `openai/gpt-6-sol`; `planificador` = `openai/gpt-6.1-sol` (de `modelos.json`; si Franco lo cambió, rige `node scripts/resolver.mjs modelo <agente> pi`).
- Si el modelo del subagente no es observable en el registro, la tarea **no** da por probado el punto: queda `lista para revisión` con la evidencia de lo observable (principal; archivo instalado del subagente; lanzador) y una nota explícita «subagente no observable en el registro», para que Franco decida.

## Alcance / Fuera de alcance
Alcance: el lanzador, una corrida y su evidencia.
Fuera de alcance: modificar `instalar.sh`, agentes, `modelos.json` o la configuración de Pi (`~/.pi/agent/settings.json`); extractor reutilizable (task-05); Claude Code (task-03).

## Pasos
1. Crear `pruebas/lanzar-modelos-pi.sh` (bash, `set -euo pipefail`, patrón de `lanzar-pi.sh`). Resultado: `bash -n pruebas/lanzar-modelos-pi.sh` sin salida.
2. Comprobar la precondición.
3. Correr desde una carpeta temporal vacía con `FLUCASTR_RECORD_FILE=$d/registro.jsonl`.
4. Extraer del registro los modelos de cada evento con `model` y los nombres de subagente invocados (`node -e`, sin dependencias); pegar la tabla y las líneas JSON mínimas con `model` en *Evidencia* (para task-05), sin credenciales.
5. Anotar en *Notas* lo observable y lo no observable.

## Criterios de aceptación
1. `bash -n pruebas/lanzar-modelos-pi.sh` termina con 0.
2. La corrida terminó dentro del tope y el registro existe y no está vacío. Se comprueba con `wc -l`.
3. El modelo del principal coincide con `resolver.mjs modelo coordinador pi`.
4. Cada subagente invocado: modelo observado igual al resuelto, o nota explícita de que no es observable.

## Verificación
```
bash -n pruebas/lanzar-modelos-pi.sh
node pruebas/comprobaciones/modelos-agentes.mjs
for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a pi; done
```
Esperado: sin salida / `modelos de agentes instalados vigentes` / tres modelos que coinciden con la *Evidencia*. La corrida: «no ejecutado, inferido» (requiere Pi con modelo).

## Evidencia

Corrida real (no inferida), 2026-10-30, desde una carpeta temporal vacía (`/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/14b3b3bb-3945-4c18-bed2-c390112a4639/scratchpad/corrida-pi.Xl8T`), con `FLUCASTR_RECORD_FILE=<esa carpeta>/registro.jsonl`.

Precondición y verificación (salida real):
```
$ bash -n pruebas/lanzar-modelos-pi.sh
[exit=0]
$ node pruebas/comprobaciones/modelos-agentes.mjs
modelos de agentes instalados vigentes
[exit=0]
$ for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a pi; done
openai/gpt-6.1-sol
openai/gpt-6.1-sol
openai/gpt-6-sol
[exit=0]
```

Corrida:
```
$ bash pruebas/lanzar-modelos-pi.sh   (con FLUCASTR_RECORD_FILE, desde la carpeta temporal)
Fri Oct 30 00:04:57 -03 2026 -> Fri Oct 30 00:06:06 -03 2026  (69 s, tope 300 s)
lanzador exit=0
$ wc -l registro.jsonl
290 .../scratchpad/corrida-pi.Xl8T/registro.jsonl
```

Modelos observados (fuente generada por Pi, no autodeclarada):

| Rol | Fuente en el registro | Fuente en la transcripción del subagente | Observado | Resuelto | Coincide |
|---|---|---|---|---|---|
| coordinador (principal) | `turn_end` de mensaje del asistente: `provider=openai`, `model=gpt-6.1-sol` | — | openai/gpt-6.1-sol | openai/gpt-6.1-sol | sí |
| planificador | `tool_execution_end` de `subagent`, `details.results[0].model` | `_transcript.jsonl` L4 (turno del asistente) y `_meta.json` `model` | openai/gpt-6.1-sol | openai/gpt-6.1-sol | sí |
| constructor | `tool_execution_end` de `subagent`, `details.results[0].model` | `_transcript.jsonl` L8 (turno del asistente) y `_meta.json` `model` | openai/gpt-6-sol | openai/gpt-6-sol | sí |

Extractos JSON mínimos (abreviados; las líneas completas están en el registro):
```
{"type":"turn_end","message":{"role":"assistant","provider":"openai","model":"gpt-6.1-sol"}}
{"type":"tool_execution_end","toolName":"subagent","result":{"details":{"results":[{"agent":"planificador","model":"openai/gpt-6.1-sol","requestedModel":"openai/gpt-6.1-sol"}]}}}
{"type":"tool_execution_end","toolName":"subagent","result":{"details":{"results":[{"agent":"constructor","model":"openai/gpt-6-sol","requestedModel":"openai/gpt-6-sol"}]}}}
```

Criterios de aceptación:
1. `bash -n pruebas/lanzar-modelos-pi.sh` termina con 0: cumple.
2. Corrida dentro del tope (69 s), registro existente con 290 líneas: cumple.
3. Principal `openai/gpt-6.1-sol` = `resolver.mjs modelo coordinador pi`: cumple.
4. Planificador y constructor: modelo observado igual al resuelto (no hace falta la nota de «no observable»): cumple.

## Notas

- Huecos menores resueltos:
  - El registro no trae el modelo del subagente en los eventos de mensaje del proceso principal (igual que en Claude Code), pero sí en el resultado de la herramienta `subagent` (`details.results[].model` y `requestedModel`) y en la transcripción que Pi guarda por subagente en `/var/folders/.../pi-subagents-uid-501/artifacts/<runId>_<agente>_0_transcript.jsonl`. Se usó la transcripción como fuente análoga a la de task-03. Esa carpeta es temporal y la gestiona el paquete `pi-subagents`; si desaparece, la evidencia queda en el registro de esta corrida.
  - En el registro, el principal aparece como `model=gpt-6.1-sol` con `provider=openai` aparte. Se comparó como `openai/gpt-6.1-sol`.
  - `subagent` no estaba activa al inicio: el coordinador la activó él mismo con `subagents_enable`, como indica `agentes/coordinador.md`. No se tocó `~/.pi/agent/settings.json` (no tiene la clave `subagents_enable`; sí `npm:pi-subagents`).
  - El lanzador usa el prompt en línea (como `lanzar-modelos-claude.sh`), no un archivo de `prompts/`.
- Observaciones de comportamiento, sin efecto en el criterio de modelo:
  - El constructor llamó una vez a `contact_supervisor` (coordinación con el proceso principal, no lectura ni escritura de archivos), y en el registro su resultado aparece como `exitCode: -2` mientras estaba separado; la `_meta.json` final da `exitCode: 0` y `model: openai/gpt-6-sol`.
  - Pese a «sin usar herramientas», el constructor usó `contact_supervisor`. Dato para Franco; no cambia el resultado.
- Lo observable: modelo del principal, de planificador y de constructor. Nada queda «no observable».
- Solo se crearon `pruebas/lanzar-modelos-pi.sh` y la *Evidencia*/*Notas*/`estado` de esta tarea. No se tocó `definitions/STATUS.md`, `task-05-extractor-modelos-registro.md`, `instalar.sh`, agentes, `modelos.json` ni la configuración de Pi. No hay commit, push, PR ni merge.
- Para Franco: revisar la *Evidencia* de esta tarea y el archivo nuevo `pruebas/lanzar-modelos-pi.sh` antes de decidir `hecha`.
