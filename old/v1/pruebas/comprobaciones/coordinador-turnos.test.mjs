import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FRASES_COORDINADOR_F21 } from './contrato-roles.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const ARCHIVO = 'agentes/coordinador.md';
// Tope de tamaño del coordinador (F21): el archivo no debe superar 17920 bytes.
const TOPE_BYTES = 17920;

// Genera el agente del coordinador con scripts/resolver.mjs (orden: agente-claude o agente-pi).
function generar(orden) {
  const r = spawnSync('node', ['scripts/resolver.mjs', orden, ARCHIVO], { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, `resolver ${orden} falló: ${r.stderr}`);
  return r.stdout;
}

// Devuelve los errores de una salida generada: frases de F21 ausentes y falta de la línea de herramienta.
function comprobarSalida(salida) {
  const errores = [];
  for (const frase of FRASES_COORDINADOR_F21) {
    if (!salida.includes(frase)) errores.push(`falta la frase «${frase}»`);
  }
  if (!salida.includes('Herramienta: ')) errores.push('falta la línea «Herramienta: »');
  return errores;
}

for (const [orden, herramienta] of [['agente-claude', 'Claude Code'], ['agente-pi', 'Pi']]) {
  test(`el coordinador generado para ${herramienta} conserva las 11 frases de F21`, () => {
    assert.deepEqual(comprobarSalida(generar(orden)), []);
  });
}

test(`el coordinador no supera el tope de ${TOPE_BYTES} bytes`, () => {
  const tamano = fs.statSync(path.join(RAIZ, ARCHIVO)).size;
  assert.ok(tamano <= TOPE_BYTES, `mide ${tamano} bytes; el tope es ${TOPE_BYTES}`);
});

test('rechaza una salida generada a la que le falta una frase de F21', () => {
  const frase = FRASES_COORDINADOR_F21[0];
  const salida = generar('agente-pi').replace(frase, 'frase omitida');
  const errores = comprobarSalida(salida);
  assert.ok(errores.some((e) => e.includes(frase)), `se esperaba un error que mencione «${frase}»`);
});
