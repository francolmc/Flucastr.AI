#!/usr/bin/env bash
# Lanza el agente coordinador en Pi (F12, task-06) con el lanzador pi-coordinador que genera instalar.sh.
# Pi da bash completo al coordinador (opción B de §3.1.1, riesgo aceptado): este lanzador no añade
# ningún filtro. La contención es solo instruccional; un resultado limpio no demuestra confinamiento.
# Uso: lanzar-coordinador-pi.sh "<prompt>"   (ejecutar desde el directorio del fixture)
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: lanzar-coordinador-pi.sh "<prompt>"' >&2; exit 2; }
: "${FLUCASTR_RECORD_FILE:?lanzar-coordinador-pi.sh debe definir FLUCASTR_RECORD_FILE}"
pi_bin="${FLUCASTR_PI_BIN:-pi-coordinador}"
# Tope de tiempo (macOS no trae `timeout`): una corrida colgada no debe consumir la jornada.
tope="${FLUCASTR_PI_TOPE:-300}"
"$pi_bin" --mode json --no-session -p "$1" > "$FLUCASTR_RECORD_FILE" &
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
  echo "lanzar-coordinador-pi.sh: Pi no terminó en ${tope} s; se cortó la corrida" >&2
fi
exit "$estado"
