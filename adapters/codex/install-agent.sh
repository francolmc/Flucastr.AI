generar_agente_codex() { # archivo del agente (lo lee Codex como rol de subagente)
  local archivo="$1" nombre destino modelo
  nombre="$(basename "$archivo" .md)"
  destino="$CODEX_DIR/agents/$nombre.toml"
  modelo="$(node "$RESOLVER" modelo "$nombre" codex)"
  if ! liberar "$destino" && { [ -e "$destino" ] || [ -L "$destino" ]; }; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$CODEX_DIR/agents"
    node "$RESOLVER" agente-codex "$archivo" > "$destino"
    registrar archivo "$destino"
  fi
  echo "  agente generado: $destino (modelo: $modelo)"
}
