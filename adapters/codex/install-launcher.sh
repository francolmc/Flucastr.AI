generar_lanzador_codex() { # archivo del agente
  local archivo="$1" nombre destino modelo esfuerzo compactar
  nombre="$(basename "$archivo" .md)"
  destino="$BIN_DIR/codex-$nombre"
  modelo="$(node "$RESOLVER" modelo "$nombre" codex)"
  esfuerzo="$(node "$RESOLVER" esfuerzo "$nombre" codex)"
  compactar="$(node "$RESOLVER" compactar-codex "$nombre")"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    local exportar="" bandera=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    if [ -n "$esfuerzo" ]; then bandera=" -c 'model_reasoning_effort=\"$esfuerzo\"'"; fi
    # Umbral de compactación (compactar_en de modelos.json): la prueba de codex-compactacion lo confirmó para Codex.
    if [ -n "$compactar" ]; then bandera="$bandera -c model_auto_compact_token_limit=$compactar"; fi
    # Espera larga de comandos (una sola llamada, sin sondeos): 30 min. Sin probar hasta el tramo 2 de espera-unica (A2).
    bandera="$bandera -c background_terminal_max_timeout=1800000"
    # El modelo y las instrucciones se resuelven al lanzar (como en pi-<agente>); el esfuerzo y el umbral se fijan aquí.
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
RAIZ="$RAIZ"
${exportar}exec codex --sandbox workspace-write -c 'approval_policy="on-request"' -m "\$(node "\$RAIZ/scripts/resolver.mjs" modelo $nombre codex)"$bandera -c "developer_instructions=\$(node "\$RAIZ/scripts/resolver.mjs" instrucciones-codex "\$RAIZ/agentes/$nombre.md")" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (modelo: $modelo, esfuerzo: ${esfuerzo:-sin declarar}, compacta en: ${compactar:-sin declarar})"
}
