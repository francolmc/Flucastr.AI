import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSyncSeguro } from '../../tools/spawn/sync-seguro.mjs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'scripts/review-plan.mjs');
const fixture = (name) => path.join(root, 'tests/review-plan/fixtures', name);
const run = (file) => spawnSyncSeguro(process.execPath, [script, file], { encoding: 'utf8' });
const temporary = async (callback) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'review-plan-'));
  try { await callback(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};

// Los fixtures conservan el texto registrado (datos, sin edición). Las pruebas
// los traducen en memoria al vocabulario nuevo; cada regla cambia solo tokens
// y no añade ni quita líneas, así las aserciones de línea siguen valiendo.
const NEW_VOCABULARY = [
  [/^## Pasos\s*$/gm, '## Steps'],
  [/^## Alcance\s*$/gm, '## Scope'],
  [/^## Aceptación\s*$/gm, '## Acceptance'],
  [/^### Tramo (\d+) — Historia:/gm, '### Segment $1 — Story:'],
  [/^### Tramo (\d+)/gm, '### Segment $1'],
  [/\bArchivos:/g, 'Files:'],
  [/\bDependencias:/g, 'Dependencies:'],
  [/^Como persona usuaria quiero (.+?) para (.+?)\. Dependencies:/gm, 'As a user I want $1 so that $2. Dependencies:'],
  [/\bninguna\b/g, 'none'],
  [/\bAceptación (?=A\d+:)/g, 'Acceptance '],
  [/\bCUANDO\b/g, 'WHEN'],
  [/\bENTONCES\b/g, 'THEN'],
  [/Verificación del tramo:/g, 'Segment verification:'],
  [/Comprobación:/g, 'Check:'],
];
const translated = async (dir, name) => {
  const source = await readFile(fixture(name), 'utf8');
  const text = NEW_VOCABULARY.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), source);
  const file = path.join(dir, name);
  await writeFile(file, text);
  return file;
};

const newStoryPlan = ({ files = ['src/a.js'], extra = '' } = {}) => `# Feature de prueba

## Scope
Cambiar solo los archivos de producto declarados por historia.

## Steps
### Segment 1 — Story: save the change
As a user I want to save the change so that I keep my work.
Dependencies: none.
Scope: ${files.map((file) => `\`${file}\``).join(', ')}.
Files: ${files.map((file) => `\`${file}\``).join(', ')}
WHEN I save the change THEN it is available when I come back (A1).
Acceptance:
- A1: the change is saved; check that it can be read back.
TODO:
- [ ] Update \`${files[0]}\` (A1). Check: \`node --check ${files[0]}\`; exit 0.
Segment verification: \`node --test tests/feature.test.mjs\` — level 1; exit 0; covers A1.
Handoff: use the agreed base and return the evidence for A1.
${extra}`;

test('F13 fixture reports folder, weak steps and multiple screens', async () => temporary(async (dir) => {
  const result = run(await translated(dir, 'f13-segment1.md'));
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /f13-segment1\.md:5:.*carpeta/);
  assert.match(result.stdout, /f13-segment1\.md:7:.*ruta de archivo/);
  for (const line of [6, 7, 8, 9]) assert.match(result.stdout, new RegExp(`f13-segment1\\.md:${line}:.*comprueba`));
  assert.match(result.stdout, /f13-segment1\.md:4:.*varias pantallas/);
}));

test('well-cut plan has no warnings and the fixture stays byte-for-byte intact', async () => temporary(async (dir) => {
  const file = fixture('plan-correct.md');
  const before = await readFile(file);
  const result = run(await translated(dir, 'plan-correct.md'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.deepEqual(await readFile(file), before);
}));

test('complete new story fixture passes without external change-plan paths', async () => temporary(async (dir) => {
  const file = path.join(dir, 'nuevo.md');
  await writeFile(file, newStoryPlan());
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');

  const stableFixture = run(await translated(dir, 'story-new-valid.md'));
  assert.equal(stableFixture.status, 0, stableFixture.stdout || stableFixture.stderr);
  assert.equal(stableFixture.stdout, '');
}));

test('new format without ## Steps is rejected instead of accepted silently', async () => temporary(async (dir) => {
  const file = path.join(dir, 'sin-pasos.md');
  await writeFile(file, '# Feature\n\n## Goal\nTest omissions.\n\nWHEN sucede THEN funciona (A1).\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /sin-pasos\.md:1:.*no contiene ## Steps/);
}));

test('new story reports missing mandatory fields and TODO acceptance mapping', async () => temporary(async (dir) => {
  const file = path.join(dir, 'incompleto.md');
  const source = newStoryPlan().replace('Dependencies: none.\n', '').replace('Handoff: use the agreed base and return the evidence for A1.\n', '').replace('(A1). Check:', '(A2). Check:');
  await writeFile(file, source);
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /incompleto\.md:.*falta Dependencies:/);
  assert.match(result.stdout, /incompleto\.md:.*falta Handoff:/);
  assert.match(result.stdout, /incompleto\.md:.*A2 en TODO no tiene criterio/);
}));

test('legacy scenarios and global acceptance remain valid', async () => temporary(async (dir) => {
  const file = path.join(dir, 'antiguo.md');
  await writeFile(file, `# Plan antiguo\n\n## Scenarios\n- La persona guarda el cambio.\n\n## Acceptance\n- A1: el cambio queda guardado.\n\n## Steps\n### Segment 1: guardar\nResult: el cambio queda guardado.\nFiles: \`src/a.js\`\n- [ ] Actualizar \`src/a.js\`. Check: \`node --check src/a.js\`\n`);
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');
}));

test('CLI errors use exit 2 and write to stderr', async () => {
  const noArgument = spawnSyncSeguro(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(noArgument.status, 2);
  assert.equal(noArgument.stdout, '');
  assert.match(noArgument.stderr, /archivo Markdown/);
  const missing = run('/ruta/inexistente/plan.md');
  assert.equal(missing.status, 2);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /no se pudo leer/);
});

test('three product files are allowed; four and a directory are warned', async () => temporary(async (dir) => {
  const base = `## Steps\n### Segment 1\nFiles: \`src/a.js\`, \`src/b.js\`, \`src/c.js\`\n- [ ] Editar \`src/a.js\`. Check: \`node --check src/a.js\`\n`;
  const file = path.join(dir, 'plan.md');
  await writeFile(file, base);
  assert.equal(run(file).status, 0);
  const newStoryFile = path.join(dir, 'nuevo.md');
  await writeFile(newStoryFile, newStoryPlan({ files: ['src/a.js', 'src/b.js', 'src/c.js', 'src/d.js'] }));
  const newStoryFour = run(newStoryFile);
  assert.equal(newStoryFour.status, 1);
  assert.match(newStoryFour.stdout, /nuevo\.md:.*4 archivos/);
  await writeFile(file, base.replace('src/c.js', 'src/c.js`, `src/d.js'));
  const four = run(file);
  assert.equal(four.status, 1);
  assert.match(four.stdout, /plan\.md:3:.*4 archivos/);
  await writeFile(file, base.replace('src/a.js`, `src/b.js`, `src/c.js', 'app/'));
  assert.match(run(file).stdout, /plan\.md:3:.*carpeta/);
}));

test('step checks may be on a subline; missing route and check each warn on step line', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, '## Steps\n- [ ] Hacer el cambio (A1).\n  - Check: `node --version`\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:2:.*ruta de archivo/);
  assert.doesNotMatch(result.stdout, /plan\.md:2:.*comprueba/);
}));

test('a backticked filename is not a check, and segment verification does not satisfy the last step', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, '## Steps\n### Segment 1\nFiles: `src/a.js`\n- [ ] Editar `src/a.js`.\nSegment verification: `node --version`\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:4:.*comprueba/);
  assert.doesNotMatch(result.stdout, /plan\.md:4:.*ruta de archivo/);
}));

