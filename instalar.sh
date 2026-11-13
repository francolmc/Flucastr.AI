#!/usr/bin/env bash
# Instala Flucastr.AI en Claude Code, Pi y Codex.
# Uso: bash instalar.sh [--simular] [--copiar] [--solo claude|pi|codex] [--proyecto <ruta> [--agente <nombre>]] [--skills-proyecto]
#      bash instalar.sh --migrar <ruta> [--simular]   pasa un proyecto de la v1 a la v2 (solo ese proyecto, Claude Code)
#   --copiar: copia las skills (carpetas reales) en vez de enlazarlas, y usa un modelos.json personal
#             en ~/.flucastr-ai/modelos.json (o en $FLUCASTR_MODELOS si está definida). Modo "descarga".
#   Sin --copiar: enlaza las skills al repo (modo "repo").
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash instalar.sh" >&2
  exit 1
fi
set -euo pipefail

mostrar_ayuda() {
  cat <<'AYUDA'
Uso
  bash instalar.sh [opciones]
  bash instalar.sh --migrar <ruta> [--simular]

Opciones
  --simular                 Muestra las acciones sin escribir archivos.
  --copiar                  Copia las skills en vez de enlazarlas (modo descarga).
  --solo claude|pi|codex    Limita la instalación a Claude Code, Pi o Codex; no instala herramientas.
  --proyecto <ruta>         Además de la instalación global, configura el proyecto para Claude Code
                            si se detecta, y fija su agente predeterminado. Con Codex, escribe
                            .codex/rules/flucastr.rules (reglas deny; Codex las carga solo en proyectos
                            de confianza y son experimentales).
  --agente <nombre>         Elige el agente predeterminado del proyecto; por defecto, principal.
                            No filtra los agentes globales.
  --skills-proyecto         Copia skills en <ruta>/.pi/skills; requiere --proyecto y no se combina
                            con --solo claude. Las copias se regeneran al reinstalar.
  --migrar <ruta>           Migra ese proyecto de v1 a v2: solo Claude Code, conserva v1 en
                            old/v1/ y no hace la instalación global.
  -h, --help                Muestra esta ayuda.

Restricciones
  --migrar admite --simular; no se combina con --proyecto, --skills-proyecto, --copiar,
  --solo ni --agente.
  --skills-proyecto no se combina con --solo claude ni --solo codex.
  Las herramientas se detectan automáticamente; --solo solo filtra cuáles configurar.
  Sin --copiar, las skills se enlazan al repositorio (modo repo). Con --copiar, se copian
  (modo descarga). Para cambiar de modo, desinstala antes.

Entorno y rutas
  --copiar usa FLUCASTR_MODELOS si está definida; si no, usa
  ~/.flucastr-ai/modelos.json. En modo repo se usan los modelos del repositorio.
  PI_CODING_AGENT_DIR cambia la ruta de Pi; por defecto es ~/.pi/agent.
  Claude Code usa ~/.claude. Codex usa CODEX_HOME o, si no está, ~/.codex: los agentes van
  a <CODEX_HOME>/agents/<agente>.toml y las skills a ~/.agents/skills.
  Los lanzadores claude-<agente>, pi-<agente> y codex-<agente> (y kit-run, con Codex) se crean en
  ~/.local/bin; agrega esa carpeta al PATH para invocarlos.

Ejemplos
  bash instalar.sh
  bash instalar.sh --simular
  bash instalar.sh --copiar
  bash instalar.sh --solo pi
  bash instalar.sh --proyecto "/ruta/mi proyecto" --agente constructor
  bash instalar.sh --solo pi --proyecto "/ruta/mi proyecto" --skills-proyecto
  bash instalar.sh --migrar "/ruta/mi proyecto" --simular
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
AGENTE="principal"
SKILLS_PROYECTO=0
MIGRAR=""
AGENTE_DADO=0
while [ $# -gt 0 ]; do
  case "$1" in
    --simular) SIMULAR=1 ;;
    --migrar)
      shift
      MIGRAR="${1:-}"
      [ -d "$MIGRAR" ] || { echo "--migrar necesita una carpeta que exista" >&2; exit 1; }
      MIGRAR="$(cd "$MIGRAR" && pwd)"
      ;;
    --copiar) MODO=descarga ;;
    --solo)
      shift
      SOLO="${1:-}"
      case "$SOLO" in
        claude | pi | codex) ;;
        *) echo "--solo acepta: claude, pi o codex" >&2; exit 1 ;;
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
      AGENTE_DADO=1
      ;;
    --skills-proyecto) SKILLS_PROYECTO=1 ;;
    -h | --help) mostrar_ayuda; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
  shift
