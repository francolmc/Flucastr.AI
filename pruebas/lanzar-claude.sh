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
  'Bash(git -C ./worker remote -v)' 'Bash(git -C ./worker branch -a)' 'Bash(git -C ./worker branch --show-current)' 'Bash(git -C ./worker log --oneline -20)' 'Bash(git -C ./worker status --short)' \
  'Bash(git -C ./infra remote -v)' 'Bash(git -C ./infra branch -a)' 'Bash(git -C ./infra branch --show-current)' 'Bash(git -C ./infra log --oneline -20)' 'Bash(git -C ./infra status --short)' \
  'Bash(git remote -v)' 'Bash(git branch -a)' 'Bash(git branch --show-current)' 'Bash(git log --oneline -20)' 'Bash(git status --short)' \
  'Bash(ls *)' 'Bash(find *)' \
  'Bash(cat ./api/README.md)' 'Bash(cat ./api/COMPONENTE.md)' 'Bash(cat ./api/package.json)' 'Bash(cat ./front/README.md)' 'Bash(cat ./front/COMPONENTE.md)' 'Bash(cat ./front/package.json)' 'Bash(cat ./front/api.ts)' \
  'Bash(cat ./worker/README.md)' 'Bash(cat ./worker/COMPONENTE.md)' 'Bash(cat ./worker/package.json)' 'Bash(cat ./infra/README.md)' 'Bash(cat ./infra/COMPONENTE.md)' 'Bash(cat ./infra/package.json)' \
  'Bash(cat ./.env.example)' 'Bash(cat ./api/.env.example)' 'Bash(cat ./front/.env.example)' \
  'Bash(bash -n ./definicion/clonar.sh)' 'Bash(mkdir -p ./definicion)' \
  --disallowedTools \
  'Read(./.env)' 'Read(.env)' 'Read(./api/.env)' 'Read(./front/.env)' 'Read(./worker/.env)' 'Read(./infra/.env)' \
  'Bash(cat ./.env)' 'Bash(cat ./api/.env)' 'Bash(cat ./front/.env)' 'Bash(cat ./worker/.env)' 'Bash(cat ./infra/.env)' \
  'Bash(grep * ./.env)' 'Bash(head * ./.env)' 'Bash(grep * .env)' 'Bash(head * .env)' \
  -- "$prompt" > "$FLUCASTR_RECORD_FILE"
