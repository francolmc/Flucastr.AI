# Renombra el vocabulario viejo (español) de un proyecto instalado al vocabulario nuevo (inglés):
# cambios/ pasa a changes/ (hechos/ pasa a done/), y en los planes y tramos se renombran las claves del
# frontmatter, las secciones y las etiquetas; en .claude/settings.local.json, el agente predeterminado.
# Uso: bash install.sh --migrate-names <ruta> [--dry-run]
# Es idempotente: una segunda corrida no cambia nada. No toca old/, el texto de changes/done/, HISTORY.md ni
# la prosa de la documentación; no hace commit y no usa git para mover archivos.
# Usa SIMULAR (de install.sh): con 1 solo lista lo que cambiaría.

# Programa awk que transforma un plan (frontmatter, encabezados y etiquetas). Lo imprime para pasarlo a awk.
nombres_programa() {
  cat <<'AWK'
function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
BEGIN {
  K["estado"] = "status"; K["rama"] = "branch"; K["tramo"] = "segment"
  K["ejecutor"] = "executor"; K["continuidad"] = "continuity"; K["tipo"] = "type"
  V["estado:borrador"] = "draft"; V["estado:aprobado"] = "approved"; V["estado:en curso"] = "in progress"
  V["estado:parcial"] = "partial"; V["estado:listo"] = "done"
  V["ejecutor:constructor"] = "builder"; V["ejecutor:principal"] = "planner"
  V["continuidad:continua"] = "continuous"; V["tipo:codigo"] = "code"
  H["Objetivo"] = "Goal"; H["Exploración"] = "Exploration"; H["Evaluación"] = "Evaluation"
  H["Supuestos"] = "Assumptions"; H["Decisiones ya tomadas"] = "Decisions already taken"; H["Decisiones"] = "Decisions"
  H["Validación"] = "Validation"; H["Alcance"] = "Scope"; H["Verificación"] = "Verification"
  H["Pasos"] = "Steps"
  H["Evidencia"] = "Evidence"; H["Notas"] = "Notes"
  nl = 0
  LB[++nl] = "Ejemplo concreto del resultado esperado:"; LN[nl] = "Concrete example of the expected result:"
  LB[++nl] = "Rutas susceptibles de cambio:"; LN[nl] = "Paths likely to change:"
  LB[++nl] = "Contratos a conservar:"; LN[nl] = "Contracts to keep:"
  LB[++nl] = "Verificación del tramo:"; LN[nl] = "Segment verification:"
  LB[++nl] = "Dependencias:"; LN[nl] = "Dependencies:"
  LB[++nl] = "Aceptación:"; LN[nl] = "Acceptance:"
  LB[++nl] = "Archivos:"; LN[nl] = "Files:"
  LB[++nl] = "Alcance:"; LN[nl] = "Scope:"
}
NR == 1 && $0 == "---" { fm = 1; print; next }
fm && $0 == "---" { fm = 0; print; next }
fm && match($0, /^[a-z]+:/) {
  k = substr($0, 1, RLENGTH - 1); v = trim(substr($0, RLENGTH + 1))
  if (k in K) {
    if ((k ":" v) in V) nv = V[k ":" v]; else nv = v
    print K[k] ": " nv; next
  }
  print; next
}
/^# Tramo [0-9]+$/ { sub(/^# Tramo /, "# Segment ") }
/^### Tramo [0-9]+ — / { sub(/^### Tramo /, "### Segment "); gsub(/ — Historia: /, " — Story: ") }
/^## / {
  t = trim(substr($0, 4)); ev = (t == "Evidencia" || t == "Evidence")
  if (t in H) $0 = "## " H[t]
  print; next
}
{
  # La sección de evidencias es salida real de comandos: no se reescribe su texto.
  if (!ev) for (i = 1; i <= nl; i++) if (index($0, LB[i]) == 1) { $0 = LN[i] substr($0, length(LB[i]) + 1); break }
  print
}
AWK
}

# Anota un cambio y lo muestra. Con SIMULAR=1 solo lo lista; si no, reemplaza el original por la copia nueva.
nombres_aplicar() { # original nuevo ruta-para-mostrar
  NOMBRES_N=$((NOMBRES_N + 1))
  if [ "${SIMULAR:-0}" = 1 ]; then
    echo "  cambiaría: $3"
    diff "$1" "$2" 2>/dev/null | grep '^>' | head -n 12 | sed 's/^/      /' || true
  else
    cat "$2" > "$1"
    echo "  reescrito: $3"
  fi
}

