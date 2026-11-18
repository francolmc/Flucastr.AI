import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { fingerprint } from './fingerprint-reference.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const diagnoseScript = path.join(root, 'core/skills/diagnose/diagnose.mjs');
const contrato = readFileSync(path.join(root, 'core/contracts/verification.md'), 'utf8');
function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function runDiagnose(dir) {
  const result = spawnSync(process.execPath, [diagnoseScript, dir, '--json'], { encoding: 'utf8' });
  assert.equal(result.error, undefined, `diagnose no inició: ${result.error}`);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)).find((item) => item.tipo === 'resultado');
}

function temporaryRepo(callback, { commit = true } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'diagnostico-fingerprint-'));
  try {
    git(dir, ['init', '-q']);
    writeFileSync(path.join(dir, '.gitignore'), 'resultado.json\n');
    mkdirSync(path.join(dir, 'src'), { recursive: true });
    writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 1;\n');
    mkdirSync(path.join(dir, 'changes/demo'), { recursive: true });
    writeFileSync(path.join(dir, 'changes/demo/plan.md'), '## Plan\n');
    if (commit) {
      git(dir, ['config', 'user.name', 'Fingerprint Test']);
      git(dir, ['config', 'user.email', 'fingerprint@example.test']);
      git(dir, ['add', '.']);
      git(dir, ['commit', '-qm', 'base']);
    }
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function guardarResultado(dir, value) {
  writeFileSync(path.join(dir, 'resultado.json'), JSON.stringify({
    fingerprint: value, level: 'rapida', fase: 'pruebas', ok: true, fallo: 'ninguno',
  }));
}

test('the contract and diagnostic exclude tracked edits and new files under changes/', () => temporaryRepo((dir) => {
  assert.match(contrato, /status --porcelain -- \. '\:\(exclude,top\)changes\/\*\*'/);
  assert.match(contrato, /diff HEAD -- \. '\:\(exclude,top\)changes\/\*\*'/);
  const baseline = fingerprint(dir);
  guardarResultado(dir, baseline);
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente');

  writeFileSync(path.join(dir, 'changes/demo/plan.md'), '## Plan editado\n');
  mkdirSync(path.join(dir, 'changes/nuevo'), { recursive: true });
  writeFileSync(path.join(dir, 'changes/nuevo/plan.md'), '## Nuevo\n');
  assert.equal(fingerprint(dir), baseline, 'las modificaciones y altas en changes/ no cambian el fingerprint');
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente');

  writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 2;\n');
  assert.equal(runDiagnose(dir).fingerprintStatus, 'obsoleta', 'un cambio de producto rastreado invalida el fingerprint');
}));

test('a repository without HEAD keeps the status-only fingerprint behavior', () => temporaryRepo((dir) => {
  const baseline = fingerprint(dir);
  guardarResultado(dir, baseline);
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente');
  writeFileSync(path.join(dir, 'changes/demo/plan.md'), '## Editado sin HEAD\n');
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente');
  writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 3;\n');
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente', 'sin HEAD se conserva el fingerprint basado solo en status');
  writeFileSync(path.join(dir, 'otro.js'), 'export const other = true;\n');
  assert.equal(runDiagnose(dir).fingerprintStatus, 'obsoleta', 'un cambio en status sí altera el fingerprint sin HEAD');
}, { commit: false }));

test('a resultado.json written with the legacy key is still read', () => temporaryRepo((dir) => {
  const baseline = fingerprint(dir);
  writeFileSync(path.join(dir, 'resultado.json'), JSON.stringify({
    huella: baseline, level: 'rapida', fase: 'pruebas', ok: true, fallo: 'ninguno',
  }));
  assert.equal(runDiagnose(dir).fingerprintStatus, 'vigente', 'la clave heredada se lee por compatibilidad');
}));
