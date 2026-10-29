import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarConstructor } from './contrato-constructor.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const leer = (relativa) => fs.readFileSync(path.join(RAIZ, relativa), 'utf8');

const real = () => ({
  constructor: leer('agentes/constructor.md'),
  skill: leer('skills/ejecutar-tarea/SKILL.md'),
});

test('los textos reales del constructor y de ejecutar-tarea cumplen las nueve reglas', () => {
  assert.deepEqual(validarConstructor(real()), []);
});

// Cada variante borra la frase (o frases) de una regla del texto real y exige al menos un error.
const variantes = [
  ['regla 1: falta «estado: aprobada» o «te detienes» en el constructor', 'constructor', ['estado: aprobada', 'te detienes']],
  ['regla 2: falta «Nunca escribes `hecha`» en el constructor', 'constructor', ['Nunca escribes `hecha`']],
  ['regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor', 'constructor', ['No haces commit, push, PR, merge ni despliegue']],
  ['regla 4: falta «escribes en `STATUS.md`» en el constructor', 'constructor', ['escribes en `STATUS.md`']],
  ['regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill', 'skill', ['no es `aprobada`', 'detente', 'Cambia `estado` a `en curso`']],
  ['regla 6: falta una de las tres causas de parada en la skill', 'skill', ['Falta de credenciales o acceso', 'Una decisión que cambia el alcance', 'La misma verificación falla dos veces por la misma causa']],
  ['regla 7: falta «estado: bloqueada» en la skill', 'skill', ['estado: bloqueada']],
  ['regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill', 'skill', ['rol=planificador', 'rol=arquitecto', 'BLOQUEO: rol=<rol requerido>; motivo=<motivo>']],
  ['regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill', 'skill', ['Nunca `hecha`', 'Sin commit, push, PR, merge ni despliegue']],
];

for (const [nombre, sobre, frases] of variantes) {
  test(`rechaza ${nombre}`, () => {
    const textos = real();
    for (const frase of frases) {
      textos[sobre] = textos[sobre].replace(frase, '');
    }
    assert.ok(validarConstructor(textos).length > 0, 'se esperaba al menos un error');
  });
}
