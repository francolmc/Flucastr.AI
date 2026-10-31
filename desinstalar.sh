#!/usr/bin/env bash
# Quita lo que instalar.sh creó (y solo eso), según ~/.flucastr-ai/manifiesto.txt.
# Uso: bash desinstalar.sh [--simular] [--todo] [--proyecto <ruta>]   (con --proyecto se quita lo instalado en ese proyecto: agente y skills)
#   --todo: además borra ~/.flucastr-ai/modelos.json (el personal). Sin él, ese archivo se conserva siempre.
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash desinstalar.sh" >&2
  exit 1
fi
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
ESTADO_DIR="$HOME/.flucastr-ai"
MANIFIESTO="$ESTADO_DIR/manifiesto.txt"

SIMULAR=0
SILENCIOSO=0
CONSERVAR_AJUSTES=0
TODO=0
PROYECTO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --simular) SIMULAR=1 ;;
    --silencioso) SILENCIOSO=1 ;;
    --todo) TODO=1 ;;
    --conservar-ajustes) CONSERVAR_AJUSTES=1 ;; # lo usa instalar.sh al reinstalar
    --proyecto)
      shift
      PROYECTO="${1:-}"
      [ -d "$PROYECTO" ] || { echo "--proyecto necesita una carpeta que exista" >&2; exit 1; }
      PROYECTO="$(cd "$PROYECTO" && pwd)"
      ;;
    -h | --help) sed -n '2,3p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
  shift
done

decir() {
  if [ "$SILENCIOSO" = 0 ]; then echo "$*"; fi
}

# Ruta absoluta de .git/info/exclude del proyecto; vacía si el proyecto no es un repo git.
exclusion_de_git() { # ruta del proyecto
  git -C "$1" rev-parse --path-format=absolute --git-path info/exclude 2>/dev/null || true
}

