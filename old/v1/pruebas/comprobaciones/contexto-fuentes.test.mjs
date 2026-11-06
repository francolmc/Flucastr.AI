import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agregarFuentes, categoriaDeFuente, formatearTabla } from '../../scripts/contexto-fuentes.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const CLI = join(aqui, '..', '..', 'scripts', 'contexto-fuentes.mjs');
const CABECERA = '| fuente | KB único | veces leída | KB totales | rol |';

// Sesión con la forma de descubrirSesiones (consumo.mjs): lecturas del coordinador y subagentes por rol.
const sesion = ({ rol = 'coordinador', lecturas = {}, porRol = {} } = {}) => ({
  archivo: 'sintetica.jsonl',
  rol,
  lecturas: { porArchivo: lecturas },
  subagentes: { porRol: porRol },
});

test('una ruta leída dos veces (en dos sesiones) suma veces 2 y kb total', () => {
  const ruta = '/repo/definitions/STATUS-sintetico.md';
  const filas = agregarFuentes([
    sesion({ lecturas: { [ruta]: { lecturas: 1, kb: 2.0 } } }),
    sesion({ lecturas: { [ruta]: { lecturas: 1, kb: 2.0 } } }),
  ], { repo: '/inexistente' });
  const fila = filas.find((f) => f.fuente === ruta);
  assert.equal(fila.veces, 2);
  assert.equal(fila.kbTotales, 4);
  assert.equal(fila.kbUnico, 2);
  assert.equal(fila.rol, 'coordinador');
});

test('las categorías se asignan por ruta', () => {
  assert.equal(categoriaDeFuente('/r/skills/ejecutar-tarea/SKILL.md'), 'skill');
  assert.equal(categoriaDeFuente('/r/definitions/PROJECT.md'), 'definicion');
  assert.equal(categoriaDeFuente('/r/definitions/STATUS.md'), 'definicion');
  assert.equal(categoriaDeFuente('/r/STATUS.md'), 'status');
  assert.equal(categoriaDeFuente('/r/features/F43/task-01.md'), 'tarea');
  assert.equal(categoriaDeFuente('/r/modelos.json'), 'otro');

  const filas = agregarFuentes([sesion({
    lecturas: {
      '/r/skills/x/SKILL.md': { lecturas: 1, kb: 1 },
      '/r/features/F1/task-01.md': { lecturas: 1, kb: 1 },
      '/r/instalar.sh': { lecturas: 1, kb: 1 },
    },
  })], { repo: '/inexistente' });
  const categoria = (ruta) => filas.find((f) => f.fuente === ruta).categoria;
  assert.equal(categoria('/r/skills/x/SKILL.md'), 'skill');
  assert.equal(categoria('/r/features/F1/task-01.md'), 'tarea');
  assert.equal(categoria('/r/instalar.sh'), 'otro');
});

test('un dato ausente da n/d y no se estima', () => {
  const ruta = '/r/definitions/X.md';
  const filas = agregarFuentes([
    sesion({ porRol: { constructor: { corridas: 1, porArchivo: { [ruta]: { lecturas: 1 } } } } }),
  ], { repo: '/inexistente' });
  const fila = filas.find((f) => f.fuente === ruta);
  assert.equal(fila.kbTotales, 'n/d');
  assert.equal(fila.kbUnico, 'n/d');
  assert.equal(fila.rol, 'constructor');
  // Sin agentes/<rol>.md en el repo, el prompt también es n/d.
  const prompt = filas.find((f) => f.categoria === 'prompt');
  assert.equal(prompt.kbTotales, 'n/d');
});

test('el prompt de un rol mide agentes/<rol>.md en KB y veces = corridas', () => {
  const repo = mkdtempSync(join(tmpdir(), 'contexto-fuentes-'));
  try {
    mkdirSync(join(repo, 'agentes'));
    writeFileSync(join(repo, 'agentes', 'coordinador.md'), 'x'.repeat(2048));
    const filas = agregarFuentes([sesion(), sesion()], { repo });
    const prompt = filas.find((f) => f.categoria === 'prompt');
    assert.equal(prompt.fuente, 'agentes/coordinador.md');
    assert.equal(prompt.veces, 2);
    assert.equal(prompt.kbUnico, 2);
    assert.equal(prompt.kbTotales, 4);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('formatearTabla: cabecera una vez, texto ≤ 4096 bytes aunque haya muchas filas', () => {
  const filas = Array.from({ length: 500 }, (_, i) => ({
    fuente: `/Users/franco/Codes/flucastr/Flucastr.AI/definitions/ruta-larga-${i}.md`,
    categoria: 'definicion', kbUnico: 1.5, veces: 3, kbTotales: 4.5, rol: 'coordinador',
  }));
  const texto = formatearTabla(filas);
  assert.equal(texto.split(CABECERA).length - 1, 1);
  assert.ok(Buffer.byteLength(texto, 'utf8') <= 4096);
  assert.match(texto, /filas más \(ver --json\)/);
});

test('CLI: carpeta de logs vacía termina en 0 y solo imprime la cabecera', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'contexto-fuentes-vacio-'));
  try {
    const r = spawnSync(process.execPath, [CLI, '--raiz', raiz, '--repo', raiz], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), `${CABECERA}\n|---|---:|---:|---:|---|`);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('CLI: sin --raiz falla con código 1', () => {
  const r = spawnSync(process.execPath, [CLI], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--raiz es obligatorio/);
});