done

# Validación del flag: antes de escribir nada.
if [ "$SKILLS_PROYECTO" = 1 ]; then
  [ -n "$PROYECTO" ] || { echo "--skills-proyecto necesita --proyecto <ruta>" >&2; exit 1; }
  { [ "$SOLO" != claude ] && [ "$SOLO" != codex ]; } || { echo "--skills-proyecto no se combina con --solo claude ni --solo codex" >&2; exit 1; }
fi

command -v node >/dev/null 2>&1 || { echo "Falta node: se usa para leer modelos.json." >&2; exit 1; }
[ -f "$RAIZ/modelos.json" ] || { echo "No encuentro modelos.json en $RAIZ" >&2; exit 1; }
[ -f "$RAIZ/agentes/$AGENTE.md" ] || { echo "No existe el agente '$AGENTE' en agentes/" >&2; exit 1; }

# --- Migración v1 -> v2 (--migrar <ruta>): ver cambios/migrar-v1-v2/plan.md ---
# Solo el proyecto y solo Claude Code: no toca ~/.claude ni ~/.pi. Va antes de cualquier paso de la instalación
# y termina con su propia salida. Nada se borra: lo de v1 se mueve a <proyecto>/old/v1/.
MIG_TMP=""
MIG_MAN=""

# Añade una línea al manifiesto temporal de la migración (sin duplicar). En simulación no hace nada.
mig_anotar() { # tipo ruta [dato]
  local linea
  if [ "$SIMULAR" = 1 ]; then return 0; fi
  linea="$(printf '%s\t%s\t%s' "$1" "$2" "${3:-}")"
  if [ ! -f "$MANIFIESTO" ] && [ ! -s "$MIG_MAN" ]; then printf 'modo\trepo\t\n' > "$MIG_MAN"; fi
  if grep -qxF "$linea" "$MIG_MAN"; then return 0; fi
  printf '%s\n' "$linea" >> "$MIG_MAN"
}

# Quita del manifiesto temporal las líneas de ese tipo y ruta (dato vacío = cualquiera). En simulación no hace nada.
mig_quitar() { # tipo ruta [dato]
  if [ "$SIMULAR" = 1 ]; then return 0; fi
  awk -F'\t' -v t="$1" -v r="$2" -v d="${3:-}" '!($1 == t && $2 == r && (d == "" || $3 == d))' "$MIG_MAN" > "$MIG_MAN.x"
  mv "$MIG_MAN.x" "$MIG_MAN"
}

# Agente predeterminado del proyecto: queda `principal`, aunque hubiera otro. $1: archivo de ajustes a usar.
mig_agente() {
  local arch="$1" real="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  if [ "$SIMULAR" = 1 ]; then prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-agente "$arch" principal --sobrescribir 2>&1)"; then
    echo "  AVISO: no se tocó $real ($salida)"
    return 0
  fi
  case "$salida" in
    fijado)
      echo "  ${prefijo}agente predeterminado fijado: principal ($real)"
      mig_quitar ajuste "$real"; mig_anotar ajuste "$real" principal
      ;;
    reemplazado:*)
      echo "  ${prefijo}agente predeterminado cambiado de ${salida#reemplazado:} a principal ($real)"
      mig_quitar ajuste "$real"; mig_anotar ajuste "$real" principal
      ;;
    ya-estaba) echo "  ${prefijo}el agente predeterminado ya es principal ($real)" ;;
    *) echo "  AVISO: resultado inesperado de fijar-agente ($salida)" ;;
  esac
  return 0
}

# Quita el hook del validador de v1 (solo la entrada exacta). $1: archivo de ajustes a usar.
mig_hook() {
  local arch="$1" real="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  if [ "$SIMULAR" = 1 ]; then prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" quitar-hook claude "$arch" 2>&1)"; then
    echo "  AVISO: no se tocó $real ($salida)"
    return 0
  fi
  case "$salida" in
    quitado)
      echo "  ${prefijo}hook de v1 quitado: $real"
      mig_quitar hook "$real" claude
      ;;
    archivo-quitado)
      echo "  ${prefijo}hook de v1 quitado; $real quedó vacío y se borra"
      mig_quitar hook "$real" claude
      ;;
    omitido) echo "  ${prefijo}sin hook de v1 que quitar: $real" ;;
    *) echo "  AVISO: resultado inesperado de quitar-hook ($salida)" ;;
  esac
  return 0
}

