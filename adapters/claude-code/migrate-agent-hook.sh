# Agente predeterminado del proyecto: queda `principal`, aunque hubiera otro. $1: archivo de ajustes a usar.
mig_agente() {
  local arch="$1" real="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  if [ "$SIMULAR" = 1 ]; then prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-agente "$arch" principal --sobrescribir 2>&1)"; then
    echo "  AVISO: no se tocó $real ($salida)"
    return 0
  fi
  case "$salida" in
    fijado)
      echo "  ${prefijo}agente predeterminado fijado: principal ($real)"
      mig_quitar ajuste "$real"; mig_anotar ajuste "$real" principal
      ;;
    reemplazado:*)
      echo "  ${prefijo}agente predeterminado cambiado de ${salida#reemplazado:} a principal ($real)"
      mig_quitar ajuste "$real"; mig_anotar ajuste "$real" principal
      ;;
    ya-estaba) echo "  ${prefijo}el agente predeterminado ya es principal ($real)" ;;
    *) echo "  AVISO: resultado inesperado de fijar-agente ($salida)" ;;
  esac
  return 0
}

# Quita el hook del validador de v1 (solo la entrada exacta). $1: archivo de ajustes a usar.
mig_hook() {
  local arch="$1" real="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  if [ "$SIMULAR" = 1 ]; then prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" quitar-hook claude "$arch" 2>&1)"; then
    echo "  AVISO: no se tocó $real ($salida)"
    return 0
  fi
  case "$salida" in
    quitado)
      echo "  ${prefijo}hook de v1 quitado: $real"
      mig_quitar hook "$real" claude
      ;;
    archivo-quitado)
      echo "  ${prefijo}hook de v1 quitado; $real quedó vacío y se borra"
      mig_quitar hook "$real" claude
      ;;
    omitido) echo "  ${prefijo}sin hook de v1 que quitar: $real" ;;
    *) echo "  AVISO: resultado inesperado de quitar-hook ($salida)" ;;
  esac
  return 0
}

