import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CENTINELA_TEXTO,
  metaSubagentePi,
  metaSubagenteClaude,
  registroAgentSettingClaude,
  registroPromptClaude,
  registroSesionPi,
  resultadoReadClaude,
  transcriptSubagentePi,
  turnoClaude,
  turnoPi,
  unirJsonl,
} from './consumo-fixtures.mjs';

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

const SECRETO_MOTIVO = 'SECRETO-MOTIVO';
const NOMBRE_PI = '2026-10-30T10-00-00.000Z_lectura.jsonl';
const ENCARGOS_PI = [
  'Lee: features/F31-a/task-01-b.md\nEvita leer: `definitions/`\nDisparó: puerta 3',
  'Lee: features/F32-a/task-01-b.md\nEvita leer: `definitions/`\nDisparó: puerta 3',
  'Lee: features/F32-a/task-02-b.md\nEvita leer: `definitions/`\nDisparó: puerta 3',
];
const DECLARACION = `Lectura extra: definitions/WORKFLOW.md; motivo=${SECRETO_MOTIVO}`;

const raices = [];
after(() => {
  for (const r of raices) fs.rmSync(r, { recursive: true, force: true });
});

function nuevaRaiz(prefijo) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
  raices.push(dir);
  return dir;
}

function escribirArbol(dir, archivos) {
  for (const [rel, contenido] of Object.entries(archivos)) {
    const ruta = path.join(dir, rel);
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, contenido);
  }
  return dir;
}

// Raíz del informe con un estado aprobado y una ejecución de la misma tarea: tareas = 1, así que con --minimo 1
// el bloque Consumo sale (tareas cuenta las tareas con ejecución).
function raizConEventos() {
  return escribirArbol(nuevaRaiz('informe-lectura-cli-'), {
    'registro/eventos.jsonl': unirJsonl([estado('F32', '01', 'aprobada'), ejecucion('F32', '01')]),
  });
}

// Carpeta de consumo de Pi: un coordinador y tres corridas de planificador que leen definitions/WORKFLOW.md.
// Solo la primera declara la lectura extra.
function carpetaPi() {
  const archivos = {
    [`pi/${NOMBRE_PI}`]: unirJsonl([
      registroSesionPi({ id: 'sesion-lectura' }),
      turnoPi({ ts: '2026-10-30T10:00:00.000Z', contexto: 20000, output: 100, costo: 0.5 }),
    ]),
  };
  ENCARGOS_PI.forEach((task, i) => {
    const runId = `r${i + 1}`;
    archivos[`pi/subagent-artifacts/${runId}_planificador_meta.json`] = JSON.stringify(
      metaSubagentePi({ runId, agent: 'planificador', parentSessionId: 'sesion-lectura', model: 'm-p', turns: 2, cost: 0.05, task }),
    );
    archivos[`pi/subagent-artifacts/${runId}_planificador_transcript.jsonl`] = transcriptSubagentePi({
      lecturas: [{ ruta: 'definitions/WORKFLOW.md', bytes: 1024 }],
      textoFinal: i === 0 ? DECLARACION : undefined,
    });
  });
  return escribirArbol(nuevaRaiz('informe-lectura-pi-'), archivos);
}

// Carpeta de consumo de Claude Code: una corrida de planificador con un Read declarado.
function carpetaClaude() {
  return escribirArbol(nuevaRaiz('informe-lectura-claude-'), {
    'claude/proyecto/sesion-claude.jsonl': unirJsonl([
      registroAgentSettingClaude('coordinador'),
      turnoClaude({ id: 'c1', ts: '2026-10-30T10:00:00.000Z', input: 20000, output: 100 }),
    ]),
    'claude/proyecto/sesion-claude/subagents/agent-a1.meta.json': JSON.stringify(metaSubagenteClaude({ agentType: 'planificador' })),
    'claude/proyecto/sesion-claude/subagents/agent-a1.jsonl': unirJsonl([
      registroPromptClaude(ENCARGOS_PI[0]),
      turnoClaude({
        id: 'a',
        ts: '2026-10-30T10:01:00.000Z',
        llamadas: [{ id: 'tu1', name: 'Read', input: { file_path: '/ws/definitions/WORKFLOW.md' } }],
      }),
      resultadoReadClaude({ ts: '2026-10-30T10:01:01.000Z', toolUseId: 'tu1', ruta: '/ws/definitions/WORKFLOW.md', bytes: 1024 }),
      turnoClaude({ id: 'b', ts: '2026-10-30T10:02:00.000Z', texto: DECLARACION }),
    ]),
  });
}

const correr = (raiz, consumo, args) =>
  spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, '--consumo', consumo, '--minimo', '1', ...args], { encoding: 'utf8' });

test('(1) Markdown: pistas 7 y 9 y la línea de lectura extra; sin pista 8', () => {
  const r = correr(raizConEventos(), carpetaPi(), ['--pistas']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^## Pistas$/m);
  assert.ok(r.stdout.includes('- Pista 7: planificador lee de más `definitions/WORKFLOW.md` en 3 corridas y 2 features.'));
  assert.ok(r.stdout.includes('- Pista 9: 1 de 3 lecturas extra declaradas (33 %).'));
  assert.ok(r.stdout.includes('Lectura extra: 3 en 3 corrida(s) · declaradas 1 · cumplimiento 33 %'));
  assert.ok(!r.stdout.includes('- Pista 8'));
  assert.ok(!r.stdout.includes('lecturas extra por llamada'));
});

test('(2) --json: pistas con 7 y 9 y sin 8', () => {
  const r = correr(raizConEventos(), carpetaPi(), ['--pistas', '--json']);
  assert.equal(r.status, 0, r.stderr);
  const json = JSON.parse(r.stdout);
  const ns = json.pistas.map((p) => p.n);
  assert.ok(ns.includes(7), `pistas: ${ns}`);
  assert.ok(ns.includes(9), `pistas: ${ns}`);
  assert.ok(!ns.includes(8), `pistas: ${ns}`);
  assert.deepEqual(json.consumo.lecturaExtra, { corridas: 3, extras: 3, declaradas: 1, cumplimiento: 33, porLlamada: 1 });
});

test('(3) motivo y centinela no salen por stdout ni stderr; Claude Code con Read declarado da declaradas 1', () => {
  const raiz = raizConEventos();
  const pi = carpetaPi();
  for (const args of [['--pistas'], ['--pistas', '--json']]) {
    const r = correr(raiz, pi, args);
    assert.equal(r.status, 0, r.stderr);
    for (const salida of [r.stdout, r.stderr]) {
      assert.ok(!salida.includes(SECRETO_MOTIVO));
      assert.ok(!salida.includes(CENTINELA_TEXTO));
    }
  }
  const claude = correr(raiz, carpetaClaude(), ['--json']);
  assert.equal(claude.status, 0, claude.stderr);
  assert.equal(JSON.parse(claude.stdout).consumo.lecturaExtra.declaradas, 1);
});
