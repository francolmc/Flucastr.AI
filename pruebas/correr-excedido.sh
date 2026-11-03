#!/usr/bin/env bash
# Corrida de «excedido» + «A» (F36, task-02). Solo MIDE: crea el fixture de task-01, lanza el
# coordinador dos veces (etapa 1 y etapa 2 con «A») con el lanzador de F12 de la herramienta y
# escribe el informe. La corrida con modelo real la hace Franco; las pruebas usan un modelo simulado.
# Uso: bash pruebas/correr-excedido.sh {claude-code|pi} [N]   (N entero >= 1, por defecto 1)
# Cada corrida (1..N) escribe su informe con el número libre siguiente; al final: Corridas: <ok>/<N> OK.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
uso='uso: correr-excedido.sh {claude-code|pi} [N]   (N entero >= 1, por defecto 1)'
[[ $# -ge 1 && $# -le 2 ]] || { echo "$uso" >&2; exit 2; }
herramienta="$1"
n="${2:-1}"
[[ "$n" =~ ^[1-9][0-9]*$ ]] || { echo "$uso" >&2; exit 2; }
case "$herramienta" in
  claude-code) lanzador="$RAIZ/pruebas/lanzar-coordinador-claude.sh" ;;
  pi) lanzador="$RAIZ/pruebas/lanzar-coordinador-pi.sh" ;;
  *) echo "$uso" >&2; exit 2 ;;
esac

if [[ "${FLUCASTR_SIN_PRECONDICION:-0}" != "1" ]]; then
  if ! node "$RAIZ/pruebas/comprobaciones/modelos-agentes.mjs"; then
    echo 'correr-excedido.sh: precondición de modelos falla; no se lanza la corrida' >&2
    exit 2
  fi
fi

res="${FLUCASTR_RESULTADOS:-$RAIZ/pruebas/resultados}"
mkdir -p "$res"
ok=0
for ((i = 1; i <= n; i++)); do
  base="$RAIZ/pruebas/.temporales/excedido-$herramienta-$$-$i"
  rm -rf "$base"
  mkdir -p "$base"
  bash "$RAIZ/pruebas/fixtures/excedido.sh" "$base/fixture"

  # Un fallo de un lanzador no aborta: la corrida se mide igual.
  (cd "$base/fixture" && FLUCASTR_RECORD_FILE="$base/etapa1.jsonl" bash "$lanzador" 'Continúa con el flujo.') \
    || echo 'aviso: la etapa 1 terminó con error; se mide igual' >&2
  mkdir -p "$base/etapa1"
  cp "$base/fixture/definitions/STATUS.md" "$base/etapa1/STATUS.md"

  (cd "$base/fixture" && FLUCASTR_RECORD_FILE="$base/etapa2.jsonl" bash "$lanzador" 'A') \
    || echo 'aviso: la etapa 2 terminó con error; se mide igual' >&2
  mkdir -p "$base/etapa2"
  cp "$base/fixture/definitions/STATUS.md" "$base/etapa2/STATUS.md"

  k=1
  while [[ -e "$res/$(date +%F)-excedido-$herramienta-$k.md" ]]; do k=$((k + 1)); done
  destino="$res/$(date +%F)-excedido-$herramienta-$k.md"
  if veredicto="$(EXC_DIR="$base" EXC_HERR="$herramienta" EXC_DEST="$destino" node --input-type=module -e "import fs from 'node:fs'; import { analizarCorrida } from 'file://$RAIZ/pruebas/comprobaciones/excedido-resultado.mjs'; const { ok, informe } = analizarCorrida({ dir: process.env.EXC_DIR, herramienta: process.env.EXC_HERR }); fs.writeFileSync(process.env.EXC_DEST, informe, { flag: 'wx' }); process.stdout.write(ok ? 'OK' : 'FALLA');")"; then
    echo "informe: $destino"
    if [[ "$veredicto" == OK ]]; then ok=$((ok + 1)); fi
  else
    echo 'correr-excedido.sh: no se pudo escribir el informe' >&2
    exit 2
  fi
done
echo "Corridas: $ok/$n OK"
exit 0
