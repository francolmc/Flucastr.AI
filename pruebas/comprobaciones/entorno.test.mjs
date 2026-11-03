import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comprobarEntorno, sugerirRequiere } from '../../scripts/entorno.mjs';
import { parsearRequiere } from '../../scripts/formato-requiere.mjs';

const ENTORNO = fileURLToPath(new URL('../../scripts/entorno.mjs', import.meta.url));

function items(texto) {
  const r = parsearRequiere(texto);
  assert.equal(r.ok, true);
  return r.items;
}

function cli(...argumentos) {
  const r = spawnSync(process.execPath, [ENTORNO, ...argumentos], { encoding: 'utf8', timeout: 30000 });
  return { codigo: r.status, salida: r.stdout.trim(), error: r.stderr.trim() };
}

function tareaCon(directorio, contexto) {
  const ruta = join(directorio, 'tarea.md');
  writeFileSync(ruta, `# task-99\nrepo: X   estado: aprobada\n\n## Contexto\n${contexto}\n\n## Pasos\n1. nada\n`);
  return ruta;
}

function puertoCerrado() {
  return new Promise((resolver, rechazar) => {
    const s = createServer();
    s.once('error', rechazar);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolver(port));
    });
  });
}

function puertoAbierto() {
  return new Promise((resolver, rechazar) => {
    const s = createServer();
    s.once('error', rechazar);
    s.listen(0, '127.0.0.1', () => resolver({ port: s.address().port, servidor: s }));
  });
}

test('comprobarEntorno con sondas inyectadas: ambas fallan da las dos faltas en orden', async () => {
  const sondas = { docker: async () => false, puerto: async () => false };
  assert.deepEqual(await comprobarEntorno(items('docker, puerto:55432'), sondas), ['docker', 'puerto:55432']);
});

test('comprobarEntorno con sondas inyectadas: ambas ok da arreglo vacío', async () => {
  const sondas = { docker: async () => true, puerto: async () => true };
  assert.deepEqual(await comprobarEntorno(items('docker, puerto:55432'), sondas), []);
});

test('comprobarEntorno: un item sin sonda (largo) cumple y una sonda que lanza cuenta como falta', async () => {
  const sondas = { docker: async () => { throw new Error('x'); } };
  assert.deepEqual(await comprobarEntorno(items('docker, largo:240'), sondas), ['docker']);
});

