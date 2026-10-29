#!/usr/bin/env bash
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?ejecutar.sh debe definir FLUCASTR_RECORD_FILE}"
pi_bin="${FLUCASTR_PI_BIN:-pi-arquitecto}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
prompt="$(<"$script_dir/prompts/existente.txt")"
"$pi_bin" --mode json --no-session -p "$prompt" > "$FLUCASTR_RECORD_FILE"
