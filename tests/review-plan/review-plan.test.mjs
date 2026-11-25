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
