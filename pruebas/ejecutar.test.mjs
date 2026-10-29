import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const executor = path.join(here, 'ejecutar.sh');
const scenarios = ['B', 'M', 'C', 'R'];

function run(args) {
  return spawnSync('/bin/bash', [executor, ...args], {
    cwd: path.resolve(here, '..'), encoding: 'utf8', timeout: 120_000,
  });
}

for (const scenario of scenarios) {
  test(`${scenario}: ejecutar.sh genera fixture e instantánea y resume correctamente`, () => {
    const result = run([scenario, 'claude-code', '1']);
    assert.notEqual(result.status, 0, 'Sin entregables del agente, el ejecutor debe reportar el fallo de evaluación');
    assert.match(result.stdout, new RegExp(`Corrida 1/1: escenario=${scenario} herramienta=claude-code`));
    assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 1 pendientes de registro \(de 1\)\./);
    assert.match(result.stdout, /FALLA: faltan entregables/);
    const fixture = result.stdout.split('\n').find((line) => line.startsWith('Fixture temporal: '))?.slice('Fixture temporal: '.length);
    assert.ok(fixture && existsSync(fixture), `No se encontró fixture generado en stdout:\n${result.stdout}`);
    assert.match(result.stdout, new RegExp(`${scenario} generado`));
    const snapshotRoot = scenario === 'R' ? path.join(fixture, 'repo') : fixture;
    assert.ok(existsSync(path.join(path.dirname(snapshotRoot), '.instantanea-inicial.json')), 'Falta la instantánea inicial');
  });
}

test('devuelve código distinto de cero ante fallo del comando y resume el fallo', () => {
  const result = run(['B', 'claude-code', '1', 'false']);
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /FALLA: comando de herramienta/);
  assert.match(result.stdout, /Resumen: 0 aprobadas, 1 fallidas, 0 pendientes de registro \(de 1\)\./);
});
