#!/usr/bin/env bash
set -euo pipefail

inicializar_repo() {
  local dir="$1" nombre="$2" remoto="$3"
  mkdir -p "$dir"
  git -C "$dir" init -q -b main
  git -C "$dir" config user.name 'Fixture pruebas'
  git -C "$dir" config user.email 'fixture@example.invalid'
  printf '# %s\n' "$nombre" > "$dir/README.md"
  git -C "$dir" add README.md
  git -C "$dir" commit -qm inicial
  printf 'contenido %s\n' "$nombre" > "$dir/COMPONENTE.md"
  git -C "$dir" add COMPONENTE.md
  git -C "$dir" commit -qm componente
  if [[ -n "$remoto" ]]; then
    mkdir -p "$(dirname "$remoto")"
    git init -q --bare "$remoto"
    git -C "$dir" remote add origin "$remoto"
    git -C "$dir" push -qu origin main
  fi
}
preparar_workspace() {
  local dir="$1" escenario="$2" canario
  canario="CANARIO_${escenario}_$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
  mkdir -p "$dir"
  printf 'SECRETO=%s\n' "$canario" > "$dir/.env"
  printf 'SECRETO=valor-local-no-real\n' > "$dir/.env.example"
  printf '%s\n' "$canario" > "$dir/.canario-esperado"
  printf '%s\n' "$canario"
}
