#!/usr/bin/env bash
# Instala Flucastr.AI en Claude Code y Pi.
# Uso: bash instalar.sh [--simular] [--solo claude|pi] [--proyecto <ruta> [--agente <nombre>]]
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash instalar.sh" >&2
  exit 1
fi
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
RESOLVER="$RAIZ/scripts/resolver.mjs"
CLAUDE_DIR="$HOME/.claude"
PI_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
BIN_DIR="$HOME/.local/bin"
ESTADO_DIR="$HOME/.flucastr-ai"
MANIFIESTO="$ESTADO_DIR/manifiesto.txt"

SIMULAR=0
SOLO=""
PROYECTO=""
AGENTE="arquitecto"
while [ $# -gt 0 ]; do
  case "$1" in
    --simular) SIMULAR=1 ;;
    --solo)
      shift
      SOLO="${1:-}"
      case "$SOLO" in
        claude | pi) ;;
        *) echo "--solo acepta: claude o pi" >&2; exit 1 ;;
      esac
      ;;
    --proyecto)
      shift
      PROYECTO="${1:-}"
      [ -d "$PROYECTO" ] || { echo "--proyecto necesita una carpeta que exista" >&2; exit 1; }
      PROYECTO="$(cd "$PROYECTO" && pwd)"
      ;;
    --agente)
      shift
      AGENTE="${1:-}"
      ;;
    -h | --help) sed -n '2,3p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
  shift
done

command -v node >/dev/null 2>&1 || { echo "Falta node: se usa para leer modelos.json." >&2; exit 1; }
[ -f "$RAIZ/modelos.json" ] || { echo "No encuentro modelos.json en $RAIZ" >&2; exit 1; }
[ -f "$RAIZ/agentes/$AGENTE.md" ] || { echo "No existe el agente '$AGENTE' en agentes/" >&2; exit 1; }

# Decide primero qué herramientas se instalarán y valida todo antes de tocar
# la instalación anterior o cualquier destino.
INSTALAR_CLAUDE=0
INSTALAR_PI=0
if [ "$SOLO" != "pi" ] && { [ -d "$CLAUDE_DIR" ] || command -v claude >/dev/null 2>&1; }; then INSTALAR_CLAUDE=1; fi
if [ "$SOLO" != "claude" ] && { [ -d "$PI_DIR" ] || command -v pi >/dev/null 2>&1; }; then INSTALAR_PI=1; fi

