import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reglas de task-07 (F24): puerta previa del coordinador y decisión abierta del constructor.
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

const COORDINADOR = 'agentes/coordinador.md';
const CONSTRUCTOR = 'agentes/constructor.md';
const COMANDO = 'validar-tarea.mjs';
const SALIDA_1 = 'salida 1';
const DECISION = 'DECISION: tarea=task-NN; abiertas=<n>';
const RECOMENDADA = 'Recomendada:';
const MODULO_YOLO = 'skills/modo-yolo/SKILL.md';
const REGLA_2_YOLO = '2. **Revisión de «completa»';
const PENDIENTE = 'RE_PENDIENTE';

// Frases que deben estar en cada agente: [archivo, frase, nombre en el mensaje de error].
const REQUISITOS = [
  [COORDINADOR, COMANDO, 'el comando validar-tarea.mjs'],
  [COORDINADOR, SALIDA_1, 'la salida 1 de la puerta 3'],
  [COORDINADOR, DECISION, 'la línea DECISION: del coordinador'],
  [CONSTRUCTOR, DECISION, 'la línea DECISION: del constructor'],
  [CONSTRUCTOR, RECOMENDADA, 'la línea Recomendada: del constructor'],
];

const de = (texto) => (typeof texto === 'string' ? texto : '');
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
const reales = () => ({ [COORDINADOR]: leer(COORDINADOR), [CONSTRUCTOR]: leer(CONSTRUCTOR), [MODULO_YOLO]: leer(MODULO_YOLO) });

// Devuelve los mensajes de error en español; vacío = válido. No lanza.
function validarPuertaPrevia(textos) {
  const errores = [];
  for (const [archivo, frase, nombre] of REQUISITOS) {
    if (!de(textos[archivo]).includes(frase)) {
      errores.push(`${archivo} no tiene ${nombre} («${frase}»)`);
    }
  }
  const regla2 = de(textos[MODULO_YOLO]).split('\n').find((l) => l.startsWith(REGLA_2_YOLO)) ?? '';
  if (!regla2) {
    errores.push(`${MODULO_YOLO} no tiene la regla 2 de yolo («${REGLA_2_YOLO}»)`);
  } else if (regla2.includes(PENDIENTE)) {
    errores.push(`${MODULO_YOLO}: la regla 2 de yolo todavía contiene «${PENDIENTE}»`);
  }
  return errores;
}

test('los textos reales de coordinador y constructor cumplen la puerta previa', () => {
  assert.deepEqual(validarPuertaPrevia(reales()), []);
});

for (const [archivo, frase, nombre] of REQUISITOS) {
  test(`falla si quitamos ${nombre} de ${archivo}`, () => {
    const textos = reales();
    const original = textos[archivo];
    textos[archivo] = original.split(frase).join('');
    assert.notEqual(textos[archivo], original, `la prueba no quitó «${frase}» de ${archivo}`);
    const errores = validarPuertaPrevia(textos);
    assert.ok(
      errores.some((e) => e.includes(nombre)),
      `se esperaba error sobre ${nombre}, llegó: ${JSON.stringify(errores)}`,
    );
  });
}

test(`falla si la regla 2 de yolo vuelve a contener ${PENDIENTE}`, () => {
  const textos = reales();
  textos[MODULO_YOLO] = textos[MODULO_YOLO].replace(REGLA_2_YOLO, `${REGLA_2_YOLO} ${PENDIENTE}`);
  const errores = validarPuertaPrevia(textos);
  assert.ok(
    errores.some((e) => e.includes(PENDIENTE)),
    `se esperaba error sobre ${PENDIENTE}, llegó: ${JSON.stringify(errores)}`,
  );
});
