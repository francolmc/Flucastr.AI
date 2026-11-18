#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const skill = readFileSync(new URL('../skills/ejecutar-plan/SKILL.md', import.meta.url), 'utf8');
const constructor = readFileSync(new URL('../agentes/constructor.md', import.meta.url), 'utf8');
const planificador = readFileSync(new URL('../skills/planificar-cambio/SKILL.md', import.meta.url), 'utf8');
const principalCore = readFileSync(new URL('../core/agents/principal.md', import.meta.url), 'utf8');
const constructorCore = readFileSync(new URL('../core/agents/constructor.md', import.meta.url), 'utf8');
const reglasIdioma = [
  [principalCore, 'Always respond in the language the user is currently using.', 'switch languages whenever they do.', 'Program output remains Spanish.'],
  [constructorCore, 'Respond in the language the user is currently using.', 'switch whenever they do.', 'Messages emitted by commands remain Spanish.'],
];
function validarReglasIdioma(reglas) {
  assert.ok(reglas[0].includes(reglas[1]), 'A6: falta la regla de respuesta en el idioma actual');
  assert.ok(reglas[0].includes(reglas[2]), 'A6: falta la regla para cambiar de idioma');
  assert.ok(reglas[0].includes(reglas[3]), 'A6: falta conservar la salida de programas en español');
}
for (const regla of reglasIdioma) validarReglasIdioma(regla);
assert.throws(
  () => validarReglasIdioma([principalCore.replace('Always respond in the language the user is currently using.', ''), ...reglasIdioma[0].slice(1)]),
  error => error instanceof assert.AssertionError && error.message.includes('A6: falta la regla de respuesta'),
  'A6: eliminar la regla del principal debe fallar',
);
assert.throws(
  () => validarReglasIdioma([constructorCore.replace('Respond in the language the user is currently using.', ''), ...reglasIdioma[1].slice(1)]),
  error => error instanceof assert.AssertionError && error.message.includes('A6: falta la regla de respuesta'),
  'A6: eliminar la regla del constructor debe fallar',
);
console.log('ok A6: ambos agentes adaptan sus respuestas al idioma de la persona y las mutaciones negativas fallan');
assert.match(skill, /As soon as a step is complete and its check passes, mark `- \[x\]`[\s\S]*?before starting the next step/,
  'A1: la casilla debe marcarse al completar y comprobar cada paso, antes del siguiente');
assert.match(skill, /If a step has no explicit check, leave it unchecked[\s\S]*?If interrupted or incomplete, leave it unchecked/,
  'A2: pasos sin comprobación o interrumpidos deben quedar pendientes con nota');
assert.match(skill, /never edit \*Alcance\* or \*Aceptación\*/,
  'A1: el constructor no modifica Alcance ni Aceptación');
assert.match(constructor, /before starting the next step; do not accumulate checkboxes until the end of the tranche/,
  'A1: el contrato del constructor requiere avance visible por paso');
assert.match(planificador, /one explicit check, and its expected result[\s\S]*?`Verificación del tramo` is additional and never replaces an individual check/,
  'A2/A3: cada paso requiere comprobación propia aunque el tramo tenga verificación');
assert.ok(
  skill.includes('`### Tramo N — Historia: ...` identifies a self-contained story')
    && skill.includes('`A#` criteria, TODO items, and *Handoff*'),
  'A4: el formato nuevo guía la ejecución por historia y handoff',
);
assert.ok(
  skill.includes('For older plans, follow their existing steps and acceptance criteria')
    && skill.includes('`tramo-<n>.md`'),
  'A4: los planes antiguos conservan sus pasos y archivo de tramo',
);
console.log('ok A4: contrato nuevo y compatibilidad con el contrato anterior');

