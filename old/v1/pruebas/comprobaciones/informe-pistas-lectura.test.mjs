import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPistas } from '../../scripts/pistas.mjs';

// Corridas sintéticas (no se leen registro/ ni .env).
const corrida = (feature, extras, extra = {}) => ({
  rol: 'planificador',
  disparo: null,
  feature,
  tarea: '01',
  turnos: 1,
  costo: null,
  kb: null,
  lecturaExtra: { extras, declaradas: extra.declaradas ?? extras.length },
  ...extra,
});
const de = (pistas, n) => pistas.filter((p) => p.n === n);
const mediciones = (pistas) => pistas.map((p) => [p.n, p.feature, p.medicion]);

// Pista 7: 3 corridas con la misma ruta en extras y 2 features distintas.
test('pista 7 dispara con 3 corridas en 2 features', () => {
  const dispara = calcularPistas([], {
    corridas: [
      corrida('F01', ['definitions/A.md']),
      corrida('F02', ['definitions/A.md']),
      corrida('F02', ['definitions/A.md']),
    ],
  });
  assert.deepEqual(mediciones(de(dispara, 7)), [
    [7, null, 'planificador lee de más `definitions/A.md` en 3 corridas y 2 features'],
  ]);
});

// Pista 7: no dispara con 3 corridas de una sola feature, ni con 2 corridas en 2 features.
test('pista 7 no dispara con 3 corridas de una feature ni con 2 corridas en 2 features', () => {
  const misma = calcularPistas([], {
    corridas: [
      corrida('F01', ['definitions/A.md']),
      corrida('F01', ['definitions/A.md']),
      corrida('F01', ['definitions/A.md']),
    ],
  });
  assert.deepEqual(de(misma, 7), []);

  const dos = calcularPistas([], {
    corridas: [corrida('F01', ['definitions/A.md']), corrida('F02', ['definitions/A.md'])],
  });
  assert.deepEqual(de(dos, 7), []);
});

// Pista 8, forma a: lecturas extra por llamada > 1 (estricto).
test('pista 8 (a) dispara con 1,5 extras por llamada y no con 1,0', () => {
  const dispara = calcularPistas([], {
    corridas: [corrida('F01', ['a', 'b', 'c']), corrida('F02', [])],
  });
  assert.deepEqual(mediciones(de(dispara, 8)), [[8, null, 'planificador: 1.5 lecturas extra por llamada']]);

  const no = calcularPistas([], {
    corridas: [corrida('F01', ['a', 'b']), corrida('F02', [])],
  });
  assert.deepEqual(de(no, 8), []);
});

// Pista 8, forma b: media de kb con extras > 1,25 x media de kb sin extras.
test('pista 8 (b) dispara con kb 10 frente a 6 (+67 %) y no con 7 frente a 6 (+17 %)', () => {
  const dispara = calcularPistas([], {
    corridas: [corrida('F01', ['a'], { kb: 10 }), corrida('F02', [], { kb: 6 })],
  });
  assert.deepEqual(mediciones(de(dispara, 8)), [[8, null, 'planificador: 67 % más KB por corrida con lectura extra que sin ella']]);

  const no = calcularPistas([], {
    corridas: [corrida('F01', ['a'], { kb: 7 }), corrida('F02', [], { kb: 6 })],
  });
  assert.deepEqual(de(no, 8), []);
});

// Pista 9: declaradas < 90 % de las extras (estricto).
test('pista 9 dispara con 8 de 10 declaradas y no con 9 de 10', () => {
  const dispara = calcularPistas([], {
    corridas: [
      corrida('F01', ['a', 'b', 'c', 'd', 'e'], { declaradas: 4 }),
      corrida('F02', ['f', 'g', 'h', 'i', 'j'], { declaradas: 4 }),
    ],
  });
  assert.deepEqual(mediciones(de(dispara, 9)), [[9, null, '8 de 10 lecturas extra declaradas (80 %)']]);

  const no = calcularPistas([], {
    corridas: [
      corrida('F01', ['a', 'b', 'c', 'd', 'e'], { declaradas: 5 }),
      corrida('F02', ['f', 'g', 'h', 'i', 'j'], { declaradas: 4 }),
    ],
  });
  assert.deepEqual(de(no, 9), []);
});

// Sin datos de lectura no hay pistas 7 a 9.
test('sin corridas o con corridas sin lecturaExtra no emite pistas 7 a 9', () => {
  const conExtrasSinCorridas = calcularPistas([], { corridas: null });
  assert.deepEqual(conExtrasSinCorridas.filter((p) => p.n >= 7 && p.n <= 9), []);

  const sinLectura = calcularPistas([], {
    corridas: [
      { rol: 'planificador', disparo: null, feature: 'F01', tarea: '01', turnos: 1, costo: null, kb: 10 },
      { rol: 'planificador', disparo: null, feature: 'F02', tarea: '01', turnos: 1, costo: null, kb: 6 },
    ],
  });
  assert.deepEqual(sinLectura.filter((p) => p.n >= 7 && p.n <= 9), []);
});
