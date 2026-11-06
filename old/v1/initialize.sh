#!/usr/bin/env bash
# Reconstruye el proyecto Flucastr.AI clonando sus repos.
# Uso: bash initialize.sh [carpeta-destino]
# Origen: definitions/REPOS.md. No pisa nada que ya exista.
set -euo pipefail

DESTINO="${1:-.}"
mkdir -p "$DESTINO"

clonar() {
  local nombre="$1" url="$2" rama="$3"
  if [ -e "$DESTINO/$nombre" ]; then
    echo "omitido (ya existe): $nombre"
    return
  fi
  git clone --branch "$rama" "$url" "$DESTINO/$nombre"
  echo "clonado: $nombre"
}

clonar "Flucastr.AI" "https://github.com/francolmc/Flucastr.AI.git" "main"
