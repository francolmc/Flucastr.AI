import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSyncSeguro } from '../../tools/spawn/sync-seguro.mjs';
import { checkDecisions } from '../../tools/check/decisiones.mjs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'scripts/review-plan.mjs');
const temporary = async (callback) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'decisiones-'));
  try { return await callback(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};
const readOrNull = (file) => readFile(file, 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return null;
  throw error;
});

const rowsRegistry = (rows, { header = true } = {}) => [
  '# Decisions — prueba',
  '',
  ...(header ? ['| ID | Decision | Reason | Date | Status |', '|----|----------|--------|------|--------|'] : []),
  ...rows,
  '',
].join('\n');

const REGISTRY = rowsRegistry([
  '| D-01 | Usar A | Razón a | 2026-11-26 | active |',
  '| D-02 | Usar B | Razón b | 2026-11-26 | superseded by D-03 |',
  '| D-03 | Usar C | Razón c | 2026-11-26 | active |',
  '| D-04 | Quitar D | Razón d | 2026-11-26 | revoked |',
]);

const CLEAN_PLAN = [
  '# Plan de prueba',
  '',
  '## Goal',
  'Probar decisiones sin avisos.',
  '',
  '## Scope',
  '- `src/a.js` cambia; el ejemplo `D-09` va entre acentos graves.',
  '',
  '## Decisions already taken',
  '- Executor: builder',
  '- D-01, D-03',
  '- D-02, D-03',
  '',
  '## Decisions',
  '- D-03: usar c.',
  '- None',
  '',
  '## Notes',
  '- D-04 se revocó antes de este plan.',
  '',
  '## Evidence',
  'Resuelto: D-01 sin efecto en prueba.',
  '',
];

// Ejecuta el CLI real en un directorio temporal con plan.md y, si se pasa, decisions.md.
async function review(lines, registry = REGISTRY) {
  return temporary(async (dir) => {
    await writeFile(path.join(dir, 'plan.md'), lines.join('\n'));
    if (registry !== null) await writeFile(path.join(dir, 'decisions.md'), registry);
    const result = spawnSyncSeguro(process.execPath, [script, 'plan.md'], { encoding: 'utf8', cwd: dir });
    return {
      status: result.status,
      stdout: result.stdout,
      decisions: result.stdout.split('\n').filter((line) => line.includes('decisiones:')),
    };
  });
}

// Inserta una línea justo después de un encabezado del plan limpio.
const withLine = (heading, text) => {
  const at = CLEAN_PLAN.indexOf(heading);
  assert.ok(at >= 0, `falta el encabezado ${heading}`);
  return [...CLEAN_PLAN.slice(0, at + 1), text, ...CLEAN_PLAN.slice(at + 1)];
};

test('A1 clean plan with active, superseded and revoked IDs has no decisiones warning', async () => {
  const result = await review(CLEAN_PLAN);
  assert.equal(result.status, 0, result.stdout);
  assert.deepEqual(result.decisions, []);
});

