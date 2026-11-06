#!/usr/bin/env bash
# Corrida de «repetido» (F39, task-05). Solo MIDE: crea el fixture de task-04 (tarea rota ya rechazada
# una vez), lanza el coordinador una vez con el prompt de task-04 usando el lanzador de F12 de la
# herramienta y escribe el informe. La corrida con modelo real la hace Franco (task-06); las pruebas
# usan un modelo simulado.
# Uso: bash pruebas/correr-repetido.sh {claude-code|pi}
# Escribe el informe con el número libre siguiente; imprime «informe: <ruta>» y «Veredicto: OK|FALLA».
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
uso='uso: correr-repetido.sh {claude-code|pi}'
[[ $# == 1 ]] || { echo "$uso" >&2; exit 2; }
herramienta="$1"
case "$herramienta" in
  claude-code) lanzador="$RAIZ/pruebas/lanzar-coordinador-claude.sh" ;;
  pi) lanzador="$RAIZ/pruebas/lanzar-coordinador-pi.sh" ;;
  *) echo "$uso" >&2; exit 2 ;;
esac

if [[ "${FLUCASTR_SIN_PRECONDICION:-0}" != "1" ]]; then
  if ! node "$RAIZ/pruebas/comprobaciones/modelos-agentes.mjs"; then
    echo 'correr-repetido.sh: precondición de modelos falla; no se lanza la corrida' >&2
    exit 2
  fi
fi

prompt='La puerta previa volvió a rechazar features/F01-demo/task-01-rota.md. Continúa con el flujo.'
res="${FLUCASTR_RESULTADOS:-$RAIZ/pruebas/resultados}"
mkdir -p "$res"
base="$RAIZ/pruebas/.temporales/repetido-$herramienta-$$"
rm -rf "$base"
mkdir -p "$base"
bash "$RAIZ/pruebas/fixtures/repetido.sh" "$base/fixture"

# Un fallo del lanzador no aborta: la corrida se mide igual.
(cd "$base/fixture" && FLUCASTR_RECORD_FILE="$base/registro.jsonl" bash "$lanzador" "$prompt") \
  || echo 'aviso: el lanzador terminó con error; se mide igual' >&2
mkdir -p "$base/final"
cp "$base/fixture/definitions/STATUS.md" "$base/final/STATUS.md"

k=1
while [[ -e "$res/$(date +%F)-repetido-$herramienta-$k.md" ]]; do k=$((k + 1)); done
destino="$res/$(date +%F)-repetido-$herramienta-$k.md"
if veredicto="$(REP_DIR="$base" REP_HERR="$herramienta" REP_DEST="$destino" node --input-type=module -e "import fs from 'node:fs'; import { analizarCorrida } from 'file://$RAIZ/pruebas/comprobaciones/repetido-resultado.mjs'; const { ok, informe } = analizarCorrida({ dir: process.env.REP_DIR, herramienta: process.env.REP_HERR }); fs.writeFileSync(process.env.REP_DEST, informe, { flag: 'wx' }); process.stdout.write(ok ? 'OK' : 'FALLA');")"; then
  echo "informe: $destino"
  echo "Veredicto: $veredicto"
  exit 0
fi
echo 'correr-repetido.sh: no se pudo escribir el informe' >&2
exit 2
