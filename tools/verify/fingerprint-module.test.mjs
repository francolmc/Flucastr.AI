import assert from 'node:assert/strict';
import { spawnSyncSeguro } from '../spawn/sync-seguro.mjs';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { fingerprint } from '../../tests/diagnosis-suggests/fingerprint-reference.mjs';
import { fingerprintCurrent, recorrer } from '../../core/skills/diagnose/fingerprint.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function temporaryRepo(callback, { commit = true } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'diagnostico-fingerprint-modulo-'));
  const git = (args) => spawnSyncSeguro('git', ['-C', dir, ...args], { encoding: 'utf8' });
  try {
    assert.equal(git(['init', '-q']).status, 0);
    writeFileSync(path.join(dir, '.gitignore'), 'resultado.json\n');
    mkdirSync(path.join(dir, 'src'), { recursive: true });
    writeFileSync(path.join(dir, 'src/app.js'), 'export const value = 1;\n');
    mkdirSync(path.join(dir, 'changes/demo'), { recursive: true });
    writeFileSync(path.join(dir, 'changes/demo/plan.md'), '## Plan\n');
    if (commit) {
      for (const args of [
        ['config', 'user.name', 'Huella Test'],
        ['config', 'user.email', 'fingerprint@example.test'],
        ['add', '.'],
        ['commit', '-qm', 'base'],
      ]) assert.equal(git(args).status, 0);
    }
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('fingerprint module import has no output or diagnostic execution', () => {
  const moduleUrl = new URL('../../core/skills/diagnose/fingerprint.mjs', import.meta.url).href;
  const result = spawnSyncSeguro(process.execPath, ['--input-type=module', '-e', 'await import(process.argv[1])', moduleUrl], { encoding: 'utf8' });
  assert.equal(result.error, undefined, `module import did not start: ${result.error}`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('recorrer visits regular files and skips hidden, dependency, build and linked entries', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'diagnostico-recorrer-'));
  try {
    const empty = [];
    recorrer(dir, dir, new Set(['node_modules', 'dist', 'build', 'coverage']), (_ruta, rel) => empty.push(rel));
    assert.deepEqual(empty, []);
    mkdirSync(path.join(dir, 'src', 'nested'), { recursive: true });
    for (const name of ['node_modules', 'dist', 'build', 'coverage', '.hidden']) {
      mkdirSync(path.join(dir, name));
      writeFileSync(path.join(dir, name, 'skip.js'), 'skip');
    }
    writeFileSync(path.join(dir, 'src/app.js'), 'app');
    writeFileSync(path.join(dir, 'src/nested/lib.js'), 'lib');
    writeFileSync(path.join(dir, '.secret'), 'skip');
    const outside = path.join(dir, 'outside.js');
    writeFileSync(outside, 'outside');
    symlinkSync(outside, path.join(dir, 'linked-file.js'));
    symlinkSync(path.join(dir, 'src'), path.join(dir, 'linked-dir'), 'dir');

    const visited = [];
    recorrer(dir, dir, new Set(['node_modules', 'dist', 'build', 'coverage']), (_ruta, rel) => visited.push(rel));
    assert.deepEqual(visited.sort(), ['outside.js', 'src/app.js', 'src/nested/lib.js']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fingerprintCurrent matches the independent fingerprint calculation with and without HEAD', () => {
  for (const commit of [true, false]) temporaryRepo((dir) => {
    assert.equal(fingerprintCurrent(dir), fingerprint(dir));
    mkdirSync(path.join(dir, 'changes', 'nuevo'), { recursive: true });
    writeFileSync(path.join(dir, 'changes', 'nuevo', 'plan.md'), 'excluded\n');
    assert.equal(fingerprintCurrent(dir), fingerprint(dir));
    writeFileSync(path.join(dir, 'src/app.js'), 'export const changed = true;\n');
    assert.equal(fingerprintCurrent(dir), fingerprint(dir));
  }, { commit });
});
