import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'scripts/revisar-plan.mjs');
const fixture = (name) => path.join(root, 'pruebas/revisar-plan/fixtures', name);
const run = (file) => spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
const temporary = async (callback) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'revisar-plan-'));
  try { await callback(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};

const newStoryPlan = ({ files = ['src/a.js'], extra = '' } = {}) => `# Feature de prueba

## Alcance
Cambiar solo los archivos de producto declarados por historia.

## Pasos
### Tramo 1 — Historia: guardar el cambio
Como persona usuaria quiero guardar el cambio para conservar mi trabajo.
Dependencias: ninguna.
Alcance: ${files.map((file) => `\`${file}\``).join(', ')}.
Archivos: ${files.map((file) => `\`${file}\``).join(', ')}
CUANDO guardo el cambio ENTONCES queda disponible al volver (A1).
Aceptación:
- A1: el cambio queda guardado; comprobar que puede volver a leerse.
TODO:
- [ ] Actualizar \`${files[0]}\` (A1). Comprobación: \`node --check ${files[0]}\`; exit 0.
Verificación del tramo: \`node --test pruebas/feature.test.mjs\` — nivel 1; exit 0; cubre A1.
Handoff: usar la base acordada y devolver la evidencia de A1.
${extra}`;

test('F13 fixture reports folder, weak steps and multiple screens', () => {
  const result = run(fixture('f13-tramo1.md'));
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /f13-tramo1\.md:5:.*carpeta/);
  assert.match(result.stdout, /f13-tramo1\.md:7:.*ruta de archivo/);
  for (const line of [6, 7, 8, 9]) assert.match(result.stdout, new RegExp(`f13-tramo1\\.md:${line}:.*comprueba`));
  assert.match(result.stdout, /f13-tramo1\.md:4:.*varias pantallas/);
});

test('well-cut plan has no warnings and stays byte-for-byte intact', async () => {
  const file = fixture('plan-correcto.md');
  const before = await readFile(file);
  const result = run(file);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.deepEqual(await readFile(file), before);
});

test('complete new story fixture passes without external change-plan paths', async () => temporary(async (dir) => {
  const file = path.join(dir, 'nuevo.md');
  await writeFile(file, newStoryPlan());
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');

  const stableFixture = run(fixture('historia-nueva-valida.md'));
  assert.equal(stableFixture.status, 0, stableFixture.stdout || stableFixture.stderr);
  assert.equal(stableFixture.stdout, '');
}));

test('new format without Pasos is rejected instead of accepted silently', async () => temporary(async (dir) => {
  const file = path.join(dir, 'sin-pasos.md');
  await writeFile(file, '# Feature\n\n## Objetivo\nProbar omisiones.\n\nCUANDO sucede ENTONCES funciona (A1).\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /sin-pasos\.md:1:.*no contiene ## Pasos/);
}));

test('new story reports missing mandatory fields and TODO acceptance mapping', async () => temporary(async (dir) => {
  const file = path.join(dir, 'incompleto.md');
  const source = newStoryPlan().replace('Dependencias: ninguna.\n', '').replace('Handoff: usar la base acordada y devolver la evidencia de A1.\n', '').replace('(A1). Comprobación:', '(A2). Comprobación:');
  await writeFile(file, source);
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /incompleto\.md:.*falta Dependencias/);
  assert.match(result.stdout, /incompleto\.md:.*falta Handoff/);
  assert.match(result.stdout, /incompleto\.md:.*A2 en TODO no tiene criterio/);
}));

test('legacy scenarios and global acceptance remain valid', async () => temporary(async (dir) => {
  const file = path.join(dir, 'antiguo.md');
  await writeFile(file, `# Plan antiguo\n\n## Escenarios\n- La persona guarda el cambio.\n\n## Aceptación\n- A1: el cambio queda guardado.\n\n## Pasos\n### Tramo 1: guardar\nResultado: el cambio queda guardado.\nArchivos: \`src/a.js\`\n- [ ] Actualizar \`src/a.js\`. Comprobación: \`node --check src/a.js\`\n`);
  const result = run(file);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.stdout, '');
}));

test('CLI errors use exit 2 and write to stderr', async () => {
  const noArgument = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(noArgument.status, 2);
  assert.equal(noArgument.stdout, '');
  assert.match(noArgument.stderr, /archivo Markdown/);
  const missing = run('/ruta/inexistente/plan.md');
  assert.equal(missing.status, 2);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /no se pudo leer/);
});

test('three product files are allowed; four and a directory are warned', async () => temporary(async (dir) => {
  const base = `## Pasos\n### Tramo 1\nArchivos: \`src/a.js\`, \`src/b.js\`, \`src/c.js\`\n- [ ] Editar \`src/a.js\`. Comprobación: \`node --check src/a.js\`\n`;
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
  await writeFile(file, '## Pasos\n- [ ] Hacer el cambio (A1).\n  - Comprobación: `node --version`\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:2:.*ruta de archivo/);
  assert.doesNotMatch(result.stdout, /plan\.md:2:.*comprueba/);
}));

test('a backticked filename is not a check, and tranche verification does not satisfy the last step', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, '## Pasos\n### Tramo 1\nArchivos: `src/a.js`\n- [ ] Editar `src/a.js`.\nVerificación del tramo: `node --version`\n');
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:4:.*comprueba/);
  assert.doesNotMatch(result.stdout, /plan\.md:4:.*ruta de archivo/);
}));

test('Archivos declaration is parsed when it follows Resultado on the same line', async () => {
  const result = run(fixture('f13-tramo1.md'));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /f13-tramo1\.md:5:.*carpeta/);
});

test('one screen and one layer are allowed; multiple screens and layers warn', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  const base = '## Pasos\n### Tramo 1\nPantalla: acceso\nCapa: interfaz\n- [ ] Editar `src/a.js`. Comprobación: `node --check src/a.js`\n';
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
  const valid = `## Pasos\n- [ ] Editar \`src/a.js\`. Comprobación: \`node --check src/a.js\`\n`;
  await writeFile(file, valid + ' '.repeat(8192 - Buffer.byteLength(valid)));
  assert.equal(run(file).status, 0);
  await writeFile(file, valid + ' '.repeat(8193 - Buffer.byteLength(valid)));
  const result = run(file);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /plan\.md:1:.*8192 bytes/);
}));

test('tranches are checked separately and other sections are ignored', async () => temporary(async (dir) => {
  const file = path.join(dir, 'plan.md');
  await writeFile(file, `## Aceptación\n- [ ] Bad acceptance text\n\n## Pasos\n### Tramo 1\nArchivos: \`src/a.js\`\n- [ ] Editar \`src/a.js\`. Comprobación: \`node --check src/a.js\`\n### Tramo 2\nArchivos: \`src/b.js\`\n- [ ] Editar \`src/b.js\`. Comprobación: \`node --check src/b.js\`\n`);
  assert.equal(run(file).status, 0);
}));
