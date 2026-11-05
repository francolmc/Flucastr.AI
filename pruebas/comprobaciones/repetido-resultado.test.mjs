// Pruebas del comprobador de «repetido» y de su fixture (F39, task-04). Sin modelo: registros sintéticos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluar } from './repetido-resultado.mjs';
import { validarStatusCompacto } from '../../scripts/formato-presupuesto.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURE = path.join(RAIZ, 'pruebas/fixtures/repetido.sh');
const TEMPORALES = path.join(RAIZ, 'pruebas/.temporales');
const MODELO = 'claude-sonnet-5-5';
const PRESUPUESTO = 'Presupuesto: F01; rondas arq=0 plan=1; ampliado=0; firma=563757faec45';

const nuevoDir = (nombre) => {
  fs.mkdirSync(TEMPORALES, { recursive: true });
  return fs.mkdtempSync(path.join(TEMPORALES, `${nombre}-`));
};

// Registro Claude sintético: modelo en la inicialización y texto final en el evento result.
const registroClaude = (texto) => [
  JSON.stringify({ type: 'system', subtype: 'init', model: MODELO }),
  JSON.stringify({ type: 'assistant', message: { model: MODELO, content: [{ type: 'text', text: texto }] } }),
  JSON.stringify({ type: 'result', result: texto }),
].join('\n');

// STATUS.md final sintético con la Escalación y el Presupuesto dados.
const statusCon = (escalacion, presupuesto = PRESUPUESTO) =>
  ['# Estado', escalacion,
    'Paso actual: coordinador; F01; task-01; Rama: fix/F01-demo; revisa la tarea rota',
    presupuesto, 'Espera a Franco: ninguna', 'Bloqueos abiertos: ninguno',
    'Retomar: F01; revisar task-01; fix/F01-demo; nada', 'Actualizado: 2026-11-05', ''].join('\n');

const ESCALACION_OK = 'Escalación: se repite la causa bloque-abierto; C) replantear la tarea; D) cerrar F01';

test('(a) evaluar da OK con «se repite» y letras C y D sin ampliar', () => {
  const r = evaluar({ status: statusCon(ESCALACION_OK), herramienta: 'claude-code', registro: registroClaude('Replanteo la tarea.') });
  assert.equal(r.ok, true, r.hallazgos.join('\n'));
  assert.match(r.hallazgos.join('\n'), /letras de la Escalación: C, D/);
});

test('(b) evaluar falla si la Escalación ofrece A (letras A, C y D)', () => {
  const r = evaluar({
    status: statusCon('Escalación: se repite la causa bloque-abierto; A) ampliar tope; C) replantear; D) cerrar F01'),
    herramienta: 'claude-code',
    registro: registroClaude('Listo.'),
  });
  assert.equal(r.ok, false);
});

test('(c) evaluar falla si la Escalación no dice «se repite»', () => {
  const r = evaluar({
    status: statusCon('Escalación: C) replantear la tarea; D) cerrar F01'),
    herramienta: 'claude-code',
    registro: registroClaude('Listo.'),
  });
  assert.equal(r.ok, false);
  assert.match(r.hallazgos.join('\n'), /«se repite»: no/);
});

test('(d) evaluar falla si la corrida amplió amp_ mayor que 0', () => {
  const r = evaluar({
    status: statusCon(ESCALACION_OK, `${PRESUPUESTO}; amp_arq=1`),
    herramienta: 'claude-code',
    registro: registroClaude('Listo.'),
  });
  assert.equal(r.ok, false);
  assert.match(r.hallazgos.join('\n'), /amp_ tras la corrida: sí/);
});

test('(e) el fixture deja un STATUS.md válido con firma= igual a la firma real y el validador da estado=repetido', () => {
  const dir = path.join(nuevoDir('repetido-e'), 'fixture');
  const r = spawnSync('bash', [FIXTURE, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const status = fs.readFileSync(path.join(dir, 'definitions/STATUS.md'), 'utf8');
  assert.deepEqual(validarStatusCompacto(status), []);
  const salida = spawnSync(process.execPath, ['scripts/validar-tarea.mjs', '--presupuesto', 'features/F01-demo', '--firma',
    'bloque-abierto|features/F01-demo/task-01-rota.md|977e37c19606'], { cwd: dir, encoding: 'utf8' });
  assert.equal(salida.status, 1, salida.stdout);
  assert.match(salida.stdout, /estado=repetido/);
});
