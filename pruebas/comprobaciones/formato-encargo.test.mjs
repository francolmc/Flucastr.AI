import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearDisparo, rutaDeTarea, resumirEncargo } from '../../scripts/formato-encargo.mjs';

test('parsearDisparo reconoce las cuatro formas válidas', () => {
  assert.deepEqual(parsearDisparo('Disparó: puerta 3'), { origen: 'puerta', puerta: 3 });
  assert.deepEqual(parsearDisparo('Disparó: BLOQUEO task-03'), { origen: 'bloqueo', tarea: '03' });
  assert.deepEqual(parsearDisparo('Disparó: franco'), { origen: 'franco' });
  assert.deepEqual(parsearDisparo('Disparó: reintento'), { origen: 'reintento' });
});

test('parsearDisparo da null con formas inválidas', () => {
  assert.equal(parsearDisparo('Disparó: puerta 5'), null);
  assert.equal(parsearDisparo('Disparó: BLOQUEO task-5'), null);
  assert.equal(parsearDisparo('Disparó: otro'), null);
  assert.equal(parsearDisparo('Disparó: franco, tarde'), null);
});

test('parsearDisparo gana la primera línea válida si hay dos', () => {
  assert.deepEqual(parsearDisparo('Disparó: reintento\nDisparó: franco\n'), { origen: 'reintento' });
});

test('rutaDeTarea devuelve feature y tarea de la ruta completa', () => {
  assert.deepEqual(
    rutaDeTarea('Lee: features/F31-puerta-de-entorno/task-03-x.md'),
    { feature: 'F31', tarea: '03' },
  );
});

test('rutaDeTarea con solo la carpeta de feature da null', () => {
  assert.equal(rutaDeTarea('Lee: features/F31-puerta-de-entorno/'), null);
});

test('resumirEncargo con solo la carpeta de feature saca feature y tarea del disparo', () => {
  assert.deepEqual(
    resumirEncargo('Lee: features/F31-puerta-de-entorno/\nDisparó: BLOQUEO task-07\n'),
    { disparo: { origen: 'bloqueo', tarea: '07' }, feature: 'F31', tarea: '07' },
  );
});

test('entrada no string devuelve todo null', () => {
  assert.deepEqual(resumirEncargo(undefined), { disparo: null, feature: null, tarea: null });
  assert.deepEqual(resumirEncargo(42), { disparo: null, feature: null, tarea: null });
  assert.equal(parsearDisparo(undefined), null);
  assert.equal(rutaDeTarea(42), null);
});

test('resumirEncargo no devuelve texto del encargo', () => {
  const texto = 'CENTINELA-ENCARGO Lee: features/F31-puerta-de-entorno/task-03-x.md\nDisparó: franco\nCENTINELA-ENCARGO';
  const salida = JSON.stringify(resumirEncargo(texto));
  assert.equal(salida.includes('CENTINELA-ENCARGO'), false);
  assert.deepEqual(JSON.parse(salida), { disparo: { origen: 'franco' }, feature: 'F31', tarea: '03' });
});
