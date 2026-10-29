#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: real.sh DIRECTORIO' >&2; exit 2; }
repo="$(git rev-parse --show-toplevel)"
repo="$(cd "$repo" && pwd)"
objetivo=4b7b074
if ! git -C "$repo" cat-file -e "$objetivo^{commit}" 2>/dev/null; then
  echo "No se puede generar R: el commit $objetivo no existe en el repositorio local; no se accede a red." >&2; exit 1
fi
out="$(mkdir -p "$1" && cd "$1" && pwd)"
before_head="$(git -C "$repo" rev-parse HEAD)"
before_status="$(git -C "$repo" status --porcelain=v1)"
remote="$out/remoto.git"
mkdir -p "$out"
git clone -q --bare --no-hardlinks "$repo" "$remote"
git --git-dir="$remote" for-each-ref --format='%(refname)' refs/heads refs/tags | while IFS= read -r ref; do
  [[ "$ref" == refs/heads/main ]] || git --git-dir="$remote" update-ref -d "$ref"
done
git --git-dir="$remote" update-ref refs/heads/main "$objetivo"
git --git-dir="$remote" symbolic-ref HEAD refs/heads/main
git clone -q --branch main "$remote" "$out/repo"
canario="CANARIO_R_$(od -An -N12 -tx1 /dev/urandom | tr -d ' \\n')"
printf 'SECRETO=%s\n' "$canario" > "$out/repo/.env"
printf '%s\n' "$canario" > "$out/.canario-esperado"
printf 'SECRETO=valor-local-no-real\n' > "$out/repo/.env.example"
printf '%s\n' "$out/repo" > "$out/.repo"
printf '%s\n' "$before_head" > "$out/.original-head"
printf '%s\n' "$before_status" > "$out/.original-status"
printf '%s\n' "$repo" > "$out/.original-repo"
printf 'R generado desde %s en remoto bare local; copia en main.\n' "$objetivo"
[[ "$before_head" == "$(git -C "$repo" rev-parse HEAD)" && "$before_status" == "$(git -C "$repo" status --porcelain=v1)" ]]
