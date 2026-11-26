#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSyncSeguro } from '../tools/spawn/sync-seguro.mjs';

const skill = readFileSync(new URL('../core/skills/execute-plan/SKILL.md', import.meta.url), 'utf8');
const builder = readFileSync(new URL('../core/agents/builder.md', import.meta.url), 'utf8');
const planificador = readFileSync(new URL('../core/skills/plan-change/SKILL.md', import.meta.url), 'utf8');
const plannerCore = readFileSync(new URL('../core/agents/planner.md', import.meta.url), 'utf8');
const builderCore = readFileSync(new URL('../core/agents/builder.md', import.meta.url), 'utf8');
const reglasIdioma = [
  [plannerCore, 'Always respond in the language the user is currently using.', 'switch languages whenever they do.', 'Program output remains Spanish.'],
  [builderCore, 'Respond in the language the user is currently using.', 'switch whenever they do.', 'Messages emitted by commands remain Spanish.'],
];
function validarReglasIdioma(reglas) {
  assert.ok(reglas[0].includes(reglas[1]), 'A6: falta la regla de respuesta en el idioma actual');
  assert.ok(reglas[0].includes(reglas[2]), 'A6: falta la regla para cambiar de idioma');
  assert.ok(reglas[0].includes(reglas[3]), 'A6: falta conservar la salida de programas en español');
}
for (const regla of reglasIdioma) validarReglasIdioma(regla);
assert.throws(
  () => validarReglasIdioma([plannerCore.replace('Always respond in the language the user is currently using.', ''), ...reglasIdioma[0].slice(1)]),
  error => error instanceof assert.AssertionError && error.message.includes('A6: falta la regla de respuesta'),
  'A6: eliminar la regla del planner debe fallar',
);
assert.throws(
  () => validarReglasIdioma([builderCore.replace('Respond in the language the user is currently using.', ''), ...reglasIdioma[1].slice(1)]),
  error => error instanceof assert.AssertionError && error.message.includes('A6: falta la regla de respuesta'),
  'A6: eliminar la regla del builder debe fallar',
);
console.log('ok A6: ambos agentes adaptan sus respuestas al idioma de la persona y las mutaciones negativas fallan');
assert.match(skill, /As soon as a step is complete and its check passes, mark `- \[x\]`[\s\S]*?before starting the next step/,
  'A1: la casilla debe marcarse al completar y comprobar cada paso, antes del siguiente');
assert.match(skill, /If a step has no explicit check, leave it unchecked[\s\S]*?If interrupted or incomplete, leave it unchecked/,
  'A2: pasos sin comprobación o interrumpidos deben quedar pendientes con nota');
assert.match(builder, /never edit \*Scope\* or \*Acceptance\*/,
  'A1: el builder no modifica Scope ni Acceptance');
assert.match(skill, /before starting the next step; do not accumulate checkboxes until the end of the segment/,
  'A1: la skill requiere avance visible por paso');
assert.match(planificador, /one explicit check, and its expected result[\s\S]*?`Segment verification:` is additional and never replaces an individual check/,
  'A2/A3: cada paso requiere comprobación propia aunque el tramo tenga verificación');
assert.ok(
  skill.includes('`### Segment N — Story: ...` identifies a self-contained story')
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
  ['opt-in keeps one-segment execution by default', 'By default, an execution ends when the active segment is complete'],
  ['continuity is limited to the same story', 'do not move on to another story'],
  ['checkpoint per segment', 'checkpoint to *Notes* with files changed, a diff summary, and the check result'],
  ['final or per-segment review when the plan requires it', '`Revisión: por tramo`'],
  ['prior measurement of the same check', 'prior duration is recorded for the exact check in an equivalent environment'],
  ['effective limit of twice the duration', 'timeout <2x-segundos>s <comando>'],
  ['second failure for the same cause pauses', 'same cause returns, pause'],
  ['leaving scope or a user decision pauses', 'Also pause if work must leave scope or requires a user decision'],
  ['minor questions are recorded and work continues', 'Record minor in-scope decisions under `Decisions` and continue'],
  ['the pause leaves a resumable note', 'a resumable note describing progress, remaining work, and cause'],
];
for (const [label, phrase] of continuidad) {
  assert.ok(skill.includes(phrase), `A2: la skill debe cubrir ${label}`);
}
assert.ok(builder.includes('continuity: continuous') && skill.includes('do not move on to another story'),
  'A2: el builder permite continuidad solo dentro de la historia aprobada');
