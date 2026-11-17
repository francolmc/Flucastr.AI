# Deja el agente como predeterminado de un proyecto, en su archivo de ajustes personal (no se sube a git).
fijar_agente_proyecto() {
  local ajustes="$PROYECTO/.claude/settings.local.json" resultado
  if [ "$SIMULAR" = 1 ]; then
    echo "  fijaría el agente '$AGENTE' como predeterminado en: $ajustes"
    return
  fi
  resultado="$(node "$RESOLVER" fijar-agente "$ajustes" "$AGENTE")"
  case "$resultado" in
    fijado)
      echo "  agente predeterminado fijado: $ajustes -> $AGENTE"
      registrar ajuste "$ajustes" "$AGENTE"
      ;;
    ya-estaba) echo "  ya estaba fijado: $ajustes" ;;
    omitido:*) echo "  OMITIDO (el proyecto ya define otro agente predeterminado: ${resultado#omitido:}): $ajustes" ;;
  esac
}