const continuidad = [
  ['opt-in conserva la ejecución de un tramo por defecto', 'By default, an execution ends when the active tramo is complete'],
  ['continuidad se limita a la misma historia', 'do not move on to another story'],
  ['checkpoint por tramo y sin commits', 'checkpoint to *Notas* with changed files, a diff summary, and the check result; do not commit'],
  ['revisión al final o pausa entre tramos si el plan lo exige', '`Revisión: por tramo`'],
  ['medición previa de la misma comprobación', 'prior duration is recorded for the exact check in an equivalent environment'],
  ['límite efectivo de dos veces la duración', 'timeout <2x-segundos>s <comando>'],
  ['segunda falla por la misma causa pausa', 'same cause returns, pause'],
  ['salida de alcance o decisión de la persona usuaria pausa', 'Also pause if work must leave scope or requires a user decision'],
  ['dudas menores se registran y siguen', 'Record minor in-scope decisions under `Decisiones` and continue'],
  ['la pausa deja una reanudación retomable', 'a resumable note describing progress, remaining work, and cause'],
];
for (const [label, phrase] of continuidad) {
  assert.ok(skill.includes(phrase), `A2: la skill debe cubrir ${label}`);
}
assert.ok(constructor.includes('continuidad: continua') && constructor.includes('do not move to another story'),
  'A2: el constructor permite continuidad solo dentro de la historia aprobada');
assert.ok(constructor.includes('checkpoint to *Notas* with files changed') && constructor.includes('Do not commit between tranches'),
  'A2: el constructor exige checkpoint y conserva la prohibición de commits');
assert.ok(constructor.includes('fails twice for the same cause') && constructor.includes('more than twice its measured duration'),
  'A2: el constructor detiene el avance en segunda falla o timeout');
assert.ok(constructor.includes('may you also update `tramo:`') && constructor.includes('add minor resolved questions to *Decisiones*'),
  'A2: el constructor autoriza los cambios de tramo y decisiones necesarios, solo en continuidad');
assert.ok(constructor.includes('when using `PAUSA`, set `estado: parcial`') && constructor.includes('reapproves the plan before resumption'),
  'A2: la pausa queda parcial y la reanudación requiere aprobación del principal');
assert.ok(skill.includes('set it to `parcial` when pausing') && skill.includes('For plans without continuity, preserve their existing procedure and content'),
  'A2: la skill alinea estados y conserva compatibilidad de planes antiguos');
assert.ok(skill.includes('For older plans, follow their existing steps and acceptance criteria'),
  'A2: los planes antiguos conservan el procedimiento existente');
console.log(`ok A2: ${continuidad.length + 7} condiciones del modo continuo y compatibilidad verificadas`);

const a5 = [
  ['dependencias reales', 'dependencias reales', 'real dependencies'],
  ['dependencias externas y su motivo', 'Externa — <sistema, herramienta, requisito o contrato externo necesario y motivo>', 'including external dependencies beyond the tramos and their reasons'],
  ['contratos a conservar', 'Contratos a conservar:', 'contracts to preserve'],
  ['rutas susceptibles de cambio', 'Rutas susceptibles de cambio:', 'paths likely to change'],
  ['ruta usada por prueba que puede moverse o archivarse y prueba a actualizar', 'indica si puede moverse o archivarse y qué prueba debe actualizarse', 'whether the path may move or be archived and which test must be updated'],
  ['ejemplo concreto del resultado esperado', 'Ejemplo concreto del resultado esperado:', 'a concrete example of the expected result'],
];
const templateStart = planificador.indexOf('```markdown\n', planificador.indexOf('## Pasos'));
const templateEnd = planificador.indexOf('\n```', templateStart);
const reviewStart = planificador.indexOf('## Before Requesting Approval');
const reviewEnd = planificador.indexOf('\nIf the constructor returns', reviewStart);
assert.ok(templateStart >= 0 && templateEnd > templateStart, 'A5: falta la plantilla de historia');
assert.ok(reviewStart >= 0 && reviewEnd > reviewStart, 'A5: falta la revisión previa a aprobación');

