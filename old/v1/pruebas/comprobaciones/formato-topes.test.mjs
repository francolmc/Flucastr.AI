import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medirTopes } from '../../scripts/formato-topes.mjs';

function tarea(leerLinea, estado = 'aprobada') {
  const partes = [
    '# task-02 — Prueba de topes',
    `repo: Flucastr.AI   depende_de: task-01   estado: ${estado}`,
    '',
    '## Descripción',
    'Prueba.',
    '',
    '## Contexto',
    '- Tocar: `scripts/formato-topes.mjs`',
  ];
  if (leerLinea !== undefined) partes.push(leerLinea);
  partes.push('- Fuente: ninguna', '', '## Alcance / Fuera de alcance', 'Alcance: prueba. Fuera de alcance: nada.', '');
  return partes.join('\n');
}

function leerDesde(archivos) {
  return (ruta) => (Object.hasOwn(archivos, ruta) ? archivos[ruta] : null);
}

test('sin línea Leer no hay errores ni avisos', () => {
  const r = medirTopes(tarea(), leerDesde({}));
  assert.deepEqual(r, { errores: [], avisos: [] });
});

test('cuatro archivos pasan el tope de archivos', () => {
  const archivos = { a: 'x', b: 'x', c: 'x', d: 'x' };
  const linea = '- Leer: `a`, `b`, `c`, `d`';
  const r = medirTopes(tarea(linea), leerDesde(archivos));
  assert.deepEqual(r.errores, []);
});

test('cinco archivos fallan y el error nombra el tope 4 y la cifra 5', () => {
  const archivos = { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' };
  const linea = '- Leer: `a`, `b`, `c`, `d`, `e`';
  const r = medirTopes(tarea(linea), leerDesde(archivos));
  assert.equal(r.errores.length, 1);
  assert.match(r.errores[0], /5/);
  assert.match(r.errores[0], /4/);
});

test('12288 bytes pasan sin error', () => {
  const linea = '- Leer: `big`';
  const r = medirTopes(tarea(linea), leerDesde({ big: 'a'.repeat(12288) }));
  assert.deepEqual(r.errores, []);
});

test('12289 bytes fallan', () => {
  const linea = '- Leer: `big`';
  const r = medirTopes(tarea(linea), leerDesde({ big: 'a'.repeat(12289) }));
  assert.equal(r.errores.length, 1);
  assert.match(r.errores[0], /12289/);
});

test('9217 bytes dan aviso sin error', () => {
  const linea = '- Leer: `mid`';
  const r = medirTopes(tarea(linea), leerDesde({ mid: 'a'.repeat(9217) }));
  assert.deepEqual(r.errores, []);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /9217/);
});

test('un rango mide solo sus líneas', () => {
  // La línea 1 pesa 20000 bytes; el rango @2-3 solo debe contar «bbbb», «cc» y «ddddddd».
  const archivo = `${'x'.repeat(20000)}\nbbbb\ncc\nddddddd\n`;
  const sinRango = medirTopes(tarea('- Leer: `f`'), leerDesde({ f: archivo }));
  assert.equal(sinRango.errores.length, 1);

  const conRango = medirTopes(tarea('- Leer: `f@2-3`'), leerDesde({ f: archivo }));
  assert.deepEqual(conRango, { errores: [], avisos: [] });
});

test('una tarea hecha con cinco archivos queda exenta', () => {
  const archivos = { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' };
  const linea = '- Leer: `a`, `b`, `c`, `d`, `e`';
  const r = medirTopes(tarea(linea, 'hecha'), leerDesde(archivos));
  assert.deepEqual(r, { errores: [], avisos: [] });
});
