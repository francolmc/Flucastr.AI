import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

// Regla de task-12 en agentes/coordinador.md: escribir STATUS.md antes de delegar, y retomar desde él.
const FRASE_ESCRIBE = 'Antes de delegar, escribe en `definitions/STATUS.md`';
const FRASE_RETOMA = 'empieza vacía o resumida';
// Línea eliminada por diseño (no debe volver).
const LINEA_ELIMINADA = 'CONTEXTO:';
const SECCION = '## Cómo avanzas';
const PASO_DELEGA = 'Delega.';

const de = (texto) => (typeof texto === 'string' ? texto : '');

// Pasos numerados de la sección «Cómo avanzas», en el orden en que aparecen.
function pasosDeSeccion(texto) {
  const lineas = de(texto).split('\n');
  const inicio = lineas.findIndex((l) => l.startsWith(SECCION));
  if (inicio < 0) return [];
  const pasos = [];
  for (let i = inicio + 1; i < lineas.length; i++) {
    if (lineas[i].startsWith('## ')) break;
    if (/^\d+\. /.test(lineas[i])) pasos.push(lineas[i]);
  }
  return pasos;
}

// Devuelve los mensajes de error en español; vacío = válido. No lanza.
function validarCoordinador(texto) {
  const t = de(texto);
  const errores = [];

  if (!t.includes(FRASE_ESCRIBE)) {
    errores.push('agentes/coordinador.md no tiene el paso «Antes de delegar, escribe en definitions/STATUS.md»');
  }
  if (!t.includes(FRASE_RETOMA)) {
    errores.push('agentes/coordinador.md no tiene la frase de retoma «empieza vacía o resumida»');
  }
  if (t.includes(LINEA_ELIMINADA)) {
    errores.push('agentes/coordinador.md conserva la línea CONTEXTO: que se eliminó');
  }

  // Orden: el paso que escribe el estado va antes del paso que delega.
  const pasos = pasosDeSeccion(t);
  const iEscribe = pasos.findIndex((p) => p.includes(FRASE_ESCRIBE));
  const iDelega = pasos.findIndex((p) => p.includes(PASO_DELEGA));
  if (iEscribe >= 0 && iDelega >= 0 && iEscribe > iDelega) {
    errores.push('agentes/coordinador.md escribe STATUS.md después de delegar (debe ir antes)');
  }

  return errores;
}

const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');

// Quita las líneas que contienen el patrón (para simular que falta la regla).
const sinLineas = (texto, patron) =>
  texto.split('\n').filter((linea) => !linea.includes(patron)).join('\n');

// Intercambia el contenido de dos líneas (para simular el orden incorrecto).
function intercambiarLineas(texto, patronA, patronB) {
  const lineas = texto.split('\n');
  const a = lineas.findIndex((l) => l.includes(patronA));
  const b = lineas.findIndex((l) => l.includes(patronB));
  assert.ok(a >= 0 && b >= 0, `no se encontró «${patronA}» o «${patronB}»`);
  [lineas[a], lineas[b]] = [lineas[b], lineas[a]];
  return lineas.join('\n');
}

test('el archivo real cumple la regla', () => {
  assert.deepEqual(validarCoordinador(leer('agentes/coordinador.md')), []);
});

test('falla si falta el paso que escribe STATUS.md antes de delegar', () => {
  const texto = sinLineas(leer('agentes/coordinador.md'), FRASE_ESCRIBE);
  const errores = validarCoordinador(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /^agentes\/coordinador\.md/);
  assert.match(errores[0], /STATUS\.md/);
});

test('falla si falta la frase de retoma desde STATUS.md', () => {
  const texto = leer('agentes/coordinador.md').replace(FRASE_RETOMA, 'frase quitada');
  const errores = validarCoordinador(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /^agentes\/coordinador\.md/);
  assert.match(errores[0], /empieza vacía o resumida/);
});

test('falla si vuelve la línea CONTEXTO:', () => {
  const texto = `${leer('agentes/coordinador.md')}\n${LINEA_ELIMINADA} sesion-nueva\n`;
  const errores = validarCoordinador(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /^agentes\/coordinador\.md/);
  assert.match(errores[0], /CONTEXTO:/);
});

test('falla si el paso de escribir STATUS.md queda después de delegar', () => {
  const texto = intercambiarLineas(leer('agentes/coordinador.md'), FRASE_ESCRIBE, PASO_DELEGA);
  const errores = validarCoordinador(texto);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /^agentes\/coordinador\.md/);
  assert.match(errores[0], /después de delegar/);
});
