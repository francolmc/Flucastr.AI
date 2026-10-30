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

test('los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas', () => {
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
  ['regla 10: falta «git switch -c», «git branch --show-current» o la prohibición de `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout` en el constructor', 'constructor', ['git switch -c', 'git branch --show-current', 'Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`']],
  ['regla 11: falta «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`» o «Cambia `estado` a `en curso`» en la skill', 'skill', ['git switch -c', 'git branch --show-current', 'Rama:', 'Franco confirmó `git switch <rama>`', 'Cambia `estado` a `en curso`']],
  ['regla 12: falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en la skill', 'skill', ['CONFIRMAR: accion=git switch <rama>; motivo=<motivo>']],
  ['regla 13: falta «Modo yolo: activo», «no creas rama», «no emites `CONFIRMAR:`» o «ni local» en el constructor', 'constructor', ['Modo yolo: activo', 'no creas rama', 'no emites `CONFIRMAR:`', 'ni local']],
  ['regla 14: falta «Modo yolo: activo», «salta este paso entero», «no emites `CONFIRMAR:`» o «ni local» en la skill', 'skill', ['Modo yolo: activo', 'salta este paso entero', 'no emites `CONFIRMAR:`', 'ni local']],
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

test('rechaza la regla 11 si la rama se resuelve después del paso a «en curso»', () => {
  const textos = real();
  textos.skill = textos.skill.replace('git switch -c', 'X') + '\ngit switch -c';
  const errores = validarConstructor(textos);
  assert.ok(errores.some((e) => e.startsWith('Regla 11 ')), `se esperaba error de la regla 11, llegó: ${JSON.stringify(errores)}`);
});

test('rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill', () => {
  const textos = real();
  textos.skill = textos.skill.replace('Modo yolo: activo', 'X') + '\nModo yolo: activo';
  const errores = validarConstructor(textos);
  assert.ok(errores.some((e) => e.startsWith('Regla 14 ')), `se esperaba error de la regla 14, llegó: ${JSON.stringify(errores)}`);
});
