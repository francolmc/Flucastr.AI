#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const skill = readFileSync(new URL('../skills/ejecutar-plan/SKILL.md', import.meta.url), 'utf8');
const constructor = readFileSync(new URL('../agentes/constructor.md', import.meta.url), 'utf8');
const planificador = readFileSync(new URL('../skills/planificar-cambio/SKILL.md', import.meta.url), 'utf8');
assert.match(skill, /En cuanto un paso esté completo y su comprobación pase, marca su `- \[x\]`[\s\S]*?antes de empezar el paso siguiente/,
  'A1: la casilla debe marcarse al completar y comprobar cada paso, antes del siguiente');
assert.match(skill, /Si el paso no tiene una comprobación explícita, déjalo sin marcar[\s\S]*?Si se interrumpe o queda incompleto, déjalo sin marcar/,
  'A2: pasos sin comprobación o interrumpidos deben quedar pendientes con nota');
assert.match(skill, /nunca edites \*Alcance\* ni \*Aceptación\*/,
  'A1: el constructor no modifica Alcance ni Aceptación');
assert.match(constructor, /antes de empezar el paso siguiente; no acumules casillas para el final del tramo/,
  'A1: el contrato del constructor requiere avance visible por paso');
assert.match(planificador, /una comprobación explícita y su resultado esperado[\s\S]*?`Verificación del tramo` es adicional y nunca sustituye la comprobación individual/,
  'A2/A3: cada paso requiere comprobación propia aunque el tramo tenga verificación');
assert.ok(
  skill.includes('`### Tramo N — Historia: ...` identifica una historia autocontenida')
    && skill.includes('criterios `A#`, TODO y *Handoff*'),
  'A4: el formato nuevo guía la ejecución por historia y handoff',
);
assert.ok(
  skill.includes('En planes antiguos, sigue los pasos y aceptación declarados en su formato existente')
    && skill.includes('`tramo-<n>.md`'),
  'A4: los planes antiguos conservan sus pasos y archivo de tramo',
);
console.log('ok A4: contrato nuevo y compatibilidad con el contrato anterior');

const a5 = [
  ['dependencias reales', 'dependencias reales', 'dependencias reales'],
  ['dependencias externas y su motivo', 'Externa — <sistema, herramienta, requisito o contrato externo necesario y motivo>', 'incluidas dependencias externas a los tramos y su motivo'],
  ['contratos a conservar', 'Contratos a conservar:', 'contratos a conservar'],
  ['rutas susceptibles de cambio', 'Rutas susceptibles de cambio:', 'rutas susceptibles de cambio'],
  ['ruta usada por prueba que puede moverse o archivarse y prueba a actualizar', 'indica si puede moverse o archivarse y qué prueba debe actualizarse', 'indique si puede moverse o archivarse y qué prueba debe actualizarse'],
  ['ejemplo concreto del resultado esperado', 'Ejemplo concreto del resultado esperado:', 'ejemplo concreto del resultado esperado'],
];
const templateStart = planificador.indexOf('```markdown\n', planificador.indexOf('## Pasos'));
const templateEnd = planificador.indexOf('\n```', templateStart);
const reviewStart = planificador.indexOf('## Antes de pedir la aprobación');
const reviewEnd = planificador.indexOf('\nSi el constructor devuelve', reviewStart);
assert.ok(templateStart >= 0 && templateEnd > templateStart, 'A5: falta la plantilla de historia');
assert.ok(reviewStart >= 0 && reviewEnd > reviewStart, 'A5: falta la revisión previa a aprobación');

function validarA5(text) {
  const start = text.indexOf('```markdown\n', text.indexOf('## Pasos'));
  const end = text.indexOf('\n```', start);
  const template = text.slice(start, end).toLowerCase();
  const review = text.slice(text.indexOf('## Antes de pedir la aprobación'), text.indexOf('\nSi el constructor devuelve')).toLowerCase();
  assert.ok(template.includes('«no aplica»'), 'A5: la plantilla debe permitir «No aplica»');
  assert.ok(review.includes('«no aplica»'), 'A5: la revisión previa debe permitir «No aplica»');
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
  const withoutReviewRequirement = quitarEnSeccion(planificador, '## Antes de pedir la aprobación', '\nSi el constructor devuelve', reviewPhrase);
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