test('Files declaration is parsed when it follows Result on the same line', async () => temporary(async (dir) => {
  const result = run(await translated(dir, 'f13-segment1.md'));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /f13-segment1\.md:5:.*carpeta/);
}));

test('one screen and one layer are allowed; multiple screens and layers warn', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  const base = '## Steps\n### Segment 1\nPantalla: acceso\nCapa: interfaz\n- [ ] Editar `src/a.js`. Check: `node --check src/a.js`\n';
  await writeFile(file, base);
  assert.equal(run(file).status, 0);
  await writeFile(file, base.replace('Pantalla: acceso', 'Pantallas: acceso, resumen'));
  assert.match(run(file).stdout, /plan\.md:2:.*varias pantallas/);
  await writeFile(file, base.replace('Capa: interfaz', 'Capa: interfaz y API'));
  assert.match(run(file).stdout, /plan\.md:2:.*varias capas/);
  await writeFile(file, base.replace('Capa: interfaz', 'Capa: interfaz; API fuera'));
  assert.equal(run(file).status, 0);
}));

test('8192 bytes are allowed and 8193 bytes are warned at line 1', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  const valid = `## Steps\n- [ ] Editar \`src/a.js\`. Check: \`node --check src/a.js\`\n`;
  await writeFile(file, valid + ' '.repeat(8192 - Buffer.byteLength(valid)));
  assert.equal(run(file).status, 0);
  await writeFile(file, valid + ' '.repeat(8193 - Buffer.byteLength(valid)));
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:1:.*8192 bytes/);
}));

