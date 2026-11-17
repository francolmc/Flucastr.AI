# Compactación automática de Claude Code en el ajuste personal del proyecto (settings.local.json, no se sube a git).
# El resolver escribe autoCompactWindow = compactar_en + 33000 (el colchón de Claude Code). Si el proyecto ya define
# autoCompactWindow, lo respeta.
instalar_compactacion_claude() {
  local ajustes="$PROYECTO/.claude/settings.local.json" salida valor prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-compactacion claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  case "$salida" in
    fijado:*)
      valor="${salida#fijado:}"
      echo "  ${prefijo}compactación de Claude Code fijada: autoCompactWindow=$valor ($ajustes)"
      if [ "$SIMULAR" = 0 ]; then registrar compactacion "$ajustes" "claude:$valor"; fi
      ;;
    ya-estaba) echo "  ${prefijo}compactación de Claude Code ya estaba fijada: $ajustes" ;;
    omitido-usuario) echo "  ${prefijo}OMITIDO (el proyecto ya define autoCompactWindow: se respeta): $ajustes" ;;
    omitido-umbral) echo "  ${prefijo}OMITIDO (modelos.json no tiene un compactar_en válido para Claude Code)" ;;
    omitido-rango:*) echo "  ${prefijo}OMITIDO (autoCompactWindow=${salida#omitido-rango:} queda fuera de 100000-1000000, el rango de Claude Code)" ;;
    *) echo "  AVISO: resultado inesperado de fijar-compactacion claude ($salida)" ;;
  esac
  return 0
}
