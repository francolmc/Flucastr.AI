#!/usr/bin/env bash
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
TOPE="${FLUCASTR_TOPE_RAPIDA:-30}"
archivos=()
for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs; do
  [[ "$f" == */contrato.test.mjs ]] && continue
  archivos+=("$f")
done
inicio=$SECONDS
node --test --test-concurrency=1 "${archivos[@]}"
duracion=$((SECONDS - inicio))
echo "rapida: ${#archivos[@]} archivos en ${duracion} s (tope ${TOPE} s)"
if (( duracion > TOPE )); then
  echo "FALLA: la verificación rápida superó el tope de ${TOPE} s" >&2
  exit 1
fi
