import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const leer = (ruta) => fs.readFileSync(new URL(ruta, `file://${RAIZ}`), 'utf8');

// Control negativo: detecta la cláusula vieja «No leas:» en un texto de encargo.
function contieneNoLeas(texto) {
  return texto.includes('No leas:');
}

test('el coordinador real no contiene «No leas:»', () => {
  const coordinador = leer('agentes/coordinador.md');
  assert.equal(contieneNoLeas(coordinador), false);
});

test('control negativo: contieneNoLeas detecta «No leas:» y no confunde «Evita leer:»', () => {
  assert.equal(contieneNoLeas('Plantilla: `No leas:` lo que sobra'), true);
  assert.equal(contieneNoLeas('Plantilla: `Evita leer:` lo que sobra'), false);
});

test('revisar-proyecto-existente conserva el permiso duro «No leas `.env`»', () => {
  const skill = leer('skills/revisar-proyecto-existente/SKILL.md');
  assert.ok(skill.includes('No leas `.env`'), 'falta «No leas `.env`»');
});

test('skills/lectura-extra indica que no aplica al `coordinador`', () => {
  const skill = leer('skills/lectura-extra/SKILL.md');
  assert.ok(skill.includes('no aplica al `coordinador`'), 'falta «no aplica al `coordinador`»');
});