# Reglas deny de Claude Code del proyecto: las mismas que instala --proyecto (fijar-deny).
mig_deny() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea regla prefijo="" extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-deny claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  if [ "$salida" = ya-estaba ]; then
    echo "  ${prefijo}reglas deny de Claude Code ya estaban: $ajustes"
    return 0
  fi
  while IFS= read -r linea; do
    case "$linea" in
      agregada:*)
        regla="${linea#agregada:}"
        echo "  ${prefijo}regla deny de Claude Code agregada: $regla ($ajustes)"
        mig_anotar deny "$ajustes" "$regla"
        ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny claude ($linea)" ;;
    esac
  done <<< "$salida"
  return 0
}

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
    echo "La raíz no es repo: la skill migrar-proyecto te preguntará si la hacemos repo propio (este script no la crea)"
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
    echo "AVISO: AGENTS.md sigue siendo de v1 y apunta a rutas movidas: ejecuta la skill migrar-proyecto"
  fi
  return 0
}

migrar() {
  local base="$PROYECTO/old/v1" lista="" d es_git=0 raiz_v1="old/v1/" leer local_arch
  local medias t est abiertas
  if [ -e "$base" ] || [ -L "$base" ]; then
    echo "old/v1 ya existe en $PROYECTO: no se cambia nada (una migración anterior ya la hizo; revísala a mano si falta algo)."
    return 0
  fi
  for d in definitions features registro; do
    if [ -e "$PROYECTO/$d" ] || [ -L "$PROYECTO/$d" ]; then lista="$lista $d"; fi
  done
  if [ -z "$lista" ]; then
    echo "nada que migrar: $PROYECTO no tiene definitions/, features/ ni registro/."
    return 0
  fi

  MIG_TMP="$(mktemp -d)" || { echo "no pude crear un temporal" >&2; return 1; }
  trap 'rm -rf "$MIG_TMP"' EXIT
  MIG_MAN="$MIG_TMP/manifiesto.txt"
  if [ -f "$MANIFIESTO" ]; then cp "$MANIFIESTO" "$MIG_MAN"; else : > "$MIG_MAN"; fi
  cp "$MIG_MAN" "$MIG_TMP/manifiesto.original"
  if git -C "$PROYECTO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then es_git=1; fi

  if [ "$SIMULAR" = 1 ]; then
    echo "SIMULACIÓN: no se escribe nada. Esto es lo que haría:"
    raiz_v1=""
  else
    mkdir -p "$base"
  fi

  echo "Migrar $PROYECTO a la v2"
  mig_workspace
  echo "Mover a old/v1/ (nada se borra; src/ no se toca):"
  for d in $lista; do
    if [ "$SIMULAR" = 1 ]; then
      echo "  movería: $d -> old/v1/$d"
    elif [ "$es_git" = 1 ] && [ -n "$(git -C "$PROYECTO" ls-files -- "$d")" ]; then
      git -C "$PROYECTO" mv "$d" "old/v1/$d"
      echo "  movido (git mv): $d -> old/v1/$d"
    else
      mv "$PROYECTO/$d" "$base/$d"
      echo "  movido: $d -> old/v1/$d"
    fi
  done

  # En simulación el agente y el hook se calculan sobre una copia: el proyecto no cambia.
  local_arch="$PROYECTO/.claude/settings.local.json"
  if [ "$SIMULAR" = 1 ]; then
    mkdir -p "$MIG_TMP/local"
    if [ -f "$local_arch" ]; then cp "$local_arch" "$MIG_TMP/local/settings.local.json"; fi
    local_arch="$MIG_TMP/local/settings.local.json"
  fi
  echo "Claude Code (proyecto $PROYECTO):"
  mig_agente "$local_arch"
  mig_hook "$local_arch"
  mig_deny
  echo ".gitignore:"
  mig_gitignore

  if [ "$SIMULAR" = 1 ]; then
    echo "  crearía: $PROYECTO/cambios/"
  elif [ -d "$PROYECTO/cambios" ]; then
    echo "  ya existe: $PROYECTO/cambios/"
  else
    mkdir -p "$PROYECTO/cambios"
    echo "  creado: $PROYECTO/cambios/"
  fi

  # Trabajo a medias: solo se lista (no se convierte aquí). Con --simular se lee desde su sitio original.
  leer="$base"
  if [ "$SIMULAR" = 1 ]; then leer="$PROYECTO"; fi
  medias=""
  for t in "$leer"/features/*/task-*.md; do
    [ -f "$t" ] || continue
    est="$(sed -n 2p "$t" | grep -oE 'estado: *(aprobada|en curso|bloqueada)' | sed -E 's/^estado: *//' || true)"
    [ -n "$est" ] || continue
    medias="$medias  tarea $est: ${raiz_v1}features/$(basename "$(dirname "$t")")/$(basename "$t")"$'\n'
  done
  if [ -f "$leer/definitions/BACKLOG.md" ]; then
    abiertas="$(awk -F'|' -v p="$raiz_v1" '/^\| *F[0-9]+/ {
      id = $2; ft = $3; e = $8
      gsub(/^ +| +$/, "", id); gsub(/^ +| +$/, "", ft); gsub(/^ +| +$/, "", e)
      if (e != "hecha" && e != "completada") printf "  feature abierta: %s %s (estado: %s) [%sdefinitions/BACKLOG.md]\n", id, ft, e, p
    }' "$leer/definitions/BACKLOG.md")"
    if [ -n "$abiertas" ]; then medias="$medias$abiertas"$'\n'; fi
  fi
  echo "Trabajo a medias (solo se lista; no se convierte aquí):"
  if [ -n "$(printf '%s' "$medias" | grep .)" ]; then printf '%s\n' "$medias" | grep .; else echo "  ninguno"; fi
  mig_aviso_agents

  # El manifiesto solo cambia si algo se registró (real, no en simulación).
  if [ "$SIMULAR" = 0 ] && ! cmp -s "$MIG_MAN" "$MIG_TMP/manifiesto.original"; then
    mkdir -p "$ESTADO_DIR"
    cp "$MIG_MAN" "$MANIFIESTO"
  fi
  if [ "$SIMULAR" = 1 ]; then
    echo "SIMULACIÓN: no se escribió nada."
  else
    echo "Migración lista. Lo de v1 está en $PROYECTO/old/v1/ (sin borrar). Siguiente: skill migrar-proyecto (AGENTS.md, verify, planes)."
  fi
  return 0
}

