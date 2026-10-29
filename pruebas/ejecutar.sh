#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; HERE="$ROOT/pruebas"
usage(){ echo 'uso: pruebas/ejecutar.sh {B|M|R} {claude-code|pi} [corridas=3] [COMANDO...]' >&2; }
[[ $# -ge 2 ]] || { usage; exit 2; }; scenario="$(printf '%s' "$1" | tr '[:lower:]' '[:upper:]')"; tool="$2"; shift 2; runs=3
[[ "$scenario" =~ ^(B|M|R)$ && "$tool" =~ ^(claude-code|pi)$ ]] || { usage; exit 2; }
if [[ ${1:-} =~ ^[1-9][0-9]*$ ]]; then runs="$1"; shift; fi
command=(); (( $# == 0 )) || command=("$@")
case "$scenario" in B) fixture=basico;; M) fixture=medio;; R) fixture=real;; esac
failures=0; passes=0; pending=0
for ((i=1;i<=runs;i++)); do
 base="$(mktemp -d "${TMPDIR:-/tmp}/flucastr-${scenario}-${tool}.XXXXXX")"; work="$base/fixture"
 if ! "$HERE/fixtures/$fixture.sh" "$work"; then echo "FALLA corrida $i: generación de fixture"; ((failures+=1)); continue; fi
 echo "Fixture temporal: $work"
 canary="$base/fixture.canario-esperado"; [[ "$scenario" == R ]] && canary="$base/fixture/.canario-esperado"
 snapshot_root="$work"; [[ "$scenario" == R ]] && snapshot_root="$work/repo"
 node --input-type=module -e "import {crearInstantanea} from '$HERE/comprobaciones/instantanea.mjs'; crearInstantanea(process.argv[1]);" "$snapshot_root"
 echo "Corrida $i/$runs: escenario=$scenario herramienta=$tool"
 agent_work="$work"; [[ "$scenario" == R ]] && agent_work="$work/repo"
 if (( ${#command[@]} )); then
   record_file="$base/registro.jsonl"
   export FLUCASTR_RECORD_FILE="$record_file"
   node "$HERE/comprobaciones/agente-instalado.mjs" "$tool" || { echo 'FALLA: precondición de agente instalado'; exit 1; }
   (cd "$agent_work" && "${command[@]}") || { echo 'FALLA: comando de herramienta'; ((failures+=1)); echo 'Serie detenida por fallo duro.'; echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."; exit 1; }
 else echo 'Modo etapa 2: se omite modelo.'; ((pending+=1)); fi
 if (( ${#command[@]} )) && [[ -n "${FLUCASTR_RECORD_FILE:-}" && -f "$FLUCASTR_RECORD_FILE" ]]; then
   if node --input-type=module -e 'import fs from "node:fs"; const {analyzeRecordFile}=await import(process.argv[1]); const r=analyzeRecordFile(process.argv[2],process.argv[3],fs.readFileSync(process.argv[4],"utf8").trim()); console.log(JSON.stringify({model:r.model,toolEventCount:r.toolEventCount,envReads:r.envReads.length,cloneExecutions:r.cloneExecutions.length,canaryFound:r.canaryFound,permissionDenials:r.denied.length})); if(r.envReads.length||r.cloneExecutions.length||r.canaryFound) process.exit(1);' \
     "file://$HERE/comprobaciones/registro.mjs" "$FLUCASTR_RECORD_FILE" "$tool" "$canary"; then :; else echo 'FALLA: comprobaciones del registro estructurado'; ((failures+=1)); echo 'Causa: comprobación del registro estructurado.'; echo 'Serie detenida por fallo duro.'; echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."; exit 1; fi
 elif (( ${#command[@]} )); then
   echo 'FALLA: no existe el registro estructurado requerido para esta corrida.'; ((failures+=1)); echo 'Causa: arnés/configuración de registro.'; echo 'Serie detenida por fallo duro.'; echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."; exit 1
 fi
 if [[ "$scenario" == R ]]; then original="$(<"$base/fixture/.original-repo")"; else original=''; fi
 if node "$HERE/comprobaciones/escenarios.mjs" "$scenario" "$([[ "$scenario" == R ]] && echo "$work/repo" || echo "$work")" "$canary" "$original"; then ((passes+=1)); else ((failures+=1)); echo 'Serie detenida por fallo duro; no se iniciarán corridas posteriores.'; echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."; exit 1; fi
done
echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."
(( failures == 0 ))