test('tranches are checked separately and other sections are ignored', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, `continuity: continuous\n## Acceptance\n- [ ] Bad acceptance text\n\n## Steps\n### Segment 1\nFiles: \`src/a.js\`\n- [ ] Editar \`src/a.js\`. Check: \`node --check src/a.js\`\n### Segment 2\nFiles: \`src/b.js\`\n- [ ] Editar \`src/b.js\`. Check: \`node --check src/b.js\`\n`);
  assert.equal(run(file).status, 0);
}));

test('two or more tranches without continuity warn once; declared continuity or a single tranche do not', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  const body = '## Steps\n### Segment 1\nFiles: `src/a.js`\n- [ ] Editar `src/a.js`. Check: `node --check src/a.js`\n### Segment 2\nFiles: `src/b.js`\n- [ ] Editar `src/b.js`. Check: `node --check src/b.js`\n';
  await writeFile(file, body);
  const sin = run(file);
  assert.equal(sin.status, 1);
  assert.match(sin.stdout, /plan\.md:\d+: el plan tiene 2 tramos sin «continuity: continuous»/);
  assert.equal(sin.stdout.trim().split('\n').length, 1, 'el aviso de continuidad aparece una sola vez');
  await writeFile(file, `continuity: continuous\n${body}`);
  assert.equal(run(file).status, 0);
  await writeFile(file, body.replace(/### Segment 2[\s\S]*$/, ''));
  assert.equal(run(file).status, 0);
  await writeFile(file, '## Steps\n1. [Tramo 1](tramo-1.md)\n2. [Tramo 2](tramo-2.md)\n');
  assert.match(run(file).stdout, /plan\.md:\d+: el plan tiene 2 tramos sin «continuity: continuous»/);
}));

test('A2 valid new segment has no warnings', async () => temporary(async (dir) => {
  const file = path.join(dir, 'valido.md');
  await writeFile(file, newStoryPlan());
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '', 'una historia nueva no imprime la nota de formato anterior');
}));

test('A2 new segment without A# criteria warns', async () => temporary(async (dir) => {
  const file = path.join(dir, 'sin-a.md');
  await writeFile(file, newStoryPlan().replace(/Acceptance:\n- A1:[^\n]*\n/, ''));
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /sin-a\.md:\d+: historia nueva: falta al menos un criterio A#/);
}));