if [ -n "$MIGRAR" ]; then
  [ -z "$PROYECTO" ] && [ "$SKILLS_PROYECTO" = 0 ] && [ "$MODO" = repo ] && [ -z "$SOLO" ] && [ "$AGENTE_DADO" = 0 ] \
    || { echo "--migrar solo trabaja sobre el proyecto con Claude Code: no se combina con --proyecto, --skills-proyecto, --copiar, --solo ni --agente" >&2; exit 1; }
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
    echo "Hay una instalación en modo $MODO_ANTERIOR; ejecuta desinstalar.sh antes de cambiar de modo." >&2
    exit 1
  fi
fi

# modelos.json personal (solo modo descarga). Se crea si falta y nunca se sobrescribe.
# Con --simular no se crea nada: se valida contra el del repo.
MODELOS=""
if [ "$MODO" = descarga ]; then
  MODELOS="${FLUCASTR_MODELOS:-$ESTADO_DIR/modelos.json}"
  if [ ! -f "$MODELOS" ]; then
    if [ "$SIMULAR" = 0 ]; then
      mkdir -p "$(dirname "$MODELOS")"
      cp "$RAIZ/modelos.json" "$MODELOS"
      echo "modelos.json personal creado: $MODELOS"
    else
      echo "SIMULACIÓN: se creará $MODELOS a partir de $RAIZ/modelos.json"
      MODELOS="$RAIZ/modelos.json"
    fi
  fi
  export FLUCASTR_MODELOS="$MODELOS"
else
  # sin --copiar no se usa ningún modelos.json personal, aunque el shell lo tenga definido
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

