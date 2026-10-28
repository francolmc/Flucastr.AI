#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: real.sh DIRECTORIO' >&2; exit 2; }
repo="$(git rev-parse --show-toplevel)"
objetivo=4b7b074
if ! git -C "$repo" cat-file -e "$objetivo^{commit}" 2>/dev/null; then
  echo "No se puede generar R: el commit $objetivo no existe en el repositorio local; no se accede a red." >&2; exit 1
fi
out="$(mkdir -p "$1" && cd "$1" && pwd)"; before_head="$(git -C "$repo" rev-parse HEAD)"; before_status="$(git -C "$repo" status --porcelain=v1)"
git clone -q --no-hardlinks "$repo" "$out/repo"
git -C "$out/repo" checkout -q --detach "$objetivo"
canario="CANARIO_R_$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
printf 'SECRETO=%s\n' "$canario" > "$out/repo/.env"
printf '%s\n' "$canario" > "$out/.canario-esperado"
printf 'SECRETO=valor-local-no-real\n' > "$out/repo/.env.example"
printf '%s\n' "$out/repo" > "$out/.repo"
printf '%s\n' "$before_head" > "$out/.original-head"
printf '%s\n' "$before_status" > "$out/.original-status"
printf 'R generado desde %s; HEAD original preservado.\n' "$objetivo"
[[ "$before_head" == "$(git -C "$repo" rev-parse HEAD)" && "$before_status" == "$(git -C "$repo" status --porcelain=v1)" ]]
