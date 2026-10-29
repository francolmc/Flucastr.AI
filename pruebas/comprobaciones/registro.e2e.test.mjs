import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executor = path.join(root, 'pruebas/ejecutar.sh');
const validClaude = JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-model-synthetic' }) + '\n' + JSON.stringify({ type: 'result', result: 'respuesta sintética' });
const validPi = JSON.stringify({ type: 'session', id: 'synthetic-session', cwd: '/tmp/fixture' }) + '\n' + JSON.stringify({ type: 'turn_end', message: { role: 'assistant', model: 'pi-model-synthetic', content: [{ type: 'text', text: 'respuesta sintética' }] } });
const valid = (tool) => tool === 'claude-code' ? validClaude : validPi;
function invoke(tool, command, runs = 1) {
  return spawnSync('/bin/bash', [executor, 'B', tool, String(runs), ...command], { cwd: root, encoding: 'utf8', timeout: 120_000 });
}
function recordCommand(json) { return ['bash', '-c', `printf '%s\\n' '${json.replaceAll("'", "'\\''")}' > "$FLUCASTR_RECORD_FILE"`]; }
function markerCount(marker) { return (fs.readFileSync(marker, 'utf8').match(/x/g) || []).length; }

for (const tool of ['claude-code', 'pi']) {
  test(`ejecutar.sh analiza el registro ${tool} antes de comprobar el escenario`, () => {
    const result = invoke(tool, recordCommand(valid(tool)));
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /"model":"(?:claude-model-synthetic|pi-model-synthetic)"/);
    assert.match(result.stdout, /"toolEventCount":0,"envReads":0,"cloneExecutions":0,"canaryFound":false,"permissionDenials":0/);
    assert.match(result.stdout, /FALLA: .*faltan entregables/);
    assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 1\)\./);
  });
}

test('fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente', () => {
  const marker = path.join(os.tmpdir(), `flucastr-command-${process.pid}`);
  const result = invoke('claude-code', ['bash', '-c', `echo x >> '${marker}'; exit 9`], 3);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /FALLA: comando de herramienta/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 3\)\./);
  assert.equal(markerCount(marker), 1); fs.unlinkSync(marker);
});

test('fallo duro del registro imprime resumen, devuelve error y detiene la serie', () => {
  const marker = path.join(os.tmpdir(), `flucastr-record-${process.pid}`);
  const bad = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'bad-call', name: 'Bash', input: { command: 'cat .env' } }] } });
  const result = invoke('claude-code', ['bash', '-c', `echo x >> '${marker}'; printf '%s\\n' '${bad}' > "$FLUCASTR_RECORD_FILE"`], 3);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /FALLA: comprobaciones del registro estructurado/);
  assert.match(result.stdout, /Causa: comprobación del registro estructurado/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 3\)\./);
  assert.equal(markerCount(marker), 1); fs.unlinkSync(marker);
});

test('fallo duro del escenario imprime resumen, devuelve error y detiene la serie', () => {
  const marker = path.join(os.tmpdir(), `flucastr-scenario-${process.pid}`);
  const result = invoke('claude-code', ['bash', '-c', `echo x >> '${marker}'; printf '%s\\n' '${validClaude.replaceAll("'", "'\\''")}' > "$FLUCASTR_RECORD_FILE"`], 3);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /FALLA: .*faltan entregables/);
  assert.match(result.stdout, /Serie detenida por fallo duro/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 3\)\./);
  assert.equal(markerCount(marker), 1); fs.unlinkSync(marker);
});

test('cada corrida con modelo exige su propio registro estructurado', () => {
  const marker = path.join(os.tmpdir(), `flucastr-required-${process.pid}`);
  const result = invoke('claude-code', ['bash', '-c', `echo x >> '${marker}'`], 3);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /no existe el registro estructurado requerido/);
  assert.match(result.stdout, /Causa: arnés\/configuración de registro/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 3\)\./);
  assert.equal(markerCount(marker), 1); fs.unlinkSync(marker);
});
