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
  '- Tocar: `archivo.mjs`',
  '- Requiere: docker, puerto:55432',
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
  ['regla 11: cuatro rutas a tocar', (t) => t.replace('- Tocar: `archivo.mjs`', '- Tocar: `a.mjs`, `b.mjs`, `c.mjs`, `d.mjs`')],
  ['regla 11: ruta con «*»', (t) => t.replace('- Tocar: `archivo.mjs`', '- Tocar: `*.mjs`')],
  ['regla 11: sin línea «Tocar»', (t) => t.replace('- Tocar: `archivo.mjs`\n', '')],
  ['regla 12: Requiere inválido', (t) => t.replace('- Requiere: docker, puerto:55432', '- Requiere: Docker')],
  ['regla 12: dos líneas Requiere', (t) => t.replace('- Requiere: docker, puerto:55432', '- Requiere: docker, puerto:55432\n- Requiere: ninguno')],
  ['regla 10: decisión abierta sin resolver', (t) => t.replace('## Decisiones abiertas\nNinguna.', '## Decisiones abiertas\n- ¿Qué librería usar?')],
  ['regla 10: sección «Decisiones abiertas» vacía', (t) => t.replace('## Decisiones abiertas\nNinguna.', '## Decisiones abiertas')],
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

const cancelada = muestra
  .replace('estado: aprobada', 'estado: cancelada')
  .replace('## Notas\n', '## Notas\nCancelada: motivo=replanificada\n');

test('acepta una tarea «cancelada» con su línea «Cancelada: motivo=replanificada» y sin Evidencia', () => {
  const sinEvidencia = cancelada.replace('## Evidencia\n\n', '## Evidencia\n');
  assert.deepEqual(validarTarea(sinEvidencia), []);
});

test('rechaza una tarea «cancelada» sin línea «Cancelada:»', () => {
  const sinLinea = cancelada.replace('Cancelada: motivo=replanificada\n', '');
  const errores = validarTarea(sinLinea);
  assert.equal(errores.length, 1);
  assert.match(errores[0], /exige una línea «Cancelada: motivo=…»/);
});

test('rechaza una tarea «cancelada» con motivo fuera de la lista', () => {
  const motivoNuevo = cancelada.replace('motivo=replanificada', 'motivo=nueva');
  const errores = validarTarea(motivoNuevo);
  assert.equal(errores.length, 1);
  assert.match(errores[0], /«nueva» no está en el vocabulario/);
});

test('una tarea «hecha» no exige línea «Cancelada:»', () => {
  const hecha = muestra.replace('estado: aprobada', 'estado: hecha').replace('## Evidencia\n\n', '## Evidencia\n$ node --test\nexit 0\n');
  assert.deepEqual(validarTarea(hecha), []);
});

test('acepta una decisión abierta con «Resuelta: »', () => {
  const resuelta = muestra.replace('## Decisiones abiertas\nNinguna.', '## Decisiones abiertas\n- Elegir librería — Resuelta: node:test');
  assert.deepEqual(validarTarea(resuelta), []);
});

test('exige Evidencia no vacía con estado «lista para revisión»', () => {
  const alterada = muestra.replace('estado: aprobada', 'estado: lista para revisión');
  assert.ok(validarTarea(alterada).some((e) => e.includes('Evidencia')));
});

const esActiva = (r) => /(^|\/)task-\d{2}-[^/]*\.md$/.test(r) && !r.startsWith('completed/');

const reales = fs
  .readdirSync(path.join(raiz, 'features'), { recursive: true })
  .filter(esActiva)
  .map((r) => path.join(raiz, 'features', r));

test('las tareas reales de features/ cumplen el formato', () => {
  const fallos = reales.flatMap((ruta) =>
    validarTarea(fs.readFileSync(ruta, 'utf8')).map((e) => `${path.relative(raiz, ruta)}: ${e}`),
  );
  assert.deepEqual(fallos, []);
});

test('las tareas de features/completed/ no cuentan como activas', () => {
  const rutas = ['completed/F01-x/task-01-a.md', 'F37-y/task-01-b.md'];
  assert.deepEqual(rutas.filter(esActiva), ['F37-y/task-01-b.md']);
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
