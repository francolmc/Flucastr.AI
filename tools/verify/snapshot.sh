# Instantánea de lo que instalar.sh escribe: cada ruta vigilada (sin seguir enlaces),
# el destino de cada enlace simbólico y el hash de cada archivo (siguiendo enlaces).
# Las rutas salen de $HOME, PI_CODING_AGENT_DIR y CODEX_HOME al llamarla. Las que no existen cuentan como vacías.
instantanea() {
  local base="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}" r lista=""
  for r in "$HOME/.claude/agents" "$HOME/.claude/skills" "$base/agents" "$base/skills" "${CODEX_HOME:-$HOME/.codex}/agents" "$HOME/.agents/skills" "$HOME"/.local/bin/pi-* "$HOME"/.local/bin/codex-*; do
    if [ -e "$r" ] || [ -L "$r" ]; then lista="$lista$r"$'\n'; fi
  done
  {
    printf '%s' "$lista" | while IFS= read -r r; do find "$r" -print; done | sed 's/^/ruta /'
    printf '%s' "$lista" | while IFS= read -r r; do
      find "$r" -type l -print0 | while IFS= read -r -d '' l; do echo "enlace $l -> $(readlink "$l")"; done
    done
    printf '%s' "$lista" | while IFS= read -r r; do find -L "$r" -type f -exec shasum {} +; done | sed 's/^/hash /'
  } | sort
}

# 5a. autoprueba de la instantánea en un HOME temporal (siempre corre). Subshell: el temporal se borra al salir.
autoprueba_5a() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  unset PI_CODING_AGENT_DIR
  export HOME="$tmp"
  mkdir -p "$HOME/.claude/agents" "$HOME/.claude/skills" "$HOME/.pi/agent/agents" "$HOME/.pi/agent/skills" "$HOME/.local/bin" "$HOME/.codex/agents" "$HOME/.agents/skills"

  # (i) añadir un archivo en cada ruta vigilada, de a uno: la instantánea debe cambiar
  previa=$(instantanea) || exit 1
  for destino in .claude/agents .claude/skills .pi/agent/agents .pi/agent/skills .codex/agents .agents/skills .local/bin; do
    f=prueba.md
    if [ "$destino" = .local/bin ]; then f=pi-prueba; fi
    echo a > "$HOME/$destino/$f"
    nueva=$(instantanea) || exit 1
    [ "$nueva" != "$previa" ] || { echo "FALLO: autoprueba: añadir $destino/$f no cambió la instantánea" >&2; exit 1; }
    previa=$nueva
  done

  # (ii) cambiar el contenido de un archivo existente: la instantánea debe cambiar
  echo b > "$HOME/.claude/agents/prueba.md"
  nueva=$(instantanea) || exit 1
  [ "$nueva" != "$previa" ] || { echo "FALLO: autoprueba: cambiar .claude/agents/prueba.md no cambió la instantánea" >&2; exit 1; }
  previa=$nueva

  # (iii) transcripts nuevos y history.jsonl modificado: la instantánea NO debe cambiar
  echo '{}' > "$HOME/.claude/history.jsonl"
  previa=$(instantanea) || exit 1
  mkdir -p "$HOME/.claude/projects/x"
  echo '{}' > "$HOME/.claude/projects/x/transcript.jsonl"
  echo '{"n":2}' >> "$HOME/.claude/history.jsonl"
  nueva=$(instantanea) || exit 1
  [ "$nueva" = "$previa" ] || { echo "FALLO: autoprueba: transcripts o history.jsonl alteraron la instantánea" >&2; exit 1; }

  echo "ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history"
)
