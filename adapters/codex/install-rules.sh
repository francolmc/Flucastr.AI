# Reglas deny de Codex del proyecto (<proyecto>/.codex/rules/flucastr.rules, archivo del kit: no se mezcla con lo ajeno).
# Codex las carga solo en proyectos de confianza y son experimentales. Si el archivo es ajeno, avisa y sigue.
instalar_deny_codex() {
  local archivo="$PROYECTO/.codex/rules/flucastr.rules" agents="$PROYECTO/AGENTS.md" salida prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-deny codex "$archivo" "$agents" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $archivo ($salida)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  ${prefijo}reglas de Codex fijadas: $archivo" ;;
    actualizado) echo "  ${prefijo}reglas de Codex actualizadas: $archivo" ;;
    ya-estaba) echo "  ${prefijo}reglas de Codex ya estaban: $archivo" ;;
    *) echo "  AVISO: resultado inesperado de fijar-deny codex ($salida)"; return 0 ;;
  esac
  # Una línea por archivo: se registra solo si aún no está en el registro nuevo.
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'codex-reglas\t%s\t' "$archivo")" "$NUEVO"; then
    registrar codex-reglas "$archivo"
  fi
  return 0
}

# Refresca las reglas de Codex de los proyectos ya registrados (sin --project), para no ir uno por uno.
# Un proyecto que ya no existe o un archivo de reglas ajeno solo avisa y sigue; su línea del registro se conserva
# (ya va copiada a $NUEVO).
refrescar_reglas_codex_registradas() {
  local ruta raiz_proyecto salida extra=() prefijo=""
  [ -n "$REGLAS_CODEX_REGISTRADAS" ] || return 0
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  echo
  echo "Reglas de Codex de proyectos registrados"
  while IFS= read -r ruta; do
    [ -n "$ruta" ] || continue
    raiz_proyecto="${ruta%/.codex/rules/flucastr.rules}"
    if [ ! -d "$raiz_proyecto" ]; then
      echo "  AVISO: el proyecto registrado ya no existe, se omiten sus reglas de Codex (registro conservado): $raiz_proyecto"
      continue
    fi
    if ! salida="$(node "$RESOLVER" fijar-deny codex "$ruta" "$raiz_proyecto/AGENTS.md" ${extra[@]+"${extra[@]}"} < /dev/null 2>&1)"; then
      echo "  AVISO: no se tocó $ruta ($salida)"
      continue
    fi
    case "$salida" in
      fijado) echo "  ${prefijo}reglas de Codex fijadas: $ruta" ;;
      actualizado) echo "  ${prefijo}reglas de Codex actualizadas: $ruta" ;;
      ya-estaba) echo "  ${prefijo}reglas de Codex ya estaban: $ruta" ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny codex ($salida)" ;;
    esac
  done <<< "$REGLAS_CODEX_REGISTRADAS"
  return 0
}

