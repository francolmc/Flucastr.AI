// Prueba rápida del generador de fixture pruebas/fixtures/constructor.sh.
// Sin modelo ni red: solo ejecuta el script en un directorio temporal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTarea } from './formato-tarea.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'pruebas/fixtures/constructor.sh');
const CARPETA_TAREAS = 'features/F99-demo';
const ESTADOS_ESPERADOS = ['aprobada', 'borrador', 'aprobada', 'aprobada'];

function generar(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flucastr-fixture-constructor-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const r = spawnSync('bash', [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `el script debe terminar con código 0: ${r.stderr}`);
  return dir;
}

function git(dir, ...args) {
  const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

test('las cuatro tareas cumplen la plantilla y tienen los estados esperados', (t) => {
  const dir = generar(t);
  const nombres = fs.readdirSync(path.join(dir, CARPETA_TAREAS)).sort();
  assert.equal(nombres.length, 4);
  const estados = nombres.map((nombre) => {
    const texto = fs.readFileSync(path.join(dir, CARPETA_TAREAS, nombre), 'utf8');
    assert.deepEqual(validarTarea(texto), [], `${nombre} no cumple la plantilla`);
    return /estado: (\S+)$/m.exec(texto.split('\n')[1])[1];
  });
  assert.deepEqual(estados, ESTADOS_ESPERADOS);
});

test('el repo del fixture queda limpio, con 3 commits y datos.json correcto', (t) => {
  const dir = generar(t);
  assert.equal(git(dir, 'status', '--short'), '');
  assert.equal(git(dir, 'rev-list', '--count', 'HEAD').trim(), '3');
  assert.equal(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8'), '{"v":1}\n');
});