for f in "$RAIZ"/agentes/*.md; do
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

instalar_skills() { # carpeta destino de skills, según el modo
  if [ "$MODO" = descarga ]; then copiar_skills "$1"; else enlazar_skills "$1"; fi
}

# Modo descarga: copia cada skill como carpeta real y le pone la marca .flucastr-ai (la que desinstalar.sh exige).
copiar_skills() { # carpeta destino de skills
  local base="$1" s n destino
  for s in "$RAIZ"/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    destino="$base/$n"
    if [ -e "$destino" ] || [ -L "$destino" ]; then
      if [ -d "$destino" ] && [ ! -L "$destino" ] && [ -f "$destino/.flucastr-ai" ]; then
        # copia anterior de este kit: se reemplaza
        if [ "$SIMULAR" = 0 ]; then rm -rf "$destino"; fi
      else
        echo "  OMITIDO (ya existe y no es una copia de Flucastr.AI): $destino"
        continue
      fi
    fi
    if [ "$SIMULAR" = 0 ]; then
      mkdir -p "$base"
      cp -R "$RAIZ/skills/$n" "$destino"
      : > "$destino/.flucastr-ai"
      registrar directorio "$destino"
    fi
    echo "  copiado: $destino"
  done
}

# Skills de Pi dentro del proyecto (--skills-proyecto): carpetas reales en <proyecto>/.pi/skills/, sin enlaces.
SIN_GIT_AVISADO=0

# Ruta absoluta de .git/info/exclude del proyecto; vacía si el proyecto no es un repo git.
exclusion_de_git() { # ruta del proyecto
  git -C "$1" rev-parse --path-format=absolute --git-path info/exclude 2>/dev/null || true
}

# Excluye en git, de forma local, la carpeta de una skill copiada. Solo añade la línea si no estaba
# (si la puso el cliente, no se toca ni se registra, para que desinstalar.sh no borre una línea ajena).
excluir_en_git() { # nombre de la skill
  local n="$1" archivo linea="/.pi/skills/$1/"
  archivo="$(exclusion_de_git "$PROYECTO")"
  if [ -z "$archivo" ]; then
    if [ "$SIN_GIT_AVISADO" = 0 ]; then
      echo "  AVISO: el proyecto no es un repo git; no hay nada que excluir."
      SIN_GIT_AVISADO=1
    fi
    return
  fi
  if [ -f "$archivo" ] && grep -qxF "$linea" "$archivo"; then
    echo "  ya estaba excluido en git (no se toca): $linea"
    return
  fi
  if [ "$SIMULAR" = 1 ]; then
    echo "  excluiría: $linea"
    return
  fi
  mkdir -p "$(dirname "$archivo")"
  if [ -s "$archivo" ] && [ -n "$(tail -c1 "$archivo")" ]; then printf '\n' >> "$archivo"; fi
  printf '%s\n' "$linea" >> "$archivo"
  registrar exclusion "$archivo" "$linea"
  echo "  excluido en git: $linea"
}

instalar_skills_proyecto() { # usa $PROYECTO
  local base="$PROYECTO/.pi/skills" s n destino
  if [ "$SIMULAR" = 0 ]; then copiar_skills "$base"; fi
  for s in "$RAIZ"/skills/*/; do
    [ -f "${s}SKILL.md" ] || continue
    n="$(basename "$s")"
    destino="$base/$n"
    if [ "$SIMULAR" = 1 ]; then
      if { [ -e "$destino" ] || [ -L "$destino" ]; } && { [ -L "$destino" ] || [ ! -f "$destino/.flucastr-ai" ]; }; then
        echo "  OMITIDO (ya existe y no es una copia de Flucastr.AI): $destino"
        continue
      fi
      echo "  copiaría: $destino"
    elif [ -L "$destino" ] || [ ! -d "$destino" ] || [ ! -f "$destino/.flucastr-ai" ]; then
      continue # copiar_skills la omitió (carpeta ajena): no se excluye
    fi
    excluir_en_git "$n"
  done
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'skills-proyecto\t%s\t' "$PROYECTO")" "$NUEVO"; then
    registrar skills-proyecto "$PROYECTO"
  fi
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
    local exportar=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
RAIZ="$RAIZ"
${exportar}exec pi --model "\$(node "\$RAIZ/scripts/resolver.mjs" modelo-esfuerzo $nombre pi)" \\
  --append-system-prompt "\$(node "\$RAIZ/scripts/resolver.mjs" cuerpo "\$RAIZ/agentes/$nombre.md")" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (modelo: $modelo)"
}

