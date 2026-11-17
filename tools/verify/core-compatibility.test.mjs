import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkCoreCompatibility } from './core-compatibility.mjs';

function fixture(t, inventory = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'core-compatibility-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'tools'));
  fs.writeFileSync(path.join(root, 'tools/core-compatibility.json'), JSON.stringify(inventory));
  fs.mkdirSync(path.join(root, 'core'));
  fs.mkdirSync(path.join(root, 'legacy'));
  return root;
}

function pair(source = 'core/module.sh', compatibility = 'legacy/module.sh') {
  return [{ source, compatibility }];
}

test('acepta inventario vacío y pares iguales con modo ejecutable idéntico', t => {
  const emptyRoot = fixture(t);
  assert.doesNotThrow(() => checkCoreCompatibility(emptyRoot));

  const root = fixture(t, pair());
  for (const relative of ['core/module.sh', 'legacy/module.sh']) {
    fs.writeFileSync(path.join(root, relative), '#!/bin/sh\n');
    fs.chmodSync(path.join(root, relative), 0o755);
  }
  assert.doesNotThrow(() => checkCoreCompatibility(root));
});

test('rechaza contenido y bits ejecutables distintos', t => {
  const root = fixture(t, pair());
  fs.writeFileSync(path.join(root, 'core/module.sh'), 'source');
  fs.writeFileSync(path.join(root, 'legacy/module.sh'), 'copy');
  assert.throws(() => checkCoreCompatibility(root), /contenido distinto/);
  fs.writeFileSync(path.join(root, 'legacy/module.sh'), 'source');
  fs.chmodSync(path.join(root, 'core/module.sh'), 0o755);
  assert.throws(() => checkCoreCompatibility(root), /permisos ejecutables distintos/);
});

test('rechaza archivos faltantes y rutas fuera del repositorio', t => {
  assert.throws(() => checkCoreCompatibility(fixture(t, pair())), /ruta faltante/);
  for (const route of ['/etc/passwd', '../outside', 'core/../../outside']) {
    assert.throws(() => checkCoreCompatibility(fixture(t, pair(route))), /absoluta|no permitida|fuera del repositorio/);
  }
});

test('rechaza duplicados exactos y alias normalizados', t => {
  const duplicates = [
    [...pair(), ...pair('core/other.sh', 'legacy/module.sh')],
    [...pair(), ...pair('core/./module.sh', 'legacy/other.sh')],
  ];
  for (const inventory of duplicates) {
    const root = fixture(t, inventory);
    assert.throws(() => checkCoreCompatibility(root), /ruta duplicada/);
  }
});

test('rechaza enlaces simbólicos en componentes intermedios y finales', t => {
  const parentRoot = fixture(t, pair('core/link/module.sh'));
  fs.mkdirSync(path.join(parentRoot, 'outside'));
  fs.writeFileSync(path.join(parentRoot, 'outside/module.sh'), 'same');
  fs.symlinkSync(path.join(parentRoot, 'outside'), path.join(parentRoot, 'core/link'));
  assert.throws(() => checkCoreCompatibility(parentRoot), /enlace simbólico/);

  const fileRoot = fixture(t, pair());
  fs.writeFileSync(path.join(fileRoot, 'legacy/module.sh'), 'same');
  fs.symlinkSync(path.join(fileRoot, 'legacy/module.sh'), path.join(fileRoot, 'core/module.sh'));
  assert.throws(() => checkCoreCompatibility(fileRoot), /enlace simbólico/);
});

test('la fase de modelos falla en una copia temporal si el par difiere', t => {
  const root = fixture(t, pair());
  fs.mkdirSync(path.join(root, 'tools/verify'), { recursive: true });
  fs.mkdirSync(path.join(root, 'agentes'));
  fs.writeFileSync(path.join(root, 'modelos.json'), JSON.stringify({ agentes: {} }));
  fs.copyFileSync(new URL('./core-compatibility.mjs', import.meta.url), path.join(root, 'tools/verify/core-compatibility.mjs'));
  fs.copyFileSync(new URL('./models.sh', import.meta.url), path.join(root, 'tools/verify/models.sh'));
  fs.writeFileSync(path.join(root, 'core/module.sh'), 'source');
  fs.writeFileSync(path.join(root, 'legacy/module.sh'), 'different');
  const runner = path.join(root, 'run-models.sh');
  fs.writeFileSync(runner, [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    'paso() { :; }',
    'fallo() { echo "FALLO: $*" >&2; exit 1; }',
    'source tools/verify/models.sh',
  ].join('\n'));
  const result = spawnSync('bash', [runner], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /contenido distinto/);
});