function validarA5(text) {
  const start = text.indexOf('```markdown\n', text.indexOf('## Pasos'));
  const end = text.indexOf('\n```', start);
  const template = text.slice(start, end).toLowerCase();
  const review = text.slice(text.indexOf('## Before Requesting Approval'), text.indexOf('\nIf the constructor returns')).toLowerCase();
  assert.ok(template.includes('«no aplica»'), 'A5: la plantilla debe permitir «No aplica»');
  assert.ok(review.includes('“not applicable”'), 'A5: la revisión previa debe permitir «No aplica»');
  for (const [label, templatePhrase, reviewPhrase] of a5) {
    assert.ok(template.includes(templatePhrase.toLowerCase()), 'A5: falta en plantilla "' + label + '"');
    assert.ok(review.includes(reviewPhrase), 'A5: falta en revisión previa "' + label + '"');
  }
}

function quitarEnSeccion(text, startMarker, endMarker, phrase) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  const section = text.slice(start, end);
  assert.ok(section.toLowerCase().includes(phrase.toLowerCase()), 'A5: no se encontró "' + phrase + '" para mutar');
  return text.slice(0, start) + section.replace(phrase, '') + text.slice(end);
}

validarA5(planificador);
for (const [label, templatePhrase, reviewPhrase] of a5) {
  const withoutTemplateRequirement = quitarEnSeccion(planificador, '## Pasos', '\n## Evidencia', templatePhrase);
  assert.throws(
    () => validarA5(withoutTemplateRequirement),
    error => error instanceof assert.AssertionError && error.message.includes('A5: falta en plantilla "' + label + '"'),
    'A5: quitar ' + label + ' de la plantilla debe fallar por ese requisito',
  );
  const withoutReviewRequirement = quitarEnSeccion(planificador, '## Before Requesting Approval', '\nIf the constructor returns', reviewPhrase);
  assert.throws(
    () => validarA5(withoutReviewRequirement),
    error => error instanceof assert.AssertionError && error.message.includes('A5: falta en revisión previa "' + label + '"'),
    'A5: quitar ' + label + ' de la revisión debe fallar por ese requisito',
  );
}
console.log('ok A5: plantilla y revisión exigen dependencias externas, contratos, rutas y ejemplo; 12 mutaciones negativas detectadas');

function validarRegistroA2({ plan, paso, prefijoNota }) {
  const lines = plan.split(/\r?\n/);
  const step = lines.find(line => /^- \[[ x]\] /.test(line) && line.slice(6).startsWith(paso));
  assert.ok(step, `A2: debe existir ${paso}`);
  assert.match(step, /^- \[ \] /, `A2: ${paso} debe quedar sin marcar`);
  const notesStart = lines.indexOf('## Notas');
  assert.notEqual(notesStart, -1, 'A2: debe existir la sección Notas');
  const notes = lines.slice(notesStart + 1).filter(line => line.trim().replace(/^- /, '').startsWith(prefijoNota));
  assert.equal(notes.length, 1, `A2: ${paso} debe tener una sola nota retomable`);
  assert.ok(!notes[0].includes('\n'), `A2: la nota de ${paso} debe ocupar una sola línea`);
}