generar_lanzador_claude() { # archivo del agente
  local archivo="$1" nombre destino esfuerzo
  nombre="$(basename "$archivo" .md)"
  destino="$BIN_DIR/claude-$nombre"
  esfuerzo="$(node "$RESOLVER" esfuerzo "$nombre")"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    echo "  OMITIDO (ya existe): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$BIN_DIR"
    local exportar="" bandera=""
    if [ "$MODO" = descarga ]; then exportar="export FLUCASTR_MODELOS=\"$MODELOS\""$'\n'; fi
    if [ -n "$esfuerzo" ]; then bandera=" --effort $esfuerzo"; fi
    cat > "$destino" <<EOF
#!/usr/bin/env bash
# flucastr-ai:generado - lo crea instalar.sh y lo borra desinstalar.sh
${exportar}exec claude --agent $nombre$bandera "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (esfuerzo: ${esfuerzo:-sin declarar})"
}

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
${exportar}exec codex -m "\$(node "\$RAIZ/scripts/resolver.mjs" modelo $nombre codex)"$bandera -c "developer_instructions=\$(node "\$RAIZ/scripts/resolver.mjs" instrucciones-codex "\$RAIZ/agentes/$nombre.md")" "\$@"
EOF
    chmod +x "$destino"
    registrar archivo "$destino"
  fi
  echo "  lanzador generado: $destino (modelo: $modelo, esfuerzo: ${esfuerzo:-sin declarar}, compacta en: ${compactar:-sin declarar})"
}

# kit-run: lanza al constructor sin interfaz y revisa al final (scripts/kit-run.mjs). Va con Codex (tramo 2 de kit-run).
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

# Reglas deny de Codex del proyecto (<proyecto>/.codex/rules/flucastr.rules, archivo del kit: no se mezcla con lo ajeno).
# Codex las carga solo en proyectos de confianza y son experimentales. Si el archivo es ajeno, avisa y sigue.
instalar_deny_codex() {
  local archivo="$PROYECTO/.codex/rules/flucastr.rules" salida prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-deny codex "$archivo" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $archivo ($salida)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  ${prefijo}reglas de Codex fijadas: $archivo" ;;
    actualizado) echo "  ${prefijo}reglas de Codex actualizadas: $archivo" ;;
    ya-estaba) echo "  ${prefijo}reglas de Codex ya estaban: $archivo" ;;
    *) echo "  AVISO: resultado inesperado de fijar-deny codex ($salida)"; return 0 ;;
  esac
  # Una línea por archivo: se registra solo si aún no está en el registro nuevo.
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'codex-reglas\t%s\t' "$archivo")" "$NUEVO"; then
    registrar codex-reglas "$archivo"
  fi
  return 0
}

# Refresca las reglas de Codex de los proyectos ya registrados (sin --proyecto), para no ir uno por uno.
# Un proyecto que ya no existe o un archivo de reglas ajeno solo avisa y sigue; su línea del registro se conserva
# (ya va copiada a $NUEVO).
refrescar_reglas_codex_registradas() {
  local ruta raiz_proyecto salida extra=() prefijo=""
  [ -n "$REGLAS_CODEX_REGISTRADAS" ] || return 0
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  echo
  echo "Reglas de Codex de proyectos registrados"
  while IFS= read -r ruta; do
    [ -n "$ruta" ] || continue
    raiz_proyecto="${ruta%/.codex/rules/flucastr.rules}"
    if [ ! -d "$raiz_proyecto" ]; then
      echo "  AVISO: el proyecto registrado ya no existe, se omiten sus reglas de Codex (registro conservado): $raiz_proyecto"
      continue
    fi
    if ! salida="$(node "$RESOLVER" fijar-deny codex "$ruta" ${extra[@]+"${extra[@]}"} < /dev/null 2>&1)"; then
      echo "  AVISO: no se tocó $ruta ($salida)"
      continue
    fi
    case "$salida" in
      fijado) echo "  ${prefijo}reglas de Codex fijadas: $ruta" ;;
      actualizado) echo "  ${prefijo}reglas de Codex actualizadas: $ruta" ;;
      ya-estaba) echo "  ${prefijo}reglas de Codex ya estaban: $ruta" ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny codex ($salida)" ;;
    esac
  done <<< "$REGLAS_CODEX_REGISTRADAS"
  return 0
}

