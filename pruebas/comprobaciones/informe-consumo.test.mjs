import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { leerArgumentos } from '../../scripts/informe.mjs';
import {
  CENTINELA_TEXTO,
  registroSesionPi,
  turnoPi,
  unirJsonl,
  metaSubagentePi,
  transcriptSubagentePi,
  registroAgentSettingClaude,
  turnoClaude,
} from './consumo-fixtures.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'scripts', 'informe.mjs');

const BASE = Date.parse('2026-10-01T10:00:00Z');
const iso = (horas) => new Date(BASE + horas * 3600000).toISOString().slice(0, 19) + 'Z';
const hex = (n, largo) => n.toString(16).padStart(largo, '0');
const T1 = '2026-10-30T10:00:00.000Z';
const T2 = '2026-10-30T10:05:00.000Z';

// Canarios: si alguno aparece en la salida, la privacidad falla.
const CANARIO_TITULO = 'CANARIO-TITULO-7f3a';
const CANARIO_AUTOR = 'CANARIO-AUTOR-7f3a';
const CANARIO_RUTA = '/Users/CANARIO-RUTA-7f3a/secreto.md';
const CANARIO_ARCHIVO = 'CANARIO-ARCHIVO-7f3a';

// Diez tareas hechas, cada una con una ejecución (como el escenario de informe.test.mjs, sin devoluciones).
let contador = 0;
function ev(evento, t, campos) {
  contador++;
  const fuente = { ejecucion: 'notas' }[evento] ?? 'git';
  return { v: 1, id: hex(contador, 12), t, evento, fuente, ...campos };
}
function escenario(n = 10) {
  const eventos = [];
  for (let i = 1; i <= n; i++) {
    const feature = `F${String(i).padStart(2, '0')}`;
    const sha = `abc${hex(i, 4)}`;
    eventos.push(ev('tarea_estado', iso(0), { feature, tarea: '01', sha, de: 'borrador', a: 'aprobada', por: 'franco' }));
    eventos.push(ev('tarea_estado', iso(2 * i), { feature, tarea: '01', sha, de: 'lista para revisión', a: 'hecha', por: 'franco' }));
    eventos.push(
      ev('ejecucion', iso(1), {
        feature,
        tarea: '01',
        sha,
        n: 1,
        herramienta: 'claude-code',
        modo: 'normal',
        intentos: 1,
        verificacion: 'pasa',
        huecos: 0,
        resultado: 'lista',
        causa: 'ninguna',
        modelo: 'claude-x',
      }),
    );
  }
  return eventos;
}
const aJsonl = (eventos) => eventos.map((e) => JSON.stringify(e)).join('\n') + '\n';

// Raíz de prueba con registro/eventos.jsonl (contenido dado).
function raizCon(contenido) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-consumo-'));
  fs.mkdirSync(path.join(raiz, 'registro'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), contenido);
  return raiz;
}

// Crea los archivos (ruta relativa → contenido), con sus carpetas.
function escribirArbol(raiz, archivos) {
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const destino = path.join(raiz, ruta);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
  }
}

// Sesiones sintéticas de Pi (coordinador) con dos subagentes, y una de Claude Code sin costo.
// Pi: turnos 2, costo 0.75; constructor 4 turnos, 0.10; planificador 2 turnos, 0.05.
const NOMBRE_PI = `2026-10-30T10-00-00.000Z_${CANARIO_ARCHIVO}.jsonl`;
function carpetaSesionesConsumo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-sesiones-'));
  escribirArbol(dir, {
    [`pi/${NOMBRE_PI}`]: unirJsonl([
      registroSesionPi({ id: 'sesion-cli', cwd: CANARIO_RUTA }),
      turnoPi({ ts: T1, contexto: 20000, output: 100, costo: 0.5 }),
      turnoPi({ ts: T2, contexto: 25000, output: 100, costo: 0.25 }),
    ]),
    'pi/subagent-artifacts/r1_constructor_meta.json': JSON.stringify(
      metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'sesion-cli', model: 'm-c', turns: 4, cost: 0.1 }),
    ),
    'pi/subagent-artifacts/r1_constructor_transcript.jsonl': transcriptSubagentePi({
      lecturas: [{ ruta: 'definitions/PROJECT.md', bytes: 2048 }],
    }),
    'pi/subagent-artifacts/r2_planificador_meta.json': JSON.stringify(
      metaSubagentePi({ runId: 'r2', agent: 'planificador', parentSessionId: 'sesion-cli', model: 'm-p', turns: 2, cost: 0.05 }),
    ),
    'pi/subagent-artifacts/r2_planificador_transcript.jsonl': transcriptSubagentePi(),
  });
  return dir;
}

