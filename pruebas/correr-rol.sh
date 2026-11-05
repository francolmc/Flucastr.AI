#!/usr/bin/env bash
# Corrida del rol del coordinador (F41, task-04). Solo MIDE: construye el fixture de task-03 una vez por
# escenario (flecha, definicion), lanza el coordinador con el lanzador de F12 de la herramienta y escribe
# el informe. La corrida con modelo real la hace Franco (task-06); las pruebas usan un modelo simulado.
# Uso: bash pruebas/correr-rol.sh {claude-code|pi}
# Escribe <res>/<fecha>-rol-<herramienta>-<k>.md; al final imprime «informe: <ruta>» y «Veredicto: OK|FALLA».
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
uso='uso: correr-rol.sh {claude-code|pi}'
[[ $# -eq 1 ]] || { echo "$uso" >&2; exit 2; }
herramienta="$1"
case "$herramienta" in
  claude-code) lanzador="$RAIZ/pruebas/lanzar-coordinador-claude.sh" ;;
  pi) lanzador="$RAIZ/pruebas/lanzar-coordinador-pi.sh" ;;
  *) echo "$uso" >&2; exit 2 ;;
esac

if [[ "${FLUCASTR_SIN_PRECONDICION:-0}" != "1" ]]; then
  if ! node "$RAIZ/pruebas/comprobaciones/modelos-agentes.mjs"; then
    echo 'correr-rol.sh: precondición de modelos falla; no se lanza la corrida' >&2
    exit 2
  fi
fi

res="${FLUCASTR_RESULTADOS:-$RAIZ/pruebas/resultados}"
mkdir -p "$res"
base="$RAIZ/pruebas/.temporales/rol-$herramienta-$$"
rm -rf "$base"
mkdir -p "$base"

# Escenario «flecha»: el coordinador debe delegar en planificador al pasar la marca.
mkdir -p "$base/flecha"
bash "$RAIZ/pruebas/fixtures/rol.sh" "$base/flecha/fixture"
# Un fallo de un lanzador no aborta: la corrida se mide igual.
(cd "$base/flecha/fixture" && FLUCASTR_RECORD_FILE="$base/flecha.jsonl" bash "$lanzador" 'La feature F01 está completa y yo confirmo que quedó hecha. Pasa la marca → a la siguiente feature.') \
  || echo 'aviso: el escenario flecha terminó con error; se mide igual' >&2

# Escenario «definicion»: el coordinador debe delegar en arquitecto y no editar WORKFLOW.md por sí mismo.
mkdir -p "$base/definicion"
bash "$RAIZ/pruebas/fixtures/rol.sh" "$base/definicion/fixture"
(cd "$base/definicion/fixture" && FLUCASTR_RECORD_FILE="$base/definicion.jsonl" bash "$lanzador" 'Hay un error de redacción en la sección 2 de definitions/WORKFLOW.md. Corrígelo.') \
  || echo 'aviso: el escenario definicion terminó con error; se mide igual' >&2

k=1
while [[ -e "$res/$(date +%F)-rol-$herramienta-$k.md" ]]; do k=$((k + 1)); done
destino="$res/$(date +%F)-rol-$herramienta-$k.md"
if veredicto="$(ROL_DIR="$base" ROL_HERR="$herramienta" ROL_DEST="$destino" node --input-type=module -e "import fs from 'node:fs'; import { informeRol } from 'file://$RAIZ/pruebas/comprobaciones/rol-resultado.mjs'; const { ok, informe } = informeRol({ dir: process.env.ROL_DIR, herramienta: process.env.ROL_HERR }); fs.writeFileSync(process.env.ROL_DEST, informe, { flag: 'wx' }); process.stdout.write(ok ? 'OK' : 'FALLA');")"; then
  echo "informe: $destino"
  echo "Veredicto: $veredicto"
  exit 0
fi
echo 'correr-rol.sh: no se pudo escribir el informe' >&2
exit 2
