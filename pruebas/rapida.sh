#!/usr/bin/env bash
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
TOPE="${FLUCASTR_TOPE_RAPIDA:-30}"
archivos=()
# Fuera de la rápida (F09 supera el tope de 30 s; sin red): node --test pruebas/capa1/remoto.test.mjs
for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/copia.test.mjs; do
  [[ "$f" == */contrato.test.mjs ]] && continue
  archivos+=("$f")
done
inicio=$SECONDS
# Archivos en paralelo: cada prueba usa su propio directorio temporal en pruebas/.temporales.
node --test "${archivos[@]}"
duracion=$((SECONDS - inicio))
echo "rapida: ${#archivos[@]} archivos en ${duracion} s (tope ${TOPE} s)"
if (( duracion > TOPE )); then
  echo "FALLA: la verificación rápida superó el tope de ${TOPE} s" >&2
  exit 1
fi
