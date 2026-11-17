generar_lanzador_claude() { # archivo del agente
  local archivo="$1" nombre destino esfuerzo
  nombre="$(basename "$archivo" .md)"
  destino="$BIN_DIR/claude-$nombre"
  esfuerzo="$(node "$RESOLVER" esfuerzo "$nombre")"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    local exportar="" bandera=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    if [ -n "$esfuerzo" ]; then bandera=" --effort $esfuerzo"; fi
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
${exportar}exec claude --agent $nombre$bandera "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (esfuerzo: ${esfuerzo:-sin declarar})"
}
