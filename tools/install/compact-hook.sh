# Hook de compactación del proyecto (A9 de changes/piso-planner/tramo-9.md): la entrada SessionStart `compact`
# que ejecuta scripts/after-compact.mjs. Usa adapters/shared/compact-hook.mjs; si falla, avisa y sigue: no aborta
# la instalación. Una línea `hook-compact` por archivo en el registro, solo si aún no está.
instalar_hook_compact() { # claude|codex
  local herramienta="$1" archivo prefijo="" salida extra=()
  case "$herramienta" in
    claude) archivo="$PROYECTO/.claude/settings.local.json" ;;
    codex) archivo="$PROYECTO/.codex/hooks.json" ;;
    *) echo "  AVISO: herramienta desconocida para el hook de compactación ($herramienta)"; return 0 ;;
  esac
  if [ "$SIMULAR" = 1 ]; then extra=(--dry-run); prefijo="(simulación) "; fi
  if ! salida="$(node "$RAIZ/adapters/shared/compact-hook.mjs" instalar "$herramienta" "$PROYECTO" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $archivo para el hook de compactación ($salida)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  ${prefijo}hook de compactación fijado: $archivo" ;;
    ya-estaba) echo "  ${prefijo}hook de compactación ya estaba: $archivo" ;;
    *) echo "  AVISO: resultado inesperado del hook de compactación ($salida)"; return 0 ;;
  esac
  if [ "$herramienta" = codex ]; then echo "  Codex pedirá aprobar el hook de compactación la primera vez que lo use."; fi
  # Una línea por archivo: se registra solo si aún no está en el registro nuevo.
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'hook-compact\t%s\t%s' "$archivo" "$herramienta")" "$NUEVO"; then
    registrar hook-compact "$archivo" "$herramienta"
  fi
  return 0
}
