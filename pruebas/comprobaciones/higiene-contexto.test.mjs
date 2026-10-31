import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

// Roles cuyo texto no puede conservar la línea sobre modelos.json (task-03).
const ROLES = ['arquitecto', 'planificador', 'constructor', 'coordinador'];
const FRASE_MODELO_AGENTE = 'El nivel de modelo que usas no se declara aquí';
// Lectura acotada (task-05): debe estar en constructor y en ejecutar-tarea.
const LECTURA_ACOTADA = 'Lectura acotada:';
const FRASE_EDIT = '`edit` en vez de reescribirlos enteros con `write`';
// Frase quitada de WORKFLOW.md (task-04).
const FRASE_WORKFLOW_QUITADA = 'Cada rol configura su nivel de modelo';
// Tope de caracteres de WORKFLOW.md (task-04), medido como `wc -m` en UTF-8.
const TOPE_WORKFLOW = 30720;

const caracteres = (texto) => [...texto].length;

// Lee una clave propia de un objeto; nunca toma propiedades heredadas (p. ej. `constructor`).
const de = (obj, clave) =>
  obj && Object.hasOwn(obj, clave) && typeof obj[clave] === 'string' ? obj[clave] : '';

// Devuelve los mensajes de error en español; vacío = válido. No lanza.
function validarHigiene({ agentes, skills, workflow } = {}) {
  const errores = [];
  const ag = agentes ?? {};
  const sk = typeof skills === 'string' ? skills : '';
  const wf = typeof workflow === 'string' ? workflow : '';

  for (const rol of ROLES) {
    if (de(ag, rol).includes(FRASE_MODELO_AGENTE)) {
      errores.push(`agentes/${rol}.md conserva la línea sobre modelos.json`);
    }
  }

  const textoConstructor = de(ag, 'constructor');
  if (!textoConstructor.includes(LECTURA_ACOTADA) || !textoConstructor.includes(FRASE_EDIT)) {
    errores.push('agentes/constructor.md no tiene la lectura acotada');
  }
  if (!sk.includes(LECTURA_ACOTADA) || !sk.includes(FRASE_EDIT)) {
    errores.push('skills/ejecutar-tarea/SKILL.md no tiene la lectura acotada');
  }

  const largo = caracteres(wf);
  if (largo > TOPE_WORKFLOW) {
    errores.push(`definitions/WORKFLOW.md pasa de ${TOPE_WORKFLOW} caracteres (tiene ${largo})`);
  }
  if (wf.includes(FRASE_WORKFLOW_QUITADA)) {
    errores.push('definitions/WORKFLOW.md conserva la frase sobre modelos.json');
  }

  return errores;
}

const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');

function cargarReales() {
  const agentes = {};
  for (const rol of ROLES) agentes[rol] = leer(`agentes/${rol}.md`);
  return {
    agentes,
    skills: leer('skills/ejecutar-tarea/SKILL.md'),
    workflow: leer('definitions/WORKFLOW.md'),
  };
}

// Quita las líneas que contienen el patrón (para simular que falta la regla).
const sinLineas = (texto, patron) =>
  texto.split('\n').filter((linea) => !linea.includes(patron)).join('\n');

test('los archivos reales cumplen la regla', () => {
  assert.deepEqual(validarHigiene(cargarReales()), []);
});

test('falla si un agente conserva la línea de modelos.json', () => {
  const r = cargarReales();
  r.agentes.planificador += `\n${FRASE_MODELO_AGENTE}: el nivel lo fija modelos.json.\n`;
  const errores = validarHigiene(r);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /planificador\.md/);
});

test('falla si falta la lectura acotada en constructor', () => {
  const r = cargarReales();
  r.agentes.constructor = sinLineas(r.agentes.constructor, LECTURA_ACOTADA);
  const errores = validarHigiene(r);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /constructor\.md/);
});

test('falla si falta la lectura acotada en ejecutar-tarea', () => {
  const r = cargarReales();
  r.skills = sinLineas(r.skills, LECTURA_ACOTADA);
  const errores = validarHigiene(r);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /ejecutar-tarea/);
});

test('falla si WORKFLOW.md pasa de 30720 caracteres', () => {
  const r = cargarReales();
  // Una letra más que el tope, para que el único error sea el tamaño.
  r.workflow += 'x'.repeat(TOPE_WORKFLOW - caracteres(r.workflow) + 1);
  const errores = validarHigiene(r);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /30720/);
});

test('falla si WORKFLOW.md conserva la frase sobre modelos.json', () => {
  const r = cargarReales();
  r.workflow += `\n${FRASE_WORKFLOW_QUITADA}, a elección de Franco.`;
  const errores = validarHigiene(r);
  assert.equal(errores.length, 1, errores.join(' | '));
  assert.match(errores[0], /conserva la frase/);
});
