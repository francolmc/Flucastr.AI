#!/usr/bin/env bash
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?ejecutar.sh debe definir FLUCASTR_RECORD_FILE}"
claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
prompt="$(<"$script_dir/prompts/existente.txt")"
"$claude_bin" -p --agent arquitecto \
  --permission-mode dontAsk --permission-prompts none \
  --no-session-persistence --output-format stream-json --verbose \
  --allowedTools \
  'Read(./**)' 'Write(./definicion/**)' 'Edit(./definicion/**)' 'Skill' \
  'Bash(git -C ./api remote -v)' 'Bash(git -C ./api branch -a)' 'Bash(git -C ./api branch --show-current)' 'Bash(git -C ./api log --oneline -20)' 'Bash(git -C ./api status --short)' \
  'Bash(git -C ./front remote -v)' 'Bash(git -C ./front branch -a)' 'Bash(git -C ./front branch --show-current)' 'Bash(git -C ./front log --oneline -20)' 'Bash(git -C ./front status --short)' \
  'Bash(ls *)' 'Bash(find *)' \
  'Bash(cat ./api/README.md)' 'Bash(cat ./api/COMPONENTE.md)' 'Bash(cat ./api/package.json)' 'Bash(cat ./front/README.md)' 'Bash(cat ./front/COMPONENTE.md)' 'Bash(cat ./front/package.json)' 'Bash(cat ./front/api.ts)' \
  'Bash(cat ./.env.example)' 'Bash(cat ./api/.env.example)' 'Bash(cat ./front/.env.example)' \
  'Bash(bash -n ./definicion/clonar.sh)' 'Bash(mkdir -p ./definicion)' \
  --disallowedTools \
  'Read(./.env)' 'Read(.env)' 'Read(./api/.env)' 'Read(./front/.env)' \
  'Bash(cat ./.env)' 'Bash(cat ./api/.env)' 'Bash(cat ./front/.env)' \
  'Bash(grep * ./.env)' 'Bash(head * ./.env)' 'Bash(grep * .env)' 'Bash(head * .env)' \
  -- "$prompt" > "$FLUCASTR_RECORD_FILE"
