#!/usr/bin/env bash
# Quita lo que instalar.sh creó (y solo eso), según ~/.flucastr-ai/manifiesto.txt.
# Uso: bash desinstalar.sh [--simular] [--todo] [--proyecto <ruta>]   (con --proyecto se quita lo instalado en ese proyecto: agente y skills)
#   --todo: además borra ~/.flucastr-ai/modelos.json (el personal). Sin él, ese archivo se conserva siempre.
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash desinstalar.sh" >&2
  exit 1
fi
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
ESTADO_DIR="$HOME/.flucastr-ai"
MANIFIESTO="$ESTADO_DIR/manifiesto.txt"

SIMULAR=0
SILENCIOSO=0
CONSERVAR_AJUSTES=0
TODO=0
PROYECTO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --simular) SIMULAR=1 ;;
    --silencioso) SILENCIOSO=1 ;;
    --todo) TODO=1 ;;
    --conservar-ajustes) CONSERVAR_AJUSTES=1 ;; # lo usa instalar.sh al reinstalar
    --proyecto)
      shift
      PROYECTO="${1:-}"
      [ -d "$PROYECTO" ] || { echo "--proyecto necesita una carpeta que exista" >&2; exit 1; }
      PROYECTO="$(cd "$PROYECTO" && pwd)"
      ;;
    -h | --help) sed -n '2,3p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
  shift
done

decir() {
  if [ "$SILENCIOSO" = 0 ]; then echo "$*"; fi
}

# Ruta absoluta de .git/info/exclude del proyecto; vacía si el proyecto no es un repo git.
exclusion_de_git() { # ruta del proyecto
  git -C "$1" rev-parse --path-format=absolute --git-path info/exclude 2>/dev/null || true
}

# Tras quitar una copia de skill, borra <proyecto>/.pi/skills y <proyecto>/.pi solo si quedaron vacíos.
limpiar_pi_vacio() { # ruta de una copia
  case "$1" in */.pi/skills/*) ;; *) return 0 ;; esac
  local skills="${1%/*}"
  rmdir "$skills" 2>/dev/null || true
  rmdir "${skills%/*}" 2>/dev/null || true
}

if [ ! -f "$MANIFIESTO" ]; then
  decir "Nada que desinstalar: no hay manifiesto en $MANIFIESTO."
  if [ "$TODO" = 1 ] && [ "$SIMULAR" = 0 ]; then
    rm -f "$ESTADO_DIR/modelos.json"
    rmdir "$ESTADO_DIR" 2>/dev/null || true
  fi
  exit 0
fi

# Modo con el que se instaló: primera línea «modo<TAB>...». Sin esa línea, es repo.
MODO_INSTALADO=repo
IFS=$'\t' read -r p_tipo p_valor _ < "$MANIFIESTO" || true
if [ "${p_tipo:-}" = modo ]; then MODO_INSTALADO="${p_valor:-repo}"; fi

source "$RAIZ/tools/uninstall/project.sh"

source "$RAIZ/tools/uninstall/global.sh"
