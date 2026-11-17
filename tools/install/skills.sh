enlazar_skills() { # carpeta destino de skills
  local base="$1" s n
  for s in "$RAIZ"/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    enlazar "$RAIZ/skills/$n" "$base/$n"
  done
}

instalar_skills() { # carpeta destino de skills, según el modo
  if [ "$MODO" = descarga ]; then copiar_skills "$1"; else enlazar_skills "$1"; fi
}

# Modo descarga: copia cada skill como carpeta real y le pone la marca .flucastr-ai (la que desinstalar.sh exige).
copiar_skills() { # carpeta destino de skills
  local base="$1" s n destino
  for s in "$RAIZ"/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    destino="$base/$n"
    if [ -e "$destino" ] || [ -L "$destino" ]; then
      if [ -d "$destino" ] && [ ! -L "$destino" ] && [ -f "$destino/.flucastr-ai" ]; then
        # copia anterior de este kit: se reemplaza
        if [ "$SIMULAR" = 0 ]; then rm -rf "$destino"; fi
      else
        echo "  OMITIDO (ya existe y no es una copia de Flucastr.AI): $destino"
        continue
      fi
    fi
    if [ "$SIMULAR" = 0 ]; then
      mkdir -p "$base"
      cp -R "$RAIZ/skills/$n" "$destino"
      : > "$destino/.flucastr-ai"
      registrar directorio "$destino"
    fi
    echo "  copiado: $destino"
  done
}
