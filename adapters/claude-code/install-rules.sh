instalar_deny_claude() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea regla prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
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
        if [ "$SIMULAR" = 1 ]; then
          echo "  (simulación) agregaría: $regla ($ajustes)"
        else
          echo "  regla deny de Claude Code agregada: $regla ($ajustes)"
          if ! grep -qxF "$(printf 'deny\t%s\t%s' "$ajustes" "$regla")" "$NUEVO"; then
            registrar deny "$ajustes" "$regla"
          fi
        fi
        ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny claude ($linea)" ;;
    esac
  done <<< "$salida"
  return 0
}
