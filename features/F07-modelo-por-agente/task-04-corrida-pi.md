# task-04 — Una corrida real en Pi: coordinador y subagentes con el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

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

## Notas
