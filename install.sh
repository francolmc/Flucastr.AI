#!/usr/bin/env bash
# Instala Flucastr.AI en Claude Code, Pi y Codex.
# Uso: bash install.sh [--dry-run] [--copy] [--only claude|pi|codex] [--project <ruta> [--agent <nombre>]] [--project-skills]
#      bash install.sh --migrate <ruta> [--dry-run]   pasa un proyecto de la v1 a la v2 (solo ese proyecto, Claude Code)
#      bash install.sh --migrate-names <ruta> [--dry-run]   renombra el vocabulario viejo de un proyecto al nuevo (idempotente)
#   --copy: copia las skills (carpetas reales) en vez de enlazarlas, y usa un models.json personal
#             en ~/.flucastr-ai/models.json (o en $FLUCASTR_MODELOS si está definida). Modo "descarga".
#   Sin --copy: enlaza las skills al repo (modo "repo").
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash install.sh" >&2
  exit 1
fi
set -euo pipefail

mostrar_ayuda() {
  cat <<'AYUDA'
Uso
  bash install.sh [opciones]
  bash install.sh --migrate <ruta> [--dry-run]
  bash install.sh --migrate-names <ruta> [--dry-run]

Opciones
  --dry-run                 Muestra las acciones sin escribir archivos.
  --copy                  Copia las skills en vez de enlazarlas (modo descarga).
  --only claude|pi|codex    Limita la instalación a Claude Code, Pi o Codex; no instala herramientas.
  --project <ruta>         Además de la instalación global, configura el proyecto para Claude Code
                            si se detecta, y fija su agente predeterminado. Con Codex, escribe
                            .codex/rules/flucastr.rules (reglas deny; Codex las carga solo en proyectos
                            de confianza y son experimentales).
  --agent <nombre>         Elige el agente predeterminado del proyecto; por defecto, planner.
                            No filtra los agentes globales.
  --project-skills         Copia skills en <ruta>/.pi/skills; requiere --project y no se combina
                            con --only claude. Las copias se regeneran al reinstalar.
  --migrate <ruta>           Migra ese proyecto de v1 a v2: solo Claude Code, conserva v1 en
                            old/v1/ y no hace la instalación global.
  --migrate-names <ruta>     Renombra en ese proyecto cambios/ a changes/ (hechos/ a done/), las
                            claves y secciones de los planes en curso y el agente predeterminado
                            de Claude Code. Idempotente; no hace commit ni toca old/.
  -h, --help                Muestra esta ayuda.

Restricciones
  --migrate y --migrate-names admiten --dry-run; no se combinan con --project, --project-skills,
  --copy, --only ni --agent, ni entre sí.
  --project-skills no se combina con --only claude ni --only codex.
  Las herramientas se detectan automáticamente; --only solo filtra cuáles configurar.
  Sin --copy, las skills se enlazan al repositorio (modo repo). Con --copy, se copian
  (modo descarga). Para cambiar de modo, desinstala antes.

Entorno y rutas
  --copy usa FLUCASTR_MODELOS si está definida; si no, usa
  ~/.flucastr-ai/models.json. En modo repo se usan los modelos del repositorio.
  PI_CODING_AGENT_DIR cambia la ruta de Pi; por defecto es ~/.pi/agent.
  Claude Code usa ~/.claude. Codex usa CODEX_HOME o, si no está, ~/.codex: los agentes van
  a <CODEX_HOME>/agents/<agente>.toml y las skills a ~/.agents/skills.
  Los lanzadores claude-<agente>, pi-<agente> y codex-<agente> (y kit-run, con Codex) se crean en
  ~/.local/bin; agrega esa carpeta al PATH para invocarlos.

Ejemplos
  bash install.sh
  bash install.sh --dry-run
  bash install.sh --copy
  bash install.sh --only pi
  bash install.sh --project "/ruta/mi proyecto" --agent builder
  bash install.sh --only pi --project "/ruta/mi proyecto" --project-skills
  bash install.sh --migrate "/ruta/mi proyecto" --dry-run
  bash install.sh --migrate-names "/ruta/mi proyecto" --dry-run
AYUDA
}

RAIZ="$(cd "$(dirname "$0")" && pwd)"
RESOLVER="$RAIZ/scripts/resolver.mjs"
CLAUDE_DIR="$HOME/.claude"
PI_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
CODEX_DIR="${CODEX_HOME:-$HOME/.codex}"
CODEX_SKILLS="$HOME/.agents/skills"
BIN_DIR="$HOME/.local/bin"
ESTADO_DIR="$HOME/.flucastr-ai"
MANIFIESTO="$ESTADO_DIR/manifiesto.txt"

