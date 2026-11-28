generar_agente_pi() { # archivo del agente (lo lee el paquete de subagentes de Pi)
  local archivo="$1" nombre destino modelo
  nombre="$(basename "$archivo" .md)"
  destino="$PI_DIR/agents/$nombre.md"
  modelo="$(node "$RESOLVER" modelo "$nombre" pi)"
  if ! liberar "$destino" && { [ -e "$destino" ] || [ -L "$destino" ]; }; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$PI_DIR/agents"
    node "$RESOLVER" agente-pi "$archivo" > "$destino"
    node "$RAIZ/adapters/pi/install-termination.mjs" "$destino" "$RAIZ/adapters/pi/termination.mjs"
    registrar archivo "$destino"
  fi
  echo "  agente generado: $destino (modelo: $modelo)"
}
