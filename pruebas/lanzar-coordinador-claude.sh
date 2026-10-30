#!/usr/bin/env bash
# Lanza el agente coordinador en Claude Code con permisos explícitos (F12, task-05).
# Los tres patrones de Bash para scripts/ se conceden aquí con --allowedTools por decisión de Franco
# (2026-10-30): el tools: del agente no concede permiso en Claude Code. Son los únicos Bash permitidos.
# Uso: lanzar-coordinador-claude.sh "<prompt>"   (ejecutar desde el directorio del fixture)
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: lanzar-coordinador-claude.sh "<prompt>"' >&2; exit 2; }
: "${FLUCASTR_RECORD_FILE:?lanzar-coordinador-claude.sh debe definir FLUCASTR_RECORD_FILE}"
if [[ -n "${CLAUDE_CODE_SUBAGENT_MODEL:-}" ]]; then
  echo 'lanzar-coordinador-claude.sh: CLAUDE_CODE_SUBAGENT_MODEL definida; la prueba queda invalidada' >&2
  exit 2
fi
claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
extra=()
if [[ "${FLUCASTR_PERSISTIR_SESION:-0}" != "1" ]]; then extra+=(--no-session-persistence); fi
"$claude_bin" -p --agent coordinador \
  --permission-mode dontAsk --permission-prompts none \
  ${extra[@]+"${extra[@]}"} --output-format stream-json --verbose \
  --allowedTools \
  'Read(./**)' 'Write(./definitions/**)' 'Edit(./definitions/**)' 'Skill' \
  'Bash(node scripts/registrar.mjs)' \
  'Bash(node scripts/archivar.mjs)' \
  'Bash(node scripts/archivar.mjs --aplicar F*)' \
  --disallowedTools \
  'Read(./.env)' 'Read(.env)' \
  'Bash(cat ./.env)' 'Bash(cat .env)' \
  -- "$1" > "$FLUCASTR_RECORD_FILE"
