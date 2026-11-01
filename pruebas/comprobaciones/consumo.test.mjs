import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analizarSesionPi } from '../../scripts/consumo.mjs';
import {
  CENTINELA_TEXTO,
  registroSesionPi,
  turnoPi,
  resultadoPi,
  unirJsonl,
} from './consumo-fixtures.mjs';

const T1 = '2026-10-30T10:00:00.000Z';
const T2 = '2026-10-30T10:05:00.000Z';
const T3 = '2026-10-30T10:10:00.000Z';

const tresTurnos = () =>
  unirJsonl([
    registroSesionPi(),
    turnoPi({ ts: T1, contexto: 20000, output: 100, costo: 0.01 }),
    turnoPi({ ts: T2, contexto: 45000, output: 200, costo: 0.02 }),
    turnoPi({ ts: T3, contexto: 70000, output: 300, costo: 0.03 }),
  ]);

test('(a) tres turnos: forma exacta, costo total y un turno por tramo', () => {
  const r = analizarSesionPi(tresTurnos());
  assert.deepEqual(r, {
    herramienta: 'pi',
    turnos: 3,
    costo: 0.06,
    tokens: { input: 67500, output: 600, cacheRead: 67500, cacheWrite: 0 },
    tramos: {
      menos30k: { turnos: 1, costo: 0.01 },
      de30a60k: { turnos: 1, costo: 0.02 },
      mas60k: { turnos: 1, costo: 0.03 },
    },
    herramientas: {},
    llamadasSubagente: 0,
    subagentsEnable: 0,
  });
});

test('(b) límites de tramo: 29999 y 30000 / 60000 y 60001', () => {
  const r = analizarSesionPi(
    unirJsonl([
      turnoPi({ ts: T1, contexto: 29999, costo: 1 }),
      turnoPi({ ts: T1, contexto: 30000, costo: 10 }),
      turnoPi({ ts: T1, contexto: 60000, costo: 100 }),
      turnoPi({ ts: T1, contexto: 60001, costo: 1000 }),
    ]),
  );
  assert.deepEqual(r.tramos, {
    menos30k: { turnos: 1, costo: 1 },
    de30a60k: { turnos: 2, costo: 110 },
    mas60k: { turnos: 1, costo: 1000 },
  });
});

test('(c) conteos de herramientas, subagent y subagents_enable', () => {
  const r = analizarSesionPi(
    unirJsonl([
      turnoPi({
        ts: T1,
        contexto: 1000,
        llamadas: [
          { id: 'a', name: 'subagent', arguments: { task: 'x' } },
          { id: 'b', name: 'subagents_enable', arguments: {} },
          { id: 'c', name: 'read', arguments: { path: 'p' } },
        ],
      }),
      turnoPi({
        ts: T2,
        contexto: 1000,
        llamadas: [{ id: 'd', name: 'subagent', arguments: { task: 'y' } }],
      }),
    ]),
  );
  assert.equal(r.llamadasSubagente, 2);
  assert.equal(r.subagentsEnable, 1);
  assert.deepEqual(r.herramientas, { subagent: 2, subagents_enable: 1, read: 1 });
});

test('(d) hasta corta por timestamp: entre el turno 2 y el 3 deja dos turnos', () => {
  const r = analizarSesionPi(tresTurnos(), { hasta: '2026-10-30T10:07:00.000Z' });
  assert.equal(r.turnos, 2);
  assert.equal(r.costo, 0.03);
});

test('(e) líneas corruptas, compaction y resultados de herramientas no alteran el resultado', () => {
  const base = tresTurnos();
  const ruidoso = [
    base.trimEnd(),
    '{esto no es json',
    '',
    JSON.stringify({ type: 'compaction', timestamp: T2, summary: 'x' }),
    JSON.stringify({ type: 'model_change', timestamp: T2, model: 'otro' }),
    JSON.stringify(resultadoPi({ ts: T2, id: 'z', name: 'read' })),
  ].join('\n');
  assert.deepEqual(analizarSesionPi(ruidoso), analizarSesionPi(base));
});

test('(f) control negativo: otro costo produce otro costo agregado', () => {
  const caro = unirJsonl([turnoPi({ ts: T1, contexto: 100, costo: 0.5 })]);
  const barato = unirJsonl([turnoPi({ ts: T1, contexto: 100, costo: 0.25 })]);
  assert.equal(analizarSesionPi(caro).costo, 0.5);
  assert.equal(analizarSesionPi(barato).costo, 0.25);
  assert.notEqual(analizarSesionPi(caro).costo, analizarSesionPi(barato).costo);
});

test('el texto de los mensajes no aparece en el resultado', () => {
  const r = JSON.stringify(analizarSesionPi(tresTurnos()));
  assert.equal(r.includes(CENTINELA_TEXTO), false);
});