# Compactación automática de los modelos de Pi del kit, en el settings.json global de Pi. Si el archivo del
# usuario no se puede tocar, avisa y sigue: no falla la instalación.
instalar_compactacion_pi() {
  local ajustes="$PI_DIR/settings.json" salida linea valor modelo resto reserve sufijo fijados=0
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); fi
  if ! salida="$(node "$RESOLVER" fijar-compactacion pi "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  while IFS= read -r linea; do
    [ -n "$linea" ] || continue
    case "$linea" in
      fijado:*)
        valor="${linea#fijado:}"
        modelo="${valor%%=*}"
        resto="${valor#*=}"
        reserve="${resto%%:*}"
        sufijo=""
        case "$resto" in *:creado) sufijo=":creado" ;; esac
        fijados=$((fijados + 1))
        if [ "$SIMULAR" = 1 ]; then
          echo "  (simulación) compactación fijada: $modelo reserveTokens=$reserve ($ajustes)"
        else
          echo "  compactación fijada: $modelo reserveTokens=$reserve ($ajustes)"
          registrar compactacion "$ajustes" "pi:$modelo=$reserve$sufijo"
        fi
        ;;
      "omitido-usuario:*") echo "  OMITIDO (ya define compaction en $ajustes: se respeta)" ;;
      omitido-usuario:*) echo "  OMITIDO (ya define compaction para ${linea#omitido-usuario:}: se respeta)" ;;
      omitido-ventana:*) echo "  OMITIDO (modelos.json no declara la ventana de ${linea#omitido-ventana:})" ;;
      omitido-umbral:*) echo "  OMITIDO (compactar_en no aplica a ${linea#omitido-umbral:}: ventana − compactar_en < 16384)" ;;
      *) echo "  $linea" ;;
    esac
  done <<< "$salida"
  if [ "$fijados" -gt 0 ]; then
    echo "  Pi no relee settings.json en caliente: abre Pi de nuevo o usa /reload. Aplica a esos modelos también fuera del kit; desinstalar.sh lo quita."
  fi
  return 0
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

# Compactación automática de Claude Code en el ajuste personal del proyecto (settings.local.json, no se sube a git).
# El resolver escribe autoCompactWindow = compactar_en + 33000 (el colchón de Claude Code). Si el proyecto ya define
# autoCompactWindow, lo respeta.
instalar_compactacion_claude() {
  local ajustes="$PROYECTO/.claude/settings.local.json" salida valor prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-compactacion claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  case "$salida" in
    fijado:*)
      valor="${salida#fijado:}"
      echo "  ${prefijo}compactación de Claude Code fijada: autoCompactWindow=$valor ($ajustes)"
      if [ "$SIMULAR" = 0 ]; then registrar compactacion "$ajustes" "claude:$valor"; fi
      ;;
    ya-estaba) echo "  ${prefijo}compactación de Claude Code ya estaba fijada: $ajustes" ;;
    omitido-usuario) echo "  ${prefijo}OMITIDO (el proyecto ya define autoCompactWindow: se respeta): $ajustes" ;;
    omitido-umbral) echo "  ${prefijo}OMITIDO (modelos.json no tiene un compactar_en válido para Claude Code)" ;;
    omitido-rango:*) echo "  ${prefijo}OMITIDO (autoCompactWindow=${salida#omitido-rango:} queda fuera de 100000-1000000, el rango de Claude Code)" ;;
    *) echo "  AVISO: resultado inesperado de fijar-compactacion claude ($salida)" ;;
  esac
  return 0
}

# Hook del validador de tareas en Claude Code (ajuste personal del proyecto, settings.local.json; no se sube a git).
# Si el resolver falla (JSON inválido, hooks con otro tipo), avisa y sigue: no aborta la instalación.
instalar_hook_claude() {
  local ajustes="$PROYECTO/.claude/settings.local.json" salida prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-hook claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  case "$salida" in
    fijado) echo "  ${prefijo}hook de Claude Code fijado: $ajustes" ;;
    ya-estaba) echo "  ${prefijo}hook de Claude Code ya estaba fijado: $ajustes" ;;
    *) echo "  AVISO: resultado inesperado de fijar-hook claude ($salida)"; return 0 ;;
  esac
  # Una sola línea hook por proyecto: se registra solo si aún no está en el registro nuevo.
  if [ "$SIMULAR" = 0 ] && ! grep -qxF "$(printf 'hook\t%s\tclaude' "$ajustes")" "$NUEVO"; then
    registrar hook "$ajustes" claude
  fi
  return 0
}

