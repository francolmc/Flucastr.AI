import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Contrato de las opciones por letra de skills/control-consumo (task-03, F36).
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const RUTA = 'skills/control-consumo/SKILL.md';

const de = (texto) => (typeof texto === 'string' ? texto : '');

// Devuelve la línea que empieza con `N. ` (el «paso N»), o cadena vacía.
function paso(texto, n) {
  const prefijo = `${n}. `;
  const linea = de(texto).split('\n').find((l) => l.startsWith(prefijo));
  return linea ?? '';
}

// Devuelve los mensajes de error en español; vacío = válido. No lanza.
function validarLetras(texto) {
  const errores = [];
  const p3 = paso(texto, 3);
  const p5 = paso(texto, 5);
  const p10 = paso(texto, 10);

  if (!p3.includes('sin `cd`, `&&`, `;`, `2>&1` ni redirecciones')) {
    errores.push(`${RUTA}, paso 3: falta «sin \`cd\`, \`&&\`, \`;\`, \`2>&1\` ni redirecciones»`);
  }

  if (!p5.includes('SIEMPRE escribes la Escalación con las letras')) {
    errores.push(`${RUTA}, paso 5: falta «SIEMPRE escribes la Escalación con las letras»`);
  }

  for (const opcion of ['A) ', 'B) ', 'C) ', 'D) cerrar la feature como incompleta']) {
    if (!p5.includes(opcion)) {
      errores.push(`${RUTA}, paso 5: falta la opción «${opcion.trim()}»`);
    }
  }

  for (const frase of ['con `arq` o `plan` no ofrezcas B', 'solo si la causa es `D` o `K`']) {
    if (!p5.includes(frase)) {
      errores.push(`${RUTA}, paso 5: falta la restricción de B «${frase}»`);
    }
  }

  if (!p5.includes('Responde con una letra')) {
    errores.push(`${RUTA}, paso 5: falta la instrucción «Responde con una letra»`);
  }

  for (const frase of ['sin añadir condiciones', 'no discutas ni reinterpretes', 'N=1', 'INCOMPLETA']) {
    if (!p10.includes(frase)) {
      errores.push(`${RUTA}, paso 10: falta «${frase}»`);
    }
  }

  return errores;
}

const leer = (ruta) => fs.readFileSync(`${RAIZ}${ruta}`, 'utf8');

// Reemplaza un texto que debe existir en la skill real; si no existe, el control está mal formado.
function mutar(real, buscar, reemplazar) {
  assert.ok(real.includes(buscar), `el texto de control no existe en la skill real: «${buscar}»`);
  return real.split(buscar).join(reemplazar);
}

test('la skill real cumple el contrato de letras', () => {
  assert.deepEqual(validarLetras(leer(RUTA)), []);
});

test('falla si el paso 5 pierde la opción D «cerrar la feature como incompleta»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'D) cerrar la feature como incompleta', 'D) otra cosa');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 5/);
  assert.match(errores[0], /D\) cerrar la feature como incompleta/);
});

test('falla si el paso 5 pierde la restricción «no ofrezcas B»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'no ofrezcas B', 'ofrece B');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 5/);
  assert.match(errores[0], /no ofrezcas B/);
});

test('falla si el paso 5 pierde «Responde con una letra»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'Responde con una letra', 'Responde');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 5/);
  assert.match(errores[0], /Responde con una letra/);
});

test('falla si el paso 3 pierde «sin cd, &&, ; ni redirecciones»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'sin `cd`, `&&`, `;`, `2>&1` ni redirecciones', 'con cualquier forma');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 3/);
  assert.ok(errores[0].includes('sin `cd`'), errores[0]);
});

test('falla si el paso 5 pierde «SIEMPRE escribes la Escalación con las letras»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'SIEMPRE escribes la Escalación con las letras', 'escribes la Escalación');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 5/);
  assert.ok(errores[0].includes('SIEMPRE escribes la Escalación con las letras'), errores[0]);
});

test('falla si el paso 10 pierde «sin añadir condiciones»', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'sin añadir condiciones', 'con condiciones');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 10/);
  assert.match(errores[0], /sin añadir condiciones/);
});

test('falla si el paso 10 pierde «N=1» en la opción A', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'N=1', 'N=2');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 10/);
  assert.match(errores[0], /N=1/);
});

test('falla si el paso 10 pierde «INCOMPLETA» en la opción D', () => {
  const real = leer(RUTA);
  const texto = mutar(real, 'INCOMPLETA', 'completa');
  const errores = validarLetras(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /paso 10/);
  assert.match(errores[0], /INCOMPLETA/);
});
