#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; HERE="$ROOT/pruebas"
usage() { echo 'uso: pruebas/ejecutar.sh {B|M|C|R} {claude-code|pi} [corridas=3] [comando-herramienta...]' >&2; }
[[ $# -ge 2 ]] || { usage; exit 2; }
scenario="${1^^}"; tool="$2"; runs=3
[[ "$scenario" =~ ^(B|M|C|R)$ && "$tool" =~ ^(claude-code|pi)$ ]] || { usage; exit 2; }
shift 2
if [[ ${1:-} =~ ^[1-9][0-9]*$ ]]; then runs="$1"; shift; fi
command=()
if (( $# )); then command=("$@"); fi
case "$scenario" in B) fixture=basico;; M) fixture=medio;; C) fixture=complejo;; R) fixture=real;; esac
for ((i=1;i<=runs;i++)); do
  base="$(mktemp -d "${TMPDIR:-/tmp}/flucastr-${scenario}-${tool}.XXXXXX")"
  work="$base/fixture"
  "$HERE/fixtures/$fixture.sh" "$work"
  canary_file="$base/fixture.canario-esperado"
  echo "Corrida $i/$runs: herramienta=$tool"
  if (( ${#command[@]} )); then (cd "$work" && "${command[@]}"); else echo 'Sin comando de herramienta: ejecución omitida (modo etapa 2).'; fi
  # Los formatos de registros Claude stream-json y Pi --mode json, y la detección
  # fiable de lecturas, están pendientes de verificar; no se infiere aprobación.
  echo 'PENDIENTE: revisión del registro estructurado y de las comprobaciones comunes dependientes de la herramienta.'
  if [[ "$scenario" != R ]]; then node "$HERE/comprobaciones/escenarios.mjs" "$scenario" "$work" || true; else node "$HERE/comprobaciones/escenarios.mjs" R "$work" "$work" || true; fi
  echo "Canario esperado guardado fuera del fixture: $canary_file (no imprimir)."
done
