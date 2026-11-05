import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dir, '..');
const script = path.join(raiz, 'pruebas/correr-repetido.sh');
const temporales = path.join(raiz, 'pruebas/.temporales');
fs.mkdirSync(temporales, { recursive: true });

function entorno(extra) {
  const env = { ...process.env, FLUCASTR_SIN_PRECONDICION: '1', ...extra };
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  return env;
}

// Modelo simulado: escribe un evento de resultado y, en el STATUS.md del fixture (cwd), reescribe la
// Escalación con la misma causa repetida y las letras C y D.
function falso(nombre, cuerpo) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'falso-'));
  const ruta = path.join(carpeta, nombre);
  fs.writeFileSync(ruta, `#!/usr/bin/env bash\n${cuerpo}\n`, { mode: 0o755 });
  return ruta;
}

const claudeSimulado = falso('claude', `
printf '%s\\n' '{"type":"result","result":"Escalación repetida; no reabro la firma."}'
f="$PWD/definitions/STATUS.md"
awk '/^Escalación:/{print "Escalación: esta causa se repite. C) cerrar y revisar a mano | D) cerrar incompleta"; next} {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
`);

// Modelo inerte: no cambia el STATUS.md; la Escalación queda en «ninguna».
const claudeInerte = falso('claude', `
printf '%s\\n' '{"type":"result","result":"Listo."}'
`);

function informeDe(resultados, sufijo) {
  const nombre = fs.readdirSync(resultados).find((n) => n.endsWith(sufijo));
  assert.ok(nombre, `no hay informe ${sufijo} en ${resultados}`);
  return fs.readFileSync(path.join(resultados, nombre), 'utf8');
}

test('correr-repetido.sh: sintaxis Bash válida', () => {
  const r = spawnSync('/bin/bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('correr-repetido.sh: sin argumento sale 2', () => {
  const r = spawnSync('/bin/bash', [script], { cwd: raiz, encoding: 'utf8', env: entorno({}) });
  assert.equal(r.status, 2, r.stderr);
});

test('correr-repetido.sh claude-code: modelo simulado correcto da Veredicto: OK', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'claude-code'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_CLAUDE_BIN: claudeSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /informe: .*-repetido-claude-code-1\.md/);
  assert.match(r.stdout, /Veredicto: OK/);
  assert.match(informeDe(resultados, '-repetido-claude-code-1.md'), /Veredicto: OK/);
});

test('correr-repetido.sh claude-code: modelo simulado inerte da Veredicto: FALLA', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'claude-code'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_CLAUDE_BIN: claudeInerte, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(informeDe(resultados, '-repetido-claude-code-1.md'), /Veredicto: FALLA/);
});
