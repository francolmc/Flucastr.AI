import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analizarSesionPi,
  analizarSubagentesPi,
  unirPi,
  analizarSesionClaude,
  analizarSubagentesClaude,
  leerEstados,
  costoPorTarea,
  formatearPorTarea,
  resumenLecturaExtra,
} from '../../scripts/consumo.mjs';
import {
  CENTINELA_TEXTO,
  registroSesionPi,
  turnoPi,
  resultadoPi,
  unirJsonl,
  metaSubagentePi,
  transcriptSubagentePi,
  registroAgentSettingClaude,
  turnoClaude,
  resultadoReadClaude,
  metaSubagenteClaude,
  registroPromptClaude,
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
    tiposDeTurno: { texto: { turnos: 3, costo: 0.06 } },
    lecturas: { porArchivo: {}, kbTotal: 0, kbPorCategoria: { definiciones: 0, tareas: 0, otros: 0 } },
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

// Un turno con una sola llamada (o ninguna) y costo 0.01: para comprobar el tipo asignado.
const tipoDe = (llamadas) =>
  analizarSesionPi(unirJsonl([turnoPi({ ts: T1, contexto: 1000, costo: 0.01, llamadas })])).tiposDeTurno;

test('tipos de turno (1): subagents_enable', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'subagents_enable', arguments: {} }]), {
    subagents_enable: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (2): delegar (llamada subagent)', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'subagent', arguments: { task: 'x' } }]), {
    delegar: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (3): reescribir_status (write sobre definitions/STATUS.md)', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'write', arguments: { path: 'definitions/STATUS.md', content: 'x' } }]), {
    reescribir_status: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (4): cambiar_estado (edit sobre una tarea)', () => {
  assert.deepEqual(
    tipoDe([{ id: 'a', name: 'edit', arguments: { path: 'features/F20-medicion-consumo/task-02-x.md' } }]),
    { cambiar_estado: { turnos: 1, costo: 0.01 } },
  );
});

test('tipos de turno (5): leer_tarea (read de una tarea)', () => {
  assert.deepEqual(
    tipoDe([{ id: 'a', name: 'read', arguments: { path: 'features/F20-medicion-consumo/task-02-x.md' } }]),
    { leer_tarea: { turnos: 1, costo: 0.01 } },
  );
});

test('tipos de turno (6): leer_status_backlog (read de BACKLOG.md)', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'read', arguments: { path: 'definitions/BACKLOG.md' } }]), {
    leer_status_backlog: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (7): leer_definiciones (read de definitions/ARCHITECTURE.md)', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } }]), {
    leer_definiciones: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (8): texto (turno sin llamadas)', () => {
  assert.deepEqual(tipoDe([]), { texto: { turnos: 1, costo: 0.01 } });
});

test('tipos de turno (9): otro (bash)', () => {
  assert.deepEqual(tipoDe([{ id: 'a', name: 'bash', arguments: { command: 'ls' } }]), {
    otro: { turnos: 1, costo: 0.01 },
  });
});

