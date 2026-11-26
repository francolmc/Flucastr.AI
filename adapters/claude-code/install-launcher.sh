generar_lanzador_claude() { # archivo del agente
  local archivo="$1" nombre destino esfuerzo ventana
  nombre="$(basename "$archivo" .md)"
  destino="$BIN_DIR/claude-$nombre"
  esfuerzo="$(node "$RESOLVER" effort "$nombre")"
  ventana="$(node "$RESOLVER" ventana-claude "$nombre")"
  if ! liberar "$destino" && { [ -e "$destino" ] || [ -L "$destino" ]; }; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    local exportar="" bandera=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    if [ -n "$esfuerzo" ]; then bandera=" --effort $esfuerzo"; fi
    if [ -n "$ventana" ]; then bandera="$bandera --autocompact $ventana"; fi
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea install.sh y lo borra uninstall.sh
${exportar}exec claude --agent $nombre$bandera "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (effort: ${effort:-sin declarar})"
}
