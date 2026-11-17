generar_lanzador_kit_run() {
  local destino="$BIN_DIR/kit-run"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
RAIZ="$RAIZ"
exec node "\$RAIZ/scripts/kit-run.mjs" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (herramienta: codex)"
}
