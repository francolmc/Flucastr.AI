generar_agente_claude() { # archivo del agente
  local archivo="$1" nombre destino modelo
  nombre="$(basename "$archivo" .md)"
  destino="$CLAUDE_DIR/agents/$nombre.md"
  modelo="$(node "$RESOLVER" modelo "$nombre" claude-code)"
  if ! liberar "$destino" && { [ -e "$destino" ] || [ -L "$destino" ]; }; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$CLAUDE_DIR/agents"
    node "$RESOLVER" agente-claude "$archivo" > "$destino"
    registrar archivo "$destino"
  fi
  echo "  agente generado: $destino (modelo: $modelo)"
}
