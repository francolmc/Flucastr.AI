#!/usr/bin/env bash
# Envoltorio de verify: dueño del temporal de la corrida, de sus traps y del registro de verificación ya hecha.
# Uso: bash tools/verify/envoltorio.sh <cuerpo> [argumentos]. El cuerpo (verify) corre como hijo con VERIFY_HIJO=1.
# Casos A2 y A3 de changes/higiene-verify/tramo-2.md. Sin registro con VERIFY_TARGET.
set -euo pipefail
cd "$(dirname "$0")/../.."
cuerpo="$1"
shift

# Barrido de viejos y espacio libre antes de crear nada: con poco espacio, sale sin correr pasos.
base="${TMPDIR:-/tmp}"
node tools/temporales/barrido.mjs "$base"
minimo="${VERIFY_MIN_LIBRE_MB:-500}"
libre_kb="$(df -Pk "$base" | awk 'NR==2 {print $4}')"
libre_mb=$((libre_kb / 1024))
if [ "$libre_mb" -lt "$minimo" ]; then
  echo "FALLO: sin espacio libre en $base: hay ${libre_mb} MB y se piden ${minimo} MB (No space left)" >&2
  exit 1
fi

d=$(mktemp -d "${TMPDIR:-/tmp}/flucastr-verify.XXXXXX")
trap 'rm -rf -- "$d"' EXIT
trap 'exit 130' INT; trap 'exit 143' TERM
export TMPDIR=$d

# Salida completa de la corrida en el log (se trunca al iniciar y no se borra al salir). En pantalla va solo un resumen.
log=pruebas/.temporales/verify.log
mkdir -p pruebas/.temporales
: > "$log"

# Verificación ya hecha (scripts/kit-verificado.mjs): la corrida completa borra resultado.json al inicio y lo registra al
# final solo si el árbol no cambió y la huella de cierre coincide con la de inicio. Con VERIFY_TARGET no se registra nada.
HUELLA_INICIO=""
registro=""
if [ -z "${VERIFY_TARGET:-}" ]; then
  rm -f pruebas/.temporales/fase-verify.txt
  HUELLA_INICIO="$(node scripts/kit-verificado.mjs iniciar | sed -n 's/^Fingerprint: //p')" || HUELLA_INICIO=""
fi
codigo=0
if [ -n "$HUELLA_INICIO" ]; then
  VERIFY_HIJO=1 VERIFY_FASE_ARCHIVO=pruebas/.temporales/fase-verify.txt bash "$cuerpo" "$@" > "$log" 2>&1 || codigo=$?
  fase="$(cat pruebas/.temporales/fase-verify.txt 2>/dev/null || true)"
  [ -n "$fase" ] || fase="inicio"
  ok=true; fallo_tipo=ninguno
  if [ "$codigo" -ne 0 ]; then ok=false; fallo_tipo=prueba; fi
  registro="$(node scripts/kit-verificado.mjs cerrar --nivel aceptacion --fase "$fase" --ok "$ok" --fallo "$fallo_tipo" --huella-inicio "$HUELLA_INICIO" 2>&1 || true)"
else
  VERIFY_HIJO=1 bash "$cuerpo" "$@" > "$log" 2>&1 || codigo=$?
fi
if [ "$codigo" -eq 0 ]; then
  pasos="$(grep -cE '^== [0-9]+[a-z]*\. ' "$log" || true)"
  echo "verify: $pasos pasos; detalle en $log"
  if [ -n "$registro" ]; then printf '%s\n' "$registro" | sed -n '1,3p'; fi
  echo "VERIFY OK"
else
  # En rojo: encabezado del último paso iniciado y su cola (≤30 líneas, ≤3000 bytes); sin paso, la cola del log.
  # Luego el registro (≤3 líneas) y la línea final: en total ≤40 líneas y ≤4096 bytes.
  n_linea="$(grep -nE '^== [0-9]+[a-z]*\. ' "$log" | tail -n 1 | cut -d: -f1 || true)"
  if [ -n "$n_linea" ]; then
    id="$(sed -n "${n_linea}p" "$log" | sed -E 's/^== ([0-9]+[a-z]*)\. .*/\1/')"
    sed -n "${n_linea}p" "$log"
    sed -n "$((n_linea + 1)),\$p" "$log" | tail -n 30 | tail -c 3000
  else
    tail -n 30 "$log" | tail -c 3000
  fi
  if [ -n "$registro" ]; then printf '%s\n' "$registro" | sed -n '1,3p'; fi
  if [ -n "$n_linea" ]; then
    echo "VERIFY FALLO: paso $id (exit $codigo); detalle en $log"
  else
    echo "VERIFY FALLO: sin paso (exit $codigo); detalle en $log"
  fi
fi
# El registro va al log al final, fuera de la cola que se muestra (así no se repite).
if [ -n "$registro" ]; then printf '%s\n' "$registro" >> "$log"; fi
exit "$codigo"
