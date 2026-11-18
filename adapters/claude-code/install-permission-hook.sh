# Política preaprobada conservadora de Claude Code: cualquier duda conserva el permiso normal de Claude.
# El hook se agrega al final de PreToolUse sin reemplazar entradas ajenas y autoriza solo comandos verificados.
instalar_hook_permisos_claude() {
  local prefijo="" verificacion="" auditoria=""
  if [ "$SIMULAR" = 1 ]; then
    echo "  (simulación) fijaría el hook de permisos conservadores en: $PROYECTO/.claude/settings.local.json"
    return 0
  fi
  local salida
  if ! salida="$(node "$RAIZ/scripts/permissions-hook.mjs" instalar "$PROYECTO" 2>&1)"; then
    node "$RAIZ/scripts/permissions-hook.mjs" quitar "$PROYECTO" >/dev/null 2>&1 || true
    echo "  AVISO: no se activó la política preaprobada de Claude Code ($salida)"
    return 0
  fi
  if ! verificacion="$(node "$RAIZ/scripts/permissions-hook.mjs" comprobar "$PROYECTO" 2>&1)" || [ "$verificacion" != "instalado" ]; then
    node "$RAIZ/scripts/permissions-hook.mjs" quitar "$PROYECTO" >/dev/null 2>&1 || true
    echo "  AVISO: no se activó la política preaprobada de Claude Code; el hook no quedó verificado ($verificacion)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  hook de permisos conservadores fijado: $PROYECTO/.claude/settings.local.json" ;;
    ya-estaba) echo "  hook de permisos conservadores ya estaba fijado: $PROYECTO/.claude/settings.local.json" ;;
    *) echo "  AVISO: no se activó la política preaprobada de Claude Code (respuesta inesperada: $salida)" ;;
  esac
  if auditoria="$(node "$RAIZ/scripts/permissions-hook.mjs" auditar "$PROYECTO" 2>&1)"; then
    node -e 'const a=JSON.parse(process.argv[1]); for (const h of a.hallazgos) if (h.tipo === "allow-amplia") console.log("  AVISO: allow amplio previo en " + h.ruta + ": " + h.regla); for (const e of a.errores) console.log("  AVISO: no se pudo revisar configuración en " + e.ruta + ": " + e.error)' "$auditoria"
  else
    echo "  AVISO: no se pudieron revisar los allow previos de Claude Code ($auditoria)"
  fi
}
