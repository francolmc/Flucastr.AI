# Funciones para copiar skills de Pi al proyecto y excluirlas localmente en Git.
# Ruta absoluta de .git/info/exclude del proyecto; vacía si el proyecto no es un repo git.
exclusion_de_git() { # ruta del proyecto
  git -C "$1" rev-parse --path-format=absolute --git-path info/exclude 2>/dev/null || true
}

# Excluye en git, de forma local, la carpeta de una skill copiada. Solo añade la línea si no estaba
# (si la puso el cliente, no se toca ni se registra, para que uninstall.sh no borre una línea ajena).
excluir_en_git() { # nombre de la skill
  local n="$1" archivo linea="/.pi/skills/$1/"
  archivo="$(exclusion_de_git "$PROYECTO")"
  if [ -z "$archivo" ]; then
    if [ "$SIN_GIT_AVISADO" = 0 ]; then
      echo "  AVISO: el proyecto no es un repo git; no hay nada que excluir."
      SIN_GIT_AVISADO=1
    fi
    return
  fi
  if [ -f "$archivo" ] && grep -qxF "$linea" "$archivo"; then
    echo "  ya estaba excluido en git (no se toca): $linea"
    return
  fi
  if [ "$SIMULAR" = 1 ]; then
    echo "  excluiría: $linea"
    return
  fi
  mkdir -p "$(dirname "$archivo")"
  if [ -s "$archivo" ] && [ -n "$(tail -c1 "$archivo")" ]; then printf '\n' >> "$archivo"; fi
  printf '%s\n' "$linea" >> "$archivo"
  registrar exclusion "$archivo" "$linea"
  echo "  excluido en git: $linea"
}

instalar_skills_proyecto() { # usa $PROYECTO
  local base="$PROYECTO/.pi/skills" s n destino
  if [ "$SIMULAR" = 0 ]; then copiar_skills "$base"; fi
  for s in "$RAIZ"/core/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    destino="$base/$n"
    if [ "$SIMULAR" = 1 ]; then
      if { [ -e "$destino" ] || [ -L "$destino" ]; } && { [ -L "$destino" ] || [ ! -f "$destino/.flucastr-ai" ]; }; then
        echo "  OMITIDO (ya existe y no es una copia de Flucastr.AI): $destino"
        continue
      fi
      echo "  copiaría: $destino"
    elif [ -L "$destino" ] || [ ! -d "$destino" ] || [ ! -f "$destino/.flucastr-ai" ]; then
      continue # copiar_skills la omitió (carpeta ajena): no se excluye
    fi
    excluir_en_git "$n"
  done
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'skills-proyecto\t%s\t' "$PROYECTO")" "$NUEVO"; then
    registrar skills-proyecto "$PROYECTO"
  fi
}