assert.ok(skill.includes('checkpoint to *Notes* with files changed') && builder.includes('Do not commit between segments'),
  'A2: la skill exige checkpoint y el builder conserva la prohibición de commits');
assert.ok(skill.includes('fails twice for the same cause') && skill.includes('more than twice its measured duration'),
  'A2: la skill detiene el avance en segunda falla o timeout');
assert.ok(builder.includes('may you also update `segment:`') && builder.includes('add minor resolved questions to *Decisions*'),
  'A2: el builder autoriza los cambios de tramo y decisiones necesarios, solo en continuidad');
assert.ok(skill.includes('when using `PAUSED`, set `status: partial`') && skill.includes('reapproves the plan before resumption'),
  'A2: la pausa queda parcial y la reanudación requiere aprobación del planner');
assert.ok(skill.includes('when using `PAUSED`, set `status: partial`') && skill.includes('For plans without continuity, preserve their existing procedure and content'),
  'A2: la skill alinea estados y conserva compatibilidad de planes antiguos');
assert.ok(skill.includes('For older plans, follow their existing steps and acceptance criteria'),
  'A2: los planes antiguos conservan el procedimiento existente');
console.log(`ok A2: ${continuidad.length + 7} condiciones del modo continuo y compatibilidad verificadas`);

const decisionesA5 = [
  ['skill: buscar decisions.md', skill, "search `decisions.md` (without it, `Resuelto:`"],
  ['skill: nuevas filas', skill, 'add decisions as new rows there instead'],
  ['skill: aplicar solo activas', skill, 'apply it if `active`'],
  ['builder: filas de decisions.md', builder, 'You may also add rows to `decisions.md`'],
  ['builder: citar IDs en retornos', builder, 'cite `D-NN` in returns'],
];
function validarDecisionesA5(texto, frase, etiqueta) {
  assert.ok(texto.includes(frase), `A5: falta ${etiqueta}: ${frase}`);
}
for (const [etiqueta, texto, frase] of decisionesA5) {
  validarDecisionesA5(texto, frase, etiqueta);
  assert.throws(
    () => validarDecisionesA5(texto.replace(frase, ''), frase, etiqueta),
    error => error instanceof assert.AssertionError && error.message.includes(frase),
    `A5: quitar "${frase}" debe fallar`,
  );
}
console.log(`ok A5: ${decisionesA5.length} frases de decisions.md presentes y mutaciones detectadas`);

const etiquetasRetorno = [
  ['DONE line', 'DONE: plan=<path>; segment=<n>; verify=pasa'],
  ['DONE labels', '`cambios:`'],
  ['DONE evidence label', '`evidencia:`'],
  ['DONE decisions label', '`decisiones:`'],
  ['DONE review label', '`revisar:`'],
  ['PAUSED line', 'PAUSED: plan=<path>; segment=<n>; motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<exact step>; no_intentado=<reason>'],
  ['PAUSED problem label', '`problema:`'],
  ['PAUSED options label', '`opciones:`'],
  ['PAUSED resume label', '`retomar:`'],
  ['recommended option', '(recommended)'],
  ['five-line limit', 'at most five lines in total'],
];
for (const [label, frase] of etiquetasRetorno) {
  assert.ok(builder.includes(frase), `A5: el retorno del builder debe incluir ${label}`);
}
console.log(`ok A5: ${etiquetasRetorno.length} etiquetas de retorno y límite de cinco líneas en builder.md`);

const proporcionales = [
  "Test only what you created or modified and its direct dependents: for each A#, the happy path and that criterion's edges.",
  'At most one regression test per bug.',
  'Every test exercises the real product; a fixture may feed it but never replaces or rewrites what is under test.',
  "While building, run only the tests related to the diff (import graph or the runner's related-tests option; otherwise the test files covering the changed paths). The final gate runs the full suite.",
  'This never narrows a declared command: Check, Segment verification:, and Verification run exactly as written.',
];
function validarPruebasProporcionales(text) {
  const start = text.indexOf('## Proportional tests');
  assert.ok(start >= 0, 'A2: la skill debe tener la sección ## Proportional tests');
  const end = text.indexOf('\n## ', start + 1);
  const section = text.slice(start, end === -1 ? undefined : end);
  for (const frase of proporcionales) {
    assert.ok(section.includes(frase), `A2: falta en Proportional tests la regla: ${frase}`);
  }
}
validarPruebasProporcionales(skill);
for (const frase of proporcionales) {
  const mutada = skill.replace(frase, '');
  assert.notEqual(mutada, skill, `A2: no se encontró la regla para mutar: ${frase}`);
  assert.throws(
    () => validarPruebasProporcionales(mutada),
    error => error instanceof assert.AssertionError && error.message.includes(frase),
    `A2: quitar la regla "${frase}" debe fallar`,
  );
}
console.log(`ok A2 pruebas proporcionales: ${proporcionales.length} reglas y ${proporcionales.length} mutaciones negativas detectadas`);

