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
const dir = fs.mkdtempSync(path.join(base, 'hook-tarea-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

const valida = [
  '# task-01 — Ejemplo de tarea válida',
  'repo: Flucastr.AI   depende_de: —   estado: aprobada',
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
  '',
  '## Criterios de aceptación',
  '1. El archivo existe.',
  '',
  '## Verificación',
  '```',
  'node --test',
  '```',
  '',
  '## Evidencia',
  '',
  '## Notas',
  '',
].join('\n');

// Escribe un archivo de tarea bajo un directorio de feature y devuelve su ruta absoluta.
function escribirTarea(carpeta, nombre, texto) {
  const destino = path.join(dir, 'features', carpeta);
  fs.mkdirSync(destino, { recursive: true });
  const ruta = path.join(destino, nombre);
  fs.writeFileSync(ruta, texto, 'utf8');
  return ruta;
}

// Ejecuta el CLI con --hook y el JSON de evento dado (o un texto crudo si es string).
function hook(entrada, { cwd, args = ['--hook'] } = {}) {
  const input = typeof entrada === 'string' ? entrada : JSON.stringify(entrada);
  return spawnSync('node', [script, ...args], { input, encoding: 'utf8', cwd });
}

const evento = (ruta) => ({ tool_name: 'Write', cwd: dir, tool_input: { file_path: ruta } });

test('tarea con bloque de código abierto sale 2 con línea, sección y Firma', () => {
  const dañada = valida.replace('```\nnode --test\n```', '```\nnode --test');
  const ruta = escribirTarea('F99-x', 'task-01-a.md', dañada);
  const r = hook(evento(ruta));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /bloque de código abierto en línea \d+, en «## Verificación»/);
  assert.match(r.stderr, /Firma: bloque-abierto\|/);
  assert.equal(r.stdout, '');
});

test('tarea válida sale 0 sin salida (control negativo)', () => {
  const ruta = escribirTarea('F99-x', 'task-02-valida.md', valida);
  const r = hook(evento(ruta));
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('tarea con Descripción vacía (alarma de mitad de edición) sale 0', () => {
  const vacia = valida.replace('Texto que describe el objetivo de la tarea.', '');
  const ruta = escribirTarea('F99-x', 'task-03-vacia.md', vacia);
  const r = hook(evento(ruta));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

test('tarea con una sección de cabecera rota sale 2 con Firma de secciones', () => {
  const sinNotas = valida.replace('## Notas\n', '');
  const ruta = escribirTarea('F99-x', 'task-04-secciones.md', sinNotas);
  const r = hook(evento(ruta));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Las secciones «##» deben ser exactamente/);
  assert.match(r.stderr, /Firma: secciones\|/);
});

test('ruta en features/completed/ sale 0 aunque la tarea esté dañada', () => {
  const dañada = valida.replace('```\nnode --test\n```', '```\nnode --test');
  const ruta = escribirTarea('completed/F98-y', 'task-01-a.md', dañada);
  const r = hook(evento(ruta));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

test('archivo que no es task-*.md sale 0 aunque esté dañado', () => {
  const dañada = valida.replace('```\nnode --test\n```', '```\nnode --test');
  const ruta = escribirTarea('F99-x', 'notas.md', dañada);
  const r = hook(evento(ruta));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

test('stdin que no es JSON sale 0', () => {
  const r = hook('esto no es json {');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('evento sin tool_input.file_path sale 0', () => {
  const r = hook({ tool_name: 'Write', tool_input: {} });
  assert.equal(r.status, 0);
});

test('ruta relativa se resuelve contra cwd', () => {
  const dañada = valida.replace('```\nnode --test\n```', '```\nnode --test');
  escribirTarea('F97-rel', 'task-01-rel.md', dañada);
  const r = hook(
    { tool_name: 'Write', cwd: dir, tool_input: { file_path: 'features/F97-rel/task-01-rel.md' } },
  );
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Firma: bloque-abierto\|/);
});

test('ruta relativa a un archivo inexistente sale 0', () => {
  const r = hook({ tool_name: 'Write', cwd: dir, tool_input: { file_path: 'features/F96-no/task-01-no.md' } });
  assert.equal(r.status, 0);
});

test('--hook con argumentos extra sale 2 con uso', () => {
  const r = hook(evento('/nada/features/F99-x/task-01-a.md'), { args: ['--hook', 'extra'] });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Uso: node validar-tarea\.mjs --hook/);
});

test('--hook en otra posición sale 2 por opción desconocida', () => {
  const r = hook(evento('/nada/features/F99-x/task-01-a.md'), { args: ['/nada/x.md', '--hook'] });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Opción desconocida: --hook/);
});
