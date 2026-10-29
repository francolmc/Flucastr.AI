#!/usr/bin/env bash
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?ejecutar.sh debe definir FLUCASTR_RECORD_FILE}"
pi_bin="${FLUCASTR_PI_BIN:-pi-arquitecto}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
prompt="$(<"$script_dir/prompts/existente.txt")"
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
  echo "lanzar-pi.sh: Pi no terminó en ${tope} s; se cortó la corrida" >&2
fi
exit "$estado"
