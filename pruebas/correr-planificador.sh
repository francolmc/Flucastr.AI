#!/usr/bin/env bash
# Corrida del «planificador» (F42, task-06). Solo MIDE: crea el fixture de task-05 (cinco módulos en src/,
# feature F01 sin tareas), lanza al planificador una vez con el prompt de task-05 usando el lanzador de la
# herramienta y escribe el informe. La corrida con modelo real la hace Franco (task-07); las pruebas usan
# un modelo simulado.
# Uso: bash pruebas/correr-planificador.sh {claude-code|pi}
# Escribe el informe con el número libre siguiente; imprime «informe: <ruta>» y «Veredicto: OK|FALLA».
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
uso='uso: correr-planificador.sh {claude-code|pi}'
[[ $# == 1 ]] || { echo "$uso" >&2; exit 2; }
herramienta="$1"
case "$herramienta" in
  claude-code|pi) ;;
  *) echo "$uso" >&2; exit 2 ;;
esac
lanzador="$RAIZ/pruebas/lanzar-planificador.sh"

if [[ "${FLUCASTR_SIN_PRECONDICION:-0}" != "1" ]]; then
  if ! node "$RAIZ/pruebas/comprobaciones/modelos-agentes.mjs"; then
    echo 'correr-planificador.sh: precondición de modelos falla; no se lanza la corrida' >&2
    exit 2
  fi
fi

prompt='Skill: descomponer-feature. Disparó: franco. Descompón F01 en features/F01-demo/ con tareas en borrador. Rama: feature/F01-demo.'
res="${FLUCASTR_RESULTADOS:-$RAIZ/pruebas/resultados}"
mkdir -p "$res"
base="$RAIZ/pruebas/.temporales/planificador-$herramienta-$$"
rm -rf "$base"
mkdir -p "$base"
bash "$RAIZ/pruebas/fixtures/planificador.sh" "$base/fixture"

# Un fallo del lanzador no aborta: la corrida se mide igual.
(cd "$base/fixture" && FLUCASTR_RECORD_FILE="$base/registro.jsonl" bash "$lanzador" "$herramienta" "$prompt") \
  || echo 'aviso: el lanzador terminó con error; se mide igual' >&2

k=1
while [[ -e "$res/$(date +%F)-planificador-$herramienta-$k.md" ]]; do k=$((k + 1)); done
destino="$res/$(date +%F)-planificador-$herramienta-$k.md"
if veredicto="$(PLA_DIR="$base" PLA_HERR="$herramienta" PLA_DEST="$destino" node --input-type=module -e "import fs from 'node:fs'; import { analizarCorrida } from 'file://$RAIZ/pruebas/comprobaciones/planificador-resultado.mjs'; const { ok, informe } = analizarCorrida({ dir: process.env.PLA_DIR, herramienta: process.env.PLA_HERR }); fs.writeFileSync(process.env.PLA_DEST, informe, { flag: 'wx' }); process.stdout.write(ok ? 'OK' : 'FALLA');")"; then
  if grep -qx 'Tareas: 0' "$destino"; then
    read -r -d '' extractor <<'JS' || true
import fs from 'node:fs';
const reg = process.env.PLA_REG;
const herr = process.env.PLA_HERR;
let texto = '';
const lineas = fs.existsSync(reg) ? fs.readFileSync(reg, 'utf8').split('\n') : [];
for (const linea of lineas) {
  if (!linea.trim()) continue;
  let ev;
  try { ev = JSON.parse(linea); } catch { continue; }
  if (herr === 'claude-code' && ev.type === 'result' && typeof ev.result === 'string') texto = ev.result;
  if (herr === 'pi' && ev.type === 'agent_end') {
    const ultimo = [...(ev.messages ?? [])].reverse().find((m) => m.role === 'assistant');
    if (ultimo && Array.isArray(ultimo.content)) texto = ultimo.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }
}
texto = texto.trim();
process.stdout.write(texto ? texto.slice(0, 1500) : `(sin texto final; registro: ${reg})`);
JS
    respuesta="$(PLA_REG="$base/registro.jsonl" PLA_HERR="$herramienta" node --input-type=module -e "$extractor")" \
      || respuesta="(sin texto final; registro: $base/registro.jsonl)"
    printf '\nRespuesta del planificador:\n%s\n' "$respuesta" >> "$destino"
  fi
  echo "informe: $destino"
  echo "Veredicto: $veredicto"
  exit 0
fi
echo 'correr-planificador.sh: no se pudo escribir el informe' >&2
exit 2
