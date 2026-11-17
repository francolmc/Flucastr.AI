#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd -P)
OUT=${1:?ruta de salida requerida}
STAGE=/tmp/flucastr-uninstall-capture-${UID}-$(printf '%s' "$ROOT" | sha256sum | cut -c1-10)
mkdir "$STAGE" || { printf 'fixture fijo ya existe: %s\n' "$STAGE" >&2; exit 1; }
trap 'rm -rf "$STAGE"' EXIT
BIN=$STAGE/bin
mkdir -p "$BIN"
for tool in claude pi codex; do
  printf '#!/bin/sh\nexit 0\n' > "$BIN/$tool"
  chmod +x "$BIN/$tool"
done

tree() {
  local dir=$1
  if [ ! -e "$dir" ]; then printf 'MISSING\n'; return; fi
  find "$dir" -mindepth 1 -print0 | sort -z | while IFS= read -r -d '' path; do
    local rel=${path#"$dir"/}
    if [ -L "$path" ]; then
      local target=$(readlink "$path")
      target=${target//"$ROOT"/<REPO>}
      target=${target//"$STAGE"/<FIXTURE>}
      printf 'L %s %s %s\n' "$rel" "$(stat -c %a "$path")" "$target"
    elif [ -d "$path" ]; then
      printf 'D %s %s\n' "$rel" "$(stat -c %a "$path")"
    elif [ -f "$path" ]; then
      printf 'F %s %s %s %s\n' "$rel" "$(stat -c %a "$path")" "$(sha256sum "$path" | cut -d' ' -f1)" "$(wc -c < "$path")"
    fi
  done
}

record() {
  local id=$1 home=$2 project=$3; shift 3
  local before_home before_project after_home after_project status
  before_home=$(tree "$home")
  before_project='(no project)'
  [ -z "$project" ] || before_project=$(tree "$project")
  set +e
  HOME="$home" CODEX_HOME="$home/.codex" PI_CODING_AGENT_DIR="$home/.pi/agent" PATH="$BIN:$PATH" bash "$@" >"$STAGE/stdout" 2>"$STAGE/stderr"
  status=$?
  set -e
  after_home=$(tree "$home")
  after_project='(no project)'
  [ -z "$project" ] || after_project=$(tree "$project")
  printf '\nCASE %s\nEXIT %s\nARGS' "$id" "$status"
  printf ' %q' "$@" | sed "s|$STAGE|<FIXTURE>|g; s|$ROOT|<REPO>|g"
  printf '\nBEFORE HOME\n%s\nBEFORE PROJECT\n%s\nSTDOUT\n' "$before_home" "$before_project"
  sed "s|$STAGE|<FIXTURE>|g; s|$ROOT|<REPO>|g" "$STAGE/stdout"
  printf 'STDERR\n'
  sed "s|$STAGE|<FIXTURE>|g; s|$ROOT|<REPO>|g" "$STAGE/stderr"
  printf 'AFTER HOME\n%s\nAFTER PROJECT\n%s\n---\n' "$after_home" "$after_project"
}

capture_uninstall() {
  local id=$1 home=$2 project=$3; shift 3
  record "$id" "$home" "$project" "$ROOT/desinstalar.sh" "$@"
}

capture_install() {
  local id=$1 home=$2 project=$3; shift 3
  record "$id" "$home" "$project" "$ROOT/instalar.sh" "$@"
}

mkdir -p "$(dirname "$OUT")"
exec >"$OUT"
printf 'Matriz de desinstalación; fixture raíz <FIXTURE>; HOME y proyectos sintéticos; herramientas claude/pi/codex simuladas.\n'

home=$STAGE/absent-home; mkdir -p "$home/.flucastr-ai"
printf 'personal\n' > "$home/.flucastr-ai/modelos.json"
capture_uninstall absent_manifest "$home" '' --todo

for mode in repo copy; do
  home=$STAGE/$mode-home; mkdir -p "$home"
  args=(); [ "$mode" != copy ] || args+=(--copiar)
  capture_install "install_$mode" "$home" '' "${args[@]}" --solo pi
  capture_uninstall "${mode}_simulate" "$home" '' --simular
  capture_uninstall "${mode}_remove" "$home" ''
done

home=$STAGE/todo-home; mkdir -p "$home"
capture_install install_todo "$home" '' --copiar --solo pi
capture_uninstall todo_remove "$home" '' --todo

home=$STAGE/project-home; project=$STAGE/project
mkdir -p "$home" "$project"
capture_install project_install "$home" "$project" --solo claude --proyecto "$project" --agente principal
capture_uninstall project_simulate "$home" "$project" --proyecto "$project" --simular
capture_uninstall project_remove "$home" "$project" --proyecto "$project"

home=$STAGE/reinstall-home; project=$STAGE/reinstall-project
mkdir -p "$home" "$project"
capture_install reinstall_first "$home" "$project" --solo claude --proyecto "$project" --agente principal
capture_install reinstall_again "$home" "$project" --solo claude --proyecto "$project" --agente principal
capture_uninstall preserve_adjustments "$home" "$project" --conservar-ajustes

home=$STAGE/foreign-home; project=$STAGE/foreign-project
mkdir -p "$home/.flucastr-ai" "$project" "$STAGE/foreign-target"
printf 'modo\trepo\narchivo\t%s\n' "$STAGE/foreign-target/owned-by-other" > "$home/.flucastr-ai/manifiesto.txt"
printf 'personal\n' > "$STAGE/foreign-target/owned-by-other"
capture_uninstall foreign_path "$home" "$project"

home=$STAGE/invalid-home; mkdir -p "$home"
capture_uninstall unknown_option "$home" '' --unknown
capture_uninstall missing_project "$home" '' --proyecto

printf '\nMATRIX_CASES 18\n'