SIMULAR=0
MODO=repo
SOLO=""
PROYECTO=""
AGENTE="planner"
SKILLS_PROYECTO=0
MIGRAR=""
MIGRAR_NOMBRES=""
AGENTE_DADO=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) SIMULAR=1 ;;
    --migrate)
      shift
      MIGRAR="${1:-}"
      [ -d "$MIGRAR" ] || { echo "--migrate necesita una carpeta que exista" >&2; exit 1; }
      MIGRAR="$(cd "$MIGRAR" && pwd)"
      ;;
    --migrate-names)
      shift
      MIGRAR_NOMBRES="${1:-}"
      [ -d "$MIGRAR_NOMBRES" ] || { echo "--migrate-names necesita una carpeta que exista" >&2; exit 1; }
      MIGRAR_NOMBRES="$(cd "$MIGRAR_NOMBRES" && pwd)"
      ;;
    --copy) MODO=descarga ;;
    --only)
      shift
      SOLO="${1:-}"
      case "$SOLO" in
        claude | pi | codex) ;;
        *) echo "--only acepta: claude, pi o codex" >&2; exit 1 ;;
      esac
      ;;
    --project)
      shift
      PROYECTO="${1:-}"
      [ -d "$PROYECTO" ] || { echo "--project necesita una carpeta que exista" >&2; exit 1; }
      PROYECTO="$(cd "$PROYECTO" && pwd)"
      ;;
    --agent)
      shift
      AGENTE="${1:-}"
      AGENTE_DADO=1
      ;;
    --project-skills) SKILLS_PROYECTO=1 ;;
    -h | --help) mostrar_ayuda; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
  shift
done

# Validación del flag: antes de escribir nada.
if [ "$SKILLS_PROYECTO" = 1 ]; then
  [ -n "$PROYECTO" ] || { echo "--project-skills necesita --project <ruta>" >&2; exit 1; }
  { [ "$SOLO" != claude ] && [ "$SOLO" != codex ]; } || { echo "--project-skills no se combina con --only claude ni --only codex" >&2; exit 1; }
fi

command -v node >/dev/null 2>&1 || { echo "Falta node: se usa para leer models.json." >&2; exit 1; }
[ -f "$RAIZ/models.json" ] || { echo "No encuentro models.json en $RAIZ" >&2; exit 1; }
[ -f "$RAIZ/core/agents/$AGENTE.md" ] || { echo "No existe el agente '$AGENTE' en core/agents/" >&2; exit 1; }

# --- Migración v1 -> v2 (--migrate <ruta>): ver changes/migrar-v1-v2/plan.md ---
# Solo el proyecto y solo Claude Code: no toca ~/.claude ni ~/.pi. Va antes de cualquier paso de la instalación
# y termina con su propia salida. Nada se borra: lo de v1 se mueve a <proyecto>/old/v1/.
MIG_TMP=""
MIG_MAN=""

source "$RAIZ/tools/install/migration/manifest.sh"

source "$RAIZ/adapters/claude-code/migrate-agent-hook.sh"

source "$RAIZ/adapters/claude-code/migrate-policy.sh"

source "$RAIZ/tools/install/migration/inspect-project.sh"

source "$RAIZ/tools/install/migration/run.sh"

source "$RAIZ/tools/install/migration/names.sh"

# --migrate-names <ruta> [--dry-run]: renombra el vocabulario de un proyecto; va antes de --migrate.
if [ -n "$MIGRAR_NOMBRES" ]; then
  [ -z "$PROYECTO" ] && [ "$SKILLS_PROYECTO" = 0 ] && [ "$MODO" = repo ] && [ -z "$SOLO" ] && [ "$AGENTE_DADO" = 0 ] && [ -z "$MIGRAR" ] \
    || { echo "--migrate-names no se combina con --project, --project-skills, --copy, --only, --agent ni --migrate" >&2; exit 1; }
  nombres_migrar "$MIGRAR_NOMBRES"
  exit $?
fi

if [ -n "$MIGRAR" ]; then
  [ -z "$PROYECTO" ] && [ "$SKILLS_PROYECTO" = 0 ] && [ "$MODO" = repo ] && [ -z "$SOLO" ] && [ "$AGENTE_DADO" = 0 ] \
    || { echo "--migrate solo trabaja sobre el proyecto con Claude Code: no se combina con --project, --project-skills, --copy, --only ni --agent" >&2; exit 1; }
  PROYECTO="$MIGRAR"
  migrar
  exit $?
fi

