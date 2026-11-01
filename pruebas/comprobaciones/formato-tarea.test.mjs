import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTarea, MAX_CARACTERES } from './formato-tarea.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const muestra = [
  '# task-03 — Ejemplo de tarea válida',
  'repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  '',
  '## Decisiones ya tomadas',
  '- Se usa `node:test`.',
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

const variantes = [
  ['regla 1: primera línea mal formada', (t) => t.replace('# task-03 — ', '# tarea 3 - ')],
  ['regla 2: estado inválido', (t) => t.replace('estado: aprobada', 'estado: pendiente')],
  ['regla 2: depende_de inválido', (t) => t.replace('depende_de: task-01, task-02', 'depende_de: task-2')],
  ['regla 3: falta una sección', (t) => t.replace('## Decisiones ya tomadas\n', '')],
  ['regla 4: sección obligatoria sin cuerpo', (t) => t.replace('Texto que describe el objetivo de la tarea.\n', '')],
  ['regla 5: sin «Fuera de alcance:»', (t) => t.replace('Fuera de alcance: hacer commit.', 'Sin límites: hacer commit.')],
  ['regla 6: nueve pasos', (t) => t.replace('2. Probarlo.', Array.from({ length: 8 }, (_, i) => `${i + 2}. Paso ${i + 2}.`).join('\n'))],
  ['regla 7: seis criterios', (t) => t.replace('1. Pasa la prueba.', Array.from({ length: 6 }, (_, i) => `${i + 1}. Criterio ${i + 1}.`).join('\n'))],
  ['regla 8: marcador de pendiente', (t) => t.replace('Texto que describe el objetivo de la tarea.', 'Texto con un TBD sin resolver.')],
  ['regla 9: más de 8192 caracteres', (t) => t.replace('Texto que describe el objetivo de la tarea.', 'x'.repeat(MAX_CARACTERES))],
];

test('la muestra válida no produce errores', () => {
  assert.deepEqual(validarTarea(muestra), []);
});

for (const [nombre, alterar] of variantes) {
  test(`rechaza una tarea con violación de ${nombre}`, () => {
    const alterada = alterar(muestra);
    assert.notEqual(alterada, muestra, 'la variante no alteró la muestra');
    assert.ok(validarTarea(alterada).length >= 1, nombre);
  });
}

test('una tarea de exactamente MAX_CARACTERES caracteres es válida', () => {
  const textoOriginal = 'Texto que describe el objetivo de la tarea.';
  const relleno = 'x'.repeat(MAX_CARACTERES - muestra.length + textoOriginal.length);
  const justa = muestra.replace(textoOriginal, relleno);
  assert.equal(justa.length, MAX_CARACTERES);
  assert.deepEqual(validarTarea(justa), []);
});

test('exige Evidencia no vacía con estado «lista para revisión»', () => {
  const alterada = muestra.replace('estado: aprobada', 'estado: lista para revisión');
  assert.ok(validarTarea(alterada).some((e) => e.includes('Evidencia')));
});

const reales = fs
  .readdirSync(path.join(raiz, 'features'), { recursive: true })
  .filter((r) => /(^|\/)task-\d{2}-[^/]*\.md$/.test(r))
  .filter((r) => !r.startsWith('completed/'))
  .map((r) => path.join(raiz, 'features', r));

test('las tareas reales de features/ cumplen el formato', () => {
  assert.ok(reales.length >= 1, 'no hay tareas reales en features/');
  const fallos = reales.flatMap((ruta) =>
    validarTarea(fs.readFileSync(ruta, 'utf8')).map((e) => `${path.relative(raiz, ruta)}: ${e}`),
  );
  assert.deepEqual(fallos, []);
});

test('cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta', () => {
  const fallos = [];
  for (const ruta of reales) {
    const segunda = fs.readFileSync(ruta, 'utf8').split('\n')[1] ?? '';
    const depende = segunda.match(/depende_de: (.*?)\s{2,}estado:/)?.[1] ?? '—';
    if (depende === '—') continue;
    const hermanos = fs.readdirSync(path.dirname(ruta));
    for (const id of depende.split(', ')) {
      if (!hermanos.some((f) => f.startsWith(`${id}-`) && f.endsWith('.md'))) {
        fallos.push(`${path.relative(raiz, ruta)}: no existe un archivo ${id}-*.md en su carpeta`);
      }
    }
  }
  assert.deepEqual(fallos, []);
});
