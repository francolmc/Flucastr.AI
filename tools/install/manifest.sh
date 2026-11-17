guardar_manifiesto() {
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$ESTADO_DIR"
    cp "$NUEVO" "$MANIFIESTO"
  fi
  rm -f "$NUEVO"
}

registrar() { # tipo ruta [extra]
  if [ "$SIMULAR" = 0 ]; then
    printf '%s\t%s\t%s\n' "$1" "$2" "${3:-}" >> "$NUEVO"
  fi
}