// Solo sesión de Claude Code: no registra costo, así que el costo es n/d.
function carpetaSoloClaude() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-claude-'));
  escribirArbol(dir, {
    'claude/proyecto/sesion-claude.jsonl': unirJsonl([
      registroAgentSettingClaude('coordinador'),
      turnoClaude({ id: 'm1', ts: T1, input: 100 }),
    ]),
  });
  return dir;
}

const correr = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('(8) consumo opcional: con --consumo hay totales y tabla por rol; sin la bandera no hay bloque', () => {
  const raiz = raizCon(aJsonl(escenario(10)));
  const consumo = carpetaSesionesConsumo();

  const con = correr(['--raiz', raiz, '--consumo', consumo]);
  assert.equal(con.status, 0, con.stderr);
  assert.match(con.stdout, /## Consumo \(aproximado\)/);
  assert.match(con.stdout, /Total: turnos 8 · costo US\$0\.900/);
  assert.match(con.stdout, /\| coordinador \| 1 \| 2 \| US\$0\.750 \|/);
  assert.match(con.stdout, /\| constructor \| 1 \| 4 \| US\$0\.100 \|/);
  assert.match(con.stdout, /\| planificador \| 1 \| 2 \| US\$0\.050 \|/);
  assert.match(con.stdout, /por tarea \(promedio, n=10\): turnos 0\.8 · costo US\$0\.090/);
  assert.match(con.stdout, /F20 mide sesiones, no tareas: el costo por tarea es un promedio, no una atribución\./);
  // El bloque va antes de «Límites de esta lectura».
  assert.ok(con.stdout.indexOf('## Consumo') < con.stdout.indexOf('## Límites de esta lectura'));
  const md = fs.readFileSync(path.join(raiz, 'registro', 'informe.md'), 'utf8');
  assert.equal(md, con.stdout);

  const sin = correr(['--raiz', raiz]);
  assert.equal(sin.status, 0, sin.stderr);
  assert.doesNotMatch(sin.stdout, /Consumo|costo|turnos:/);
  const sinJson = JSON.parse(correr(['--raiz', raiz, '--json']).stdout);
  assert.equal('consumo' in sinJson, false);

  // --json con la bandera trae la clave consumo con los mismos números.
  const conJson = JSON.parse(correr(['--raiz', raiz, '--consumo', consumo, '--json']).stdout);
  assert.equal(conJson.consumo.turnos, 8);
  assert.equal(conJson.consumo.porTarea.n, 10);
  assert.deepEqual(
    conJson.consumo.filas.map((f) => [f.rol, f.corridas, f.turnos]),
    [['constructor', 1, 4], ['coordinador', 1, 2], ['planificador', 1, 2]],
  );

  // n < minimo: el bloque no se calcula (consumo null en JSON, sin bloque en Markdown).
  const pocas = JSON.parse(correr(['--raiz', raiz, '--consumo', consumo, '--json', '--minimo', '11']).stdout);
  assert.equal(pocas.consumo, null);
  assert.equal(pocas.suficiente, false);

  for (const d of [raiz, consumo]) fs.rmSync(d, { recursive: true, force: true });
});

test('(8b) control negativo: sin costo numérico el costo sale n/d; la tabla sigue con las corridas y turnos', () => {
  const raiz = raizCon(aJsonl(escenario(10)));
  const consumo = carpetaSoloClaude();
  const r = correr(['--raiz', raiz, '--consumo', consumo]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Total: turnos 1 · costo n\/d/);
  assert.match(r.stdout, /\| coordinador \| 1 \| 1 \| n\/d \|/);
  assert.match(r.stdout, /por tarea \(promedio, n=10\): turnos 0\.1 · costo n\/d/);
  for (const d of [raiz, consumo]) fs.rmSync(d, { recursive: true, force: true });
});

test('(6) privacidad: canarios del log y de la sesión no aparecen en informe.md ni en stdout', () => {
  // Líneas con claves y valores canario que validarEvento rechaza (se cuentan, no se muestran).
  const canarios = [
    JSON.stringify({ v: 1, id: 'ffffffffffff', t: iso(0), evento: 'tarea_estado', fuente: 'git', feature: 'F01', tarea: '01', sha: 'abc0001', de: 'borrador', a: 'aprobada', por: 'franco', titulo: CANARIO_TITULO, autor: CANARIO_AUTOR }),
    JSON.stringify({ v: 1, id: 'fffffffffffe', t: iso(0), evento: 'ejecucion', fuente: 'notas', feature: 'F02', tarea: '01', sha: 'abc0002', ruta: CANARIO_RUTA, n: 1 }),
  ];
  const raiz = raizCon(aJsonl(escenario(10)) + canarios.join('\n') + '\n');
  const consumo = carpetaSesionesConsumo();

  const r = correr(['--raiz', raiz, '--consumo', consumo]);
  assert.equal(r.status, 0, r.stderr);
  const md = fs.readFileSync(path.join(raiz, 'registro', 'informe.md'), 'utf8');
  for (const salida of [r.stdout, md]) {
    assert.match(salida, /## Consumo \(aproximado\)/, 'el bloque tiene que estar, para que la prueba no sea vacía');
    for (const canario of [CANARIO_TITULO, CANARIO_AUTOR, CANARIO_RUTA, CANARIO_ARCHIVO, '/Users/CANARIO', CENTINELA_TEXTO]) {
      assert.equal(salida.includes(canario), false, `aparece «${canario}»`);
    }
  }
  assert.match(r.stdout, /líneas no válidas: 2/);

  // Lo mismo en --json con la bandera.
  const json = correr(['--raiz', raiz, '--consumo', consumo, '--json']);
  for (const canario of [CANARIO_TITULO, CANARIO_AUTOR, CANARIO_RUTA, CANARIO_ARCHIVO]) {
    assert.equal(json.stdout.includes(canario), false, `aparece «${canario}» en --json`);
  }

  for (const d of [raiz, consumo]) fs.rmSync(d, { recursive: true, force: true });
});

test('(8c) --consumo con carpeta inexistente o que es archivo: código 1 y no escribe', () => {
  const raiz = raizCon(aJsonl(escenario(10)));
  const archivo = path.join(raiz, 'no-es-carpeta.txt');
  fs.writeFileSync(archivo, 'x');
  for (const destino of [path.join(raiz, 'no-existe'), archivo]) {
    const r = correr(['--raiz', raiz, '--consumo', destino]);
    assert.equal(r.status, 1, destino);
    assert.match(r.stderr, /--consumo exige una carpeta existente/);
    assert.equal(r.stdout, '');
    assert.equal(fs.existsSync(path.join(raiz, 'registro', 'informe.md')), false);
  }
  // Sin valor también es error.
  assert.equal(correr(['--raiz', raiz, '--consumo']).status, 1);
  assert.equal(leerArgumentos(['--consumo']).error, 'falta el valor de --consumo');
  fs.rmSync(raiz, { recursive: true, force: true });
});
