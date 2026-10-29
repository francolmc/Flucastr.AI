// Prueba del lanzador del constructor en Claude Code (pruebas/lanzar-constructor-claude.sh).
// Sin modelo ni red: usa un binario simulado que imprime sus argumentos, uno por línea.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(dir, 'lanzar-constructor-claude.sh');
const tarea = 'features/F99-demo/task-01-crear-salida.md';
const prompt = `Ejecuta la tarea ${tarea}. En esta sesión no se pueden responder preguntas.`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flucastr-lanzar-constructor-'));
const fake = path.join(tmp, 'fake-model.sh');
fs.writeFileSync(fake, '#!/usr/bin/env bash\nprintf \'%s\\n\' "$@"\n', { mode: 0o755 });

test('lanzar-constructor-claude.sh: sintaxis Bash válida', () => {
  const result = spawnSync('/bin/bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso', () => {
  const record = path.join(tmp, 'sin-argumento.record');
  const result = spawnSync('/bin/bash', [script], {
    cwd: tmp, encoding: 'utf8', env: { ...process.env, FLUCASTR_CLAUDE_BIN: fake, FLUCASTR_RECORD_FILE: record },
  });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /uso:/);
  assert.equal(fs.existsSync(record), false, 'sin argumento no debe lanzar el modelo');
});

test('lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única', () => {
  const record = path.join(tmp, 'constructor.record');
  const result = spawnSync('/bin/bash', [script, tarea], {
    cwd: tmp, encoding: 'utf8', env: { ...process.env, FLUCASTR_CLAUDE_BIN: fake, FLUCASTR_RECORD_FILE: record },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(record), 'el lanzador no creó el registro indicado');
  const output = fs.readFileSync(record, 'utf8');
  const lineas = output.split(/\r?\n/);

  for (const arg of ['--agent', 'constructor', '--permission-mode', 'dontAsk', 'Write(./**)', 'Bash(echo *)', 'Bash(printf *)', 'Bash(bash verificar.sh)', 'Read(./.env)']) {
    assert.ok(lineas.includes(arg) || output.includes(arg), `falta argumento esperado: ${arg}\n${output}`);
  }
  assert.equal(lineas.filter(arg => arg === prompt).length, 1, `el prompt debe ser un único argumento completo\n${output}`);
});

test('lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico', () => {
  const record = path.join(tmp, 'permisos.record');
  spawnSync('/bin/bash', [script, tarea], {
    cwd: tmp, encoding: 'utf8', env: { ...process.env, FLUCASTR_CLAUDE_BIN: fake, FLUCASTR_RECORD_FILE: record },
  });
  const output = fs.readFileSync(record, 'utf8');
  assert.equal(output.includes('Bash(git commit'), false, 'no debe permitir git commit');
  assert.equal(output.includes('Bash(git push'), false, 'no debe permitir git push');
  assert.equal(output.split(/\r?\n/).includes('Bash(*)'), false, 'no debe permitir Bash genérico');
});

test('lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante', () => {
  const record = path.join(tmp, 'env-y-permisos.record');
  const result = spawnSync('/bin/bash', [script, tarea], {
    cwd: tmp, encoding: 'utf8', env: { ...process.env, FLUCASTR_CLAUDE_BIN: fake, FLUCASTR_RECORD_FILE: record },
  });
  assert.equal(result.status, 0, result.stderr);
  const output = fs.readFileSync(record, 'utf8');
  const lineas = output.split(/\r?\n/);
  for (const linea of ['Read(./.env)', 'Read(.env)', 'Bash(cat ./.env)', 'Bash(cat .env)']) {
    assert.ok(lineas.includes(linea), `falta denegación exacta: ${linea}\n${output}`);
  }
  assert.equal(lineas.includes('Bash(*)'), false, 'no debe permitir Bash genérico');
  assert.equal(output.includes('Bash(git commit'), false, 'no debe permitir git commit');
  assert.equal(output.includes('Bash(git push'), false, 'no debe permitir git push');
  assert.equal(lineas.includes('Bash(bash *)'), false, 'no debe permitir bash *');
  assert.equal(lineas.includes('Bash(sh *)'), false, 'no debe permitir sh *');
});