# Una instalación no cambia de modo sin desinstalar antes. Solo lee el manifiesto; va antes de cualquier escritura.
# Un manifiesto sin línea «modo» es de modo repo.
if [ -f "$MANIFIESTO" ]; then
  IFS=$'\t' read -r p_tipo p_valor _ < "$MANIFIESTO" || true
  MODO_ANTERIOR=repo
  if [ "${p_tipo:-}" = modo ]; then MODO_ANTERIOR="${p_valor:-repo}"; fi
  if [ "$MODO_ANTERIOR" != "$MODO" ]; then
    echo "Hay una instalación en modo $MODO_ANTERIOR; ejecuta uninstall.sh antes de cambiar de modo." >&2
    exit 1
  fi
fi

# models.json personal (solo modo descarga). Se crea si falta y nunca se sobrescribe.
# Con --dry-run no se crea nada: se valida contra el del repo.
MODELOS=""
if [ "$MODO" = descarga ]; then
  MODELOS="${FLUCASTR_MODELOS:-$ESTADO_DIR/models.json}"
  if [ ! -f "$MODELOS" ]; then
    if [ "$SIMULAR" = 0 ]; then
      mkdir -p "$(dirname "$MODELOS")"
      cp "$RAIZ/models.json" "$MODELOS"
      echo "models.json personal creado: $MODELOS"
    else
      echo "SIMULACIÓN: se creará $MODELOS a partir de $RAIZ/models.json"
      MODELOS="$RAIZ/models.json"
    fi
  fi
  export FLUCASTR_MODELOS="$MODELOS"
else
  # sin --copy no se usa ningún models.json personal, aunque el shell lo tenga definido
  unset FLUCASTR_MODELOS
fi

# Decide primero qué herramientas se instalarán y valida todo antes de tocar
# la instalación anterior o cualquier destino.
INSTALAR_CLAUDE=0
INSTALAR_PI=0
INSTALAR_CODEX=0
if { [ -z "$SOLO" ] || [ "$SOLO" = claude ]; } && { [ -d "$CLAUDE_DIR" ] || command -v claude >/dev/null 2>&1; }; then INSTALAR_CLAUDE=1; fi
if { [ -z "$SOLO" ] || [ "$SOLO" = pi ]; } && { [ -d "$PI_DIR" ] || command -v pi >/dev/null 2>&1; }; then INSTALAR_PI=1; fi
if { [ -z "$SOLO" ] || [ "$SOLO" = codex ]; } && { [ -d "$CODEX_DIR" ] || command -v codex >/dev/null 2>&1; }; then INSTALAR_CODEX=1; fi

