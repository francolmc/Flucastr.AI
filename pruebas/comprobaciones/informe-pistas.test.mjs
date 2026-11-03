import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { calcularPistas } from '../../scripts/pistas.mjs';
import { metaSubagentePi, registroSesionPi, transcriptSubagentePi, turnoPi, unirJsonl } from './consumo-fixtures.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'scripts', 'informe.mjs');

// Eventos sintéticos (no se leen registro/ ni .env).
const BASE = Date.parse('2026-10-01T10:00:00Z');
const hex = (n, largo) => n.toString(16).padStart(largo, '0');
const iso = (s) => new Date(BASE + s * 1000).toISOString().slice(0, 19) + 'Z';
const FUENTE = { tarea_estado: 'git', ejecucion: 'notas', bloqueo: 'notas', cancelacion: 'notas' };
let contador = 0;
function ev(evento, campos) {
  contador++;
  return { v: 1, id: hex(contador, 12), t: iso(contador * 60), evento, fuente: FUENTE[evento], sha: 'abc0001', ...campos };
}
const estado = (feature, tarea, a) => ev('tarea_estado', { feature, tarea, de: null, a, por: 'franco' });
const bloqueo = (feature, tarea, tipo) => ev('bloqueo', { feature, tarea, n: 1, tipo, falta: '-' });
const cancelacion = (feature, tarea) => ev('cancelacion', { feature, tarea, motivo: 'obsoleta' });
const ejecucion = (feature, tarea) =>
  ev('ejecucion', {
    feature,
    tarea,
    n: 1,
    herramienta: 'claude-code',
    modo: 'normal',
    intentos: 1,
    verificacion: 'pasa',
    huecos: 0,
    resultado: 'lista',
    causa: 'ninguna',
    modelo: 'claude-x',
  });
const de = (pistas, n) => pistas.filter((p) => p.n === n);

// Pista 1: umbral 2 bloqueos tipo=entorno.
test('pista 1 dispara con 2 bloqueos de entorno y no con 1', () => {
  assert.deepEqual(calcularPistas([bloqueo('F01', '01', 'entorno')]), []);
  const pistas = calcularPistas([bloqueo('F01', '01', 'entorno'), bloqueo('F01', '02', 'entorno')]);
  assert.deepEqual(
    pistas.map((p) => [p.n, p.feature, p.medicion]),
    [[1, 'F01', '2 bloqueos tipo=entorno']],
  );
  assert.equal(pistas[0].accion, 'Añade `Requiere:` a sus tareas o arregla el entorno antes de aprobar.');
});

// Pista 3: más de 0,30 de tareas canceladas; 3 de 8 dispara, 2 de 8 no.
test('pista 3 dispara con 3 de 8 canceladas y no con 2 de 8', () => {
  const escenario = (k) => {
    const eventos = [];
    for (let i = 1; i <= 8; i++) eventos.push(estado('F01', hex(i, 2), i <= k ? 'cancelada' : 'aprobada'));
    return eventos;
  };
  const dispara = de(calcularPistas(escenario(3)), 3);
  assert.deepEqual(
    dispara.map((p) => p.medicion),
    ['3 de 8 tareas canceladas (38 %)'],
  );
  assert.equal(dispara[0].accion, 'Se planifica de más: baja el tamaño de la feature o valida la idea antes de descomponer.');
  assert.deepEqual(de(calcularPistas(escenario(2)), 3), []);
});

// Pista 4, forma a: cancelada sin cancelacion (motivo).
test('pista 4 cancelada sin motivo dispara solo sin cancelacion', () => {
  const sin = calcularPistas([estado('F01', '01', 'cancelada'), estado('F01', '02', 'aprobada')]);
  assert.deepEqual(
    de(sin, 4).map((p) => p.medicion),
    ['1 cancelada(s) sin motivo'],
  );
  const con = calcularPistas([estado('F01', '01', 'cancelada'), cancelacion('F01', '01'), estado('F01', '02', 'aprobada')]);
  assert.deepEqual(de(con, 4), []);
});

// Pista 4, forma b: hecha sin ejecución; no dispara si la feature no tiene ninguna ejecución.
test('pista 4 hecha sin ejecución dispara solo si la feature tiene alguna ejecución', () => {
  const con = calcularPistas([
    ejecucion('F01', '01'),
    estado('F01', '01', 'hecha'),
    estado('F01', '02', 'hecha'),
  ]);
  assert.deepEqual(
    de(con, 4).map((p) => p.medicion),
    ['1 hecha(s) sin ejecución válida'],
  );
  const sin = calcularPistas([estado('F02', '01', 'hecha')]);
  assert.deepEqual(de(sin, 4), []);
});

