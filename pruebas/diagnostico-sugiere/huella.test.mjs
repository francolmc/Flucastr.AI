import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const diagnosticar = path.join(root, 'skills/diagnosticar/diagnosticar.mjs');
const contrato = readFileSync(path.join(root, 'nucleo/contrato/verificacion.md'), 'utf8');
const pathspec = ['--', '.', ':(exclude,top)cambios/**'];

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function huella(dir) {
  const status = git(dir, ['status', '--porcelain', ...pathspec]);
  let diff = '';
  try { diff = git(dir, ['diff', 'HEAD', ...pathspec]); } catch { /* Sin HEAD, solo cuenta status. */ }
  return createHash('sha256').update(Buffer.concat([Buffer.from(status), Buffer.from(diff)])).digest('hex').slice(0, 12);
}

function diagnostico(dir) {
  const result = spawnSync(process.execPath, [diagnosticar, dir, '--json'], { encoding: 'utf8' });
  assert.equal(result.error, undefined, `diagnosticar no inició: ${result.error}`);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)).find((item) => item.tipo === 'resultado');
}

function temporaryRepo(callback, { commit = true } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'diagnostico-huella-'));
  try {
    git(dir, ['init', '-q']);
    writeFileSync(path.join(dir, '.gitignore'), 'resultado.json\n');
    mkdirSync(path.join(dir, 'src'), { recursive: true });
    writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 1;\n');
    mkdirSync(path.join(dir, 'cambios/demo'), { recursive: true });
    writeFileSync(path.join(dir, 'cambios/demo/plan.md'), '## Plan\n');
    if (commit) {
      git(dir, ['config', 'user.name', 'Huella Test']);
      git(dir, ['config', 'user.email', 'huella@example.test']);
      git(dir, ['add', '.']);
      git(dir, ['commit', '-qm', 'base']);
    }
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function guardarResultado(dir, fingerprint) {
  writeFileSync(path.join(dir, 'resultado.json'), JSON.stringify({
    huella: fingerprint, nivel: 'rapida', fase: 'pruebas', ok: true, fallo: 'ninguno',
  }));
}

test('the contract and diagnostic exclude tracked edits and new files under cambios/', () => temporaryRepo((dir) => {
  assert.match(contrato, /status --porcelain -- \. '\:\(exclude,top\)cambios\/\*\*'/);
  assert.match(contrato, /diff HEAD -- \. '\:\(exclude,top\)cambios\/\*\*'/);
  const baseline = huella(dir);
  guardarResultado(dir, baseline);
  assert.equal(diagnostico(dir).huella, 'vigente');

  writeFileSync(path.join(dir, 'cambios/demo/plan.md'), '## Plan editado\n');
  mkdirSync(path.join(dir, 'cambios/nuevo'), { recursive: true });
  writeFileSync(path.join(dir, 'cambios/nuevo/plan.md'), '## Nuevo\n');
  assert.equal(huella(dir), baseline, 'las modificaciones y altas en cambios/ no cambian la huella');
  assert.equal(diagnostico(dir).huella, 'vigente');

  writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 2;\n');
  assert.equal(diagnostico(dir).huella, 'obsoleta', 'un cambio de producto rastreado invalida la huella');
}));

test('a repository without HEAD keeps the status-only fingerprint behavior', () => temporaryRepo((dir) => {
  const baseline = huella(dir);
  guardarResultado(dir, baseline);
  assert.equal(diagnostico(dir).huella, 'vigente');
  writeFileSync(path.join(dir, 'cambios/demo/plan.md'), '## Editado sin HEAD\n');
  assert.equal(diagnostico(dir).huella, 'vigente');
  writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 3;\n');
  assert.equal(diagnostico(dir).huella, 'vigente', 'sin HEAD se conserva la huella basada solo en status');
  writeFileSync(path.join(dir, 'otro.js'), 'export const other = true;\n');
  assert.equal(diagnostico(dir).huella, 'obsoleta', 'un cambio en status sí altera la huella sin HEAD');
}, { commit: false }));
