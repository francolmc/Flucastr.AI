import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECCIONES } from '../../scripts/formato-tarea.mjs';

// La plantilla de la skill descomponer-feature debe listar las mismas 10 secciones que el validador (F44).
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SKILL = path.join(RAIZ, 'skills', 'descomponer-feature', 'SKILL.md');

// Títulos «## » de la primera plantilla de código tras «## Plantilla».
// El título termina donde empiezan dos o más espacios seguidos.
function titulosDePlantilla(texto) {
  const tras = texto.split(/^## Plantilla\s*$/m)[1];
  assert.ok(tras !== undefined, 'la skill no tiene el encabezado «## Plantilla»');
  const bloque = tras.match(/```[^\n]*\n([\s\S]*?)```/);
  assert.ok(bloque, 'tras «## Plantilla» no hay bloque de código');
  return bloque[1]
    .split('\n')
    .filter((linea) => linea.startsWith('## '))
    .map((linea) => linea.slice(3).split(/\s{2,}/)[0].trim());
}

test('la plantilla de la skill lista las 10 secciones de SECCIONES, en orden', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  assert.deepEqual(titulosDePlantilla(texto), SECCIONES);
});

test('control negativo: sin la línea «## Decisiones abiertas» la extracción difiere', () => {
  const texto = fs.readFileSync(SKILL, 'utf8');
  const sinDecisionesAbiertas = texto
    .split('\n')
    .filter((linea) => !linea.startsWith('## Decisiones abiertas'))
    .join('\n');
  assert.notDeepEqual(titulosDePlantilla(sinDecisionesAbiertas), SECCIONES);
});
