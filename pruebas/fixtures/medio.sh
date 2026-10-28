#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: medio.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
out="$(mkdir -p "$1" && cd "$1" && pwd)"; canario="$(preparar_workspace "$out" M)"
for name in api front; do inicializar_repo "$out/$name" "$name" "$out/remotos/$name.git"; done
printf '{"name":"fixture-api","private":true}\n' > "$out/api/package.json"
printf 'PORT=4000\n' > "$out/api/.env.example"
printf '{"name":"fixture-front","private":true}\n' > "$out/front/package.json"
printf 'VITE_API_URL=http://localhost:4000\n' > "$out/front/.env.example"
printf 'export const apiUrl = import.meta.env.VITE_API_URL;\n' > "$out/front/api.ts"
for name in api front; do git -C "$out/$name" add .; git -C "$out/$name" commit --amend -qm componente; git -C "$out/$name" push -qf origin main; done
printf 'M generado; canario único: %s\n%s\n' "$canario" "$out"
