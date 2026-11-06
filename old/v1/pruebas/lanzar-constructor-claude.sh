#!/usr/bin/env bash
# Lanza el agente constructor en Claude Code con permisos explícitos.
# Uso: lanzar-constructor-claude.sh RUTA_TAREA   (ejecutar desde el directorio del fixture)
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: lanzar-constructor-claude.sh RUTA_TAREA' >&2; exit 2; }
: "${FLUCASTR_RECORD_FILE:?lanzar-constructor-claude.sh debe definir FLUCASTR_RECORD_FILE}"
claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
prompt="Ejecuta la tarea $1. En esta sesión no se pueden responder preguntas."
"$claude_bin" -p --agent constructor \
  --permission-mode dontAsk --permission-prompts none \
  --no-session-persistence --output-format stream-json --verbose \
  --allowedTools \
  'Read(./**)' 'Write(./**)' 'Edit(./**)' 'Skill' \
  'Bash(cat *)' 'Bash(ls *)' 'Bash(echo *)' 'Bash(printf *)' 'Bash(bash verificar.sh)' 'Bash(git status --short)' \
  'Bash(git switch -c *)' 'Bash(git switch *)' 'Bash(git branch --show-current)' \
  --disallowedTools \
  'Read(./.env)' 'Read(.env)' \
  'Bash(cat ./.env)' 'Bash(cat .env)' \
  'Bash(git commit *)' 'Bash(git push *)' 'Bash(git merge *)' \
  'Bash(git reset *)' 'Bash(git rebase *)' 'Bash(git checkout *)' \
  -- "$prompt" > "$FLUCASTR_RECORD_FILE"