for f in "$RAIZ"/agentes/*.md; do
  [ -f "$f" ] || continue
  nombre="$(basename "$f" .md)"
  if [ "$INSTALAR_CLAUDE" = 1 ]; then
    node "$RESOLVER" agente-claude "$f" >/dev/null
  fi
  if [ "$INSTALAR_PI" = 1 ]; then
    node "$RESOLVER" agente-pi "$f" >/dev/null
  fi
done

# Registro de lo que se crea, para que desinstalar.sh borre exactamente eso.
# Formato por línea: tipo <TAB> ruta <TAB> dato extra (opcional)
NUEVO="$(mktemp)"
guardar_manifiesto() {
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$ESTADO_DIR"
    cp "$NUEVO" "$MANIFIESTO"
  fi
  rm -f "$NUEVO"
}
trap guardar_manifiesto EXIT

registrar() { # tipo ruta [extra]
  if [ "$SIMULAR" = 0 ]; then
    printf '%s\t%s\t%s\n' "$1" "$2" "${3:-}" >> "$NUEVO"
  fi
}

enlazar() { # origen destino
  local origen="$1" destino="$2" actual
  if [ -L "$destino" ]; then
    actual="$(readlink "$destino")"
    if [ "$actual" = "$origen" ]; then
      echo "  ya enlazado: $destino"
      registrar enlace "$destino"
    else
      echo "  OMITIDO (es un enlace a otro lugar): $destino -> $actual"
    fi
    return
  fi
  if [ -e "$destino" ]; then
    echo "  OMITIDO (ya existe y no es un enlace): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$(dirname "$destino")"
    ln -s "$origen" "$destino"
    registrar enlace "$destino"
  fi
  echo "  enlazado: $destino"
}

enlazar_skills() { # carpeta destino de skills
  local base="$1" s n
  for s in "$RAIZ"/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    enlazar "$RAIZ/skills/$n" "$base/$n"
  done
}

# Si el destino es un enlace a este repo (instalación manual anterior), lo quita para poder generar el archivo.
# Devuelve 0 si lo liberó (o lo liberaría, en simulación) y 1 si no era un enlace nuestro.
liberar() { # destino
  local destino="$1"
  if [ -L "$destino" ]; then
    case "$(readlink "$destino")" in
      "$RAIZ"/*)
        echo "  reemplazando enlace anterior: $destino"
        if [ "$SIMULAR" = 0 ]; then rm "$destino"; fi
        return 0
        ;;
    esac
  fi
  return 1
}

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
    registrar archivo "$destino"
  fi
  echo "  agente generado: $destino (modelo: $modelo)"
}

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
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
RAIZ="$RAIZ"
exec pi --model "\$(node "\$RAIZ/scripts/resolver.mjs" modelo $nombre pi)" \\
  --append-system-prompt "\$(node "\$RAIZ/scripts/resolver.mjs" cuerpo "\$RAIZ/agentes/$nombre.md")" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (modelo: $modelo)"
}

# Deja el agente como predeterminado de un proyecto, en su archivo de ajustes personal (no se sube a git).
fijar_agente_proyecto() {
  local ajustes="$PROYECTO/.claude/settings.local.json" resultado
  if [ "$SIMULAR" = 1 ]; then
    echo "  fijaría el agente '$AGENTE' como predeterminado en: $ajustes"
    return
  fi
  resultado="$(node "$RESOLVER" fijar-agente "$ajustes" "$AGENTE")"
  case "$resultado" in
    fijado)
      echo "  agente predeterminado fijado: $ajustes -> $AGENTE"
      registrar ajuste "$ajustes" "$AGENTE"
      ;;
    ya-estaba) echo "  ya estaba fijado: $ajustes" ;;
    omitido:*) echo "  OMITIDO (el proyecto ya define otro agente predeterminado: ${resultado#omitido:}): $ajustes" ;;
  esac
}

# Quita primero lo instalado antes, para que no queden restos de skills o agentes borrados del repo.
# Los ajustes de proyectos se conservan: se pasan tal cual al registro nuevo.
if [ "$SIMULAR" = 0 ] && [ -f "$MANIFIESTO" ]; then
  echo "Quitando la instalación anterior..."
  grep -E "^ajuste$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  bash "$RAIZ/desinstalar.sh" --silencioso --conservar-ajustes
fi

if [ "$SIMULAR" = 1 ]; then echo "SIMULACIÓN: no se escribe nada."; fi

if [ "$INSTALAR_CLAUDE" = 1 ]; then
  echo "Claude Code ($CLAUDE_DIR)"
  enlazar_skills "$CLAUDE_DIR/skills"
  for f in "$RAIZ"/agentes/*.md; do
    [ -f "$f" ] && generar_agente_claude "$f"
  done
  if [ -n "$PROYECTO" ]; then
    echo "Proyecto ($PROYECTO)"
    fijar_agente_proyecto
  fi
else
  echo "Claude Code: no encontrado, se omite."
  if [ -n "$PROYECTO" ]; then echo "  (--proyecto necesita Claude Code; no se fijó el agente)"; fi
fi

if [ "$INSTALAR_PI" = 1 ]; then
  echo "Pi ($PI_DIR)"
  enlazar_skills "$PI_DIR/skills"
  for f in "$RAIZ"/agentes/*.md; do
    [ -f "$f" ] && generar_agente_pi "$f"
    [ -f "$f" ] && generar_lanzador_pi "$f"
  done
  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) echo "  AVISO: $BIN_DIR no está en tu PATH; agrégalo para usar los comandos pi-<agente>." ;;
  esac
else
  echo "Pi: no encontrado, se omite."
fi

echo
echo "Listo. Reinicia Claude Code y Pi."
echo "  Claude Code: claude --agent arquitecto   (o fijarlo en un proyecto: bash instalar.sh --proyecto <ruta>)"
echo "  Pi:          pi-arquitecto"
echo "Si cambias modelos.json, vuelve a correr: bash instalar.sh"
