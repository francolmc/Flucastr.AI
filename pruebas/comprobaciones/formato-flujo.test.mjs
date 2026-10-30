import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validarBacklog, validarStatus } from './formato-flujo.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

const CABECERA = '| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |';
const SEPARADOR = '|---|---|---|---|---|---|---|---|';

const BACKLOG_VALIDO = [
  '# Backlog — Prueba',
  '',
  CABECERA,
  SEPARADOR,
  '| F01 | Base de verificación | habilitante | alto | bajo | Va primero porque habilita lo demás. | pendiente | → |',
  '| F02 | Planificar desde archivos | producto | alto | medio | Depende de la base. | pendiente | |',
  '',
  'Estado del documento: borrador',
  '',
].join('\n');

const STATUS_VALIDO = [
  '# Estado del flujo',
  '',
  '## Escalación',
  '',
  '## Paso actual',
  '',
  'Rol: coordinador. Feature: F01.',
  '',
  '## Espera a Franco',
  '',
  'Puerta 3: revisar task-04.',
  '',
  '## Bloqueos abiertos',
  '',
  'Ninguno.',
  '',
  '## Última actualización',
  '',
  '2026-10-29',
  '',
].join('\n');

test('muestras válidas: backlog y status no tienen errores', () => {
  assert.deepEqual(validarBacklog(BACKLOG_VALIDO), []);
  assert.deepEqual(validarStatus(STATUS_VALIDO), []);
});

test('backlog con todas las features hechas y sin → es válido', () => {
  const t = BACKLOG_VALIDO
    .replace('| pendiente | → |', '| hecha | |')
    .replace('| pendiente | |', '| hecha | |');
  assert.deepEqual(validarBacklog(t), []);
});

test('backlog: encabezado alterado se rechaza', () => {
  const t = BACKLOG_VALIDO.replace('| Feature |', '| Funcionalidad |');
  const errores = validarBacklog(t);
  assert.ok(errores.length > 0);
  assert.ok(errores.some((e) => e.includes('encabezado')));
});

test('backlog: siete features pendientes se rechazan', () => {
  const extra = [3, 4, 5, 6, 7]
    .map((n) => `| F0${n} | Feature ${n} | producto | medio | bajo | Motivo. | pendiente | |`)
    .join('\n');
  const t = BACKLOG_VALIDO.replace('| F02', `${extra}\n| F02`);
  const errores = validarBacklog(t);
  assert.ok(errores.some((e) => e.includes('como máximo 6 features pendientes')));
});

function backlogCon(filas) {
  return [
    '# Backlog — Prueba',
    '',
    CABECERA,
    SEPARADOR,
    ...filas,
    '',
    'Estado del documento: borrador',
    '',
  ].join('\n');
}

const fila = (id, estado, siguiente = '') =>
  `| ${id} | Feature ${id} | producto | medio | bajo | Motivo. | ${estado} | ${siguiente} |`;

test('backlog: seis hechas y seis pendientes es válido (las hechas no cuentan)', () => {
  const filas = [
    ...[1, 2, 3, 4, 5, 6].map((n) => fila(`F0${n}`, 'hecha')),
    ...[7, 8, 9, 10, 11, 12].map((n) => fila(`F${String(n).padStart(2, '0')}`, 'pendiente', n === 7 ? '→' : '')),
  ];
  assert.deepEqual(validarBacklog(backlogCon(filas)), []);
});

test('backlog: seis hechas y siete pendientes se rechazan', () => {
  const filas = [
    ...[1, 2, 3, 4, 5, 6].map((n) => fila(`F0${n}`, 'hecha')),
    ...[7, 8, 9, 10, 11, 12, 13].map((n) => fila(`F${String(n).padStart(2, '0')}`, 'pendiente', n === 7 ? '→' : '')),
  ];
  const errores = validarBacklog(backlogCon(filas));
  assert.ok(errores.some((e) => e.includes('como máximo 6 features pendientes')));
});

test('backlog: tabla sin filas de datos se rechaza', () => {
  const errores = validarBacklog(backlogCon([]));
  assert.ok(errores.some((e) => e.includes('al menos 1 feature')));
});

test('backlog: Estado inválido se rechaza', () => {
  const t = BACKLOG_VALIDO.replace('| F02 | Planificar desde archivos | producto | alto | medio | Depende de la base. | pendiente |', '| F02 | Planificar desde archivos | producto | alto | medio | Depende de la base. | en revisión |');
  const errores = validarBacklog(t);
  assert.ok(errores.some((e) => e.includes('«Estado»') && e.includes('en revisión')));
});

test('backlog: dos → se rechazan', () => {
  const t = BACKLOG_VALIDO.replace('| pendiente | |', '| pendiente | → |');
  const errores = validarBacklog(t);
  assert.ok(errores.some((e) => e.includes('exactamente un «→»')));
});

test('backlog: → en una fila que no es la primera pendiente se rechaza', () => {
  const t = BACKLOG_VALIDO
    .replace('| pendiente | → |', '| pendiente | |')
    .replace('| pendiente | |\n\nEstado', '| pendiente | → |\n\nEstado');
  const errores = validarBacklog(t);
  assert.ok(errores.some((e) => e.includes('primera feature que no está hecha')));
});

test('backlog: falta «Estado del documento» se rechaza', () => {
  const t = BACKLOG_VALIDO.replace('Estado del documento: borrador\n', '');
  const errores = validarBacklog(t);
  assert.ok(errores.some((e) => e.includes('Estado del documento')));
});

test('status: falta una sección se rechaza', () => {
  const t = STATUS_VALIDO.replace('## Bloqueos abiertos\n\nNinguno.\n\n', '');
  const errores = validarStatus(t);
  assert.ok(errores.some((e) => e.includes('en este orden')));
});

test('status: orden de secciones cambiado se rechaza', () => {
  const t = STATUS_VALIDO
    .replace('## Espera a Franco\n\nPuerta 3: revisar task-04.\n\n', '')
    .replace('## Bloqueos abiertos\n\nNinguno.\n\n', '## Bloqueos abiertos\n\nNinguno.\n\n## Espera a Franco\n\nPuerta 3: revisar task-04.\n\n');
  const errores = validarStatus(t);
  assert.ok(errores.some((e) => e.includes('en este orden')));
});

test('status: fecha inválida se rechaza', () => {
  const t = STATUS_VALIDO.replace('2026-10-29', '29/10/2026');
  const errores = validarStatus(t);
  assert.ok(errores.some((e) => e.includes('YYYY-MM-DD')));
});

test('definitions/BACKLOG.md real cumple el formato', (t) => {
  const ruta = `${RAIZ}definitions/BACKLOG.md`;
  if (!fs.existsSync(ruta)) return t.skip('definitions/BACKLOG.md no existe');
  assert.deepEqual(validarBacklog(fs.readFileSync(ruta, 'utf8')), []);
});

test('definitions/STATUS.md real cumple el formato', (t) => {
  const ruta = `${RAIZ}definitions/STATUS.md`;
  if (!fs.existsSync(ruta)) return t.skip('definitions/STATUS.md no existe');
  assert.deepEqual(validarStatus(fs.readFileSync(ruta, 'utf8')), []);
});