test('tipos de turno (orden): delegar gana a leer_definiciones en el mismo turno', () => {
  assert.deepEqual(
    tipoDe([
      { id: 'a', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
      { id: 'b', name: 'subagent', arguments: { task: 'x' } },
    ]),
    { delegar: { turnos: 1, costo: 0.01 } },
  );
});

// Dos lecturas de definitions/ARCHITECTURE.md (3072 y 1024 bytes) y una de una tarea (512 bytes).
// Con errorEnDefiniciones, se añade una tercera lectura de definitions/ de 9999 bytes que devuelve isError:true.
const sesionConLecturas = ({ errorEnDefiniciones = false } = {}) => {
  const conError = errorEnDefiniciones
    ? [
        { id: 'r4', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
      ]
    : [];
  return unirJsonl([
    turnoPi({
      ts: T1,
      contexto: 1000,
      llamadas: [
        { id: 'r1', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
        { id: 'r2', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
        { id: 'r3', name: 'read', arguments: { path: 'features/F20-medicion-consumo/task-02-x.md' } },
        ...conError,
      ],
    }),
    resultadoPi({ ts: T2, id: 'r1', name: 'read', texto: 'a'.repeat(3072) }),
    resultadoPi({ ts: T2, id: 'r2', name: 'read', texto: 'a'.repeat(1024) }),
    resultadoPi({ ts: T2, id: 'r3', name: 'read', texto: 'a'.repeat(512) }),
    ...(errorEnDefiniciones
      ? [resultadoPi({ ts: T2, id: 'r4', name: 'read', texto: 'a'.repeat(9999), error: true })]
      : []),
  ]);
};

test('lecturas: KB por archivo y por categoría (3072 + 1024 bytes en definitions/, 512 en una tarea)', () => {
  const r = analizarSesionPi(sesionConLecturas());
  assert.deepEqual(r.lecturas.porArchivo, {
    'definitions/ARCHITECTURE.md': { lecturas: 2, kb: 4 },
    'features/F20-medicion-consumo/task-02-x.md': { lecturas: 1, kb: 0.5 },
  });
  assert.equal(r.lecturas.kbTotal, 4.5);
  assert.equal(r.lecturas.kbPorCategoria.definiciones, 4);
  assert.equal(r.lecturas.kbPorCategoria.tareas, 0.5);
  assert.equal(r.lecturas.kbPorCategoria.otros, 0);
});

test('lecturas: dos lecturas de definitions/ARCHITECTURE.md de 3072 y 1024 bytes suman lecturas:2, kb:4', () => {
  const r = analizarSesionPi(
    unirJsonl([
      turnoPi({
        ts: T1,
        contexto: 1000,
        llamadas: [
          { id: 'r1', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
          { id: 'r2', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } },
        ],
      }),
      resultadoPi({ ts: T2, id: 'r1', name: 'read', texto: 'a'.repeat(3072) }),
      resultadoPi({ ts: T2, id: 'r2', name: 'read', texto: 'a'.repeat(1024) }),
    ]),
  );
  assert.deepEqual(r.lecturas.porArchivo, { 'definitions/ARCHITECTURE.md': { lecturas: 2, kb: 4 } });
  assert.equal(r.lecturas.kbPorCategoria.definiciones, 4);
});

test('lecturas: un read con isError:true no suma', () => {
  const r = analizarSesionPi(sesionConLecturas({ errorEnDefiniciones: true }));
  // La lectura r4 (9999 bytes, con error) no cuenta: quedan 2 lecturas de definitions/ por 4096 bytes.
  assert.deepEqual(r.lecturas.porArchivo['definitions/ARCHITECTURE.md'], { lecturas: 2, kb: 4 });
  assert.equal(r.lecturas.kbPorCategoria.definiciones, 4);
});

test('lecturas, control negativo: sin lecturas de definitions/, kbPorCategoria.definiciones es 0', () => {
  const r = analizarSesionPi(
    unirJsonl([
      turnoPi({
        ts: T1,
        contexto: 1000,
        llamadas: [{ id: 'r1', name: 'read', arguments: { path: 'features/F20-medicion-consumo/task-02-x.md' } }],
      }),
      resultadoPi({ ts: T2, id: 'r1', name: 'read', texto: 'a'.repeat(512) }),
    ]),
  );
  assert.equal(r.lecturas.kbPorCategoria.definiciones, 0);
  assert.equal(Object.keys(r.lecturas.porArchivo).some((ruta) => ruta.includes('definitions/')), false);
});

// ---- task-03: subagentes de Pi ----

const M1 = Date.parse(T1);
const M2 = Date.parse(T2);
const M3 = Date.parse(T3);

// Carpeta de artefactos: los nombres siguen <runId>_<agente>_meta.json y <runId>_<agente>_transcript.jsonl.
// Sin transcript, no se crea el archivo.
const corrida = (meta, transcript) => ({
  [`${meta.runId}_${meta.agent}_meta.json`]: JSON.stringify(meta),
  ...(transcript === undefined ? {} : { [`${meta.runId}_${meta.agent}_transcript.jsonl`]: transcript }),
});

// Tres corridas de la sesión S1 (constructor ×2, planificador ×1) y una de otra sesión (S2) que debe excluirse.
const escenarioTresCorridas = () =>
  Object.assign(
    {},
    corrida(
      metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'S1', model: 'm-c', timestamp: M1, turns: 10, cost: 0.1 }),
      transcriptSubagentePi(),
    ),
    corrida(
      metaSubagentePi({ runId: 'r2', agent: 'constructor', parentSessionId: 'S1', model: 'm-c', timestamp: M2, turns: 20, cost: 0.25 }),
      transcriptSubagentePi(),
    ),
    corrida(
      metaSubagentePi({ runId: 'r3', agent: 'planificador', parentSessionId: 'S1', model: 'm-p', timestamp: M2, turns: 5, cost: 0.05 }),
      transcriptSubagentePi({ lecturas: [{ ruta: 'definitions/PROJECT.md', bytes: 2048 }] }),
    ),
    corrida(
      metaSubagentePi({ runId: 'r4', agent: 'constructor', parentSessionId: 'S2', timestamp: M2, turns: 99, cost: 9 }),
      transcriptSubagentePi(),
    ),
  );

// Crea una carpeta temporal con los archivos dados, ejecuta fn(dir) y la borra.
const conCarpeta = (archivos, fn) => {
  const dir = mkdtempSync(join(tmpdir(), 'consumo-subagentes-'));
  try {
    for (const [nombre, contenido] of Object.entries(archivos)) writeFileSync(join(dir, nombre), contenido);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('subagentes (1): tres corridas de S1 suman por rol; la de S2 se excluye', () => {
  const r = conCarpeta(escenarioTresCorridas(), (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }));
  assert.deepEqual(r.porRol, {
    constructor: { corridas: 2, turnos: 30, costo: 0.35, kbTotal: 0, sinTranscript: false, porArchivo: {} },
    planificador: {
      corridas: 1,
      turnos: 5,
      costo: 0.05,
      kbTotal: 2,
      sinTranscript: false,
      porArchivo: { 'definitions/PROJECT.md': { lecturas: 1, kb: 2 } },
    },
  });
  assert.deepEqual(r.modelos, { constructor: ['m-c'], planificador: ['m-p'] });
});

test('subagentes (2): transcript ausente: KB 0 y sinTranscript:true', () => {
  const r = conCarpeta(
    corrida(metaSubagentePi({ runId: 'r5', agent: 'arquitecto', parentSessionId: 'S1', timestamp: M1, turns: 3, cost: 0.2 })),
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.deepEqual(r.porRol.arquitecto, { corridas: 1, turnos: 3, costo: 0.2, kbTotal: 0, sinTranscript: true, porArchivo: {} });
});

test('subagentes (3): hasta descarta las corridas con timestamp posterior', () => {
  const archivos = Object.assign(
    {},
    corrida(metaSubagentePi({ runId: 'h1', agent: 'constructor', parentSessionId: 'S1', timestamp: M1, turns: 1, cost: 0.01 }), transcriptSubagentePi()),
    corrida(metaSubagentePi({ runId: 'h2', agent: 'constructor', parentSessionId: 'S1', timestamp: M3, turns: 7, cost: 0.07 }), transcriptSubagentePi()),
  );
  const r = conCarpeta(archivos, (dir) => analizarSubagentesPi(dir, { sesionId: 'S1', hasta: '2026-10-30T10:07:00.000Z' }));
  assert.equal(r.porRol.constructor.corridas, 1);
  assert.equal(r.porRol.constructor.turnos, 1);
});

test('unirPi: 30 turnos y 6 llamadas dan turnosPorLlamada 5; sin llamadas, null', () => {
  assert.equal(unirPi({ turnos: 30, llamadasSubagente: 6 }, {}).turnosPorLlamada, 5);
  assert.equal(unirPi({ turnos: 30, llamadasSubagente: 0 }, {}).turnosPorLlamada, null);
  assert.deepEqual(unirPi({ turnos: 30, llamadasSubagente: 6 }, { porRol: {} }), {
    turnos: 30,
    llamadasSubagente: 6,
    subagentes: { porRol: {} },
    turnosPorLlamada: 5,
  });
});

test('subagentes: ni el resultado de subagentes ni el de unirPi contienen el centinela', () => {
  const subagentes = conCarpeta(escenarioTresCorridas(), (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }));
  const unido = unirPi(analizarSesionPi(tresTurnos()), subagentes);
  assert.equal(JSON.stringify(unido).includes(CENTINELA_TEXTO), false);
});

// ---- task-04: Claude Code ----

const sesionClaude = (...registros) => unirJsonl(registros);

test('claude (1): el mismo message.id en 3 registros cuenta 1 turno y sus tokens una sola vez', () => {
  const r = analizarSesionClaude(
    sesionClaude(
      turnoClaude({ id: 'm1', ts: T1, input: 100, output: 50 }),
      turnoClaude({ id: 'm1', ts: T1, input: 100, output: 50 }),
      turnoClaude({ id: 'm1', ts: T1, input: 100, output: 50 }),
    ),
  );
  assert.equal(r.turnos, 1);
  assert.deepEqual(r.tokens, { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 });
});

test('claude (2): <synthetic> no cuenta', () => {
  const r = analizarSesionClaude(
    sesionClaude(
      turnoClaude({ id: 'm1', ts: T1, input: 100 }),
      turnoClaude({ id: 'm2', ts: T1, model: '<synthetic>', input: 999 }),
    ),
  );
  assert.equal(r.turnos, 1);
  assert.equal(r.tokens.input, 100);
});

test('claude (3): tramos con contexto 20k, 45k y 70k; costo null en todo', () => {
  const r = analizarSesionClaude(
    sesionClaude(
      turnoClaude({ id: 'a', ts: T1, input: 20000 }),
      turnoClaude({ id: 'b', ts: T2, input: 20000, cacheRead: 25000 }),
      turnoClaude({ id: 'c', ts: T3, input: 30000, cacheRead: 40000 }),
    ),
  );
  assert.deepEqual(r.tramos, {
    menos30k: { turnos: 1, costo: null },
    de30a60k: { turnos: 1, costo: null },
    mas60k: { turnos: 1, costo: null },
  });
  assert.equal(r.costo, null);
  assert.deepEqual(r.tiposDeTurno, { texto: { turnos: 3, costo: null } });
});

test('claude (4): Read de 2048 bytes en definitions/PROJECT.md suma kbPorCategoria.definiciones 2', () => {
  const r = analizarSesionClaude(
    sesionClaude(
      turnoClaude({
        id: 'a',
        ts: T1,
        input: 1000,
        llamadas: [{ id: 'tu1', name: 'Read', input: { file_path: 'definitions/PROJECT.md' } }],
      }),
      resultadoReadClaude({ ts: T2, toolUseId: 'tu1', ruta: 'definitions/PROJECT.md', bytes: 2048 }),
    ),
  );
  assert.deepEqual(r.lecturas.porArchivo, { 'definitions/PROJECT.md': { lecturas: 1, kb: 2 } });
  assert.equal(r.lecturas.kbPorCategoria.definiciones, 2);
  assert.equal(r.lecturas.kbTotal, 2);
});

test('claude (5): Agent → llamadasSubagente 1 y tipo de turno delegar', () => {
  const r = analizarSesionClaude(
    sesionClaude(
      turnoClaude({
        id: 'a',
        ts: T1,
        input: 1000,
        llamadas: [{ id: 'tu1', name: 'Agent', input: { subagent_type: 'constructor' } }],
      }),
    ),
  );
  assert.equal(r.llamadasSubagente, 1);
  assert.equal(r.herramientas.subagent, 1);
  assert.deepEqual(r.tiposDeTurno, { delegar: { turnos: 1, costo: null } });
});

test('claude (6): rol desde agent-setting; sin ese registro, "desconocido"', () => {
  const con = analizarSesionClaude(sesionClaude(registroAgentSettingClaude('coordinador'), turnoClaude({ id: 'a', ts: T1 })));
  const sin = analizarSesionClaude(sesionClaude(turnoClaude({ id: 'a', ts: T1 })));
  assert.equal(con.rol, 'coordinador');
  assert.equal(sin.rol, 'desconocido');
});

test('claude (7): subagentes: dos metas constructor suman corridas 2 y turnos por message.id', () => {
  const transcript = sesionClaude(turnoClaude({ id: 'x', ts: T1, input: 100 }));
  const r = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': transcript,
      'agent-a2.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a2.jsonl': transcript,
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.equal(r.porRol.constructor.corridas, 2);
  assert.equal(r.porRol.constructor.turnos, 2);
  assert.equal(r.porRol.constructor.tokens.input, 200);
});

test('claude (8): carpeta de subagentes inexistente → porRol {}', () => {
  const r = analizarSubagentesClaude(join(tmpdir(), `consumo-inexistente-${Date.now()}`));
  assert.deepEqual(r.porRol, {});
  assert.deepEqual(r.corridas, []);
});

// ---- task-10: corridas por subagente (rol, disparo, feature, tarea, turnos, costo) ----

test('corridas (1): Pi: disparo, feature y tarea del encargo; turnos y costo del meta', () => {
  const r = conCarpeta(
    corrida(
      metaSubagentePi({
        runId: 'r1',
        agent: 'constructor',
        parentSessionId: 'S1',
        timestamp: M1,
        turns: 10,
        cost: 0.1,
        task: 'Lee: features/F31-x/task-02-y.md\nDisparó: puerta 4',
      }),
      transcriptSubagentePi(),
    ),
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.deepEqual(r.corridas, [
    {
      rol: 'constructor',
      disparo: { origen: 'puerta', puerta: 4 },
      feature: 'F31',
      tarea: '02',
      turnos: 10,
      costo: 0.1,
      kb: 0,
      lecturaExtra: { extras: [], declaradas: 0 },
    },
  ]);
});

test('corridas (2): Pi: Disparó BLOQUEO da la tarea; sin Disparó, los tres valores son null', () => {
  const r = conCarpeta(
    {
      ...corrida(
        metaSubagentePi({ runId: 'r1', agent: 'planificador', parentSessionId: 'S1', timestamp: M1, turns: 5, cost: 0.05, task: 'Disparó: BLOQUEO task-02' }),
        transcriptSubagentePi(),
      ),
      ...corrida(metaSubagentePi({ runId: 'r2', agent: 'constructor', parentSessionId: 'S1', timestamp: M1, turns: 1, cost: 0 }), transcriptSubagentePi()),
    },
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.deepEqual(r.corridas, [
    {
      rol: 'planificador',
      disparo: { origen: 'bloqueo', tarea: '02' },
      feature: null,
      tarea: '02',
      turnos: 5,
      costo: 0.05,
      kb: 0,
      lecturaExtra: { extras: [], declaradas: 0 },
    },
    {
      rol: 'constructor',
      disparo: null,
      feature: null,
      tarea: null,
      turnos: 1,
      costo: 0,
      kb: 0,
      lecturaExtra: { extras: [], declaradas: 0 },
    },
  ]);
});

// ---- task-02: kb y lecturaExtra por corrida de Pi ----

const ENCARGO_EXTRA = 'Lee: features/F34-x/task-02-y.md\nEvita leer: `definitions/`\nDisparó: puerta 4';

test('corridas Pi (task-02 a): lectura de Evita leer declarada sale como extra; kb de sus bytes', () => {
  const r = conCarpeta(
    corrida(
      metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'S1', timestamp: M1, task: ENCARGO_EXTRA }),
      transcriptSubagentePi({
        lecturas: [{ ruta: 'definitions/WORKFLOW.md', bytes: 2048 }],
        textoFinal: 'Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla',
      }),
    ),
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.equal(r.corridas[0].kb, 2);
  assert.deepEqual(r.corridas[0].lecturaExtra, { extras: ['definitions/WORKFLOW.md'], declaradas: 1 });
});

test('corridas Pi (task-02 b): sin declaración, declaradas 0; una ruta de Lee no cuenta como extra', () => {
  const r = conCarpeta(
    corrida(
      metaSubagentePi({
        runId: 'r1',
        agent: 'constructor',
        parentSessionId: 'S1',
        timestamp: M1,
        task: 'Lee: definitions/PROJECT.md\nEvita leer: `definitions/`\nDisparó: puerta 4',
      }),
      transcriptSubagentePi({
        lecturas: [
          { ruta: 'definitions/WORKFLOW.md', bytes: 2048 },
          { ruta: 'definitions/PROJECT.md', bytes: 1024 },
        ],
      }),
    ),
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.equal(r.corridas[0].kb, 3);
  assert.deepEqual(r.corridas[0].lecturaExtra, { extras: ['definitions/WORKFLOW.md'], declaradas: 0 });
});

test('corridas Pi (task-02 c): sin transcript, kb null; el motivo ni el texto no salen en corridas', () => {
  const r = conCarpeta(
    corrida(metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'S1', timestamp: M1, task: ENCARGO_EXTRA })),
    (dir) => analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  assert.equal(r.corridas[0].kb, null);
  assert.deepEqual(r.corridas[0].lecturaExtra, { extras: [], declaradas: 0 });
  const json = JSON.stringify(r.corridas);
  assert.ok(!json.includes('motivo='));
  assert.ok(!json.includes(CENTINELA_TEXTO));
});

test('corridas (3): Claude: encargo del primer registro user; costo null', () => {
  const transcript = unirJsonl([
    registroPromptClaude('Lee: features/F31-x/task-02-y.md\nDisparó: puerta 4'),
    turnoClaude({ id: 'x', ts: T1, input: 100 }),
  ]);
  const r = conCarpeta(
    { 'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })), 'agent-a1.jsonl': transcript },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.deepEqual(r.corridas, [
    {
      rol: 'constructor',
      disparo: { origen: 'puerta', puerta: 4 },
      feature: 'F31',
      tarea: '02',
      turnos: 1,
      costo: null,
      kb: 0,
      lecturaExtra: { extras: [], declaradas: 0 },
    },
  ]);
});

test('corridas (4): Claude sin transcript: los tres valores del encargo son null; kb 0 y sin extras', () => {
  const r = conCarpeta(
    { 'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })) },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.deepEqual(r.corridas, [
    {
      rol: 'constructor',
      disparo: null,
      feature: null,
      tarea: null,
      turnos: 0,
      costo: null,
      kb: 0,
      lecturaExtra: { extras: [], declaradas: 0 },
    },
  ]);
});

// ---- task-03: kb y lecturaExtra por corrida de Claude Code ----

// Transcript de un subagente de Claude Code con un Read de 2048 bytes en /ws/definitions/WORKFLOW.md y el
// turno final `textoFinal` (con CENTINELA_TEXTO en el turno de apertura, para comprobar que no sale).
const transcriptLecturaExtraClaude = (textoFinal) =>
  unirJsonl([
    registroPromptClaude(ENCARGO_EXTRA),
    turnoClaude({ id: 'x', ts: T1, llamadas: [{ id: 'tu1', name: 'Read', input: { file_path: '/ws/definitions/WORKFLOW.md' } }] }),
    resultadoReadClaude({ ts: T2, toolUseId: 'tu1', ruta: '/ws/definitions/WORKFLOW.md', bytes: 2048 }),
    turnoClaude({ id: 'y', ts: T3, texto: textoFinal }),
  ]);

test('corridas Claude (task-03 a): lectura de Evita leer declarada sale como extra; kb de sus bytes', () => {
  const r = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': transcriptLecturaExtraClaude('Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla'),
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.equal(r.corridas[0].kb, 2);
  assert.deepEqual(r.corridas[0].lecturaExtra, { extras: ['definitions/WORKFLOW.md'], declaradas: 1 });
});

test('corridas Claude (task-03 b): sin declaración, declaradas 0', () => {
  const r = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': transcriptLecturaExtraClaude(CENTINELA_TEXTO),
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.equal(r.corridas[0].kb, 2);
  assert.deepEqual(r.corridas[0].lecturaExtra, { extras: ['definitions/WORKFLOW.md'], declaradas: 0 });
});

test('corridas Claude (task-03 c): el motivo y el texto no salen en corridas', () => {
  const r = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': transcriptLecturaExtraClaude('Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla'),
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  const json = JSON.stringify(r.corridas);
  assert.ok(!json.includes('motivo='));
  assert.ok(!json.includes(CENTINELA_TEXTO));
});

test('corridas (5): el texto del encargo (Pi y Claude) no sale en corridas', () => {
  const pi = conCarpeta(corrida(metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'S1', timestamp: M1 }), transcriptSubagentePi()), (dir) =>
    analizarSubagentesPi(dir, { sesionId: 'S1' }),
  );
  const claude = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': unirJsonl([registroPromptClaude(), turnoClaude({ id: 'x', ts: T1 })]),
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.equal(JSON.stringify(pi.corridas).includes(CENTINELA_TEXTO), false);
  assert.equal(JSON.stringify(claude.corridas).includes(CENTINELA_TEXTO), false);
});

test('claude: el texto de los mensajes y la description del meta no aparecen en los resultados', () => {
  const sesion = analizarSesionClaude(
    sesionClaude(
      registroAgentSettingClaude('coordinador'),
      turnoClaude({ id: 'a', ts: T1, input: 100, llamadas: [{ id: 'tu1', name: 'Read', input: { file_path: 'definitions/PROJECT.md' } }] }),
      resultadoReadClaude({ ts: T2, toolUseId: 'tu1', ruta: 'definitions/PROJECT.md', bytes: 2048 }),
    ),
  );
  const subagentes = conCarpeta(
    {
      'agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
      'agent-a1.jsonl': sesionClaude(turnoClaude({ id: 'x', ts: T1, input: 100 })),
    },
    (dir) => analizarSubagentesClaude(dir),
  );
  assert.equal(JSON.stringify(sesion).includes(CENTINELA_TEXTO), false);
  assert.equal(JSON.stringify(subagentes).includes(CENTINELA_TEXTO), false);
});

// ---- task-05: CLI, informe y no-contenido ----

const SCRIPT = fileURLToPath(new URL('../../scripts/consumo.mjs', import.meta.url));
const NOMBRE_PI = '2026-10-30T10-00-00.000Z_sesion-cli.jsonl';

const correr = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

// Crea los archivos (ruta relativa a raiz → contenido), con sus carpetas.
function escribirArbol(raiz, archivos) {
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const completa = join(raiz, ruta);
    mkdirSync(dirname(completa), { recursive: true });
    writeFileSync(completa, contenido);
  }
}

// Nombres y tamaños de todo lo que hay bajo dir.
function inventario(dir) {
  const lista = [];
  const recorrer = (carpeta) => {
    for (const nombre of readdirSync(carpeta).sort()) {
      const ruta = join(carpeta, nombre);
      const st = statSync(ruta);
      lista.push(`${relative(dir, ruta)} ${st.isDirectory() ? 'dir' : st.size}`);
      if (st.isDirectory()) recorrer(ruta);
    }
  };
  recorrer(dir);
  return lista;
}

const sesionPiCli = () =>
  unirJsonl([
    registroSesionPi({ id: 'sesion-cli' }),
    turnoPi({ ts: T1, contexto: 20000, output: 100, costo: 0.01, llamadas: [{ id: 'r1', name: 'read', arguments: { path: 'definitions/ARCHITECTURE.md' } }] }),
    resultadoPi({ ts: T1, id: 'r1', name: 'read', texto: 'a'.repeat(2048) }),
    turnoPi({ ts: T2, contexto: 45000, output: 200, costo: 0.02, llamadas: [{ id: 's1', name: 'subagent' }] }),
    turnoPi({ ts: T3, contexto: 70000, output: 300, costo: 0.03, llamadas: [{ id: 's2', name: 'subagent' }] }),
  ]);

const sesionClaudeCli = () =>
  unirJsonl([
    registroAgentSettingClaude('coordinador'),
    turnoClaude({ id: 'm1', ts: T1, input: 20000, llamadas: [{ id: 'tu1', name: 'Read', input: { file_path: 'definitions/PROJECT.md' } }] }),
    resultadoReadClaude({ ts: T2, toolUseId: 'tu1', ruta: 'definitions/PROJECT.md', bytes: 2048 }),
    turnoClaude({ id: 'm2', ts: T3, input: 30000, cacheRead: 40000, llamadas: [{ id: 'tu2', name: 'Agent', input: { subagent_type: 'constructor' } }] }),
  ]);

// Subagentes de la sesión Pi sesion-cli (dos corridas: constructor con 2048 bytes leídos, planificador sin lecturas).
const archivosSubagentesPi = (prefijo) => ({
  [`${prefijo}subagent-artifacts/r1_constructor_meta.json`]: JSON.stringify(
    metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'sesion-cli', model: 'm-c', timestamp: M1, turns: 4, cost: 0.1 }),
  ),
  [`${prefijo}subagent-artifacts/r1_constructor_transcript.jsonl`]: transcriptSubagentePi({
    lecturas: [{ ruta: 'definitions/PROJECT.md', bytes: 2048 }],
  }),
  [`${prefijo}subagent-artifacts/r2_planificador_meta.json`]: JSON.stringify(
    metaSubagentePi({ runId: 'r2', agent: 'planificador', parentSessionId: 'sesion-cli', model: 'm-p', timestamp: M2, turns: 2, cost: 0.05 }),
  ),
  [`${prefijo}subagent-artifacts/r2_planificador_transcript.jsonl`]: transcriptSubagentePi(),
});

