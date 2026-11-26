# Compactación automática de Claude Code en el ajuste personal del proyecto (settings.local.json, no se sube a git).
# El resolver escribe autoCompactWindow = compact_at + 33000 (compact_at del planner). Actualiza el valor que escribió el
# kit (el registrado en el manifiesto o 133000 de versiones anteriores) y respeta cualquier otro valor del proyecto.
# Uso: instalar_compactacion_claude [--solo-actualizar]   (--solo-actualizar no fija el campo si falta; lo usa el refresco)
# Siempre devuelve 0.

# Valores claude registrados para la ruta, en el registro de esta instalación y en el anterior.
registrados_claude() { # ruta
  cat "${NUEVO:-/dev/null}" "${MANIFIESTO:-/dev/null}" 2>/dev/null |
    awk -F'\t' -v r="$1" '$1=="compactacion" && $2==r && $3 ~ /^claude:/ { print substr($3, 8) }'
}

# Quita todas las líneas de registro claude de la ruta (solo con instalación real).
quitar_registro_claude() { # ruta
  local tmp
  if [ "$SIMULAR" = 0 ] && [ -f "$NUEVO" ]; then
    tmp="$(mktemp)"
    awk -F'\t' -v OFS='\t' -v r="$1" '!($1=="compactacion" && $2==r && $3 ~ /^claude:/)' "$NUEVO" > "$tmp"
    mv "$tmp" "$NUEVO"
  fi
}

# Deja solo la primera línea de registro claude de la ruta (solo con instalación real).
dejar_un_registro_claude() { # ruta
  local tmp
  if [ "$SIMULAR" = 0 ] && [ -f "$NUEVO" ]; then
    tmp="$(mktemp)"
    awk -F'\t' -v OFS='\t' -v r="$1" 'BEGIN { v = 0 } $1=="compactacion" && $2==r && $3 ~ /^claude:/ { if (v) next; v = 1 } { print }' "$NUEVO" > "$tmp"
    mv "$tmp" "$NUEVO"
  fi
}

# Proyecto de --project: fija o actualiza su compactación.
instalar_compactacion_claude() {
  compactacion_claude_en "$PROYECTO/.claude/settings.local.json" "$@"
}

# Fija o actualiza la compactación de Claude Code de unos ajustes. Uso: compactacion_claude_en <ajustes> [--solo-actualizar]
compactacion_claude_en() {
  local ajustes="$1" salida valor nuevo antes prefijo=""
  local extra=() regs=() v
  shift
  if [ "${1:-}" = "--solo-actualizar" ]; then extra+=(--solo-actualizar); fi
  if [ "$SIMULAR" = 1 ]; then extra+=(--dry-run); prefijo="(simulación) "; fi
  while IFS= read -r v; do
    if [ -n "$v" ]; then regs+=(--registrado "$v"); fi
  done < <(registrados_claude "$ajustes")
  if ! salida="$(node "$RESOLVER" fijar-compactacion claude "$ajustes" ${regs[@]+"${regs[@]}"} ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  case "$salida" in
    fijado:*)
      valor="${salida#fijado:}"
      echo "  ${prefijo}compactación de Claude Code fijada: autoCompactWindow=$valor ($ajustes)"
      quitar_registro_claude "$ajustes"
      if [ "$SIMULAR" = 0 ]; then registrar compactacion "$ajustes" "claude:$valor"; fi
      ;;
    actualizado:*)
      valor="${salida#actualizado:}"
      nuevo="${valor%%:*}"
      antes="${valor#*:}"
      echo "  ${prefijo}compactación de Claude Code actualizada: $antes → $nuevo ($ajustes)"
      quitar_registro_claude "$ajustes"
      if [ "$SIMULAR" = 0 ]; then registrar compactacion "$ajustes" "claude:$nuevo"; fi
      ;;
    ya-estaba)
      dejar_un_registro_claude "$ajustes"
      echo "  ${prefijo}compactación de Claude Code ya estaba fijada: $ajustes"
      ;;
    sin-campo) ;;
    omitido-usuario)
      quitar_registro_claude "$ajustes"
      echo "  ${prefijo}OMITIDO (el proyecto ya define autoCompactWindow: se respeta): $ajustes"
      ;;
    omitido-umbral) echo "  ${prefijo}OMITIDO (models.json no tiene un compact_at válido para el planner en Claude Code)" ;;
    omitido-rango:*) echo "  ${prefijo}OMITIDO (autoCompactWindow=${salida#omitido-rango:} queda fuera de 100000-1000000, el rango de Claude Code)" ;;
    *) echo "  AVISO: resultado inesperado de fijar-compactacion claude ($salida)" ;;
  esac
  return 0
}

# Refresca la compactación de Claude Code de los proyectos registrados (sin --project), para no ir uno por uno.
# REFRESCO_COMPACTACION_CLAUDE: líneas modo<TAB>raíz. "completo" crea el campo si falta; "solo" usa --solo-actualizar.
# Un proyecto ya tratado con --project se omite; una carpeta ausente avisa y sigue (su registro se conserva).
refrescar_compactacion_claude_registrada() {
  local modo m raiz ajustes vistos=$'\n'
  [ -n "${REFRESCO_COMPACTACION_CLAUDE:-}" ] || return 0
  echo
  echo "Compactación de Claude Code de proyectos registrados"
  for modo in completo solo; do
    while IFS=$'\t' read -r m raiz; do
      [ "$m" = "$modo" ] && [ -n "$raiz" ] || continue
      case "$vistos" in *$'\n'"$raiz"$'\n'*) continue ;; esac
      vistos+="$raiz"$'\n'
      if [ "$raiz" = "${PROYECTO:-}" ]; then continue; fi
      if [ ! -d "$raiz" ]; then
        echo "  AVISO: el proyecto registrado ya no existe, se omite (registro conservado): $raiz"
        continue
      fi
      ajustes="$raiz/.claude/settings.local.json"
      if [ "$modo" = solo ]; then
        compactacion_claude_en "$ajustes" --solo-actualizar
      else
        compactacion_claude_en "$ajustes"
      fi
    done <<< "$REFRESCO_COMPACTACION_CLAUDE"
  done
  return 0
}
