import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FRASES_ROL_F41 } from './frases-por-archivo.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const ARCHIVO = 'agentes/coordinador.md';
const SKILL = 'skills/comandos-coordinador/SKILL.md';
// Tope de tamaño del coordinador tras F41: no puede crecer netamente.
const TOPE_BYTES = 7155;
const PUNTERO = FRASES_ROL_F41.coordinador[0];
const NOMBRE_SKILL = 'comandos-coordinador';

// Genera el agente del coordinador con scripts/resolver.mjs (orden: agente-claude o agente-pi).
function generar(orden) {
  const r = spawnSync('node', ['scripts/resolver.mjs', orden, ARCHIVO], { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, `resolver ${orden} falló: ${r.stderr}`);
  return r.stdout;
}

// Devuelve los errores de una salida generada: falta del puntero de F41 o del nombre de la skill.
function comprobarSalida(salida) {
  const errores = [];
  if (!salida.includes(PUNTERO)) errores.push(`falta la frase «${PUNTERO}»`);
  if (!salida.includes(NOMBRE_SKILL)) errores.push(`falta el nombre «${NOMBRE_SKILL}»`);
  return errores;
}

for (const [orden, herramienta] of [['agente-claude', 'Claude Code'], ['agente-pi', 'Pi']]) {
  test(`el coordinador generado para ${herramienta} conserva el puntero de F41 y el nombre de la skill`, () => {
    assert.deepEqual(comprobarSalida(generar(orden)), []);
  });
}

test('la skill comandos-coordinador conserva las cuatro frases de F41', () => {
  const texto = fs.readFileSync(path.join(RAIZ, SKILL), 'utf8');
  const faltan = FRASES_ROL_F41['comandos-coordinador'].filter((f) => !texto.includes(f));
  assert.deepEqual(faltan, []);
});

test(`el coordinador no supera el tope de ${TOPE_BYTES} bytes`, () => {
  const tamano = fs.statSync(path.join(RAIZ, ARCHIVO)).size;
  assert.ok(tamano <= TOPE_BYTES, `mide ${tamano} bytes; el tope es ${TOPE_BYTES}`);
});

test('rechaza una salida generada a la que le falta el puntero de F41', () => {
  const salida = generar('agente-pi').replace(PUNTERO, 'frase omitida');
  const errores = comprobarSalida(salida);
  assert.ok(errores.some((e) => e.includes(PUNTERO)), `se esperaba un error que mencione «${PUNTERO}»`);
});
