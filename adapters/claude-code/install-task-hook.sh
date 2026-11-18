# Hook del validador de tareas en Claude Code (ajuste personal del proyecto, settings.local.json; no se sube a git).
# Si el resolver falla (JSON inválido, hooks con otro tipo), avisa y sigue: no aborta la instalación.
instalar_hook_claude() {
  local ajustes="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-hook claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  ${prefijo}hook de Claude Code fijado: $ajustes" ;;
    ya-estaba) echo "  ${prefijo}hook de Claude Code ya estaba fijado: $ajustes" ;;
    *) echo "  AVISO: resultado inesperado de fijar-hook claude ($salida)"; return 0 ;;
  esac
  # Una sola línea hook por proyecto: se registra solo si aún no está en el registro nuevo.
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'hook\t%s\tclaude' "$ajustes")" "$NUEVO"; then
    registrar hook "$ajustes" claude
  fi
  return 0
}
