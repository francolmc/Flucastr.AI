# Workspace: si la raíz tiene repos hijos con .git, los lista; si la raíz no es repo, lo dice. Sin hijos, no imprime nada.
mig_workspace() {
  local g hijos="" h
  while IFS= read -r g; do
    h="$(basename "$(dirname "$g")")"
    hijos="${hijos:+$hijos, }$h"
  done < <(find "$PROYECTO" -maxdepth 2 -name .git -not -path "$PROYECTO/.git" 2>/dev/null | sort)
  if [ -z "$hijos" ]; then return 0; fi
  echo "Workspace: repos hijos: $hijos"
  if [ ! -e "$PROYECTO/.git" ]; then
    echo "La raíz no es repo: la skill migrate-project te preguntará si la hacemos repo propio (este script no la crea)"
  fi
  return 0
}

# .gitignore del proyecto: agrega .claude/settings.local.json una sola vez (comparación exacta).
mig_gitignore() {
  local gi="$PROYECTO/.gitignore" linea=".claude/settings.local.json" prefijo=""
  if [ "$SIMULAR" = 1 ]; then prefijo="(simulación) "; fi
  if [ -f "$gi" ] && grep -qxF "$linea" "$gi"; then
    echo "  ${prefijo}.gitignore ya ignora $linea ($gi)"
    return 0
  fi
  if [ "$SIMULAR" = 1 ]; then
    echo "  (simulación) agregaría $linea a $gi"
    return 0
  fi
  if [ -s "$gi" ] && [ -n "$(tail -c1 "$gi")" ]; then printf '\n' >> "$gi"; fi
  printf '%s\n' "$linea" >> "$gi"
  echo "  agregada $linea a $gi"
  return 0
}

# Aviso si el AGENTS.md de la raíz sigue siendo de v1 (menciona definitions/, features/ o registro/).
mig_aviso_agents() {
  if [ -f "$PROYECTO/AGENTS.md" ] && grep -qE 'definitions/|features/|registro/' "$PROYECTO/AGENTS.md"; then
    echo "AVISO: AGENTS.md sigue siendo de v1 y apunta a rutas movidas: ejecuta la skill migrate-project"
  fi
  return 0
}

