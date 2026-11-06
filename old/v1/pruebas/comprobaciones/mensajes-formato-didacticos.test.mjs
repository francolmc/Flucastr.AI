import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { medirTopes } from '../../scripts/formato-topes.mjs';
import { validarFuente } from '../../scripts/formato-fuente.mjs';
import { validarTarea } from '../../scripts/formato-tarea.mjs';

// Fija lo que corrigen task-05 (skill) y task-06 (mensajes del validador) con un control negativo (F44).
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SKILL = path.join(RAIZ, 'skills', 'descomponer-feature', 'SKILL.md');
const FRASE_PUNTO = 'sin punto final';
const FRASE_COMILLAS = 'sin comillas invertidas';

// Tarea mínima que leen medirTopes y validarFuente: título, línea repo/estado y «## Contexto».
const tareaConContexto = (linea) => [
  '# task-01 — Ejemplo mínimo',
  'repo: Flucastr.AI   depende_de: —   estado: aprobada',
  '',
  '## Contexto',
  linea,
  '',
].join('\n');

// Tarea completa de diez secciones, como la de formato-tarea.test.mjs.
const tareaCompleta = (lineaTocar) => [
  '# task-03 — Ejemplo de tarea válida',
  'repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  lineaTocar,
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

const leerOk = () => '## X\ncontenido\n';

test('(1) la skill dice «sin punto final» y «sin comillas invertidas»', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  assert.ok(texto.includes(FRASE_PUNTO), `falta «${FRASE_PUNTO}» en la skill`);
  assert.ok(texto.includes(FRASE_COMILLAS), `falta «${FRASE_COMILLAS}» en la skill`);
});

test('(1) control negativo: sin esas frases, el texto no las contiene', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  const sin = texto.replaceAll(FRASE_PUNTO, '').replaceAll(FRASE_COMILLAS, '');
  assert.equal(sin.includes(FRASE_PUNTO), false);
  assert.equal(sin.includes(FRASE_COMILLAS), false);
});

test('(2) «- Leer:» con punto final se rechaza con el formato exacto', () => {
  const { errores } = medirTopes(tareaConContexto('- Leer: `a.js`.'), leerOk);
  assert.ok(errores.some((e) => e.includes(FRASE_PUNTO)), `errores: ${JSON.stringify(errores)}`);
});

test('(2) «- Leer:» bien formado no produce error de formato', () => {
  const { errores } = medirTopes(tareaConContexto('- Leer: `a.js`'), leerOk);
  assert.equal(errores.some((e) => e.includes('formato inválido')), false, `errores: ${JSON.stringify(errores)}`);
});

test('(3) «- Fuente:» con comillas invertidas en la ruta se rechaza con el formato exacto', () => {
  const motivos = validarFuente(tareaConContexto('- Fuente: `definitions/PROJECT.md` «X».'), leerOk);
  assert.ok(motivos.some((m) => m.includes(FRASE_COMILLAS)), `motivos: ${JSON.stringify(motivos)}`);
});

test('(3) «- Fuente:» bien formado no produce error de formato', () => {
  const motivos = validarFuente(tareaConContexto('- Fuente: definitions/PROJECT.md «X»'), leerOk);
  assert.equal(motivos.some((m) => m.includes('formato inválido')), false, `motivos: ${JSON.stringify(motivos)}`);
});

test('(4) «- Tocar:» con punto final se rechaza con el formato exacto', () => {
  const motivos = validarTarea(tareaCompleta('- Tocar: `a.js`.'));
  assert.ok(motivos.some((m) => m.includes(FRASE_PUNTO)), `motivos: ${JSON.stringify(motivos)}`);
});

test('(4) «- Tocar:» bien formado no produce error sobre Tocar', () => {
  const motivos = validarTarea(tareaCompleta('- Tocar: `a.js`'));
  assert.equal(motivos.some((m) => m.includes('Tocar')), false, `motivos: ${JSON.stringify(motivos)}`);
});

test('(5) la skill dice que en Leer solo van archivos que existen', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  assert.ok(texto.includes('solo archivos que existen'), 'falta «solo archivos que existen» en la skill');
  assert.ok(texto.includes('va en Tocar'), 'falta «va en Tocar» en la skill');
});

test('(5) control negativo: sin esas frases, el texto no las contiene', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  const sin = texto.replaceAll('solo archivos que existen', '').replaceAll('va en Tocar', '');
  assert.equal(sin.includes('solo archivos que existen'), false);
  assert.equal(sin.includes('va en Tocar'), false);
});

test('(6) un archivo de Leer inexistente se rechaza con la pista de Tocar', () => {
  const { errores } = medirTopes(tareaConContexto('- Leer: `a.js`'), () => null);
  assert.ok(errores.some((e) => e.includes('ponlo en Tocar')), `errores: ${JSON.stringify(errores)}`);
});

test('(6) un archivo de Leer existente no produce esa pista', () => {
  const { errores } = medirTopes(tareaConContexto('- Leer: `a.js`'), leerOk);
  assert.equal(errores.some((e) => e.includes('ponlo en Tocar')), false, `errores: ${JSON.stringify(errores)}`);
});
