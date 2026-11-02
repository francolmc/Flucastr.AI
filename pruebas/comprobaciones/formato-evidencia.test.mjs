import test from 'node:test';
import assert from 'node:assert/strict';
import { validarEvidencia } from '../../scripts/formato-evidencia.mjs';

const CMD_X = 'node --test pruebas/comprobaciones/x.test.mjs';
const CMD_Y = 'node --test pruebas/comprobaciones/y.test.mjs';

const EVIDENCIA_BASE = [
  '```',
  `$ ${CMD_X}`,
  'ℹ pass 3',
  'ℹ fail 0',
  'exit 0',
  `$ ${CMD_Y}`,
  'ℹ fail 0',
  'exit 0',
  '```',
  '',
  'Ambas pasaron con `ℹ fail 0`.',
].join('\n');

const NOTAS_BASE = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';

// Arma una tarea completa; cada parámetro puede sustituirse para un caso negativo.
function tarea({
  estado = 'lista para revisión',
  evidencia = EVIDENCIA_BASE,
  notas = NOTAS_BASE,
  esperado = 'Esperado: en ambos `ℹ fail 0`.',
} = {}) {
  return [
    '# task-01 — Ejemplo de evidencia',
    `repo: Flucastr.AI   depende_de: —   estado: ${estado}`,
    '',
    '## Descripción',
    'Texto breve que describe el objetivo.',
    '',
    '## Contexto',
    '- Tocar: `scripts/x.mjs`',
    '',
    '## Decisiones ya tomadas',
    'Ninguna.',
    '',
    '## Decisiones abiertas',
    'Ninguna.',
    '',
    '## Alcance / Fuera de alcance',
    'Alcance: el ejemplo. Fuera de alcance: nada más.',
    '',
    '## Pasos',
    '1. Paso uno.',
    '',
    '## Criterios de aceptación',
    '1. Criterio uno.',
    '',
    '## Verificación',
    '```',
    CMD_X,
    CMD_Y,
    '```',
    esperado,
    '',
    '## Evidencia',
    evidencia,
    '',
    '## Notas',
    notas,
    '',
  ].join('\n');
}

test('la tarea base completa no tiene motivos', () => {
  assert.deepEqual(validarEvidencia(tarea()), []);
});

test('falta la salida de un comando', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ pass 3',
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes(CMD_Y)), motivos.join('\n'));
});

test('comando con salida vacía', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
    'Ambas pasaron con `ℹ fail 0`.',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('vacía') && m.includes(CMD_X)), motivos.join('\n'));
});

test('fragmento esperado ausente', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 2',
    'exit 0',
    `$ ${CMD_Y}`,
    'ℹ fail 2',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('ℹ fail 0')), motivos.join('\n'));
});

test('exit 1 con «Esperado» que dice «sale 1» no se rechaza', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 1',
    'exit 1',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const esperado = 'Esperado: X sale 1; Y muestra `ℹ fail 0`.';
  assert.deepEqual(validarEvidencia(tarea({ evidencia, esperado })), []);
});

test('exit 1 con «Esperado» sin código y fragmento `ℹ fail 0` presente no se rechaza', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 0',
    'exit 1',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  assert.deepEqual(validarEvidencia(tarea({ evidencia })), []);
});

test('comando sin línea exit N se rechaza citando el comando', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 0',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('exit N') && m.includes(CMD_X)), motivos.join('\n'));
});

test('marcador «no ejecutado» en Evidencia', () => {
  const evidencia = `${EVIDENCIA_BASE}\n\nLa prueba de integración: no ejecutado.`;
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('no ejecutado')), motivos.join('\n'));
});

test('sin línea Registro en Notas', () => {
  const motivos = validarEvidencia(tarea({ notas: 'Sin registro todavía.' }));
  assert.ok(motivos.some((m) => m.includes('Registro')), motivos.join('\n'));
});

test('Registro incoherente: verificacion=falla con estado lista para revisión', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=lista; causa=ninguna';
  const motivos = validarEvidencia(tarea({ notas }));
  assert.ok(motivos.some((m) => m.includes('verificacion=pasa')), motivos.join('\n'));
});

test('estado aprobada se rechaza: la tarea no está terminada', () => {
  const motivos = validarEvidencia(tarea({ estado: 'aprobada' }));
  assert.ok(motivos.some((m) => m.includes('no está terminada')), motivos.join('\n'));
});

test('control negativo: dos comandos en Verificación y uno en Evidencia da exactamente un motivo que cita el faltante', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ pass 3',
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.equal(motivos.length, 1, motivos.join('\n'));
  assert.ok(motivos[0].includes(CMD_Y), motivos[0]);
});

test('bloque real de node --test con «ℹ todo 0» y frases con «todo»/«Todo» no se rechaza por pendientes', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ tests 3',
    'ℹ suites 0',
    'ℹ pass 3',
    'ℹ fail 0',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
    'exit 0',
    `$ ${CMD_Y}`,
    'ℹ tests 2',
    'ℹ suites 0',
    'ℹ pass 2',
    'ℹ fail 0',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
    'exit 0',
    '```',
    '',
    'Todo quedó en verde, con `ℹ fail 0` en ambos comandos.',
    'Ningún caso todo queda pendiente.',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.deepEqual(motivos.filter((m) => m.includes('pendiente')), [], motivos.join('\n'));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('TODO en mayúsculas en Evidencia se rechaza y el motivo cita TODO', () => {
  const evidencia = `${EVIDENCIA_BASE}\n\nFalta revisar el caso borde. TODO\n`;
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('«TODO»')), motivos.join('\n'));
});