test('CLI: ninguno da ok y código 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Tocar: x\n- Requiere: ninguno'));
    assert.deepEqual(r, { codigo: 0, salida: 'ok', error: '' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: sin línea Requiere da aviso y código 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Tocar: x'));
    assert.equal(r.codigo, 0);
    assert.equal(r.salida, 'aviso: la tarea no declara Requiere');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: línea inválida da código 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Tocar: x\n- Requiere: docker, cosa-rara'));
    assert.equal(r.codigo, 2);
    assert.equal(r.salida, '');
    assert.notEqual(r.error, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: Requiere repetida da código 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Requiere: ninguno\n- Requiere: docker'));
    assert.equal(r.codigo, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: uso sin argumentos da código 2', () => {
  assert.equal(cli().codigo, 2);
});

test('CLI: runtime con la mayor de process.versions.node da código 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const mayor = process.versions.node.split('.')[0];
    const r = cli(tareaCon(dir, `- Requiere: runtime:node@${mayor}`));
    assert.deepEqual(r, { codigo: 0, salida: 'ok', error: '' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: runtime:node@999 da código 1 y falta=runtime:node@999', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Requiere: runtime:node@999'));
    assert.equal(r.codigo, 1);
    assert.equal(r.salida, 'falta=runtime:node@999');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: puerto ocupado por un servidor de la prueba da código 1 y falta=puerto:<n>', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  const { port, servidor } = await puertoAbierto();
  try {
    const r = cli(tareaCon(dir, `- Requiere: puerto:${port}`));
    assert.equal(r.codigo, 1);
    assert.equal(r.salida, `falta=puerto:${port}`);
  } finally {
    await new Promise((resolver) => servidor.close(resolver));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: puerto ya cerrado da código 0', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const port = await puertoCerrado();
    const r = cli(tareaCon(dir, `- Requiere: puerto:${port}`));
    assert.deepEqual(r, { codigo: 0, salida: 'ok', error: '' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: largo:240 da código 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const r = cli(tareaCon(dir, '- Requiere: largo:240'));
    assert.deepEqual(r, { codigo: 0, salida: 'ok', error: '' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI no escribe en el directorio de la tarea', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const ruta = tareaCon(dir, '- Requiere: runtime:node@999, largo:240');
    const antes = readdirSync(dir).map((n) => [n, statSync(join(dir, n)).mtimeMs, statSync(join(dir, n)).size]);
    cli(ruta);
    const despues = readdirSync(dir).map((n) => [n, statSync(join(dir, n)).mtimeMs, statSync(join(dir, n)).size]);
    assert.deepEqual(despues, antes);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tareaConVerificacion(directorio, verificacion, extra = '') {
  const ruta = join(directorio, 'tarea.md');
  writeFileSync(ruta, `# task-99\nrepo: X   estado: aprobada\n\n${extra}## Contexto\n- Tocar: x\n\n## Verificación\n${verificacion}\n\n## Evidencia\n\n## Notas\n`);
  return ruta;
}

test('sugerirRequiere: Docker + localhost:55432 da docker y puerto:55432', () => {
  assert.deepEqual(sugerirRequiere('## Verificación\ndocker info && curl localhost:55432\n'), ['docker', 'puerto:55432']);
});

test('sugerirRequiere: playwright test da navegador', () => {
  assert.deepEqual(sugerirRequiere('## Verificación\nplaywright test\n'), ['navegador']);
});

test('sugerirRequiere: verificación sin nada da arreglo vacío', () => {
  assert.deepEqual(sugerirRequiere('## Verificación\nnode --test x.test.mjs\n'), []);
});

test('sugerirRequiere: menciones fuera de Verificación no cuentan', () => {
  const texto = '## Descripción\nUsa docker y localhost:55432 y chromium.\n\n## Verificación\nnode --test x.test.mjs\n\n## Notas\ndocker\n';
  assert.deepEqual(sugerirRequiere(texto), []);
});

test('sugerirRequiere: puertos sin repetir y en orden de aparición', () => {
  const texto = '## Verificación\ncurl 127.0.0.1:8080; curl localhost:55432; curl localhost:8080; curl 127.0.0.1:55432\n';
  assert.deepEqual(sugerirRequiere(texto), ['puerto:8080', 'puerto:55432']);
});

test('CLI --sugerir: salida exacta y código 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const ruta = tareaConVerificacion(dir, 'docker info\ncurl localhost:55432\n');
    const r = cli('--sugerir', ruta);
    assert.deepEqual(r, { codigo: 0, salida: 'sugerido: Requiere: docker, puerto:55432', error: '' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI --sugerir: sin Docker disponible no corre sondas y no escribe en el directorio', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entorno-'));
  try {
    const ruta = tareaConVerificacion(dir, 'docker info\nplaywright test\ncurl localhost:55432\n');
    const antes = readdirSync(dir).map((n) => [n, statSync(join(dir, n)).mtimeMs, statSync(join(dir, n)).size]);
    const r = spawnSync(process.execPath, [ENTORNO, '--sugerir', ruta], { encoding: 'utf8', timeout: 30000, env: { ...process.env, PATH: '/nonexistent' } });
    const despues = readdirSync(dir).map((n) => [n, statSync(join(dir, n)).mtimeMs, statSync(join(dir, n)).size]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), 'sugerido: Requiere: docker, navegador, puerto:55432');
    assert.deepEqual(despues, antes);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