// Pista 5: umbral 2 bloqueos de alcance o especificación.
test('pista 5 dispara con 2 bloqueos de alcance o especificación y no con 1', () => {
  assert.deepEqual(calcularPistas([bloqueo('F01', '01', 'alcance')]), []);
  const pistas = calcularPistas([bloqueo('F01', '01', 'alcance'), bloqueo('F01', '02', 'especificacion')]);
  assert.deepEqual(
    pistas.map((p) => [p.n, p.medicion]),
    [[5, '2 bloqueos de alcance o especificación']],
  );
});

test('las pistas salen ordenadas por número y feature', () => {
  const pistas = calcularPistas([
    bloqueo('F02', '01', 'alcance'),
    bloqueo('F02', '02', 'alcance'),
    bloqueo('F01', '01', 'entorno'),
    bloqueo('F01', '02', 'entorno'),
  ]);
  assert.deepEqual(
    pistas.map((p) => [p.n, p.feature]),
    [
      [1, 'F01'],
      [5, 'F02'],
    ],
  );
});

// CLI: la sección y la clave aparecen solo con --pistas.
const raices = [];
after(() => {
  for (const r of raices) fs.rmSync(r, { recursive: true, force: true });
});

function raizCon(eventos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-pistas-test-'));
  raices.push(raiz);
  fs.mkdirSync(path.join(raiz, 'registro'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), eventos.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return raiz;
}

function correr(raiz, args) {
  return spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, ...args], { encoding: 'utf8' });
}

