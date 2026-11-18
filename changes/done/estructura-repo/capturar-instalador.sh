#!/usr/bin/env bash
set -u

OUT=${1:?ruta de salida requerida}
exec >"$OUT"
ROOT=$(pwd -P)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

manifest() {
  local dir=$1
  if [ ! -e "$dir" ]; then printf 'MISSING %s\n' "$dir"; return; fi
  find "$dir" -mindepth 1 -print0 | sort -z | while IFS= read -r -d '' f; do
    if [ -L "$f" ]; then printf 'L %s %s %s\n' "${f#"$dir"/}" "$(stat -c %a "$f")" "$(readlink "$f")"
    elif [ -d "$f" ]; then printf 'D %s %s\n' "${f#"$dir"/}" "$(stat -c %a "$f")"
    elif [ -f "$f" ]; then printf 'F %s %s %s %s\n' "${f#"$dir"/}" "$(stat -c %a "$f")" "$(sha256sum "$f" | cut -d' ' -f1)" "$(wc -c < "$f")"
    fi
  done
}

record() {
  local id=$1 home=$2 project=$3; shift 3
  local before after status
  before=$(manifest "$home")
  [ -z "$project" ] || before+="$(manifest "$project")"
  set +e
  HOME="$home" CODEX_HOME="$home/.codex" PI_CODING_AGENT_DIR="$home/.pi/agent" PATH="$BIN:$PATH" bash "$ROOT/instalar.sh" "$@" >"$TMP/out" 2>"$TMP/err"
  status=$?
  set -e
  after=$(manifest "$home")
  [ -z "$project" ] || after+="$(manifest "$project")"
  printf '%s\n' "$id" "$status" "ARGS $*" "BEFORE" "$before" "STDOUT" "$(cat "$TMP/out")" "STDERR" "$(cat "$TMP/err")" "AFTER" "$after" '---'
}

record_uninstall() {
  local id=$1 home=$2 project=$3; shift 3
  local before after status
  before=$(manifest "$home")
  [ -z "$project" ] || before+="$(manifest "$project")"
  set +e
  HOME="$home" CODEX_HOME="$home/.codex" PI_CODING_AGENT_DIR="$home/.pi/agent" PATH="$BIN:$PATH" bash "$ROOT/desinstalar.sh" "$@" >"$TMP/out" 2>"$TMP/err"
  status=$?
  set -e
  after=$(manifest "$home")
  [ -z "$project" ] || after+="$(manifest "$project")"
  printf '%s\n' "$id" "$status" "ARGS desinstalar.sh $*" "BEFORE" "$before" "STDOUT" "$(cat "$TMP/out")" "STDERR" "$(cat "$TMP/err")" "AFTER" "$after" '---'
}

record_remote() {
  local id=$1 home=$2 origin=$3; shift 3
  local before after status
  before=$(manifest "$home")
  set +e
  HOME="$home" FLUCASTR_ORIGEN="$origin" PATH="$BIN:$PATH" bash "$ROOT/instalar-remoto.sh" "$@" >"$TMP/out" 2>"$TMP/err"
  status=$?
  set -e
  after=$(manifest "$home")
  printf '%s\n' "$id" "$status" "ARGS instalar-remoto.sh $*" "BEFORE" "$before" "STDOUT" "$(cat "$TMP/out")" "STDERR" "$(cat "$TMP/err")" "AFTER" "$after" '---'
}

BIN=$TMP/bin
mkdir -p "$BIN"
for tool in claude pi codex; do printf '#!/bin/sh\nexit 0\n' > "$BIN/$tool"; chmod +x "$BIN/$tool"; done

for args in '--simular' '--solo claude --simular' '--solo pi --simular' '--solo codex --simular' '--solo claude' '--solo pi' '--solo codex' '--copiar' '--solo claude --copiar' '--solo pi --copiar' '--solo codex --copiar'; do
  id=$(printf '%s' "$args" | tr ' ' '_' | tr -cd '[:alnum:]_-')
  home="$TMP/$id-home"; mkdir -p "$home"
  record "$id" "$home" '' $args
done

for tool in claude pi codex; do
  id="absent_$tool"; home="$TMP/$id-home"; mkdir -p "$home"
  rm -f "$BIN/$tool"
  record "$id" "$home" '' --solo "$tool"
  printf '#!/bin/sh\nexit 0\n' > "$BIN/$tool"; chmod +x "$BIN/$tool"
done

for args in '--wat' '--solo nope' '--migrar /tmp/nope --copiar' '--skills-proyecto' '--migrar /tmp --proyecto /tmp' '--migrar /tmp --skills-proyecto' '--migrar /tmp --solo claude' '--migrar /tmp --copiar' '--migrar /tmp --agente principal' '--solo claude --skills-proyecto' '--solo codex --skills-proyecto'; do
  id=$(printf 'reject_%s' "$args" | tr ' ' '_' | tr -cd '[:alnum:]_-')
  home="$TMP/$id-home"; mkdir -p "$home"
  record "$id" "$home" '' $args
done

home="$TMP/project-flow-home"; project="$TMP/project-flow-project"; mkdir -p "$home" "$project/.claude" "$project/.pi/agent" "$project/.pi/skills/preexistente"
printf '{"custom":"keep"}\n' > "$project/.claude/settings.local.json"
printf '{"custom":"keep"}\n' > "$project/.pi/agent/settings.json"
printf 'preexistente\n' > "$project/.pi/skills/preexistente/SKILL.md"
record project_skills_install "$home" "$project" --solo pi --proyecto "$project" --skills-proyecto
record project_skills_reinstall "$home" "$project" --solo pi --proyecto "$project" --skills-proyecto
record_uninstall project_skills_uninstall "$home" "$project" --proyecto "$project"
record_uninstall global_uninstall "$home" ''

for mode in simulation real; do
  home="$TMP/migration-$mode-home"; project="$TMP/migration-$mode-project"; mkdir -p "$home" "$project/definitions" "$project/features/f" "$project/registro" "$project/src" "$project/.claude"
  printf 'v1\n' > "$project/definitions/BACKLOG.md"; printf 'tarea\n' > "$project/features/f/task-1.md"; printf 'fixture\n' > "$project/registro/datos.txt"; printf 'src\n' > "$project/src/main.txt"; printf 'custom\n' > "$project/.gitignore"; printf '{"custom":"keep"}\n' > "$project/.claude/settings.local.json"
  if [ "$mode" = real ]; then
    git -C "$project" init -q
    git -C "$project" add -f definitions features registro src .gitignore .claude/settings.local.json
    tree=$(git -C "$project" write-tree)
    git -C "$project" read-tree "$tree"
    git -C "$project" ls-files -z | git -C "$project" update-index -z --assume-unchanged --stdin
  fi
  if [ "$mode" = simulation ]; then record "migration_$mode" "$home" "$project" --migrar "$project" --simular; else record "migration_$mode" "$home" "$project" --migrar "$project"; fi
done

origin="$TMP/remote-origin"; home="$TMP/remote-home"; mkdir -p "$origin" "$home"
printf '%040d\n' 0 > "$origin/sha"
printf 'not a gzip archive\n' > "$origin/kit.tar.gz"
record_remote remote_bad_archive "$home" "$origin"

printf 'captura instalación, proyecto, migración y bootstrap remoto terminada; casos=%s\n' 32 >&2
