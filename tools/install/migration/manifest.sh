# Añade una línea al manifiesto temporal de la migración (sin duplicar). En simulación no hace nada.
mig_anotar() { # tipo ruta [dato]
  local linea
  if [ "$SIMULAR" = 1 ]; then return 0; fi
  linea="$(printf '%s\t%s\t%s' "$1" "$2" "${3:-}")"
  if [ ! -f "$MANIFIESTO" ] && [ ! -s "$MIG_MAN" ]; then printf 'modo\trepo\t\n' > "$MIG_MAN"; fi
  if grep -qxF "$linea" "$MIG_MAN"; then return 0; fi
  printf '%s\n' "$linea" >> "$MIG_MAN"
}

# Quita del manifiesto temporal las líneas de ese tipo y ruta (dato vacío = cualquiera). En simulación no hace nada.
mig_quitar() { # tipo ruta [dato]
  if [ "$SIMULAR" = 1 ]; then return 0; fi
  awk -F'\t' -v t="$1" -v r="$2" -v d="${3:-}" '!($1 == t && $2 == r && (d == "" || $3 == d))' "$MIG_MAN" > "$MIG_MAN.x"
  mv "$MIG_MAN.x" "$MIG_MAN"
}
