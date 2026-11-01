import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  analizarSesionPi,
  analizarSubagentesPi,
  unirPi,
  analizarSesionClaude,
  analizarSubagentesClaude,
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
