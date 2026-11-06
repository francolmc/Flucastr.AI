#!/usr/bin/env bash
# Lanza el agente «planificador» en Claude Code o en Pi (F42, task-06) con permisos explícitos.
# Solo mide: el lanzador no añade lógica de decisión. Los permisos de Claude Code van en --allowedTools
# y --disallowedTools; en Pi no hay filtro (bash completo, como en lanzar-coordinador-pi.sh).
# Uso: lanzar-planificador.sh {claude-code|pi} "<prompt>"   (ejecutar desde el directorio del fixture)
set -euo pipefail
[[ $# == 2 ]] || { echo 'uso: lanzar-planificador.sh {claude-code|pi} "<prompt>"' >&2; exit 2; }
: "${FLUCASTR_RECORD_FILE:?lanzar-planificador.sh debe definir FLUCASTR_RECORD_FILE}"
herramienta="$1"
prompt="$2"

case "$herramienta" in
  claude-code)
    if [[ -n "${CLAUDE_CODE_SUBAGENT_MODEL:-}" ]]; then
      echo 'lanzar-planificador.sh: CLAUDE_CODE_SUBAGENT_MODEL definida; la prueba queda invalidada' >&2
      exit 2
    fi
    claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
    "$claude_bin" -p --agent planificador \
      --permission-mode dontAsk --permission-prompts none \
      --no-session-persistence --output-format stream-json --verbose \
      --allowedTools \
      'Read(./**)' 'Write(./features/**)' 'Edit(./features/**)' 'Edit(./definitions/BACKLOG.md)' 'Skill' \
      'Bash(node scripts/validar-tarea.mjs *)' \
      'Bash(node ~/.flucastr-ai/validar-tarea.mjs *)' \
      'Bash(git branch --show-current)' \
      'Bash(ls *)' \
      'Bash(wc *)' \
      --disallowedTools \
      'Read(./.env)' \
      'Bash(cat ./.env)' \
      'Bash(git commit *)' \
      'Bash(git push *)' \
      -- "$prompt" > "$FLUCASTR_RECORD_FILE"
    ;;
  pi)
    pi_bin="${FLUCASTR_PI_BIN:-pi-planificador}"
    # Tope de tiempo (macOS no trae `timeout`): descomponer lleva más que 300 s, por eso 600 por defecto.
    tope="${FLUCASTR_PI_TOPE:-600}"
    "$pi_bin" --mode json --no-session -p "$prompt" > "$FLUCASTR_RECORD_FILE" &
    pid=$!
    ( sleep "$tope"; kill "$pid" 2>/dev/null; sleep 5; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 &
    vigia=$!
    set +e
    wait "$pid"; estado=$?
    set -e
    pkill -P "$vigia" 2>/dev/null || true
    kill "$vigia" 2>/dev/null || true
    wait "$vigia" 2>/dev/null || true
    if [ "$estado" -ge 128 ]; then
      echo "lanzar-planificador.sh: Pi no terminó en ${tope} s; se cortó la corrida" >&2
    fi
    exit "$estado"
    ;;
  *)
    echo 'uso: lanzar-planificador.sh {claude-code|pi} "<prompt>"' >&2
    exit 2
    ;;
esac
