# Reglas deny de Claude Code del proyecto: las mismas que instala --project (fijar-deny).
mig_deny() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea regla prefijo="" extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-deny claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  if [ "$salida" = ya-estaba ]; then
    echo "  ${prefijo}reglas deny de Claude Code ya estaban: $ajustes"
    return 0
  fi
  while IFS= read -r linea; do
    case "$linea" in
      agregada:*)
        regla="${linea#agregada:}"
        echo "  ${prefijo}regla deny de Claude Code agregada: $regla ($ajustes)"
        mig_anotar deny "$ajustes" "$regla"
        ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny claude ($linea)" ;;
    esac
  done <<< "$salida"
  return 0
}

# Sandbox Claude del proyecto migrado. El manifiesto permite retirar solo los valores agregados.
mig_sandbox() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea dato clave valor prefijo="" extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-sandbox claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó el sandbox en $ajustes ($salida)"
    return 0
  fi
  if [ "$salida" = ya-estaba ]; then
    echo "  ${prefijo}sandbox Claude ya configurado: $ajustes"
    return 0
  fi
  while IFS= read -r linea; do
    case "$linea" in
      agregado:*)
        dato="${linea#agregado:}"; clave="${dato%%:*}"; valor="${dato#*:}"
        echo "  ${prefijo}ajuste de sandbox agregado: $clave ($ajustes)"
        mig_anotar sandbox-claude "$ajustes" "$clave" "$valor"
        ;;
      incompatible:*) echo "  AVISO: configuración incompatible de sandbox Claude: ${linea#incompatible:} ($ajustes)" ;;
      *) echo "  AVISO: resultado inesperado de fijar-sandbox claude ($linea)" ;;
    esac
  done <<< "$salida"
  return 0
}

