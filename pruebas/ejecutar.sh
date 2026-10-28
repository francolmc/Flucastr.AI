#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; HERE="$ROOT/pruebas"
usage(){ echo 'uso: pruebas/ejecutar.sh {B|M|C|R} {claude-code|pi} [corridas=3] [COMANDO...]' >&2; }
[[ $# -ge 2 ]] || { usage; exit 2; }; scenario="${1^^}"; tool="$2"; shift 2; runs=3
[[ "$scenario" =~ ^(B|M|C|R)$ && "$tool" =~ ^(claude-code|pi)$ ]] || { usage; exit 2; }
if [[ ${1:-} =~ ^[1-9][0-9]*$ ]]; then runs="$1"; shift; fi
command=(); (( $# == 0 )) || command=("$@")
case "$scenario" in B) fixture=basico;; M) fixture=medio;; C) fixture=complejo;; R) fixture=real;; esac
failures=0; passes=0; pending=0
for ((i=1;i<=runs;i++)); do
 base="$(mktemp -d "${TMPDIR:-/tmp}/flucastr-${scenario}-${tool}.XXXXXX")"; work="$base/fixture"
 if ! "$HERE/fixtures/$fixture.sh" "$work"; then echo "FALLA corrida $i: generación de fixture"; ((failures+=1)); continue; fi
 canary="$base/fixture.canario-esperado"; [[ "$scenario" == R ]] && canary="$base/fixture/.canario-esperado"
 node - "$work" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),root=process.argv[2],dirs=[];
function walk(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){if(x.name==='remotos')continue;const p=path.join(d,x.name);if(x.isDirectory()){if(fs.existsSync(path.join(p,'.git')))dirs.push(p);else walk(p)}}}walk(root);if(fs.existsSync(path.join(root,'.git')))dirs.unshift(root);
const before={};for(const d of dirs)before[d]=cp.spawnSync('git',['-C',d,'status','--porcelain=v1','--untracked-files=all'],{encoding:'utf8'}).stdout;fs.writeFileSync(path.join(path.dirname(root),'.agent-status.json'),JSON.stringify(before));
NODE
 echo "Corrida $i/$runs: escenario=$scenario herramienta=$tool"
 if (( ${#command[@]} )); then (cd "$work" && "${command[@]}") || { echo 'FALLA: comando de herramienta'; ((failures+=1)); continue; }; else echo 'Modo etapa 2: se omite modelo.'; fi
 # Pendiente exclusivamente: normalización y análisis del registro estructurado de Claude/Pi.
 echo 'PENDIENTE: evaluación del registro estructurado (lecturas de .env y ejecución de clonar.sh por el agente).'; ((pending+=1))
 if [[ "$scenario" == R ]]; then original="$(<"$base/fixture/.original-repo")"; else original=''; fi
 if node "$HERE/comprobaciones/escenarios.mjs" "$scenario" "$([[ "$scenario" == R ]] && echo "$work/repo" || echo "$work")" "$canary" "$original"; then ((passes+=1)); else ((failures+=1)); fi
done
echo "Resumen: $passes aprobadas, $failures fallidas, $pending pendientes de registro (de $runs)."
(( failures == 0 ))
