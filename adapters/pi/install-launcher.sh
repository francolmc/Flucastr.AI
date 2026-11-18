generar_lanzador_pi() { # archivo del agente
  local archivo="$1" nombre destino modelo
  nombre="$(basename "$archivo" .md)"
  destino="$BIN_DIR/pi-$nombre"
  modelo="$(node "$RESOLVER" modelo "$nombre" pi)"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    local exportar=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea install.sh y lo borra uninstall.sh
RAIZ="$RAIZ"
${exportar}exec pi --model "\$(node "\$RAIZ/scripts/resolver.mjs" modelo-esfuerzo $nombre pi)" \\
  --append-system-prompt "\$(node "\$RAIZ/scripts/resolver.mjs" cuerpo "\$RAIZ/core/agents/$nombre.md")" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (modelo: $modelo)"
}