test('la CLI imprime «## Pistas» solo con --pistas y la clave pistas solo en --json con --pistas', () => {
  const raiz = raizCon([bloqueo('F01', '01', 'entorno'), bloqueo('F01', '02', 'entorno')]);

  const con = correr(raiz, ['--pistas']);
  assert.equal(con.status, 0, con.stderr);
  assert.match(con.stdout, /^## Pistas$/m);
  assert.ok(con.stdout.includes('- Pista 1 [F01]: 2 bloqueos tipo=entorno. Añade `Requiere:`'));
  assert.ok(con.stdout.indexOf('## Pistas') < con.stdout.indexOf('## Límites de esta lectura'));

  const sin = correr(raiz, []);
  assert.equal(sin.status, 0, sin.stderr);
  assert.ok(!sin.stdout.includes('## Pistas'));

  const jsonCon = JSON.parse(correr(raiz, ['--json', '--pistas']).stdout);
  assert.deepEqual(
    jsonCon.pistas.map((p) => [p.n, p.feature, p.medicion]),
    [[1, 'F01', '2 bloqueos tipo=entorno']],
  );

  const jsonSin = JSON.parse(correr(raiz, ['--json']).stdout);
  assert.equal('pistas' in jsonSin, false);
});

test('la CLI con --pistas y sin pistas imprime la frase fija', () => {
  const raiz = raizCon([estado('F01', '01', 'aprobada')]);
  const r = correr(raiz, ['--pistas']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('Sin pistas: ninguna medición supera su umbral.'));
});

// Pista 2 (task-13): corridas { rol, disparo, feature, tarea, turnos, costo } de task-10.
const corrida = (rol, { disparo = { origen: 'bloqueo', tarea: '01' }, feature = null } = {}) => ({
  rol,
  disparo,
  feature,
  tarea: '02',
  turnos: 1,
  costo: null,
});

test('pista 2 cuenta solo vueltas de planificador o arquitecto a un bloqueo de entorno de la feature', () => {
  const eventos = [bloqueo('F01', '01', 'entorno')];
  assert.deepEqual(de(calcularPistas(eventos), 2), []);

  // Una vuelta de planificador cuenta; la de constructor no; feature nula cuenta.
  const una = de(calcularPistas(eventos, { corridas: [corrida('planificador'), corrida('constructor')] }), 2);
  assert.deepEqual(
    una.map((p) => [p.feature, p.medicion]),
    [['F01', '1 vuelta(s) de entorno a planificador o arquitecto']],
  );
  assert.equal(una[0].accion, 'Esa vuelta no podía arreglarlo: usa `rol=franco`.');

  // Arquitecto y planificador suman; un disparo que no es bloqueo no cuenta.
  const dos = de(
    calcularPistas(eventos, {
      corridas: [corrida('arquitecto'), corrida('planificador'), corrida('planificador', { disparo: { origen: 'puerta', puerta: 1 } })],
    }),
    2,
  );
  assert.deepEqual(
    dos.map((p) => p.medicion),
    ['2 vuelta(s) de entorno a planificador o arquitecto'],
  );

  // Otra feature no cuenta: corrida.feature = F02 con bloqueo de entorno solo en F01.
  assert.deepEqual(de(calcularPistas(eventos, { corridas: [corrida('planificador', { feature: 'F02' })] }), 2), []);
  // Un bloqueo de entorno de otra tarea no cuenta.
  assert.deepEqual(de(calcularPistas(eventos, { corridas: [corrida('planificador', { disparo: { origen: 'bloqueo', tarea: '09' } })] }), 2), []);
});

// Pista 6 (task-13): consumo de bloqueConsumo: filas { rol, corridas, turnos, costo } y costo total (null sin costo).
const fila = (rol, costo, turnos) => ({ rol, corridas: 1, turnos, costo });
const consumoCon = (filas, costo) => ({ turnos: 0, costo, filas, porTarea: { n: 0, turnos: null, costo: null } });

test('pista 6 dispara con más de 60 % por costo y no con 55 %', () => {
  // arquitecto + planificador = 0,65 de 1,00.
  const dispara = de(
    calcularPistas([], { consumo: consumoCon([fila('arquitecto', 0.4, 2), fila('planificador', 0.25, 3), fila('constructor', 0.35, 9)], 1) }),
    6,
  );
  assert.deepEqual(
    dispara.map((p) => [p.feature, p.medicion]),
    [[null, 'arquitecto+planificador = 65 % del total']],
  );
  assert.equal(dispara[0].accion, 'Pocos bloques de ejecución para el costo de definir: junta features chicas.');

  // arquitecto + planificador = 0,55 de 1,00: no dispara.
  const no = calcularPistas([], { consumo: consumoCon([fila('arquitecto', 0.4, 2), fila('planificador', 0.15, 3), fila('constructor', 0.45, 9)], 1) });
  assert.deepEqual(de(no, 6), []);
});

test('pista 6 usa turnos cuando el costo es null', () => {
  // 13 de 20 turnos = 65 %: dispara.
  const dispara = de(
    calcularPistas([], { consumo: consumoCon([fila('arquitecto', null, 7), fila('planificador', null, 6), fila('constructor', null, 7)], null) }),
    6,
  );
  assert.deepEqual(
    dispara.map((p) => p.medicion),
    ['arquitecto+planificador = 65 % del total'],
  );
  // 6 de 20 turnos = 30 %: no dispara.
  const no = calcularPistas([], { consumo: consumoCon([fila('arquitecto', null, 4), fila('planificador', null, 2), fila('constructor', null, 14)], null) });
  assert.deepEqual(de(no, 6), []);
});

// CLI de punta a punta: sesiones sintéticas de Pi (coordinador + planificador con Disparó: BLOQUEO task-01 en F01).
const TASK_BLOQUEO = 'Disparó: BLOQUEO task-01\nLee: features/F01-demo/task-02-plan.md\n';
function carpetaSesionesPi() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pistas-sesiones-'));
  raices.push(dir);
  const archivos = {
    'pi/2026-10-30T10-00-00.000Z_pistas.jsonl': unirJsonl([
      registroSesionPi({ id: 'sesion-pistas' }),
      turnoPi({ ts: '2026-10-30T10:00:00.000Z', contexto: 20000, output: 100, costo: 0.5 }),
    ]),
    'pi/subagent-artifacts/r1_planificador_meta.json': JSON.stringify(
      metaSubagentePi({ runId: 'r1', agent: 'planificador', parentSessionId: 'sesion-pistas', model: 'm-p', turns: 2, cost: 0.05, task: TASK_BLOQUEO }),
    ),
    'pi/subagent-artifacts/r1_planificador_transcript.jsonl': transcriptSubagentePi(),
  };
  for (const [rel, contenido] of Object.entries(archivos)) {
    const ruta = path.join(dir, rel);
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, contenido);
  }
  return dir;
}

test('CLI: --consumo <dir> --pistas evalúa la pista 2 y sin --consumo dice que 2 y 6 no se evaluaron', () => {
  const raiz = raizCon([bloqueo('F01', '01', 'entorno')]);
  const sesiones = carpetaSesionesPi();

  const con = correr(raiz, ['--consumo', sesiones, '--pistas']);
  assert.equal(con.status, 0, con.stderr);
  assert.ok(
    con.stdout.includes('- Pista 2 [F01]: 1 vuelta(s) de entorno a planificador o arquitecto. Esa vuelta no podía arreglarlo: usa `rol=franco`.'),
  );
  assert.ok(!con.stdout.includes('no evaluadas'));

  const sin = correr(raiz, ['--pistas']);
  assert.equal(sin.status, 0, sin.stderr);
  assert.ok(sin.stdout.includes('(pistas 2 y 6 no evaluadas: falta --consumo <dir>)'));
  assert.ok(!sin.stdout.includes('- Pista 2'));
});