const a5 = [
  ['real dependencies', 'identify the real dependencies', 'real dependencies'],
  ['external dependencies and their reason', 'External — <system, tool, requirement, or external contract needed and reason>', 'including external dependencies beyond the segments and their reasons'],
  ['contracts to preserve', 'Contracts to keep:', 'contracts to preserve'],
  ['paths likely to change', 'Paths likely to change:', 'paths likely to change'],
  ['path a test may move or archive, and the test to update', 'say whether it can move or be archived and which test must be updated', 'whether the path may move or be archived and which test must be updated'],
  ['concrete example of the expected result', 'Concrete example of the expected result:', 'a concrete example of the expected result'],
];
const templateStart = planificador.indexOf('```markdown\n', planificador.indexOf('## Steps'));
const templateEnd = planificador.indexOf('\n```', templateStart);
const reviewStart = planificador.indexOf('## Before Requesting Approval');
const reviewEnd = planificador.indexOf('\nIf the builder returns', reviewStart);
assert.ok(templateStart >= 0 && templateEnd > templateStart, 'A5: falta la plantilla de historia');
assert.ok(reviewStart >= 0 && reviewEnd > reviewStart, 'A5: falta la revisión previa a aprobación');

function validarA5(text) {
  const start = text.indexOf('```markdown\n', text.indexOf('## Steps'));
  const end = text.indexOf('\n```', start);
  const template = text.slice(start, end).toLowerCase();
  const review = text.slice(text.indexOf('## Before Requesting Approval'), text.indexOf('\nIf the builder returns')).toLowerCase();
  assert.ok(template.includes('"not applicable"'), 'A5: la plantilla debe permitir "Not applicable"');
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
  const withoutTemplateRequirement = quitarEnSeccion(planificador, '## Steps', '\n## Evidence', templatePhrase);
  assert.throws(
    () => validarA5(withoutTemplateRequirement),
    error => error instanceof assert.AssertionError && error.message.includes('A5: falta en plantilla "' + label + '"'),
    'A5: quitar ' + label + ' de la plantilla debe fallar por ese requisito',
  );
  const withoutReviewRequirement = quitarEnSeccion(planificador, '## Before Requesting Approval', '\nIf the builder returns', reviewPhrase);
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
  const notesStart = lines.indexOf('## Notes');
  assert.notEqual(notesStart, -1, 'A2: debe existir la sección Notes');
  const notes = lines.slice(notesStart + 1).filter(line => line.trim().replace(/^- /, '').startsWith(prefijoNota));
  assert.equal(notes.length, 1, `A2: ${paso} debe tener una sola nota retomable`);
  assert.ok(!notes[0].includes('\n'), `A2: la nota de ${paso} debe ocupar una sola línea`);
}

const fixtures = [
  {
  archivo: 'a2-no-check.json',
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
    archivo: 'a2-interrupted.json',
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
  const registro = JSON.parse(readFileSync(new URL(`./review-plan/fixtures/${fixture.archivo}`, import.meta.url), 'utf8'));
  assert.match(registro.procedencia, /^observación real independiente;/, `${fixture.salida}: falta procedencia de ejecución real`);
  assert.ok(registro.fuente && registro.observaciones.length > 0, `${fixture.salida}: falta fuente u observaciones`);
  for (const observacion of fixture.requiere) {
    assert.ok(registro.observaciones.some(line => line.includes(observacion)), `${fixture.salida}: falta observación ${observacion}`);
  }
  // El registro real se grabó con «## Notas»; se traduce el encabezado en memoria (el dato no cambia).
  validarRegistroA2({ plan: registro.plan.replace(/^## Notas$/m, '## Notes'), paso: fixture.paso, prefijoNota: fixture.prefijoNota });
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

const dir = mkdtempSync(join(tmpdir(), 'builder-contract-'));
try {
  function run(script, file) {
    const scriptPath = join(dir, 'pendientes.sh');
    writeFileSync(scriptPath, script);
    return spawnSyncSeguro('bash', ['-e', scriptPath, file], { encoding: 'utf8' });
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
