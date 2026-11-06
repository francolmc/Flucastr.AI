// Pruebas del comprobador de «excedido» + «A» y de su fixture (F36, task-01). Sin modelo: registros sintéticos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ampArq, evaluar, informe, letrasDeEscalacion } from './excedido-resultado.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURE = path.join(RAIZ, 'pruebas/fixtures/excedido.sh');
const TEMPORALES = path.join(RAIZ, 'pruebas/.temporales');
const MODELO = 'claude-sonnet-5-5';
const PRESUPUESTO_LINEA = 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0';

const nuevoDir = (nombre) => {
  fs.mkdirSync(TEMPORALES, { recursive: true });
  return fs.mkdtempSync(path.join(TEMPORALES, `${nombre}-`));
};

const construirFixture = (dir) => {
  const r = spawnSync('bash', [FIXTURE, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return dir;
};

const validar = (dir) => spawnSync(process.execPath, ['scripts/validar-tarea.mjs', '--presupuesto', 'features/F01-demo'],
  { cwd: dir, encoding: 'utf8' });

// Registro Claude sintético: modelo en la inicialización y texto final en el evento result.
const registroClaude = (texto) => [
  JSON.stringify({ type: 'system', subtype: 'init', model: MODELO }),
  JSON.stringify({ type: 'assistant', message: { model: MODELO, content: [{ type: 'text', text: texto }] } }),
  JSON.stringify({ type: 'result', result: texto }),
].join('\n');

// Escribe un STATUS.md del fixture con la línea Presupuesto cambiada y la Escalación dada.
const statusCon = (presupuesto, escalacion = 'Escalación: ninguna') =>
  ['# Estado', escalacion,
    'Paso actual: coordinador; F01; task-02; Rama: fix/F01-demo; Franco revisa la tarea bloqueada',
    presupuesto, 'Espera a Franco: ninguna', 'Bloqueos abiertos: task-02 bloqueada; rol=arquitecto',
    'Retomar: F01; replantear task-02; fix/F01-demo; nada', 'Actualizado: 2026-11-03', ''].join('\n');

test('(a) el fixture da estado=excedido arq y sale 1', () => {
  const dir = construirFixture(nuevoDir('excedido-a'));
  const r = validar(path.join(dir));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /estado=excedido arq/);
});

test('(b) con amp_arq=1 tras ampliado=0 da estado=ok y sale 0', () => {
  const dir = construirFixture(nuevoDir('excedido-b'));
  const status = path.join(dir, 'definitions/STATUS.md');
  const texto = fs.readFileSync(status, 'utf8').replace('ampliado=0', 'ampliado=0; amp_arq=1');
  fs.writeFileSync(status, texto);
  const r = validar(dir);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /estado=ok/);
});

test('(c) letrasDeEscalacion halla A y C en una línea con A) … C)', () => {
  assert.deepEqual(letrasDeEscalacion(statusCon(PRESUPUESTO_LINEA, 'Escalación: A) ampliar tope; C) cerrar F01')), ['A', 'C']);
});

test('(d) letrasDeEscalacion devuelve [] con Escalación: ninguna', () => {
  assert.deepEqual(letrasDeEscalacion(statusCon(PRESUPUESTO_LINEA)), []);
});

test('(e) ampArq lee 1 y 0', () => {
  assert.equal(ampArq(statusCon(`${PRESUPUESTO_LINEA}; amp_arq=1`)), 1);
  assert.equal(ampArq(statusCon(PRESUPUESTO_LINEA)), 0);
});

test('(f) evaluar es ok con amp_arq=1 y texto final «Listo»', () => {
  const r = evaluar({
    etapa1: statusCon(PRESUPUESTO_LINEA, 'Escalación: A) ampliar tope; B) cerrar F01'),
    etapa2: statusCon(`${PRESUPUESTO_LINEA}; amp_arq=1`),
    herramienta: 'claude-code',
    registro2: registroClaude('Listo'),
  });
  assert.equal(r.ok, true);
  assert.ok(r.hallazgos.some((h) => h.includes('amp_arq tras «A»: 1')));
});

test('(g) evaluar falla con amp_arq=1 y texto «no corresponde ampliar topes»', () => {
  const r = evaluar({
    etapa1: statusCon(PRESUPUESTO_LINEA, 'Escalación: A) ampliar tope; B) cerrar F01'),
    etapa2: statusCon(`${PRESUPUESTO_LINEA}; amp_arq=1`),
    herramienta: 'claude-code',
    registro2: registroClaude('No corresponde ampliar topes.'),
  });
  assert.equal(r.ok, false);
});

test('(h) evaluar falla sin amp_arq', () => {
  const r = evaluar({
    etapa1: statusCon(PRESUPUESTO_LINEA, 'Escalación: A) ampliar tope'),
    etapa2: statusCon(PRESUPUESTO_LINEA),
    herramienta: 'claude-code',
    registro2: registroClaude('Listo'),
  });
  assert.equal(r.ok, false);
});

test('(i) informe contiene Veredicto: OK con un dir armado a mano', () => {
  const dir = nuevoDir('excedido-i');
  construirFixture(path.join(dir, 'fixture'));
  fs.mkdirSync(path.join(dir, 'etapa1'));
  fs.mkdirSync(path.join(dir, 'etapa2'));
  fs.writeFileSync(path.join(dir, 'etapa1/STATUS.md'), statusCon(PRESUPUESTO_LINEA, 'Escalación: A) ampliar tope; B) cerrar F01'));
  const etapa2 = statusCon(`${PRESUPUESTO_LINEA}; amp_arq=1`);
  fs.writeFileSync(path.join(dir, 'etapa2/STATUS.md'), etapa2);
  fs.writeFileSync(path.join(dir, 'fixture/definitions/STATUS.md'), etapa2);
  fs.writeFileSync(path.join(dir, 'etapa2.jsonl'), registroClaude('Listo'));
  const texto = informe({ dir, herramienta: 'claude-code' });
  assert.match(texto, /^# Excedido \+ «A» — claude-code/m);
  assert.match(texto, /Veredicto: OK/);
  assert.match(texto, /Estado de --presupuesto tras «A»: .*estado=ok/);
});