for f in "$RAIZ"/core/agents/*.md; do
  [ -f "$f" ] || continue
  nombre="$(basename "$f" .md)"
  if [ "$INSTALAR_CLAUDE" = 1 ]; then
    node "$RESOLVER" agente-claude "$f" >/dev/null
  fi
  if [ "$INSTALAR_PI" = 1 ]; then
    node "$RESOLVER" agente-pi "$f" >/dev/null
  fi
  if [ "$INSTALAR_CODEX" = 1 ]; then
    node "$RESOLVER" agente-codex "$f" >/dev/null
  fi
done

# Registro de lo que se crea, para que uninstall.sh borre exactamente eso.
# Formato por línea: tipo <TAB> ruta <TAB> dato extra (opcional)
NUEVO="$(mktemp)"
source "$RAIZ/tools/install/manifest.sh"
source "$RAIZ/tools/install/links.sh"
source "$RAIZ/tools/install/skills.sh"
trap guardar_manifiesto EXIT

# Skills de Pi dentro del proyecto (--project-skills): carpetas reales en <proyecto>/.pi/skills/, sin enlaces.
SIN_GIT_AVISADO=0

source "$RAIZ/tools/install/project-skills.sh"

source "$RAIZ/adapters/claude-code/install-agent.sh"
source "$RAIZ/adapters/pi/install-agent.sh"

source "$RAIZ/adapters/pi/install-launcher.sh"

source "$RAIZ/adapters/claude-code/install-launcher.sh"

source "$RAIZ/adapters/codex/install-agent.sh"

source "$RAIZ/adapters/codex/install-launcher.sh"

# kit-run: lanza al builder sin interfaz y revisa al final (scripts/kit-run.mjs). Va con Codex (tramo 2 de kit-run).
source "$RAIZ/tools/install/kit-run-launcher.sh"

source "$RAIZ/adapters/codex/install-rules.sh"

source "$RAIZ/adapters/pi/install-compaction.sh"

source "$RAIZ/adapters/claude-code/install-project-agent.sh"

source "$RAIZ/adapters/claude-code/install-compaction.sh"

source "$RAIZ/adapters/claude-code/install-permission-hook.sh"

source "$RAIZ/adapters/claude-code/install-task-hook.sh"

# Reglas deny del proyecto en Claude Code (<proyecto>/.claude/settings.json, compartido: va a git). Solo agrega las que faltan;
# el manifiesto registra solo las que agrega (una línea deny por regla), así uninstall.sh nunca quita lo que ya tenía el usuario.
# Si el resolver falla (JSON inválido, permissions con otro tipo), avisa y sigue: no aborta la instalación.
source "$RAIZ/adapters/claude-code/install-rules.sh"

source "$RAIZ/adapters/claude-code/install-sandbox.sh"

# Primera línea del manifiesto: el modo con el que se instaló (lo leen uninstall.sh y la comprobación de modo).
registrar modo "$MODO"

# Proyectos registrados con skills-proyecto: se leen antes de quitar la instalación anterior (uninstall.sh borra
# el manifiesto). No se copian a $NUEVO: su línea la escribe registrar al reinstalar. Lista separada por saltos de línea.
PROYECTOS_REGISTRADOS=""
if [ -f "$MANIFIESTO" ]; then
  while IFS=$'\t' read -r p_tipo p_ruta _; do
    if [ "${p_tipo:-}" = skills-proyecto ] && [ -n "${p_ruta:-}" ]; then
      PROYECTOS_REGISTRADOS+="$p_ruta"$'\n'
    fi
  done < "$MANIFIESTO"
fi

# Reglas de Codex de proyectos registrados (líneas codex-reglas): se leen antes de quitar la instalación anterior,
# para refrescarlas tras instalar Codex. Lista separada por saltos de línea.
REGLAS_CODEX_REGISTRADAS=""
if [ -f "$MANIFIESTO" ]; then
  while IFS=$'\t' read -r p_tipo p_ruta _; do
    if [ "${p_tipo:-}" = codex-reglas ] && [ -n "${p_ruta:-}" ]; then
      REGLAS_CODEX_REGISTRADAS+="$p_ruta"$'\n'
    fi
  done < "$MANIFIESTO"
fi

# Quita primero lo instalado antes, para que no queden restos de skills o agentes borrados del repo.
# Los ajustes de proyectos se conservan: se pasan tal cual al registro nuevo.
if [ "$SIMULAR" = 0 ] && [ -f "$MANIFIESTO" ]; then
  echo "Quitando la instalación anterior..."
  grep -E "^ajuste$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  grep -E "^compactacion$(printf '\t')[^$(printf '\t')]*$(printf '\t')claude:" "$MANIFIESTO" >> "$NUEVO" || true
  grep -E "^hook$(printf '\t')[^$(printf '\t')]*$(printf '\t')claude$" "$MANIFIESTO" >> "$NUEVO" || true
  grep -E "^deny$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  grep -E "^sandbox-claude$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  grep -E "^codex-reglas$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  bash "$RAIZ/uninstall.sh" --quiet --keep-settings
fi

if [ "$SIMULAR" = 1 ]; then echo "SIMULACIÓN: no se escribe nada."; fi

# Raíz del kit: el coordinador la usa para llegar a scripts/ desde cualquier proyecto.
# Se escribe en ambos modos.
if [ "$SIMULAR" = 1 ]; then
  echo "SIMULACIÓN: se escribirá $ESTADO_DIR/raiz"
else
  mkdir -p "$ESTADO_DIR"
  printf '%s\n' "$RAIZ" > "$ESTADO_DIR/raiz"
  registrar raiz "$ESTADO_DIR/raiz"
  echo "  raíz del kit: $ESTADO_DIR/raiz ($RAIZ)"
fi

if [ "$INSTALAR_CLAUDE" = 1 ]; then
  echo "Claude Code ($CLAUDE_DIR)"
  echo "  AVISO: reglas allow globales amplias pueden autorizar comandos; comandos excluidos del sandbox, hooks y servidores MCP operan fuera de él. Revisa la configuración efectiva."
  instalar_skills "$CLAUDE_DIR/skills"
  for f in "$RAIZ"/core/agents/*.md; do
    [ -f "$f" ] && generar_agente_claude "$f"
    [ -f "$f" ] && generar_lanzador_claude "$f"
  done
  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) echo "  AVISO: $BIN_DIR no está en tu PATH; agrégalo para usar los comandos claude-<agente>." ;;
  esac
  if [ -n "$PROYECTO" ]; then
    echo "Proyecto ($PROYECTO)"
    fijar_agente_proyecto
    instalar_deny_claude
    instalar_sandbox_claude
    instalar_compactacion_claude
    instalar_hook_permisos_claude
    # v2: sin hook del validador de tareas (era de v1; ver legacy/v1/).
  fi
else
  echo "Claude Code: no encontrado, se omite."
  if [ -n "$PROYECTO" ]; then echo "  (--project necesita Claude Code; no se fijó el agente)"; fi
fi

if [ "$INSTALAR_PI" = 1 ]; then
  echo "Pi ($PI_DIR)"
  echo "  AVISO: Pi no tiene protecciones equivalentes de sandbox ni reglas deny en este kit."
  instalar_skills "$PI_DIR/skills"
  for f in "$RAIZ"/core/agents/*.md; do
    [ -f "$f" ] && generar_agente_pi "$f"
    [ -f "$f" ] && generar_lanzador_pi "$f"
  done
  instalar_compactacion_pi
  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) echo "  AVISO: $BIN_DIR no está en tu PATH; agrégalo para usar los comandos pi-<agente>." ;;
  esac
else
  echo "Pi: no encontrado, se omite."
fi

if [ "$INSTALAR_CODEX" = 1 ]; then
  echo "Codex ($CODEX_DIR)"
  echo "  AVISO: los deny de Codex son reglas de prefijo experimentales; no bloquean la lectura general de .env. La configuración global y MCP pueden ampliar el acceso."
  instalar_skills "$CODEX_SKILLS"
  for f in "$RAIZ"/core/agents/*.md; do
    [ -f "$f" ] && generar_agente_codex "$f"
    [ -f "$f" ] && generar_lanzador_codex "$f"
  done
  generar_lanzador_kit_run
  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) echo "  AVISO: $BIN_DIR no está en tu PATH; agrégalo para usar los comandos codex-<agente> y kit-run." ;;
  esac
  if [ -n "$PROYECTO" ]; then
    echo "Proyecto ($PROYECTO), Codex"
    instalar_deny_codex
  else
    refrescar_reglas_codex_registradas
  fi
else
  echo "Codex: no encontrado, se omite."
  if [ -n "$PROYECTO" ]; then echo "  (--project no fijó reglas de Codex: Codex no está instalado)"; fi
fi

if [ "$SKILLS_PROYECTO" = 1 ]; then
  echo
  echo "Skills de Pi en el proyecto ($PROYECTO)"
  instalar_skills_proyecto
  echo "  Las copias en .pi/skills/ no se editan: se rehacen al reinstalar. Pi pedirá confiar en el proyecto (/trust)."
fi

# Proyectos registrados con skills-proyecto: se rehacen en cada instalación (con --only claude o codex, no).
# Si no hay ninguno, no se imprime nada.
if [ -n "$PROYECTOS_REGISTRADOS" ]; then
  ANTERIOR_PROYECTO="$PROYECTO"
  if [ -n "$SOLO" ] && [ "$SOLO" != pi ]; then
    echo
    echo "  (proyectos con skills registradas no se actualizan con --only $SOLO)"
  fi
  while IFS= read -r ruta; do
    [ -n "$ruta" ] || continue
    if [ -n "$SOLO" ] && [ "$SOLO" != pi ]; then
      # solo se conserva el registro; el proyecto no se toca
      if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'skills-proyecto\t%s\t' "$ruta")" "$NUEVO"; then
        registrar skills-proyecto "$ruta"
      fi
      continue
    fi
    # ya procesado arriba, con --project-skills
    if [ "$SKILLS_PROYECTO" = 1 ] && [ "$ruta" = "$ANTERIOR_PROYECTO" ]; then continue; fi
    if [ -d "$ruta" ]; then
      echo
      echo "Skills de Pi en el proyecto registrado ($ruta)"
      PROYECTO="$ruta"
      instalar_skills_proyecto
    else
      echo "  AVISO: el proyecto registrado ya no existe, se omite (registro conservado): $ruta"
      if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'skills-proyecto\t%s\t' "$ruta")" "$NUEVO"; then
        registrar skills-proyecto "$ruta"
      fi
    fi
  done <<< "$PROYECTOS_REGISTRADOS"
  PROYECTO="$ANTERIOR_PROYECTO"
fi

echo
echo "Listo. Reinicia Claude Code y Pi."
echo "  Claude Code: claude --agent planner   (o fijarlo en un proyecto: bash install.sh --project <ruta>)"
echo "  Pi:          pi-planner"
if [ "$INSTALAR_CODEX" = 1 ]; then echo "  Codex:       codex-planner (o el agente como rol: ~/.codex/agents)"; fi
echo "Si cambias models.json, vuelve a correr: bash install.sh"
