import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarRoles, FRASES_POR_ARCHIVO } from './contrato-roles.mjs';

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

// Muestra válida mínima: cumple las reglas y se puede alterar copiándola.
// Las frases del manifiesto se añaden desde FRASES_POR_ARCHIVO, una línea por frase; aquí solo van las líneas que otras reglas necesitan.
function muestra() {
  const agentes = {
    arquitecto: FM('arquitecto', 'Diseña la arquitectura. Úsalo al iniciar un proyecto.') +
      'Eres el arquitecto. Usa la skill `definir-proyecto` y `disenar-arquitectura`.\n' +
      'Usa también `revisar-proyecto-existente`.\n',
    planificador: FM('planificador', 'Ordena el backlog y descompone features.') +
      'Eres el planificador. Usa `crear-backlog` o `descomponer-feature`.\n' +
      'Si te bloqueas, primera línea: `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`.\n',
    constructor: FM('constructor', 'Ejecuta una tarea aprobada.') +
      'Eres el constructor. Usa `ejecutar-tarea`.\n',
    coordinador: FM('coordinador', 'Decide el paso siguiente.',
      'Agent(arquitecto, planificador, constructor), Read, Grep, Bash(node scripts/registrar.mjs), Bash(node scripts/archivar.mjs), Bash(node scripts/archivar.mjs --aplicar F*), Bash(node ~/.flucastr-ai/validar-tarea.mjs *)') +
      'Eres el coordinador. Usa `crear-backlog` y `descomponer-feature`.\n' +
      'Puerta previa: `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>` antes de delegar al constructor.\n' +
      'Si un subagente responde `BLOQUEO: rol=<rol>; motivo=<motivo>`, lo registras.\n' +
      ESTADOS_TABLA.join('\n') + '\n',
  };
  const skills = {
    'ejecutar-tarea': FM('ejecutar-tarea', 'Ejecuta una tarea aprobada.') +
      'Si te bloqueas: `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`.\n',
    'descomponer-feature': FM('descomponer-feature', 'Descompone la feature siguiente.'),
    'disenar-arquitectura': FM('disenar-arquitectura', 'Diseña la estructura y el diagrama.'),
    'definir-proyecto': FM('definir-proyecto', 'Define un proyecto nuevo.'),
    'revisar-proyecto-existente': FM('revisar-proyecto-existente', 'Revisa un proyecto existente.'),
    'crear-backlog': FM('crear-backlog', 'Crea el backlog de features.') +
      'Lista ordenada de features.\n',
  };
  // Cada frase del manifiesto va en su archivo, una línea por frase. Una skill que el manifiesto nombra y la muestra no tiene se crea y se cita en el coordinador (regla 4).
  for (const [ruta, frases] of Object.entries(FRASES_POR_ARCHIVO)) {
    const [tipo, nombre] = ruta.split('/');
    const mapa = tipo === 'agentes' ? agentes : skills;
    if (!(nombre in mapa)) {
      if (tipo !== 'skills') continue;
      mapa[nombre] = FM(nombre, 'Skill del manifiesto.');
      agentes.coordinador += `Usa \`${nombre}\`.\n`;
    }
    mapa[nombre] += frases.map((f) => `${f}\n`).join('');
  }
  return {
    agentes,
    skills,
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
      'solo puedes mover la marca',
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

// Controles negativos de la regla 15: cada muestra mala debe nombrar al agente y el elemento.
const variantesF11 = [
  ['regla 15: el coordinador tiene Bash sin patrón', 'Bash', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace(
      'Bash(node scripts/registrar.mjs)',
      'Bash',
    );
  }],
  ['regla 15: al coordinador le falta un patrón Bash', 'Bash(node scripts/archivar.mjs --aplicar F*)', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace(', Bash(node scripts/archivar.mjs --aplicar F*)', '');
  }],
  ['regla 15: el planificador declara Bash(node scripts/', 'Bash(node scripts/', 'planificador', (m) => {
    m.agentes.planificador = m.agentes.planificador.replace('---\n', '---\ntools: Read, Bash(node scripts/registrar.mjs)\n');
  }],
  ['regla 15: al coordinador le falta el patrón del validador', 'validar-tarea.mjs', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace(', Bash(node ~/.flucastr-ai/validar-tarea.mjs *)', '');
  }],
  ['regla 15: el cuerpo del coordinador pierde validar-tarea.mjs', 'validar-tarea.mjs', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace('validar-tarea.mjs <ruta-tarea>', 'revisión de tareas');
  }],
  ['regla 15: el coordinador tiene un Bash extra no permitido', 'Bash(node otro.mjs)', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace(', Bash(node ~/.flucastr-ai/validar-tarea.mjs *)', ', Bash(node ~/.flucastr-ai/validar-tarea.mjs *), Bash(node otro.mjs)');
  }],
  ['regla 15: el coordinador usa la forma antigua con $(…)', 'Bash(node "$(cat ~/.flucastr-ai/raiz)', 'coordinador', (m) => {
    m.agentes.coordinador = m.agentes.coordinador.replace('Bash(node ~/.flucastr-ai/validar-tarea.mjs *)', 'Bash(node "$(cat ~/.flucastr-ai/raiz)/scripts/validar-tarea.mjs" *)');
  }],
];

for (const [nombre, elemento, agente, alterar] of variantesF11) {
  test(`rechaza ${nombre}`, () => {
    const m = muestra();
    alterar(m);
    const errores = validarRoles(m);
    assert.ok(
      errores.some((e) => e.includes(`«${agente}»`) && e.includes(elemento)),
      `se esperaba un error que nombre «${agente}» y «${elemento}»`,
    );
  });
}

// Control negativo único del manifiesto: por cada frase, quitarla de su archivo debe producir un error que la nombre.
for (const [ruta, frases] of Object.entries(FRASES_POR_ARCHIVO)) {
  const [tipo, nombre] = ruta.split('/');
  const esAgente = tipo === 'agentes';
  const etiqueta = esAgente ? 'el agente' : 'la skill';
  for (const frase of frases) {
    test(`rechaza manifiesto: ${etiqueta} «${nombre}» pierde la frase «${frase}»`, () => {
      const m = muestra();
      const mapa = esAgente ? m.agentes : m.skills;
      assert.ok(mapa[nombre].includes(frase), `la muestra debe contener «${frase}»`);
      mapa[nombre] = mapa[nombre].split(frase).join('omitida');
      const errores = validarRoles(m);
      assert.ok(errores.some((e) => e.includes(frase)), `se esperaba un error que mencione «${frase}»`);
    });
  }
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
