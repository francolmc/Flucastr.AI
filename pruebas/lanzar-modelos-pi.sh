#!/usr/bin/env bash
# Lanza una corrida de comprobación de modelos en Pi: el coordinador (agente principal)
# delega en planificador y en constructor con la herramienta subagent, y el registro guarda
# qué modelo respondió cada uno.
# Uso: lanzar-modelos-pi.sh   (ejecutar desde una carpeta temporal vacía, no desde el repo)
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?lanzar-modelos-pi.sh debe definir FLUCASTR_RECORD_FILE}"
pi_bin="${FLUCASTR_PI_BIN:-pi-coordinador}"
prompt="Esto es una comprobación de modelos, no un flujo de trabajo: no leas archivos ni escribas nada. Usa la herramienta subagent, sin pasar ningún parámetro de modelo, para llamar primero al subagente planificador y después al subagente constructor; a cada uno pídele que responda solo la palabra OK sin usar herramientas. Al terminar responde LISTO."
# Tope de tiempo (macOS no trae `timeout`): una corrida colgada no debe consumir la jornada.
tope="${FLUCASTR_PI_TOPE:-300}"
"$pi_bin" --mode json --no-session -p "$prompt" > "$FLUCASTR_RECORD_FILE" &
pid=$!
( sleep "$tope"; kill "$pid" 2>/dev/null; sleep 5; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 &
vigia=$!
set +e
wait "$pid"; estado=$?
set -e
pkill -P "$vigia" 2>/dev/null || true
kill "$vigia" 2>/dev/null || true
wait "$vigia" 2>/dev/null || true
if [ "$estado" -ge 128 ]; then
  echo "lanzar-modelos-pi.sh: Pi no terminó en ${tope} s; se cortó la corrida" >&2
fi
exit "$estado"
