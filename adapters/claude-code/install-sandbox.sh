# Activa el sandbox de Claude y agrega límites de lectura solo cuando no hay valores incompatibles.
# El manifiesto conserva cada valor agregado para retirarlo sin borrar ajustes preexistentes.
instalar_sandbox_claude() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea clave valor prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-sandbox claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se pudo configurar el sandbox de Claude Code en $ajustes ($salida)"
    return 0
  fi
  while IFS= read -r linea; do
    case "$linea" in
      agregado:*)
        clave="${linea#agregado:}"; clave="${clave%%:*}"; valor="${linea#agregado:*:}"
        if [ "$SIMULAR" = 1 ]; then
          echo "  (simulación) agregaría ajuste de sandbox $clave=$valor ($ajustes)"
        else
          echo "  ajuste de sandbox agregado: $clave=$valor ($ajustes)"
          if ! grep -qxF "$(printf 'sandbox-claude\t%s\t%s\t%s' "$ajustes" "$clave" "$valor")" "$NUEVO"; then
            registrar sandbox-claude "$ajustes" "$clave=$valor"
          fi
        fi
        ;;
      incompatible:*) echo "  AVISO: ajuste incompatible de Claude Code; no se sobrescribió (${linea#incompatible:}) en $ajustes" ;;
      ya-estaba) echo "  ajustes de sandbox de Claude Code ya estaban: $ajustes" ;;
      *) [ -n "$linea" ] && echo "  AVISO: resultado inesperado de fijar-sandbox claude ($linea)" ;;
    esac
  done <<< "$salida"
  echo "  AVISO: Claude sandbox no cubre comandos excluidos; hooks y servidores MCP se ejecutan fuera del sandbox. Revisa los allow globales amplios."
  if [ "$(uname -s)" = Linux ]; then
    local faltan=""
    command -v bwrap >/dev/null 2>&1 || faltan="bwrap"
    command -v socat >/dev/null 2>&1 && : || faltan="${faltan:+$faltan, }socat"
    if [ -n "$faltan" ]; then
      echo "  AVISO: faltan dependencias del sandbox de Claude Code ($faltan); el CLI puede desactivarlo y ejecutar sin sus restricciones."
    fi
  fi
}
