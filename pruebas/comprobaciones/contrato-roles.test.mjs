import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarRoles } from './contrato-roles.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

// Front matter mínimo: name y description, y tools solo si se pasa.
const FM = (nombre, descripcion, tools) => [
  '---',
  `name: ${nombre}`,
  `description: "${descripcion}"`,
  ...(tools ? [`tools: ${tools}`] : []),
  '---',
  '',
].join('\n');

const ESTADOS_TABLA = [
  '| Estado | Paso |',
  '|---|---|',
  '| `borrador` | Puerta 3: espera a Franco. |',
  '| `aprobada` | Delega al constructor. |',
  '| `en curso` | Escalación si no hay sesión. |',
  '| `lista para revisión` | Puerta 4: Franco revisa. |',
  '| `hecha` | Solo Franco la pasa a hecha. |',
  '| `bloqueada` | Registra el bloqueo. |',
];

// Muestra válida mínima: cumple las ocho reglas y se puede alterar copiándola.
function muestra() {
  return {
    agentes: {
      arquitecto: FM('arquitecto', 'Diseña la arquitectura. Úsalo al iniciar un proyecto.') +
        'Eres el arquitecto. Usa la skill `definir-proyecto`.\n',
      planificador: FM('planificador', 'Ordena el backlog y descompone features.') +
        'Eres el planificador. Usa `crear-backlog` o `descomponer-feature`.\n' +
        'No llamas a otros agentes ni escribes en `STATUS.md`.\n' +
        'Si te bloqueas, primera línea: `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`.\n',
      constructor: FM('constructor', 'Ejecuta una tarea aprobada.') +
        'Eres el constructor. Usa `ejecutar-tarea`.\n' +
        'No llamas a otros agentes ni escribes en `STATUS.md`.\n',
      coordinador: FM('coordinador', 'Decide el paso siguiente.',
        'Agent(arquitecto, planificador, constructor), Read, Grep') +
        'Eres el coordinador. Usa `crear-backlog` y `descomponer-feature`.\n' +
        'Si un subagente responde `BLOQUEO: rol=<rol>; motivo=<motivo>`, lo registras.\n\n' +
        ESTADOS_TABLA.join('\n') + '\n',
    },
    skills: {
      'ejecutar-tarea': FM('ejecutar-tarea', 'Ejecuta una tarea aprobada.') +
        'Si te bloqueas: `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`.\n',
      'descomponer-feature': FM('descomponer-feature', 'Descompone la feature siguiente.') +
        '5. En `BACKLOG.md` solo puedes mover la marca `→`.\n',
      'crear-backlog': FM('crear-backlog', 'Crea el backlog de features.') +
        'Lista ordenada de features.\n',
    },
    modelos: {
      version: 1,
      agentes: {
        arquitecto: { nivel: 'medio' },
        planificador: { nivel: 'medio' },
        coordinador: { nivel: 'medio' },
        constructor: { nivel: 'bajo' },
      },
    },
  };
}

test('muestra válida mínima no tiene errores', () => {
  assert.deepEqual(validarRoles(muestra()), []);
});

const variantes = [
  ['regla 1: name no coincide con la clave del agente', (m) => {
    m.agentes.planificador = m.agentes.planificador.replace('name: planificador', 'name: planeador');
  }],
  ['regla 2: modelos.json no declara al constructor', (m) => {
    delete m.modelos.agentes.constructor;
  }],
  ['regla 3: el coordinador no delega en el constructor', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace(
      'Agent(arquitecto, planificador, constructor)',
      'Agent(arquitecto, planificador)',
    );
  }],
  ['regla 4: una skill no aparece en ningún agente', (m) => {
    m.skills['generar-clonar'] = FM('generar-clonar', 'Genera initialize.sh.') + 'Genera el script.\n';
  }],
  ['regla 5: el planificador no tiene la línea de bloqueo', (m) => {
    m.agentes.planificador = m.agentes.planificador.replace(
      'BLOQUEO: rol=<rol requerido>; motivo=<motivo>',
      'bloqueo sin formato',
    );
  }],
  ['regla 6: el constructor no dice que no escribe en STATUS.md', (m) => {
    m.agentes.constructor = m.agentes.constructor.replace('escribes en `STATUS.md`', 'escribe en el estado');
  }],
  ['regla 7: la tabla del coordinador pierde el estado bloqueada', (m) => {
    m.agentes.coordinador = m.agentes.coordinador
      .split('\n')
      .filter((l) => !(l.startsWith('|') && l.includes('`bloqueada`')))
      .join('\n');
  }],
  ['regla 8: descomponer-feature prohíbe tocar BACKLOG.md', (m) => {
    m.skills['descomponer-feature'] = m.skills['descomponer-feature'].replace(
      'solo puedes mover la marca `→`',
      'No cambies `BACKLOG.md`',
    );
  }],
];

for (const [nombre, alterar] of variantes) {
  test(`rechaza ${nombre}`, () => {
    const m = muestra();
    alterar(m);
    assert.ok(validarRoles(m).length > 0, 'se esperaba al menos un error');
  });
}

test('los archivos reales de agentes, skills y modelos.json cumplen el contrato', () => {
  const agentes = Object.fromEntries(
    fs.readdirSync(path.join(RAIZ, 'agentes'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => [f.slice(0, -3), fs.readFileSync(path.join(RAIZ, 'agentes', f), 'utf8')]),
  );
  const skills = Object.fromEntries(
    fs.readdirSync(path.join(RAIZ, 'skills'))
      .filter((n) => fs.statSync(path.join(RAIZ, 'skills', n)).isDirectory())
      .map((n) => [n, fs.readFileSync(path.join(RAIZ, 'skills', n, 'SKILL.md'), 'utf8')]),
  );
  const modelos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'modelos.json'), 'utf8'));

  assert.ok(Object.keys(agentes).length >= 4, 'se esperaban al menos 4 agentes');
  assert.ok(Object.keys(skills).length >= 7, 'se esperaban al menos 7 skills');
  assert.deepEqual(validarRoles({ agentes, skills, modelos }), []);
});