test('A2 new segment without quick check warns', async () => temporary(async (dir) => {
  const file = path.join(dir, 'sin-check.md');
  await writeFile(file, newStoryPlan().replace(/Segment verification:[^\n]*\n/, ''));
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /sin-check\.md:\d+: historia nueva: falta Segment verification:/);
}));

test('A2 mixed units between two A# with disjoint product files warn', async () => {
  const result = run(fixture('segment-mixed.md'));
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /segment-mixed\.md:7: historia nueva: A1 y A2 mezcla unidades/);
});

test('A2 uncovered A#, missing level and service markers at level 1 warn', async () => temporary(async (dir) => {
  const uncovered = path.join(dir, 'sin-cobertura.md');
  await writeFile(uncovered, newStoryPlan().replace('covers A1', 'covers A9'));
  assert.match(run(uncovered).stdout, /sin-cobertura\.md:\d+: historia nueva: A1 no tiene Segment verification/);
  const docker = path.join(dir, 'docker.md');
  await writeFile(docker, newStoryPlan().replace('node --test tests/feature.test.mjs', 'docker compose up'));
  assert.match(run(docker).stdout, /docker\.md:\d+: nivel 1 con marca de servicio «docker»/);
  const sinLevel = path.join(dir, 'sin-level.md');
  await writeFile(sinLevel, newStoryPlan().replace('— level 1; ', '— '));
  assert.match(run(sinLevel).stdout, /sin-level\.md:\d+: Segment verification: falta level/);
}));

test('A3 old format prints one stderr note, keeps stdout empty and exits 0 when clean', async () => temporary(async (dir) => {
  const file = path.join(dir, 'antiguo.md');
  await writeFile(file, '## Steps\n- [ ] Editar `src/a.js`. Check: `node --check src/a.js`\n');
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^nota: formato anterior/);
  assert.equal(result.stderr.trim().split('\n').length, 1, 'la nota ocupa una sola línea');
}));

const tranches = (count) => `continuity: continuous\n## Steps\n${Array.from({ length: count }, (_, index) => `### Segment ${index + 1}\nFiles: \`src/${index}.js\`\n- [ ] Editar \`src/${index}.js\`. Check: \`node --check src/${index}.js\`\n`).join('')}`;

test('A4 four tranches warn and three do not; Excepción de tamaño with a reason cancels the warning', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, tranches(3));
  assert.equal(run(file).status, 0);
  await writeFile(file, tranches(4));
  const cuatro = run(file);
  assert.equal(cuatro.status, 1);
  assert.match(cuatro.stdout, /plan\.md:\d+: el plan tiene 4 tramos \(máximo 3\)/);
  await writeFile(file, `${tranches(4)}Excepción de tamaño: plan de migración por diseño\n`);
  assert.equal(run(file).status, 0);
  await writeFile(file, `${tranches(4)}Excepción de tamaño:\n`);
  assert.equal(run(file).status, 1, 'una excepción sin razón no cuenta');
  await writeFile(file, `${tranches(4)}Excepción de tamaño:   \n`);
  assert.equal(run(file).status, 1, 'una excepción con solo espacios no cuenta');
}));

test('A4 an exception with a reason also cancels the 8192-byte warning; without one it still warns', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  const valid = `## Steps\n- [ ] Editar \`src/a.js\`. Check: \`node --check src/a.js\`\n`;
  const grande = valid + ' '.repeat(8193 - Buffer.byteLength(valid));
  await writeFile(file, grande);
  assert.equal(run(file).status, 1);
  await writeFile(file, `${grande}\nExcepción de tamaño: la lista de pruebas es larga\n`);
  assert.equal(run(file).status, 0);
  await writeFile(file, `${grande}\nExcepción de tamaño:\n`);
  assert.match(run(file).stdout, /plan\.md:1:.*8192 bytes/);
}));

