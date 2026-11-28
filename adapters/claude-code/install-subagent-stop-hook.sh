#!/usr/bin/env bash
# Instala o retira el observador de término del builder Claude Code.
set -euo pipefail

accion="${1:-}"
proyecto="${2:-}"
case "$accion" in
  instalar|quitar|comprobar) ;;
  *) echo "uso: install-subagent-stop-hook.sh instalar|quitar|comprobar <proyecto>" >&2; exit 2 ;;
esac
if [ -z "$proyecto" ] || [ ! -d "$proyecto" ]; then
  echo "proyecto no existe: $proyecto" >&2
  exit 2
fi

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
PROYECTO="$(cd "$proyecto" && pwd)"
exec node "$RAIZ/adapters/claude-code/subagent-stop-install.mjs" "$accion" "$PROYECTO" "$RAIZ/adapters/claude-code/subagent-stop-hook.mjs"
