import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executor = path.join(root, 'pruebas/ejecutar.sh');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'registro-e2e-'));

test('ejecutar.sh procesa un registro Claude sintético de punta a punta', () => {
  const record = path.join(tmp, 'claude.jsonl');
  fs.writeFileSync(record, [
    JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-model-synthetic' }),
    JSON.stringify({ type: 'result', result: 'respuesta sintética' }),
  ].join('\n'));
  const result = spawnSync('/bin/bash', [executor, 'B', 'claude-code', '1', 'true'], {
    cwd: root, encoding: 'utf8', timeout: 120_000, env: { ...process.env, FLUCASTR_RECORD_FILE: record },
  });
  assert.notEqual(result.status, 0, 'Sin entregables B, el ejecutor debe reportar fallo de escenario');
  assert.match(result.stdout, /"model":"claude-model-synthetic"/);
  assert.match(result.stdout, /"toolEventCount":0,"envReads":0,"cloneExecutions":0,"canaryFound":false,"permissionDenials":0/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 1\)\./);
});

test('ejecutar.sh procesa un registro Pi sintético de punta a punta', () => {
  const record = path.join(tmp, 'pi.jsonl');
  fs.writeFileSync(record, [
    JSON.stringify({ type: 'session', id: 'synthetic-session', cwd: '/tmp/fixture' }),
    JSON.stringify({ type: 'turn_end', message: { role: 'assistant', model: 'pi-model-synthetic', content: [{ type: 'text', text: 'respuesta sintética' }] } }),
  ].join('\n'));
  const result = spawnSync('/bin/bash', [executor, 'B', 'pi', '1', 'true'], {
    cwd: root, encoding: 'utf8', timeout: 120_000, env: { ...process.env, FLUCASTR_RECORD_FILE: record },
  });
  assert.notEqual(result.status, 0, 'Sin entregables B, el ejecutor debe reportar fallo de escenario');
  assert.match(result.stdout, /"model":"pi-model-synthetic"/);
  assert.match(result.stdout, /"toolEventCount":0,"envReads":0,"cloneExecutions":0,"canaryFound":false,"permissionDenials":0/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 1\)\./);
});