// D-02: con «format: 2» una historia corta solo exige lo mínimo; sin la marca nada cambia.
const shortPlan = (criterion, { header = '---\nformat: 2\n---\n' } = {}) => `${header}# Plan corto

## Goal
Guardar el cambio.

## Scope
\`src/a.js\`.

## Steps
### Segment 1 — Story: save the change
Files: \`src/a.js\`
WHEN I save the change THEN it is available when I come back (A1).
Acceptance:
${criterion}
TODO:
- [ ] Update \`src/a.js\` (A1). Check: \`node --check src/a.js\`; exit 0.
Segment verification: \`node --test tests/feature.test.mjs\` — level 1; exit 0; covers A1.
`;

test('D-02 format 2 short plan with an executable criterion has no warnings and no As, Dependencies or Handoff', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, shortPlan('- A1: the change is saved; check `node --test tests/feature.test.mjs`; expect exit 0.'));
  const result = run(file);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stdout, '');
}));

test('D-02 format 2 criterion without executable command warns; manual review is accepted', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, shortPlan('- A1: the change is saved; check that it can be read back.'));
  const warned = run(file);
  assert.equal(warned.status, 1, warned.stderr);
  assert.match(warned.stdout, /plan\.md:\d+: historia nueva: A1 sin comando entre acentos graves y resultado esperado/);
  await writeFile(file, shortPlan('- A1: the change is saved; revisión manual: leer el archivo.'));
  const accepted = run(file);
  assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
}));

test('D-02 without the format 2 mark nothing changes: a complete story passes and a short one keeps the old fields', async () => temporary(async (dir) => {
  const complete = path.join(dir, 'plan.md');
  await writeFile(complete, newStoryPlan());
  const passed = run(complete);
  assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  await writeFile(complete, shortPlan('- A1: the change is saved; check `node --test tests/feature.test.mjs`; expect exit 0.', { header: '' }));
  const old = run(complete);
  assert.equal(old.status, 1, old.stderr);
  assert.match(old.stdout, /historia nueva: falta story «As/);
}));

test('D-02 a tramo-N.md inherits format 2 from its sibling plan.md', async () => temporary(async (dir) => {
  const tramo = path.join(dir, 'tramo-1.md');
  await writeFile(tramo, shortPlan('- A1: the change is saved; check `node --test tests/feature.test.mjs`; expect exit 0.', { header: '' }).replace('# Plan corto', '# Tramo 1'));
  const alone = run(tramo);
  assert.equal(alone.status, 1, alone.stderr);
  await writeFile(path.join(dir, 'plan.md'), '---\nformat: 2\n---\n# Plan\n');
  const inherited = run(tramo);
  assert.equal(inherited.status, 0, inherited.stdout + inherited.stderr);
}));

test('D-06 format 2 accepts any backticked command with an expected result, without checking the binary', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  for (const command of ['npx vitest run', 'uv run pytest', 'dotnet test', 'test -f src/a.js', 'rg -q save src/a.js', 'grep -q save src/a.js', './gradlew test', 'mvn test', 'php artisan test', 'flutter test', './x.sh']) {
    await writeFile(file, shortPlan(`- A1: the change is saved; check \`${command}\`; expect exit 0.`));
    const result = run(file);
    assert.equal(result.status, 0, `${command}: ${result.stdout}${result.stderr}`);
  }
}));

test('D-02 format 2 accepts the command on an indented continuation line of the same A#', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, shortPlan('- A1: the change is saved; check:\n  `node --check src/a.js`; expect exit 0.'));
  const result = run(file);
  assert.equal(result.status, 0, result.stdout + result.stderr);
}));

test('D-06 format 2 needs a backticked command and an expected result; a bare name or a missing result warns', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  for (const criterion of [
    '- A1: the change is saved; check src/test.js; expect exit 0.',
    '- A1: the change is saved; check `src/test.js`.',
  ]) {
    await writeFile(file, shortPlan(criterion));
    const result = run(file);
    assert.equal(result.status, 1, `${criterion}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /historia nueva: A1 sin comando entre acentos graves y resultado esperado/);
  }
}));