const fixtures = [
  {
  archivo: 'a2-sin-comprobacion.json',
    paso: 'Señal del paso 5',
    prefijoNota: 'Paso 5: quedó pendiente porque no tiene una comprobación asignada;',
    salida: 'A2 sin comprobación',
    requiere: [
      'COMPROBADO paso=1 estado=0000',
      'COMPROBADO paso=2 estado=1000',
      'COMPROBADO paso=3 estado=1100',
      'COMPROBADO paso=4 estado=1110',
      'FINAL estado=1111 paso5=pendiente',
    ],
  },
  {
    archivo: 'a2-interrumpido.json',
    paso: 'Procesar el registro de entrada',
    prefijoNota: 'El paso se interrumpió con salida parcial',
    salida: 'A2 interrumpido',
    requiere: [
      'Interrupción recibida; la comprobación termina con código 130.',
      'casilla=pendiente',
      'salida=fase=procesamiento parcial',
      'operacion_iniciada=true',
      'interrupcion_solicitada=true',
    ],
  },
];
for (const fixture of fixtures) {
  const registro = JSON.parse(readFileSync(new URL(`./revisar-plan/fixtures/${fixture.archivo}`, import.meta.url), 'utf8'));
  assert.match(registro.procedencia, /^observación real independiente;/, `${fixture.salida}: falta procedencia de ejecución real`);
  assert.ok(registro.fuente && registro.observaciones.length > 0, `${fixture.salida}: falta fuente u observaciones`);
  for (const observacion of fixture.requiere) {
    assert.ok(registro.observaciones.some(line => line.includes(observacion)), `${fixture.salida}: falta observación ${observacion}`);
  }
  validarRegistroA2({ plan: registro.plan, paso: fixture.paso, prefijoNota: fixture.prefijoNota });
  console.log(`registro real ${fixture.salida}: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo`);

  const mutado = registro.plan.replace('- [ ] ', '- [x] ');
  assert.notEqual(mutado, registro.plan, `${fixture.salida}: no se encontró casilla pendiente para mutar`);
  assert.throws(
    () => validarRegistroA2({ plan: mutado, paso: fixture.paso, prefijoNota: fixture.prefijoNota }),
    error => error instanceof assert.AssertionError && error.message.includes('debe quedar sin marcar'),
    `${fixture.salida}: marcar anticipadamente debe fallar`,
  );
  console.log(`registro real ${fixture.salida}: mutación de casilla rechazada`);
}

const matches = [...skill.matchAll(/```bash pendientes-plan\n([\s\S]*?)\n```/g)];
assert.equal(matches.length, 1, 'debe existir exactamente un bloque canónico bash pendientes-plan');
const block = matches[0][1];
const cases = [
  { id: 'A1', content: '- [x] hecho\n  - [ ] ejemplo en evidencia\n', status: 0, stdout: '0\n' },
  { id: 'A2', content: '- [ ] pendiente uno\n- [x] completo\n  - [ ] checkbox indentado\n- [ ] pendiente dos\n', status: 0, stdout: '2\n' },
  { id: 'A3', missing: true, nonzero: true },
];

const dir = mkdtempSync(join(tmpdir(), 'contrato-constructor-'));
try {
  function run(script, file) {
    const scriptPath = join(dir, 'pendientes.sh');
    writeFileSync(scriptPath, script);
    return spawnSync('bash', ['-e', scriptPath, file], { encoding: 'utf8' });
  }
  function evaluateCases(items, script = block) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('lista de casos vacía');
    return items.map(item => {
      const file = join(dir, `${item.id}.md`);
      if (!item.missing) writeFileSync(file, item.content);
      const result = run(script, file);
      assert.equal(result.error, undefined, `${item.id}: error al iniciar bash: ${result.error}`);
      assert.equal(result.signal, null, `${item.id}: bash terminó por señal ${result.signal}`);
      assert.notEqual(result.status, null, `${item.id}: bash no produjo código de salida`);
      if (item.nonzero) assert.notEqual(result.status, 0, `${item.id}: ruta ilegible no debe producir éxito`);
      else assert.equal(result.status, item.status, `${item.id}: exit inesperado (${result.status}): ${result.stderr}`);
      if (item.stdout !== undefined) assert.equal(result.stdout, item.stdout, `${item.id}: stdout inesperado`);
      return result;
    });
  }

  evaluateCases(cases);
  for (const item of cases) console.log(`ok ${item.id}`);
  assert.throws(() => evaluateCases([], block), /lista de casos vacía/, 'A5: un evaluador vacío debe fallar explícitamente');
  console.log('ok A5');

  const mutated = block.replace(/awk '[\s\S]*?' "\$1"/, `grep -c '^- \\[ \\]' "$1"`);
  assert.notEqual(mutated, block, 'no se encontró el evaluador awk para aplicar mutación de sensibilidad');
  assert.throws(
    () => evaluateCases([cases[0]], mutated),
    error => error instanceof assert.AssertionError && /A1: exit inesperado/.test(error.message),
    'A4: el mismo evaluador debe rechazar el mutante por exit inesperado de A1',
  );
  console.log('ok A4');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
