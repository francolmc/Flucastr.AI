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
