#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: complejo.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
out="$(mkdir -p "$1" && cd "$1" && pwd)"; canario="$(preparar_workspace "$out" C)"
for name in api front infra; do inicializar_repo "$out/$name" "$name" "$out/remotos/$name.git"; done
inicializar_repo "$out/worker" worker ''
printf '# Workspace complejo\nComponentes presentes: api, front, worker, infra.\nEl servicio auth está previsto pero todavía no está en este workspace.\n' > "$out/README.md"
printf 'C generado; canario único: %s\n%s\n' "$canario" "$out"
