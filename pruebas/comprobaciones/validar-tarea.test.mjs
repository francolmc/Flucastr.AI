import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(raiz, 'scripts', 'validar-tarea.mjs');
const base = path.join(raiz, 'pruebas', '.temporales');
fs.mkdirSync(base, { recursive: true });
const dir = fs.mkdtempSync(path.join(base, 'validar-tarea-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

const valida = [
  '# task-03 — Ejemplo de tarea válida',
  'repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  '- Tocar: `archivo.mjs`',
  '',
  '## Decisiones ya tomadas',
  '- Se usa `node:test`.',
  '',
  '## Decisiones abiertas',
  'Ninguna.',
  '',
  '## Alcance / Fuera de alcance',
  'Alcance: un archivo nuevo.',
  'Fuera de alcance: hacer commit.',
  '',
  '## Pasos',
  '1. Crear el archivo.',
  '2. Probarlo.',
  '',
  '## Criterios de aceptación',
  '1. Pasa la prueba.',
  '',
  '## Verificación',
  '```',
  'node --test archivo.test.mjs',
  '```',
  'Salida esperada: `ℹ fail 0`.',
  '',
  '## Evidencia',
  '',
  '## Notas',
  '',
].join('\n');

// Control negativo: cuatro rutas en «Tocar» (el máximo es tres).
const cuatroTocar = valida.replace('- Tocar: `archivo.mjs`', '- Tocar: `a.mjs`, `b.mjs`, `c.mjs`, `d.mjs`');

// Decisiones abiertas sin resolver.
const abiertas = valida.replace('## Decisiones abiertas\nNinguna.', '## Decisiones abiertas\nPendiente: a definir por el arquitecto.');

fs.writeFileSync(path.join(dir, 'valida.md'), valida);
fs.writeFileSync(path.join(dir, 'cuatro.md'), cuatroTocar);
fs.writeFileSync(path.join(dir, 'abierta.md'), abiertas);

function correr(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('una tarea válida sola sale con 0 y OK: 1', () => {
  const r = correr('valida.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) válida\(s\)/);
});

test('una tarea inválida sola sale con 1, con su ruta y el motivo sobre «Tocar»', () => {
  const r = correr('cuatro.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /cuatro\.md: /);
  assert.match(r.out, /Tocar/);
});

test('válida más inválida sale con 1 y una sola línea de rechazo', () => {
  const r = correr('valida.md', 'cuatro.md');
  assert.equal(r.code, 1);
  const rechazos = r.out.split('\n').filter((l) => l.startsWith('cuatro.md: '));
  assert.equal(rechazos.length, 1);
  assert.equal(r.out.includes('OK:'), false);
});

test('decisiones abiertas sin resolver se rechazan', () => {
  const r = correr('abierta.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /abierta\.md: /);
});

test('sin argumentos sale con 2 y muestra el uso en stderr', () => {
  const r = correr();
  assert.equal(r.code, 2);
  assert.match(r.err, /Uso: node validar-tarea\.mjs <ruta-tarea>\.\.\./);
});

test('ruta inexistente sale con 2 y lo indica en stderr', () => {
  const r = correr('no-existe.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /No se puede leer: no-existe\.md/);
});

test('una ruta ilegible sale con 2 aunque otra sea inválida', () => {
  const r = correr('cuatro.md', 'no-existe.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /No se puede leer: no-existe\.md/);
});
