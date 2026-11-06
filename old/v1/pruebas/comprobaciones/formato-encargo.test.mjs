import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearDisparo,
  rutaDeTarea,
  resumirEncargo,
  listaDeRutas,
  normalizarRuta,
  rutaCalza,
  declaracionesLecturaExtra,
  resumirLecturaExtra,
} from '../../scripts/formato-encargo.mjs';

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

test('listaDeRutas saca rutas de backticks y de prosa, y descarta lo que no es ruta', () => {
  assert.deepEqual(
    listaDeRutas('Evita leer: `definitions/` salvo lo citado, tareas `hecha`', 'Evita leer'),
    ['definitions/'],
  );
  assert.deepEqual(
    listaDeRutas('Lee: a/b.md «## 2», c/d.md', 'Lee'),
    ['a/b.md', 'c/d.md'],
  );
  assert.deepEqual(listaDeRutas('sin línea', 'Lee'), []);
  assert.deepEqual(listaDeRutas(42, 'Lee'), []);
});

test('normalizarRuta unifica separadores y recorta hasta la raíz conocida', () => {
  assert.equal(normalizarRuta('/ws/definitions/X.md'), 'definitions/X.md');
  assert.equal(normalizarRuta('.\\features/F1-x/t.md'), 'features/F1-x/t.md');
});

test('rutaCalza compara carpeta contra archivo y archivo contra otro archivo', () => {
  assert.equal(rutaCalza('/ws/definitions/PROJECT.md', 'definitions/'), true);
  assert.equal(rutaCalza('/ws/definitions/PROJECT.md', 'definitions/WORKFLOW.md'), false);
  assert.equal(rutaCalza('/ws/definitions/PROJECT.md', 'definitions/PROJECT.md'), true);
});

test('declaracionesLecturaExtra ignora el motivo y normaliza rutas absolutas', () => {
  const declaradas = declaracionesLecturaExtra([
    'Resultado.\nLectura extra: /ws/definitions/WORKFLOW.md; motivo=CENTINELA-MOTIVO\n',
    42,
  ]);
  assert.deepEqual([...declaradas], ['definitions/WORKFLOW.md']);
  assert.equal(JSON.stringify([...declaradas]).includes('CENTINELA-MOTIVO'), false);
});

test('resumirLecturaExtra cuenta extras y declaradas, y no marca como extra lo que está en Lee', () => {
  const resultado = resumirLecturaExtra({
    encargo: 'Lee: definitions/PROJECT.md\nEvita leer: `definitions/`\n',
    rutas: [
      '/ws/definitions/PROJECT.md',
      '/ws/definitions/WORKFLOW.md',
      '/ws/features/F33-a/task-01-b.md',
    ],
    textos: ['Lectura extra: definitions/WORKFLOW.md; motivo=x'],
  });
  assert.deepEqual(resultado, { extras: ['definitions/WORKFLOW.md'], declaradas: 1 });
  assert.deepEqual(
    resumirLecturaExtra({ encargo: undefined, rutas: ['a'], textos: [] }),
    { extras: [], declaradas: 0 },
  );
});
