#!/usr/bin/env bash
set -euo pipefail
# Arnés de ejecución futura; etapa 2 jamás invoca herramientas/modelos.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; HERE="$ROOT/pruebas"
usage() { echo 'uso: pruebas/ejecutar.sh {B|M|C|R} {claude-code|pi} [corridas=3] [comando-herramienta...]' >&2; }
[[ $# -ge 2 ]] || { usage; exit 2; }
scenario="${1^^}"; tool="$2"; runs="${3:-3}"
[[ "$scenario" =~ ^(B|M|C|R)$ && "$tool" =~ ^(claude-code|pi)$ && "$runs" =~ ^[1-9][0-9]*$ ]] || { usage; exit 2; }
shift 3 || true
if (( $# == 0 )); then echo 'No se ejecuta ningún modelo en la etapa 2. Proporciona explícitamente el comando al usar el arnés.' >&2; exit 2; fi
command=("$@")
case "$scenario" in B) fixture=basico;; M) fixture=medio;; C) fixture=complejo;; R) fixture=real;; esac
for ((i=1;i<=runs;i++)); do
  work="$(mktemp -d "${TMPDIR:-/tmp}/flucastr-${scenario}-${tool}.XXXXXX")"
  "$HERE/fixtures/$fixture.sh" "$work/fixture"
  echo "Corrida $i/$runs: fixture en $work/fixture; herramienta=$tool"
  (cd "$work/fixture" && "${command[@]}")
  echo 'La captura estructurada y evaluación de resultados requieren adaptación al formato de la herramienta; no se informa aprobación automática.'
done
