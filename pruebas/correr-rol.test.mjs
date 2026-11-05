import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dir, '..');
const script = path.join(raiz, 'pruebas/correr-rol.sh');
const temporales = path.join(raiz, 'pruebas/.temporales');
fs.mkdirSync(temporales, { recursive: true });

function entorno(extra) {
  const env = { ...process.env, FLUCASTR_SIN_PRECONDICION: '1', ...extra };
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  return env;
}

// Modelo simulado de Claude Code: delega en planificador si el prompt (último argumento) contiene «marca»,
// en arquitecto si contiene «WORKFLOW»; siempre cierra con un evento de resultado.
function falso(nombre, cuerpo) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'falso-'));
  const ruta = path.join(carpeta, nombre);
  fs.writeFileSync(ruta, `#!/usr/bin/env bash\n${cuerpo}\n`, { mode: 0o755 });
  return ruta;
}

const claudeSimulado = falso('claude', `
prompt="\${@: -1}"
if [[ "$prompt" == *marca* ]]; then
  printf '%s\\n' '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"a1","name":"Agent","input":{"subagent_type":"planificador","prompt":"x"}}]}}'
fi
if [[ "$prompt" == *WORKFLOW* ]]; then
  printf '%s\\n' '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"a2","name":"Agent","input":{"subagent_type":"arquitecto","prompt":"x"}}]}}'
fi
printf '%s\\n' '{"type":"result","result":"Listo."}'
`);

// Pi simulado que no delega en ningún rol.
const piSimulado = falso('pi', 'exit 0');

function informeDe(resultados, sufijo) {
  const nombre = fs.readdirSync(resultados).find((n) => n.endsWith(sufijo));
  assert.ok(nombre, `no hay informe ${sufijo} en ${resultados}`);
  return fs.readFileSync(path.join(resultados, nombre), 'utf8');
}

test('correr-rol.sh: sintaxis Bash válida', () => {
  const r = spawnSync('/bin/bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('correr-rol.sh: sin argumento sale 2', () => {
  const r = spawnSync('/bin/bash', [script], { cwd: raiz, encoding: 'utf8', env: entorno({}) });
  assert.equal(r.status, 2, r.stderr);
});

test('correr-rol.sh claude-code: delega en planificador y arquitecto da Veredicto: OK', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'claude-code'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_CLAUDE_BIN: claudeSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(informeDe(resultados, '-rol-claude-code-1.md'), /Veredicto: OK/);
});

test('correr-rol.sh pi: modelo simulado que no delega da Veredicto: FALLA', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'pi'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_PI_BIN: piSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(informeDe(resultados, '-rol-pi-1.md'), /Veredicto: FALLA/);
});