# Reglas deny del proyecto en Claude Code (<proyecto>/.claude/settings.json, compartido: va a git). Solo agrega las que faltan;
# el manifiesto registra solo las que agrega (una línea deny por regla), así desinstalar.sh nunca quita lo que ya tenía el usuario.
# Si el resolver falla (JSON inválido, permissions con otro tipo), avisa y sigue: no aborta la instalación.
instalar_deny_claude() {
  local ajustes="$PROYECTO/.claude/settings.json" salida linea regla prefijo=""
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); prefijo="(simulación) "; fi
  if ! salida="$(node "$RESOLVER" fijar-deny claude "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  if [ "$salida" = ya-estaba ]; then
    echo "  ${prefijo}reglas deny de Claude Code ya estaban: $ajustes"
    return 0
  fi
  while IFS= read -r linea; do
    case "$linea" in
      agregada:*)
        regla="${linea#agregada:}"
        if [ "$SIMULAR" = 1 ]; then
          echo "  (simulación) agregaría: $regla ($ajustes)"
        else
          echo "  regla deny de Claude Code agregada: $regla ($ajustes)"
          if ! grep -qxF "$(printf 'deny\t%s\t%s' "$ajustes" "$regla")" "$NUEVO"; then
            registrar deny "$ajustes" "$regla"
          fi
        fi
        ;;
      *) echo "  AVISO: resultado inesperado de fijar-deny claude ($linea)" ;;
    esac
  done <<< "$salida"
  return 0
}

# Primera línea del manifiesto: el modo con el que se instaló (lo leen desinstalar.sh y la comprobación de modo).
registrar modo "$MODO"

# Proyectos registrados con skills-proyecto: se leen antes de quitar la instalación anterior (desinstalar.sh borra
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
  grep -E "^codex-reglas$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true
  bash "$RAIZ/desinstalar.sh" --silencioso --conservar-ajustes
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
  instalar_skills "$CLAUDE_DIR/skills"
  for f in "$RAIZ"/agentes/*.md; do
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
    instalar_compactacion_claude
    # v2: sin hook del validador de tareas (era de v1; ver legacy/v1/).
  fi
else
  echo "Claude Code: no encontrado, se omite."
  if [ -n "$PROYECTO" ]; then echo "  (--proyecto necesita Claude Code; no se fijó el agente)"; fi
fi

if [ "$INSTALAR_PI" = 1 ]; then
  echo "Pi ($PI_DIR)"
  instalar_skills "$PI_DIR/skills"
  for f in "$RAIZ"/agentes/*.md; do
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
  instalar_skills "$CODEX_SKILLS"
  for f in "$RAIZ"/agentes/*.md; do
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
  if [ -n "$PROYECTO" ]; then echo "  (--proyecto no fijó reglas de Codex: Codex no está instalado)"; fi
fi

if [ "$SKILLS_PROYECTO" = 1 ]; then
  echo
  echo "Skills de Pi en el proyecto ($PROYECTO)"
  instalar_skills_proyecto
  echo "  Las copias en .pi/skills/ no se editan: se rehacen al reinstalar. Pi pedirá confiar en el proyecto (/trust)."
fi

# Proyectos registrados con skills-proyecto: se rehacen en cada instalación (con --solo claude o codex, no).
# Si no hay ninguno, no se imprime nada.
if [ -n "$PROYECTOS_REGISTRADOS" ]; then
  ANTERIOR_PROYECTO="$PROYECTO"
  if [ -n "$SOLO" ] && [ "$SOLO" != pi ]; then
    echo
    echo "  (proyectos con skills registradas no se actualizan con --solo $SOLO)"
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
    # ya procesado arriba, con --skills-proyecto
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
echo "  Claude Code: claude --agent principal   (o fijarlo en un proyecto: bash instalar.sh --proyecto <ruta>)"
echo "  Pi:          pi-principal"
if [ "$INSTALAR_CODEX" = 1 ]; then echo "  Codex:       codex-principal (o el agente como rol: ~/.codex/agents)"; fi
echo "Si cambias modelos.json, vuelve a correr: bash instalar.sh"
