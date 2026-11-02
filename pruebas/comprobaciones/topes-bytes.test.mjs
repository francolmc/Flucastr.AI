import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

// Topes de bytes por archivo de agente y módulo (F28, sección 4 de definitions/CONTRATOS.md).
// Cada tope es el tamaño de hoy: las tareas siguientes solo pueden bajarlo.
// Los módulos (skills) son obligatorios: si falta alguno, la prueba falla.
export const TOPES = [
  { ruta: 'agentes/coordinador.md', tope: 7168, opcional: false },
  { ruta: 'agentes/planificador.md', tope: 3584, opcional: false },
  { ruta: 'agentes/constructor.md', tope: 3072, opcional: false },
  { ruta: 'agentes/arquitecto.md', tope: 3584, opcional: false },
  { ruta: 'skills/modo-yolo/SKILL.md', tope: 5120, opcional: false },
  { ruta: 'skills/ramas-feature/SKILL.md', tope: 5120, opcional: false },
  { ruta: 'skills/comandos-coordinador/SKILL.md', tope: 5120, opcional: false },
  { ruta: 'skills/control-consumo/SKILL.md', tope: 4096, opcional: false },
];

// Devuelve true si el tamaño supera el tope. Igual al tope no excede.
export function excede(bytes, tope) {
  return bytes > tope;
}

// Devuelve el tamaño en bytes de un archivo relativo a la raíz del repo.
export function medir(ruta) {
  return fs.statSync(path.join(RAIZ, ruta)).size;
}

function existe(ruta) {
  return fs.existsSync(path.join(RAIZ, ruta));
}

function omitir(ruta, opcional) {
  return opcional && !existe(ruta) ? `${ruta} aún no existe (módulo opcional)` : false;
}

for (const { ruta, tope, opcional } of TOPES) {
  test(`${ruta} no supera el tope de ${tope} bytes`, { skip: omitir(ruta, opcional) }, () => {
    const tamano = medir(ruta);
    assert.ok(!excede(tamano, tope), `${ruta} mide ${tamano} bytes; el tope es ${tope}`);
  });
}

test('control negativo: excede marca el límite exacto', () => {
  assert.equal(excede(5121, 5120), true);
  assert.equal(excede(5120, 5120), false);
});

for (const { ruta, tope } of TOPES) {
  test(`control negativo sintético: ${ruta} con tope+1 excede y con tope no excede`, () => {
    assert.equal(excede(tope + 1, tope), true);
    assert.equal(excede(tope, tope), false);
  });
}
