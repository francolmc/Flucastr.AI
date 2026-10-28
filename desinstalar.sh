#!/usr/bin/env bash
# Quita lo que instalar.sh creó (y solo eso), según ~/.flucastr-ai/manifiesto.txt.
# Uso: bash desinstalar.sh [--simular] [--proyecto <ruta>]   (con --proyecto solo se quita el agente fijado ahí)
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
PROYECTO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --simular) SIMULAR=1 ;;
    --silencioso) SILENCIOSO=1 ;;
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

if [ ! -f "$MANIFIESTO" ]; then
  decir "Nada que desinstalar: no hay manifiesto en $MANIFIESTO."
  exit 0
fi

# Solo un proyecto: quita el agente fijado ahí y deja todo lo demás instalado.
if [ -n "$PROYECTO" ]; then
  AJUSTES="$PROYECTO/.claude/settings.local.json"
  PREFIJO="$(printf 'ajuste\t%s\t' "$AJUSTES")"
  LINEA="$(grep -F "$PREFIJO" "$MANIFIESTO" | head -n 1 || true)"
  if [ -z "$LINEA" ]; then
    decir "Este instalador no fijó ningún agente en $PROYECTO."
    exit 0
  fi
  AGENTE_FIJADO="${LINEA##*$'\t'}"
  if [ "$SIMULAR" = 1 ]; then
    decir "SIMULACIÓN: quitaría el agente '$AGENTE_FIJADO' de: $AJUSTES"
    exit 0
  fi
  resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$AJUSTES" "$AGENTE_FIJADO" < /dev/null)" || resultado="error"
  decir "  ajuste de proyecto ($resultado): $AJUSTES"
  grep -vF "$PREFIJO" "$MANIFIESTO" > "$MANIFIESTO.tmp" || true
  mv "$MANIFIESTO.tmp" "$MANIFIESTO"
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
    ajuste)
      # agente predeterminado de un proyecto: solo se quita si sigue siendo el que fijamos
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría el agente predeterminado de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$ruta" "${extra:-}" < /dev/null)" || resultado="error"
        decir "  ajuste de proyecto ($resultado): $ruta"
      fi
      ;;
  esac
done < "$MANIFIESTO"

if [ "$SIMULAR" = 0 ]; then
  rm -f "$MANIFIESTO"
  rmdir "$ESTADO_DIR" 2>/dev/null || true
  decir "Listo. Reinicia Claude Code y Pi."
fi
