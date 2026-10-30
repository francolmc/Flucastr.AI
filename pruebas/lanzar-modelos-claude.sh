#!/usr/bin/env bash
# Lanza una corrida de comprobación de modelos en Claude Code: el coordinador (agente principal)
# delega en planificador y en constructor, y el registro estructurado guarda qué modelo respondió cada uno.
# Uso: lanzar-modelos-claude.sh   (ejecutar desde una carpeta temporal vacía, no desde el repo)
set -euo pipefail
: "${FLUCASTR_RECORD_FILE:?lanzar-modelos-claude.sh debe definir FLUCASTR_RECORD_FILE}"
claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
prompt="Esto es una comprobación de modelos, no un flujo de trabajo: no leas archivos ni escribas nada. Usa la herramienta Agent, sin pasar el parámetro model, para llamar primero al subagente planificador y después al subagente constructor; a cada uno pídele que responda solo la palabra OK sin usar herramientas. Al terminar responde LISTO."
extra=()
if [[ "${FLUCASTR_PERSISTIR_SESION:-0}" != "1" ]]; then extra+=(--no-session-persistence); fi
"$claude_bin" -p --agent coordinador \
  --permission-mode dontAsk --permission-prompts none \
  ${extra[@]+"${extra[@]}"} --output-format stream-json --verbose \
  "$@" \
  --allowedTools \
  'Agent(planificador)' 'Agent(constructor)' \
  -- "$prompt" > "$FLUCASTR_RECORD_FILE"
