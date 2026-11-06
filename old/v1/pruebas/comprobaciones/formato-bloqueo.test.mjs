import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearBloqueo, parsearCancelada, coherenciaBloqueo, lineasDeNotas, TIPOS_BLOQUEO, MOTIVOS_CANCELADA } from '../../scripts/formato-bloqueo.mjs';

test('el vocabulario cerrado tiene los tipos y motivos de F32', () => {
  assert.deepEqual(TIPOS_BLOQUEO, ['entorno', 'alcance', 'especificacion', 'decision_diseno', 'verificacion_x2', 'credenciales', 'otra']);
  assert.deepEqual(MOTIVOS_CANCELADA, ['replanificada', 'obsoleta', 'duplicada', 'fuera_de_alcance', 'otra']);
});

test('parsearBloqueo acepta «,» y «, » como separador de falta', () => {
  const sinEspacio = parsearBloqueo('Bloqueo: tipo=entorno; falta=docker,puerto:55432');
  assert.deepEqual(sinEspacio, { ok: true, tipo: 'entorno', falta: ['docker', 'puerto:55432'] });

  const conEspacio = parsearBloqueo('Bloqueo: tipo=entorno; falta=docker, puerto:55432');
  assert.deepEqual(conEspacio, { ok: true, tipo: 'entorno', falta: ['docker', 'puerto:55432'] });
});

test('parsearBloqueo acepta falta=- en tipos que no son entorno', () => {
  assert.deepEqual(parsearBloqueo('Bloqueo: tipo=alcance; falta=-'), { ok: true, tipo: 'alcance', falta: [] });
});

test('parsearBloqueo rechaza tipo=entorno con falta=-', () => {
  const r = parsearBloqueo('Bloqueo: tipo=entorno; falta=-');
  assert.equal(r.ok, false);
  assert.match(r.error, /entorno/);
});

test('parsearBloqueo rechaza un tipo fuera de la lista', () => {
  const r = parsearBloqueo('Bloqueo: tipo=cansancio; falta=-');
  assert.equal(r.ok, false);
  assert.match(r.error, /cansancio/);
});

test('parsearBloqueo rechaza un item fuera del vocabulario', () => {
  const r = parsearBloqueo('Bloqueo: tipo=entorno; falta=mongo');
  assert.equal(r.ok, false);
  assert.match(r.error, /mongo/);
});

test('parsearBloqueo rechaza una clave extra', () => {
  const r = parsearBloqueo('Bloqueo: tipo=entorno; falta=docker; nota=x');
  assert.equal(r.ok, false);
  assert.match(r.error, /claves/);
});

test('parsearCancelada acepta motivos del vocabulario y rechaza el resto', () => {
  assert.deepEqual(parsearCancelada('Cancelada: motivo=obsoleta'), { ok: true, motivo: 'obsoleta' });

  const r = parsearCancelada('Cancelada: motivo=nueva');
  assert.equal(r.ok, false);
  assert.match(r.error, /nueva/);
});

test('coherenciaBloqueo exige causa=otra para entorno, causa=credenciales y causa=verificacion_x2 en sus tipos', () => {
  const entorno = coherenciaBloqueo({ tipo: 'entorno', causa: 'credenciales' });
  assert.equal(entorno.length, 1);
  assert.match(entorno[0], /^Bloqueo/);

  assert.deepEqual(coherenciaBloqueo({ tipo: 'entorno', causa: 'otra' }), []);

  const cred = coherenciaBloqueo({ tipo: 'credenciales', causa: 'otra' });
  assert.equal(cred.length, 1);
  assert.match(cred[0], /^Bloqueo/);

  const verif = coherenciaBloqueo({ tipo: 'verificacion_x2', causa: 'parcial' });
  assert.equal(verif.length, 1);
  assert.match(verif[0], /^Bloqueo/);
});

test('coherenciaBloqueo no restringe los demás tipos ni causa indefinida', () => {
  assert.deepEqual(coherenciaBloqueo({ tipo: 'alcance', causa: 'otra' }), []);
  assert.deepEqual(coherenciaBloqueo({ tipo: 'entorno', causa: undefined }), []);
});

test('lineasDeNotas ignora líneas fuera de Notas y dentro de bloques de código', () => {
  const texto = [
    '# task-01 — Ejemplo',
    'Bloqueo: tipo=entorno; falta=docker',
    '## Evidencia',
    'Bloqueo: tipo=alcance; falta=-',
    '## Notas',
    'Bloqueo: tipo=entorno; falta=docker   ',
    '```',
    'Bloqueo: tipo=otra; falta=-',
    '```',
    'Cancelada: motivo=obsoleta',
    'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna',
  ].join('\n');

  assert.deepEqual(lineasDeNotas(texto, 'Bloqueo:'), ['Bloqueo: tipo=entorno; falta=docker']);
  assert.deepEqual(lineasDeNotas(texto, 'Cancelada:'), ['Cancelada: motivo=obsoleta']);
  assert.deepEqual(lineasDeNotas(texto, 'Nada:'), []);
});
