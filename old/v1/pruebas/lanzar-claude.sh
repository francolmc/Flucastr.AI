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
  'Read(./**)' 'Write(./definitions/**)' 'Edit(./definitions/**)' 'Write(./AGENTS.md)' 'Write(./initialize.sh)' 'Edit(./AGENTS.md)' 'Edit(./initialize.sh)' 'Skill' \
  'Bash(git -C ./api remote -v)' 'Bash(git -C ./api branch -a)' 'Bash(git -C ./api branch --show-current)' 'Bash(git -C ./api log --oneline -20)' 'Bash(git -C ./api status --short)' \
  'Bash(git -C ./front remote -v)' 'Bash(git -C ./front branch -a)' 'Bash(git -C ./front branch --show-current)' 'Bash(git -C ./front log --oneline -20)' 'Bash(git -C ./front status --short)' \
  'Bash(git remote -v)' 'Bash(git branch -a)' 'Bash(git branch --show-current)' 'Bash(git log --oneline -20)' 'Bash(git status --short)' \
  'Bash(ls *)' 'Bash(find *)' \
  'Bash(cat ./api/README.md)' 'Bash(cat ./api/COMPONENTE.md)' 'Bash(cat ./api/package.json)' 'Bash(cat ./front/README.md)' 'Bash(cat ./front/COMPONENTE.md)' 'Bash(cat ./front/package.json)' 'Bash(cat ./front/api.ts)' \
  'Bash(cat ./.env.example)' 'Bash(cat ./api/.env.example)' 'Bash(cat ./front/.env.example)' \
  'Bash(bash -n ./initialize.sh)' 'Bash(mkdir -p ./definitions)' \
  --disallowedTools \
  'Read(./.env)' 'Read(.env)' 'Read(./app/.env)' 'Read(./api/.env)' 'Read(./front/.env)' \
  'Bash(cat ./.env)' 'Bash(cat .env)' 'Bash(cat ./app/.env)' 'Bash(cat ./api/.env)' 'Bash(cat ./front/.env)' \
  'Bash(grep * ./.env)' 'Bash(head * ./.env)' 'Bash(grep * .env)' 'Bash(head * .env)' \
  -- "$prompt" > "$FLUCASTR_RECORD_FILE"