# Tras quitar una copia de skill, borra <proyecto>/.pi/skills y <proyecto>/.pi solo si quedaron vacíos.
limpiar_pi_vacio() { # ruta de una copia
  case "$1" in */.pi/skills/*) ;; *) return 0 ;; esac
  local skills="${1%/*}"
  rmdir "$skills" 2>/dev/null || true
  rmdir "${skills%/*}" 2>/dev/null || true
}

if [ ! -f "$MANIFIESTO" ]; then
  decir "Nada que desinstalar: no hay manifiesto en $MANIFIESTO."
  if [ "$TODO" = 1 ] && [ "$SIMULAR" = 0 ]; then
    rm -f "$ESTADO_DIR/modelos.json"
    rmdir "$ESTADO_DIR" 2>/dev/null || true
  fi
  exit 0
fi

# Modo con el que se instaló: primera línea «modo<TAB>...». Sin esa línea, es repo.
MODO_INSTALADO=repo
IFS=$'\t' read -r p_tipo p_valor _ < "$MANIFIESTO" || true
if [ "${p_tipo:-}" = modo ]; then MODO_INSTALADO="${p_valor:-repo}"; fi

# Solo un proyecto: quita lo que este instalador puso ahí (agente fijado, copias de skills, líneas de
# exclusión de git y la línea skills-proyecto) y deja el resto del manifiesto tal cual.
if [ -n "$PROYECTO" ]; then
  AJUSTES="$PROYECTO/.claude/settings.local.json"
  EXCL_GIT="$(exclusion_de_git "$PROYECTO")"
  MANTENER="$MANIFIESTO.tmp"
  hallados=0
  copias=0
  : > "$MANTENER"
  while IFS= read -r linea || [ -n "$linea" ]; do
    IFS=$'\t' read -r tipo ruta extra <<< "$linea"
    quitar=0
    case "$tipo" in
      ajuste)
        if [ "$ruta" = "$AJUSTES" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría el agente '${extra:-}' de: $AJUSTES"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$AJUSTES" "${extra:-}" < /dev/null)" || resultado="error"
            decir "  ajuste de proyecto ($resultado): $AJUSTES"
            rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
          fi
        fi
        ;;
      compactacion)
        # compactación de Claude Code de este proyecto: solo la línea claude: de su settings.local.json
        case "${extra:-}" in
          claude:*)
            if [ "$ruta" = "$AJUSTES" ]; then
              quitar=1
              hallados=$((hallados + 1))
              valor="${extra#claude:}"
              if [ "$SIMULAR" = 1 ]; then
                decir "SIMULACIÓN: quitaría la compactación de Claude Code de: $AJUSTES"
              else
                resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion claude "$AJUSTES" "$valor" < /dev/null)" || resultado="error"
                decir "  compactación de Claude Code ($resultado): $AJUSTES"
                rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
              fi
            fi
            ;;
        esac
        ;;
      directorio)
        case "$ruta" in
          "$PROYECTO"/.pi/skills/*)
            quitar=1
            hallados=$((hallados + 1))
            copias=1
            if [ -d "$ruta" ] && [ ! -L "$ruta" ] && [ -f "$ruta/.flucastr-ai" ]; then
              if [ "$SIMULAR" = 1 ]; then
                decir "  quitaría: $ruta"
              else
                rm -rf "$ruta"
                limpiar_pi_vacio "$ruta"
                decir "  quitado: $ruta"
              fi
            else
              decir "  omitido (no tiene la marca): $ruta"
            fi
            ;;
        esac
        ;;
      exclusion)
        if [ -n "$EXCL_GIT" ] && [ "$ruta" = "$EXCL_GIT" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ -n "${extra:-}" ] && [ -f "$ruta" ] && grep -qxF -- "$extra" "$ruta"; then
            if [ "$SIMULAR" = 0 ]; then
              grep -vxF -- "$extra" "$ruta" > "$ruta.tmp" || true
              if cmp -s "$ruta" "$ruta.tmp"; then rm -f "$ruta.tmp"; else mv "$ruta.tmp" "$ruta"; fi
            fi
            if [ "$SIMULAR" = 1 ]; then
              decir "  quitaría exclusión: $extra ($ruta)"
            else
              decir "  quitada exclusión: $extra ($ruta)"
            fi
          else
            decir "  omitido (no está la exclusión): $ruta"
          fi
        elif [ -z "$EXCL_GIT" ] && case "$ruta" in "$PROYECTO"/*) true ;; *) false ;; esac; then
          decir "  AVISO: el proyecto ya no es un repo git; no se quita la exclusión (sigue registrada): $extra"
        fi
        ;;
      skills-proyecto)
        if [ "$ruta" = "$PROYECTO" ]; then
          quitar=1
          hallados=$((hallados + 1))
        fi
        ;;
    esac
    if [ "$quitar" = 0 ]; then printf '%s\n' "$linea" >> "$MANTENER"; fi
  done < "$MANIFIESTO"

  if [ "$copias" = 1 ]; then
    decir "  (las copias no se editan: si cambiaste algo dentro, se pierde)"
  fi
  if [ "$hallados" = 0 ]; then
    rm -f "$MANTENER"
    decir "Este instalador no instaló nada en $PROYECTO."
    exit 0
  fi
  if [ "$SIMULAR" = 1 ]; then
    rm -f "$MANTENER"
    decir "SIMULACIÓN: no se borra nada."
    exit 0
  fi
  mv "$MANTENER" "$MANIFIESTO"
  if [ ! -s "$MANIFIESTO" ]; then
    rm -f "$MANIFIESTO"
    rmdir "$ESTADO_DIR" 2>/dev/null || true
  fi
  exit 0
fi

if [ "$SIMULAR" = 1 ]; then decir "SIMULACIÓN: no se borra nada."; fi

while IFS=$'\t' read -r tipo ruta extra; do
  [ -n "${ruta:-}" ] || continue
  case "$tipo" in
    enlace)
      # solo se borra si sigue siendo un enlace a este repo
      if [ -L "$ruta" ] && case "$(readlink "$ruta")" in "$RAIZ"/*) true ;; *) false ;; esac; then
        if [ "$SIMULAR" = 0 ]; then rm "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (ya no es un enlace de este repo): $ruta"
      fi
      ;;
    archivo)
      # solo se borra si sigue teniendo la marca de archivo generado
      if [ -f "$ruta" ] && grep -q 'flucastr-ai:generado' "$ruta"; then
        if [ "$SIMULAR" = 0 ]; then rm "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (no tiene la marca de archivo generado): $ruta"
      fi
      ;;
    directorio)
      # copia de una skill (modo descarga o --skills-proyecto): solo se borra si es carpeta real con la marca, no un enlace
      if [ -d "$ruta" ] && [ ! -L "$ruta" ] && [ -f "$ruta/.flucastr-ai" ]; then
        if [ "$SIMULAR" = 0 ]; then rm -rf "$ruta"; limpiar_pi_vacio "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (no tiene la marca): $ruta"
      fi
      ;;
    exclusion)
      # línea de .git/info/exclude que añadió --skills-proyecto: se quita solo esa línea exacta
      if [ -n "${extra:-}" ] && [ -f "$ruta" ] && grep -qxF -- "$extra" "$ruta"; then
        if [ "$SIMULAR" = 0 ]; then
          grep -vxF -- "$extra" "$ruta" > "$ruta.tmp" || true
          if cmp -s "$ruta" "$ruta.tmp"; then rm -f "$ruta.tmp"; else mv "$ruta.tmp" "$ruta"; fi
        fi
        if [ "$SIMULAR" = 1 ]; then
          decir "  quitaría exclusión: $extra ($ruta)"
        else
          decir "  quitada exclusión: $extra ($ruta)"
        fi
      else
        decir "  omitido (no está la exclusión): $ruta"
      fi
      ;;
    skills-proyecto)
      # solo registro: la línea se va con el manifiesto (las copias tienen sus propias líneas directorio)
      ;;
    compactacion)
      # compactación automática: Pi (ajuste global, siempre) y Claude Code (ajuste del proyecto, salvo --conservar-ajustes)
      case "${extra:-}" in
        pi:*)
          spec="${extra#pi:}"
          creado=""
          if [ "${spec%:creado}" != "$spec" ]; then creado="creado"; spec="${spec%:creado}"; fi
          modelo="${spec%%=*}"
          reserve="${spec#*=}"
          if [ "$SIMULAR" = 1 ]; then
            decir "  quitaría la compactación de Pi: $modelo ($ruta)"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion pi "$ruta" "$modelo" "$reserve" $creado < /dev/null)" || resultado="error"
            decir "  compactación de Pi ($resultado): $modelo"
          fi
          ;;
        claude:*)
          if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
          valor="${extra#claude:}"
          if [ "$SIMULAR" = 1 ]; then
            decir "  quitaría la compactación de Claude Code de: $ruta"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion claude "$ruta" "$valor" < /dev/null)" || resultado="error"
            decir "  compactación de Claude Code ($resultado): $ruta"
            rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
          fi
          ;;
        *)
          decir "  omitido (línea compactacion desconocida): $ruta"
          ;;
      esac
      ;;
    ajuste)
      # agente predeterminado de un proyecto: solo se quita si sigue siendo el que fijamos
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría el agente predeterminado de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$ruta" "${extra:-}" < /dev/null)" || resultado="error"
        decir "  ajuste de proyecto ($resultado): $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
      fi
      ;;
  esac
done < "$MANIFIESTO"

if [ "$SIMULAR" = 0 ]; then
  rm -f "$MANIFIESTO"
  if [ "$MODO_INSTALADO" = descarga ] && [ "$CONSERVAR_AJUSTES" = 0 ]; then
    rm -f "$ESTADO_DIR/version" "$ESTADO_DIR/kit.anterior"
  fi
  if [ "$TODO" = 1 ]; then rm -f "$ESTADO_DIR/modelos.json"; fi
  if [ "$MODO_INSTALADO" = descarga ] && [ "$CONSERVAR_AJUSTES" = 0 ]; then
    # kit puede ser la carpeta de este propio script: se borra lo último. El bloque termina en exit,
    # así bash no lee más líneas de un archivo que ya no existe.
    {
      rm -rf "$ESTADO_DIR/kit"
      rmdir "$ESTADO_DIR" 2>/dev/null || true
      decir "Listo. Reinicia Claude Code y Pi."
      exit 0
    }
  fi
  rmdir "$ESTADO_DIR" 2>/dev/null || true
  decir "Listo. Reinicia Claude Code y Pi."
fi
