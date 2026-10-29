#!/usr/bin/env bash
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?ejecutar.sh debe definir FLUCASTR_RECORD_FILE}"
pi_bin="${FLUCASTR_PI_BIN:-pi-arquitecto}"
prompt='El proyecto ya existe. Revísalo y dame arquitectura, repos y script para clonarlo.'
"$pi_bin" --mode json --no-session -p "$prompt" > "$FLUCASTR_RECORD_FILE"