// Raíz con una sesión de Pi (y subagent-artifacts/) y una de Claude Code (y su carpeta subagents/).
function raizDePrueba() {
  const raiz = mkdtempSync(join(tmpdir(), 'consumo-cli-'));
  escribirArbol(raiz, {
    [`pi/${NOMBRE_PI}`]: sesionPiCli(),
    ...archivosSubagentesPi('pi/'),
    'claude/proyecto/sesion-claude.jsonl': sesionClaudeCli(),
    'claude/proyecto/sesion-claude/subagents/agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'constructor' })),
    'claude/proyecto/sesion-claude/subagents/agent-a1.jsonl': unirJsonl([turnoClaude({ id: 'x', ts: T1, input: 100 })]),
  });
  return raiz;
}

// La raíz de prueba más una sesión con thinking y un comando de bash, ambos con CENTINELA_TEXTO.
function raizConCentinela() {
  const raiz = raizDePrueba();
  escribirArbol(raiz, {
    'otro/sesion-centinela.jsonl': unirJsonl([
      registroSesionPi({ id: 'sesion-centinela' }),
      {
        type: 'message',
        timestamp: T1,
        message: {
          role: 'assistant',
          model: 'modelo-sintetico',
          content: [
            { type: 'thinking', thinking: CENTINELA_TEXTO },
            { type: 'toolCall', id: 'b1', name: 'bash', arguments: { command: CENTINELA_TEXTO } },
          ],
          usage: { input: 100, output: 10, cacheRead: 0, cacheWrite: 0, cost: { total: 0 } },
        },
      },
    ]),
  });
  return raiz;
}

