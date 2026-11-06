// Pruebas de la corrida del hook del validador en Claude Code (F38, task-07). Con un claude simulado, sin modelo real.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'pruebas', 'correr-hook.sh');
const TEMPORALES = path.join(RAIZ, 'pruebas', '.temporales');
const TRABAJO = path.join(TEMPORALES, 'hook-claude-code');
const ESCENARIOS = ['danada', 'valida', 'subagente', 'sin-hook'];

fs.mkdirSync(TEMPORALES, { recursive: true });
const sim = fs.mkdtempSync(path.join(TEMPORALES, 'correr-hook-sim-'));
const res = fs.mkdtempSync(path.join(TEMPORALES, 'correr-hook-res-'));
after(() => {
  fs.rmSync(TRABAJO, { recursive: true, force: true });
  fs.rmSync(sim, { recursive: true, force: true });
  fs.rmSync(res, { recursive: true, force: true });
});

// Claude simulado: escribe la tarea en el cwd (el escenario es el nombre del cwd) y emite líneas JSON fijas.
// SIM_MODO: correcto | sin-bloqueo (danada y subagente no mencionan el bloqueo) | con-bloqueo (valida lo menciona)
// | parafrasis (danada y subagente parafrasean la firma y la línea, sin la frase literal) | firma-sin-linea (solo la firma, sin línea ni frase).
const CLAUDE_SIMULADO = `#!/usr/bin/env bash
set -euo pipefail
escenario="$(basename "$PWD")"
modo="\${SIM_MODO:-correcto}"
mkdir -p features/F99-demo
printf '# simulado\\n' > features/F99-demo/task-01-x.md
printf '%s\\n' '{"type":"system","subtype":"init","model":"modelo-simulado"}'
if [[ "$escenario" == subagente ]]; then
  printf '%s\\n' '{"type":"assistant","message":{"model":"modelo-simulado","content":[{"type":"tool_use","id":"a1","name":"Agent","input":{"subagent_type":"escritor"}}]}}'
fi
mostrar=0
case "$escenario:$modo" in
  danada:correcto|subagente:correcto|valida:con-bloqueo) mostrar=1 ;;
esac
if (( mostrar )); then
  printf '%s\\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t1","is_error":true,"content":"Hay un bloque de código abierto en línea 27, en «## Evidencia» (la escribe el constructor): falta la cerca de cierre."}]}}'
fi
if [[ "$modo" == parafrasis && ( "$escenario" == danada || "$escenario" == subagente ) ]]; then
  printf '%s\\n' '{"type":"assistant","message":{"model":"modelo-simulado","content":[{"type":"text","text":"El hook bloqueó: firma bloque-abierto|x|abc123 en la línea 32"}]}}'
fi
if [[ "$modo" == firma-sin-linea && ( "$escenario" == danada || "$escenario" == subagente ) ]]; then
  printf '%s\\n' '{"type":"assistant","message":{"model":"modelo-simulado","content":[{"type":"text","text":"El hook bloqueó: firma bloque-abierto|x|abc123"}]}}'
fi
printf '%s\\n' '{"type":"assistant","message":{"model":"modelo-simulado","content":[{"type":"text","text":"Listo en '"$escenario"'."}]}}'
printf '%s\\n' '{"type":"result","subtype":"success","result":"Listo en '"$escenario"'."}'
`;
const simulado = path.join(sim, 'claude-simulado.sh');
fs.writeFileSync(simulado, CLAUDE_SIMULADO, { mode: 0o755 });
fs.chmodSync(simulado, 0o755);

// Entorno sin CLAUDE_CODE_SUBAGENT_MODEL: la corrida lo rechaza si está definida.
const { CLAUDE_CODE_SUBAGENT_MODEL: _ignorada, ...entornoBase } = process.env;

function correr(argumentos, { modo = 'correcto', herramienta = 'claude-code' } = {}) {
  return spawnSync('bash', [SCRIPT, herramienta, ...argumentos], {
    cwd: RAIZ,
    encoding: 'utf8',
    env: { ...entornoBase, FLUCASTR_SIN_PRECONDICION: '1', FLUCASTR_CLAUDE_BIN: simulado, FLUCASTR_RESULTADOS: res, SIM_MODO: modo },
  });
}

function correrTodos(modo) {
  for (const escenario of ESCENARIOS) {
    const r = correr([escenario], { modo });
    assert.equal(r.status, 0, `${escenario}: ${r.stderr}`);
  }
}

// Ejecuta «informe» y devuelve la salida y el texto del informe escrito.
function informe() {
  const r = correr(['informe']);
  const ruta = /^informe: (.+)$/m.exec(r.stdout)?.[1];
  const texto = ruta && fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
  return { r, texto };
}

test('(1) con el simulado correcto, informe imprime Veredicto: OK y crea el informe', () => {
  correrTodos('correcto');
  const { r, texto } = informe();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Veredicto: OK/);
  assert.ok(texto.length > 0, 'el informe no se creó');
  for (const escenario of ESCENARIOS) assert.match(texto, new RegExp(`## ${escenario} — OK`));
  assert.match(texto, /Modelo: modelo-simulado/);
});

test('(2) control negativo: un simulado que no menciona el bloqueo hace FALLA en danada', () => {
  correrTodos('sin-bloqueo');
  const { r, texto } = informe();
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(texto, /## danada — FALLA/);
});

test('(3) control negativo: un simulado que menciona el bloqueo en valida hace FALLA en valida', () => {
  correrTodos('con-bloqueo');
  const { r, texto } = informe();
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(texto, /## valida — FALLA/);
});

test('(4) control negativo: sin .jsonl el escenario es FALLA', () => {
  correrTodos('correcto');
  fs.rmSync(path.join(TRABAJO, 'danada.jsonl'), { force: true });
  const { r, texto } = informe();
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(texto, /## danada — FALLA/);
  assert.match(texto, /sin \.jsonl/);
});

test('(5) un escenario desconocido sale con 2', () => {
  const r = correr(['otro-escenario']);
  assert.equal(r.status, 2);
});

test('(6) una herramienta desconocida sale con 2', () => {
  const r = correr(['danada'], { herramienta: 'pi' });
  assert.equal(r.status, 2);
});

test('(7) con el simulado parafrasis (firma y línea, sin la frase literal), informe imprime Veredicto: OK', () => {
  correrTodos('parafrasis');
  const { r } = informe();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Veredicto: OK/);
});

test('(8) control negativo: con firma-sin-linea (sin línea ni frase), danada da FALLA', () => {
  correrTodos('firma-sin-linea');
  const { r, texto } = informe();
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(texto, /## danada — FALLA/);
});