test('A1 rule 1: each bad registry row warns with its line and the CLI exits 1', async () => {
  const cases = [
    ['falta el encabezado', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | active |'], { header: false })],
    ['ID no válido «D-1»', rowsRegistry(['| D-1 | Usar A | Razón a | 2026-11-26 | active |'])],
    ['ID repetido D-01', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | active |', '| D-01 | Usar B | Razón b | 2026-11-26 | active |'])],
    ['D-01 tiene una celda vacía', rowsRegistry(['| D-01 |  | Razón a | 2026-11-26 | active |'])],
    ['fecha no válida en D-01', rowsRegistry(['| D-01 | Usar A | Razón a | 26/11/2026 | active |'])],
    ['estado no válido en D-01', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | done |'])],
    ['D-01 superseded sin reemplazo válido', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | superseded by |'])],
    ['D-01 no puede reemplazarse a sí mismo', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | superseded by D-01 |'])],
    ['reemplazo D-09 de D-01 no existe', rowsRegistry(['| D-01 | Usar A | Razón a | 2026-11-26 | superseded by D-09 |'])],
  ];
  for (const [expected, registry] of cases) {
    const result = await review(['# Plan', '', '## Goal', 'Sin citas.', ''], registry);
    assert.equal(result.status, 1, expected);
    assert.ok(result.decisions.some((line) => line.includes(`decisions.md:`) && line.includes(expected)), `${expected}\n${result.stdout}`);
  }
});

test('A1 rule 1: a literal pipe in a cell is one cell, not a column break', async () => {
  const registry = rowsRegistry(['| D-01 | Usar A \\| B | Razón a | 2026-11-26 | active |']);
  const plan = ['# Plan', '', '## Decisions', '- D-01: usar a | b', ''];
  const result = await review(plan, registry);
  assert.equal(result.status, 0, result.stdout);
  assert.deepEqual(result.decisions, []);
});

test('A1 rule 2: an ID absent from the table warns with the exact message of the example', async () => {
  const plan = withLine('## Scope', '- Usar D-09 en el alcance.');
  const result = await review(plan);
  assert.equal(result.status, 1);
  const at = plan.indexOf('- Usar D-09 en el alcance.') + 1;
  assert.ok(result.decisions.includes(`plan.md:${at}: decisiones: D-09 no existe en decisions.md`), result.stdout);
});

test('A1 rule 3: a revoked ID warns outside Notes, Exploration and Evidence', async () => {
  const plan = withLine('## Scope', '- D-04 sigue vigente en el alcance.');
  const result = await review(plan);
  assert.equal(result.status, 1);
  assert.ok(result.decisions.some((line) => line.endsWith('D-04 está revocada')), result.stdout);
});

test('A1 rule 3: a superseded ID needs its replacement on the same line', async () => {
  const lone = withLine('## Decisions already taken', '- D-02');
  const alone = await review(lone);
  assert.ok(alone.decisions.some((line) => line.endsWith('D-02 está superada por D-03; cítala junto con D-03 en la misma línea')), alone.stdout);
  const paired = withLine('## Decisions already taken', '- D-02, D-03');
  const ok = await review(paired);
  assert.equal(ok.status, 0, ok.stdout);
});

test('A1 rule 3: the revoked ID cited under Notes is not warned', async () => {
  const result = await review(CLEAN_PLAN);
  assert.ok(!result.stdout.includes('revocada'), result.stdout);
});

test('A1 rule 4: a top-level bullet without ID in decision sections warns; Executor and None are exempt', async () => {
  const plan = withLine('## Decisions', '- Decisión sin ID.');
  const result = await review(plan);
  assert.equal(result.status, 1);
  const at = plan.indexOf('- Decisión sin ID.') + 1;
  assert.ok(result.decisions.includes(`plan.md:${at}: decisiones: viñeta sin ID en «## Decisions»`), result.stdout);
});

test('A1 rule 4: a Resuelto line without ID warns anywhere in the plan', async () => {
  const plan = withLine('## Goal', 'Resuelto: se eligió la opción uno.');
  const result = await review(plan);
  assert.equal(result.status, 1);
  assert.ok(result.decisions.some((line) => line.endsWith('Resuelto: sin ID de decisión')), result.stdout);
});

test('A1 rule 5: a decision text that differs from its row warns; case, spacing and final period do not', async () => {
  const differs = withLine('## Decisions', '- D-01: Usar Z.');
  const bad = await review(differs);
  assert.ok(bad.decisions.some((line) => line.endsWith('D-01 no coincide con su texto en decisions.md')), bad.stdout);
  const same = withLine('## Decisions', '-  D-03 :  USAR   c');
  const ok = await review(same);
  assert.equal(ok.status, 0, ok.stdout);
});

test('A1 code spans and fenced blocks are not checked for IDs', async () => {
  const plan = [...CLEAN_PLAN, '```', 'Ejemplo D-09 dentro de cerca.', '```', ''];
  const result = await review(plan);
  assert.equal(result.status, 0, result.stdout);
});

test('A1 rule 6: without decisions.md a plan that cites an ID warns once at the first citation', async () => {
  const plan = withLine('## Scope', '- Ver D-01 y D-02.');
  const result = await review(plan, null);
  assert.equal(result.status, 1);
  const at = plan.indexOf('- Ver D-01 y D-02.') + 1;
  assert.deepEqual(result.decisions, [`plan.md:${at}: decisiones: cita D-01 pero no existe decisions.md junto al plan`]);
});

test('A2 without decisions.md and without IDs the output is the old one: no decisiones line', async () => {
  const plan = ['# Plan', '', '## Decisions', '- Resuelto sin ID.', 'Resuelto: sin id.', ''];
  const result = await review(plan, null);
  assert.equal(result.status, 0, result.stdout);
  assert.deepEqual(result.decisions, []);
});

test('A2 every repo plan without decisions.md emits no decisiones line', async () => {
  const checked = [];
  for (const base of ['changes', 'changes/done']) {
    for (const entry of await readdir(path.join(root, base), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, base, entry.name);
      const text = await readOrNull(path.join(dir, 'plan.md'));
      if (text === null) continue;
      if ((await readOrNull(path.join(dir, 'decisions.md'))) !== null) continue;
      checked.push(path.relative(root, dir));
      assert.deepEqual(checkDecisions(text, 'plan.md', null, path.join(dir, 'decisions.md')), [], path.relative(root, dir));
    }
  }
  assert.ok(checked.length > 0, 'no hay planes del repo sin decisions.md');
});