// Ejecuta fn(raiz) con una raíz creada por `crear` y la borra al final.
const conRaiz = (fn, crear = raizDePrueba) => {
  const raiz = crear();
  try {
    return fn(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
};

test('cli (1): texto con las cifras de Pi y de Claude Code, subagentes y KB por rol', () => {
  conRaiz((raiz) => {
    const r = correr(['--raiz', raiz]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stderr, '');
    for (const esperado of [
      `pi | coordinador | ${NOMBRE_PI}`,
      'turnos: 3',
      'costo: US$0.060',
      'llamadas a subagentes: 2',
      'turnos por llamada: 1.5',
      'KB de definitions/ leídos por el coordinador: 2',
      'constructor | 1 | 4 | US$0.100 | 2 KB',
      'planificador | 1 | 2 | US$0.050 | 0 KB',
      'claude-code | coordinador | sesion-claude.jsonl',
      'turnos: 2',
      'costo: n/d',
      'constructor | 1 | 1 | n/d | 0 KB',
      'Solo se cuentan lecturas con la herramienta read; lo leído por bash no se mide.',
    ]) {
      assert.ok(r.stdout.includes(esperado), `falta en la salida: ${esperado}`);
    }
  });
});

test('cli (2): sin lecturas de definitions/ la línea es exactamente "…: 0"; sin subagentes, "ninguno"', () => {
  conRaiz(
    (raiz) => {
      escribirArbol(raiz, {
        'pi/sesion-sola.jsonl': unirJsonl([registroSesionPi({ id: 'sesion-sola' }), turnoPi({ ts: T1, contexto: 1000, costo: 0.01 })]),
      });
      const r = correr(['--raiz', raiz]);
      assert.equal(r.status, 0, r.stderr);
      assert.ok(r.stdout.split('\n').includes('KB de definitions/ leídos por el coordinador: 0'));
      assert.ok(r.stdout.includes('subagentes por rol: ninguno'));
    },
    () => mkdtempSync(join(tmpdir(), 'consumo-cli-')),
  );
});

test('cli (3): --tareas 2 divide el costo y los turnos por tarea (n/d sin costo)', () => {
  conRaiz((raiz) => {
    const r = correr(['--raiz', raiz, '--tareas', '2']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('costo por tarea: US$0.03'));
    assert.ok(r.stdout.includes('turnos por tarea: 1.50'));
    assert.ok(r.stdout.includes('costo por tarea: n/d'));
  });
});

test('cli (4): --hasta corta por timestamp (hasta 10:07 deja dos turnos de Pi y US$0.030)', () => {
  conRaiz((raiz) => {
    const r = correr(['--raiz', raiz, '--hasta', '2026-10-30T10:07:00.000Z']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('turnos: 2'));
    assert.ok(r.stdout.includes('costo: US$0.030'));
    assert.ok(r.stdout.includes('llamadas a subagentes: 1'));
  });
});

test('cli (5): --json es JSON válido con las cifras; con --tareas añade porTarea', () => {
  conRaiz((raiz) => {
    const r = correr(['--raiz', raiz, '--json', '--tareas', '2']);
    assert.equal(r.status, 0, r.stderr);
    const { sesiones } = JSON.parse(r.stdout);
    assert.equal(sesiones.length, 2);
    const pi = sesiones.find((s) => s.herramienta === 'pi');
    const cc = sesiones.find((s) => s.herramienta === 'claude-code');
    assert.equal(pi.turnos, 3);
    assert.equal(pi.costo, 0.06);
    assert.equal(pi.turnosPorLlamada, 1.5);
    assert.deepEqual(pi.porTarea, { costo: 0.03, turnos: 1.5 });
    assert.equal(pi.subagentes.porRol['constructor'].kbTotal, 2);
    assert.equal(cc.costo, null);
    assert.equal(cc.rol, 'coordinador');
  });
});

test('cli (6): errores de argumentos: stderr "error: …", código 1 y sin salida', () => {
  conRaiz((raiz) => {
    const casos = [
      [[], /^error: falta --raiz/],
      [['--raiz', raiz, '--raiz', raiz], /^error: opción repetida '--raiz'/],
      [['--raiz', raiz, '--tareas', '0'], /^error: --tareas/],
      [['--raiz', raiz, '--tareas', 'abc'], /^error: --tareas/],
      [['--raiz', raiz, '--foo'], /^error: argumento desconocido '--foo'/],
    ];
    for (const [args, patron] of casos) {
      const r = correr(args);
      assert.equal(r.status, 1, JSON.stringify(args));
      assert.match(r.stderr, patron);
      assert.equal(r.stdout, '');
    }
  });
});

test('no-contenido: el centinela no sale en el texto ni en --json (stdout ni stderr); el control negativo lo detecta', () => {
  conRaiz((raiz) => {
    for (const args of [['--raiz', raiz], ['--raiz', raiz, '--json', '--tareas', '2']]) {
      const r = correr(args);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stdout.includes(CENTINELA_TEXTO), false);
      assert.equal(r.stderr.includes(CENTINELA_TEXTO), false);
    }
    // Control negativo: una línea cruda del .jsonl sin filtrar sí contiene el centinela.
    const lineaCruda = readFileSync(join(raiz, 'pi', NOMBRE_PI), 'utf8').split('\n')[1];
    assert.equal(lineaCruda.includes(CENTINELA_TEXTO), true);
  }, raizConCentinela);
});

test('solo lectura: la raíz no cambia (nombres y tamaños) tras ejecutar', () => {
  conRaiz((raiz) => {
    const antes = inventario(raiz);
    assert.equal(correr(['--raiz', raiz]).status, 0);
    assert.equal(correr(['--raiz', raiz, '--json']).status, 0);
    assert.deepEqual(inventario(raiz), antes);
  });
});

// ---- task-11: --por-tarea, --eventos y leerEstados / costoPorTarea / formatearPorTarea ----

const evento = (o) => JSON.stringify({ v: 1, id: 'x', fuente: 'git', evento: 'tarea_estado', sha: 'abc', de: null, por: 'constructor', ...o });

test('por-tarea (1): leerEstados toma el último tarea_estado por t e ignora líneas que no son JSON', () => {
  const texto = [
    evento({ t: T3, feature: 'F32', tarea: '01', a: 'hecha' }),
    'esto no es JSON',
    evento({ t: T1, feature: 'F32', tarea: '01', a: 'en curso' }),
    evento({ t: T2, feature: 'F32', tarea: '02', a: 'bloqueada' }),
    JSON.stringify({ v: 1, evento: 'bloqueo', t: T3, feature: 'F32', tarea: '03' }),
  ].join('\n');
  const estados = leerEstados(texto);
  assert.equal(estados.size, 2);
  assert.equal(estados.get('F32/01'), 'hecha');
  assert.equal(estados.get('F32/02'), 'bloqueada');
  assert.equal(estados.has('F32/03'), false);
});

// Dos corridas de constructor (una sin costo), una vuelta del planificador sobre F32/02 y otra sin feature.
const corridasPorTarea = () => [
  {
    subagentes: {
      corridas: [
        { rol: 'constructor', disparo: { origen: 'puerta', puerta: 4 }, feature: 'F32', tarea: '01', turnos: 4, costo: 0.1 },
        { rol: 'constructor', disparo: null, feature: 'F32', tarea: '01', turnos: 2, costo: 0.2 },
        { rol: 'constructor', disparo: null, feature: 'F32', tarea: '02', turnos: 3, costo: null },
        { rol: 'planificador', disparo: { origen: 'bloqueo', tarea: '02' }, feature: 'F32', tarea: '02', turnos: 5, costo: 0.05 },
        { rol: 'planificador', disparo: { origen: 'bloqueo', tarea: '03' }, feature: null, tarea: '03', turnos: 1, costo: null },
      ],
    },
  },
];

test('por-tarea (2): costoPorTarea separa tareas y vueltas; costo null sin costo numérico; estado sin_dato sin eventos', () => {
  const filas = costoPorTarea(corridasPorTarea(), { estados: new Map([['F32/01', 'hecha'], ['F32/02', 'bloqueada']]) });
  assert.deepEqual(filas, [
    { clave: '?/03', estado: 'sin_dato', corridas: 0, turnos: 0, costo: null, vueltas: 1, turnosVueltas: 1, costoVueltas: null },
    { clave: 'F32/01', estado: 'hecha', corridas: 2, turnos: 6, costo: 0.3, vueltas: 0, turnosVueltas: 0, costoVueltas: null },
    { clave: 'F32/02', estado: 'bloqueada', corridas: 1, turnos: 3, costo: null, vueltas: 1, turnosVueltas: 5, costoVueltas: 0.05 },
  ]);
  assert.equal(costoPorTarea(corridasPorTarea())[1].estado, 'sin_dato');
});

test('por-tarea (3): formatearPorTarea escribe una línea por fila con n/d y la nota final', () => {
  const texto = formatearPorTarea(costoPorTarea(corridasPorTarea(), { estados: new Map([['F32/01', 'hecha']]) }));
  assert.ok(texto.includes('F32/01 | hecha | 2 | 6 | US$0.300 | 0 | n/d\n'));
  assert.ok(texto.includes('F32/02 | sin_dato | 1 | 3 | n/d | 1 | US$0.050\n'));
  assert.ok(texto.includes('El costo del coordinador no se reparte entre tareas; la unión usa la ruta de la tarea en el encargo.'));
  assert.equal(formatearPorTarea([]).startsWith('No hay tareas que listar.'), true);
});

// Raíz Pi con la sesión de sesionPiCli() y subagentes con encargo: F32/01 (hecha), F32/02 (bloqueada, con una
// vuelta del planificador por BLOQUEO task-02) y F32/03 (sin estado ni vueltas).
function raizPorTarea() {
  const raiz = mkdtempSync(join(tmpdir(), 'consumo-tarea-'));
  const corrida = (runId, agent, task, turns, cost) => ({
    [`pi/subagent-artifacts/${runId}_${agent}_meta.json`]: JSON.stringify(
      metaSubagentePi({ runId, agent, parentSessionId: 'sesion-cli', model: 'm-t', timestamp: M1, turns, cost, task }),
    ),
    [`pi/subagent-artifacts/${runId}_${agent}_transcript.jsonl`]: transcriptSubagentePi(),
  });
  escribirArbol(raiz, {
    [`pi/${NOMBRE_PI}`]: sesionPiCli(),
    ...corrida('r1', 'constructor', 'Lee: features/F32-x/task-01-y.md', 4, 0.1),
    ...corrida('r2', 'constructor', 'Lee: features/F32-x/task-02-z.md', 3, 0.2),
    ...corrida('r3', 'planificador', 'Lee: features/F32-x/task-02-z.md\nDisparó: BLOQUEO task-02', 5, 0.05),
    ...corrida('r4', 'constructor', 'Lee: features/F32-x/task-03-w.md', 1, 0),
  });
  return raiz;
}

// Ejecuta fn(raiz, rutaEventos) con un archivo de eventos fuera de la raíz (que solo se escanea por .jsonl).
function conRaizYEventos(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'consumo-ev-'));
  const rutaEventos = join(dir, 'eventos.jsonl');
  writeFileSync(
    rutaEventos,
    [
      evento({ t: T1, feature: 'F32', tarea: '01', a: 'en curso' }),
      evento({ t: T3, feature: 'F32', tarea: '01', a: 'hecha' }),
      evento({ t: T2, feature: 'F32', tarea: '02', a: 'bloqueada' }),
    ].join('\n') + '\n',
  );
  try {
    return conRaiz((raiz) => fn(raiz, rutaEventos), raizPorTarea);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('por-tarea (4): CLI con --eventos lista solo las hechas y las con vueltas; costo de F32/01 y vuelta de F32/02', () => {
  conRaizYEventos((raiz, eventos) => {
    const r = correr(['--raiz', raiz, '--por-tarea', '--eventos', eventos]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stderr, '');
    assert.ok(r.stdout.includes('F32/01 | hecha | 1 | 4 | US$0.100 | 0 | n/d\n'));
    assert.ok(r.stdout.includes('F32/02 | bloqueada | 1 | 3 | US$0.200 | 1 | US$0.050\n'));
    assert.equal(r.stdout.includes('F32/03'), false);
  });
});

test('por-tarea (5): sin --eventos lista todas las tareas con sin_dato; --json da { tareas } con las cifras', () => {
  conRaiz((raiz) => {
    const texto = correr(['--raiz', raiz, '--por-tarea']);
    assert.equal(texto.status, 0, texto.stderr);
    assert.ok(texto.stdout.includes('F32/03 | sin_dato | 1 | 1 | US$0.000 | 0 | n/d\n'));

    const r = correr(['--raiz', raiz, '--por-tarea', '--json']);
    assert.equal(r.status, 0, r.stderr);
    const { tareas } = JSON.parse(r.stdout);
    assert.equal(Object.keys(JSON.parse(r.stdout)).join(), 'tareas');
    assert.equal(tareas.length, 3);
    const f2 = tareas.find((f) => f.clave === 'F32/02');
    assert.equal(f2.estado, 'sin_dato');
    assert.equal(f2.vueltas, 1);
    assert.equal(f2.costoVueltas, 0.05);
    assert.equal(tareas.find((f) => f.clave === 'F32/01').costoVueltas, null);
  }, raizPorTarea);
});

test('por-tarea (6): --eventos sin --por-tarea termina en 1 con el error antes de comprobar --raiz', () => {
  const r = correr(['--raiz', '/no/existe', '--eventos', 'x']);
  assert.equal(r.status, 1);
  assert.equal(r.stderr, 'error: --eventos exige --por-tarea\n');
  assert.equal(r.stdout, '');
  const sinRaiz = correr(['--eventos', 'x']);
  assert.equal(sinRaiz.status, 1);
  assert.equal(sinRaiz.stderr, 'error: --eventos exige --por-tarea\n');
});

// ---- task-04: resumen de lecturas extra y línea en el informe ----

test('lecturas extra (task-04 a): resumenLecturaExtra con 3 corridas y con [] da los números exactos', () => {
  const corridas = [
    { lecturaExtra: { extras: ['definitions/WORKFLOW.md', 'definitions/PROJECT.md'], declaradas: 1 } },
    { lecturaExtra: { extras: [], declaradas: 0 } },
    {},
  ];
  assert.deepEqual(resumenLecturaExtra(corridas), { corridas: 3, extras: 2, declaradas: 1, cumplimiento: 50, porLlamada: 0.7 });
  assert.deepEqual(resumenLecturaExtra([]), { corridas: 0, extras: 0, declaradas: 0, cumplimiento: null, porLlamada: null });
});

test('lecturas extra (task-04 b): CLI imprime la línea con una corrida extra declarada, y sin subagentes con n/d', () => {
  const conExtra = mkdtempSync(join(tmpdir(), 'consumo-extra-'));
  try {
    escribirArbol(conExtra, {
      'pi/2026-10-30T10-00-00.000Z_sesion-extra.jsonl': unirJsonl([registroSesionPi({ id: 'sesion-extra' }), turnoPi({ ts: T1, contexto: 1000, costo: 0.01 })]),
      'pi/subagent-artifacts/r1_constructor_meta.json': JSON.stringify(
        metaSubagentePi({ runId: 'r1', agent: 'constructor', parentSessionId: 'sesion-extra', model: 'm-c', timestamp: M1, turns: 2, cost: 0.02, task: ENCARGO_EXTRA }),
      ),
      'pi/subagent-artifacts/r1_constructor_transcript.jsonl': transcriptSubagentePi({
        lecturas: [{ ruta: 'definitions/WORKFLOW.md', bytes: 2048 }],
        textoFinal: 'Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla',
      }),
    });
    const r = correr(['--raiz', conExtra]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('lecturas extra: 1 en 1 corrida(s); declaradas 1; cumplimiento 100 %'), r.stdout);
  } finally {
    rmSync(conExtra, { recursive: true, force: true });
  }

  const sinSubagentes = mkdtempSync(join(tmpdir(), 'consumo-sin-'));
  try {
    escribirArbol(sinSubagentes, {
      'pi/sesion-sola.jsonl': unirJsonl([registroSesionPi({ id: 'sesion-sola' }), turnoPi({ ts: T1, contexto: 1000, costo: 0.01 })]),
    });
    const r = correr(['--raiz', sinSubagentes]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('lecturas extra: 0 en 0 corrida(s); declaradas 0; cumplimiento n/d'), r.stdout);
  } finally {
    rmSync(sinSubagentes, { recursive: true, force: true });
  }
});