# Falla antes de mover nada si una carpeta de destino ya existe.
nombres_conflictos() { # proyecto
  local p="$1" e n dest
  [ -d "$p/cambios" ] || return 0
  for e in "$p/cambios"/* "$p/cambios"/.[!.]*; do
    [ -e "$e" ] || continue
    n="$(basename "$e")"
    if [ "$n" = hechos ]; then dest="$p/changes/done"; else dest="$p/changes/$n"; fi
    if [ -e "$dest" ] || [ -L "$dest" ]; then
      echo "conflicto: ${dest#"$p"/} ya existe; no se cambia nada. Revísalo a mano." >&2
      return 1
    fi
  done
  return 0
}

# Mueve cambios/ a changes/ (hechos/ a done/) con mv; con SIMULAR=1 solo lista.
nombres_mover() { # proyecto
  local p="$1" e n dest
  [ -d "$p/cambios" ] || return 0
  for e in "$p/cambios"/* "$p/cambios"/.[!.]*; do
    [ -e "$e" ] || continue
    n="$(basename "$e")"
    if [ "$n" = hechos ]; then dest="$p/changes/done"; else dest="$p/changes/$n"; fi
    if [ "${SIMULAR:-0}" = 1 ]; then
      echo "  movería: cambios/$n -> ${dest#"$p"/}"
    else
      mkdir -p "$p/changes"
      mv "$e" "$dest"
      echo "  movido: cambios/$n -> ${dest#"$p"/}"
    fi
    NOMBRES_N=$((NOMBRES_N + 1))
  done
  if [ "${SIMULAR:-0}" != 1 ]; then
    rmdir "$p/cambios" 2>/dev/null || echo "  aviso: cambios/ no quedó vacía; revísala a mano." >&2
  fi
}

# Reescribe los planes y tramos en changes/ (y cambios/ en simulación), sin done/ ni HISTORY.md, y el agente.
nombres_reescribir() { # proyecto temporal
  local p="$1" t="$2" f k=0 nuevo ajustes
  for f in "$p"/changes/*/*.md "$p"/cambios/*/*.md; do
    [ -f "$f" ] || continue
    case "$f" in */done/* | */hechos/*) continue ;; esac
    k=$((k + 1))
    nuevo="$t/plan-$k.md"
    awk "$(nombres_programa)" "$f" > "$nuevo"
    if ! cmp -s "$f" "$nuevo"; then nombres_aplicar "$f" "$nuevo" "${f#"$p"/}"; fi
  done
  ajustes="$p/.claude/settings.local.json"
  if [ -f "$ajustes" ]; then
    nuevo="$t/ajustes.json"
    sed -E \
      -e 's/("agent"[[:space:]]*:[[:space:]]*)"constructor"/\1"builder"/' \
      -e 's/("agent"[[:space:]]*:[[:space:]]*)"principal"/\1"planner"/' \
      "$ajustes" > "$nuevo"
    if ! cmp -s "$ajustes" "$nuevo"; then nombres_aplicar "$ajustes" "$nuevo" "${ajustes#"$p"/}"; fi
  fi
}

nombres_ejecutar() { # proyecto temporal
  local p="$1" t="$2"
  if [ "${SIMULAR:-0}" = 1 ]; then
    echo "Renombrar vocabulario en $p (simulación: no se escribe nada)"
  else
    echo "Renombrar vocabulario en $p"
  fi
  nombres_conflictos "$p" || return 1
  nombres_mover "$p"
  nombres_reescribir "$p" "$t"
  if [ "$NOMBRES_N" = 0 ]; then
    echo "sin cambios: el proyecto ya usa el vocabulario nuevo."
  elif [ "${SIMULAR:-0}" = 1 ]; then
    echo "simulación: $NOMBRES_N cambio(s) pendiente(s); ejecuta sin --dry-run para aplicarlos."
  else
    echo "listo: $NOMBRES_N cambio(s) aplicado(s)."
  fi
  if [ -f "$p/AGENTS.md" ] && grep -qE 'cambios/|hechos/|COMPLETADO|PAUSA' "$p/AGENTS.md"; then
    echo "aviso: AGENTS.md cita nombres viejos; su prosa no se reescribe: revísalo a mano."
  fi
  return 0
}

nombres_migrar() { # proyecto
  local p="$1" tmp r=0
  NOMBRES_N=0
  tmp="$(mktemp -d)" || { echo "no pude crear un temporal" >&2; return 1; }
  if nombres_ejecutar "$p" "$tmp"; then r=0; else r=$?; fi
  rm -rf "$tmp"
  return "$r"
}
