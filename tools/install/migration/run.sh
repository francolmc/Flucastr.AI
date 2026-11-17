migrar() {
  local base="$PROYECTO/old/v1" lista="" d es_git=0 raiz_v1="old/v1/" leer local_arch
  local medias t est abiertas
  if [ -e "$base" ] || [ -L "$base" ]; then
    echo "old/v1 ya existe en $PROYECTO: no se cambia nada (una migración anterior ya la hizo; revísala a mano si falta algo)."
    return 0
  fi
  for d in definitions features registro; do
    if [ -e "$PROYECTO/$d" ] || [ -L "$PROYECTO/$d" ]; then lista="$lista $d"; fi
  done
  if [ -z "$lista" ]; then
    echo "nada que migrar: $PROYECTO no tiene definitions/, features/ ni registro/."
    return 0
  fi

  MIG_TMP="$(mktemp -d)" || { echo "no pude crear un temporal" >&2; return 1; }
  trap 'rm -rf "$MIG_TMP"' EXIT
  MIG_MAN="$MIG_TMP/manifiesto.txt"
  if [ -f "$MANIFIESTO" ]; then cp "$MANIFIESTO" "$MIG_MAN"; else : > "$MIG_MAN"; fi
  cp "$MIG_MAN" "$MIG_TMP/manifiesto.original"
  if git -C "$PROYECTO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then es_git=1; fi

  if [ "$SIMULAR" = 1 ]; then
    echo "SIMULACIÓN: no se escribe nada. Esto es lo que haría:"
    raiz_v1=""
  else
    mkdir -p "$base"
  fi

  echo "Migrar $PROYECTO a la v2"
  mig_workspace
  echo "Mover a old/v1/ (nada se borra; src/ no se toca):"
  for d in $lista; do
    if [ "$SIMULAR" = 1 ]; then
      echo "  movería: $d -> old/v1/$d"
    elif [ "$es_git" = 1 ] && [ -n "$(git -C "$PROYECTO" ls-files -- "$d")" ]; then
      git -C "$PROYECTO" mv "$d" "old/v1/$d"
      echo "  movido (git mv): $d -> old/v1/$d"
    else
      mv "$PROYECTO/$d" "$base/$d"
      echo "  movido: $d -> old/v1/$d"
    fi
  done

  # En simulación el agente y el hook se calculan sobre una copia: el proyecto no cambia.
  local_arch="$PROYECTO/.claude/settings.local.json"
  if [ "$SIMULAR" = 1 ]; then
    mkdir -p "$MIG_TMP/local"
    if [ -f "$local_arch" ]; then cp "$local_arch" "$MIG_TMP/local/settings.local.json"; fi
    local_arch="$MIG_TMP/local/settings.local.json"
  fi
  echo "Claude Code (proyecto $PROYECTO):"
  echo "  AVISO: reglas allow globales amplias pueden autorizar comandos; comandos excluidos del sandbox, hooks y servidores MCP operan fuera de él. Revisa la configuración efectiva."
  mig_agente "$local_arch"
  mig_hook "$local_arch"
  mig_deny
  mig_sandbox
  echo ".gitignore:"
  mig_gitignore

  if [ "$SIMULAR" = 1 ]; then
    echo "  crearía: $PROYECTO/cambios/"
  elif [ -d "$PROYECTO/cambios" ]; then
    echo "  ya existe: $PROYECTO/cambios/"
  else
    mkdir -p "$PROYECTO/cambios"
    echo "  creado: $PROYECTO/cambios/"
  fi

  # Trabajo a medias: solo se lista (no se convierte aquí). Con --simular se lee desde su sitio original.
  leer="$base"
  if [ "$SIMULAR" = 1 ]; then leer="$PROYECTO"; fi
  medias=""
  for t in "$leer"/features/*/task-*.md; do
    [ -f "$t" ] || continue
    est="$(sed -n 2p "$t" | grep -oE 'estado: *(aprobada|en curso|bloqueada)' | sed -E 's/^estado: *//' || true)"
    [ -n "$est" ] || continue
    medias="$medias  tarea $est: ${raiz_v1}features/$(basename "$(dirname "$t")")/$(basename "$t")"$'\n'
  done
  if [ -f "$leer/definitions/BACKLOG.md" ]; then
    abiertas="$(awk -F'|' -v p="$raiz_v1" '/^\| *F[0-9]+/ {
      id = $2; ft = $3; e = $8
      gsub(/^ +| +$/, "", id); gsub(/^ +| +$/, "", ft); gsub(/^ +| +$/, "", e)
      if (e != "hecha" && e != "completada") printf "  feature abierta: %s %s (estado: %s) [%sdefinitions/BACKLOG.md]\n", id, ft, e, p
    }' "$leer/definitions/BACKLOG.md")"
    if [ -n "$abiertas" ]; then medias="$medias$abiertas"$'\n'; fi
  fi
  echo "Trabajo a medias (solo se lista; no se convierte aquí):"
  if [ -n "$(printf '%s' "$medias" | grep .)" ]; then printf '%s\n' "$medias" | grep .; else echo "  ninguno"; fi
  mig_aviso_agents

  # El manifiesto solo cambia si algo se registró (real, no en simulación).
  if [ "$SIMULAR" = 0 ] && ! cmp -s "$MIG_MAN" "$MIG_TMP/manifiesto.original"; then
    mkdir -p "$ESTADO_DIR"
    cp "$MIG_MAN" "$MANIFIESTO"
  fi
  if [ "$SIMULAR" = 1 ]; then
    echo "SIMULACIÓN: no se escribió nada."
  else
    echo "Migración lista. Lo de v1 está en $PROYECTO/old/v1/ (sin borrar). Siguiente: skill migrar-proyecto (AGENTS.md, verify, planes)."
  fi
  return 0
}
