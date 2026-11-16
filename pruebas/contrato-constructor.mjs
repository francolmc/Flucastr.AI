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

function validarA2({ plan, paso, nota }) {
  const lines = plan.split(/\r?\n/);
  const step = lines.find(line => /^- \[[ x]\] /.test(line) && line.slice(6).startsWith(paso));
  assert.ok(step, `A2: debe existir ${paso}`);
  assert.match(step, /^- \[ \] /, `A2: ${paso} debe quedar sin marcar`);
  const notesStart = lines.indexOf('## Notas');
  assert.notEqual(notesStart, -1, 'A2: debe existir la sección Notas');
  const notes = lines.slice(notesStart + 1).filter(line => line.startsWith(`- ${paso}`));
  assert.equal(notes.length, 1, `A2: ${paso} debe tener una sola nota retomable`);
  assert.equal(notes[0], `- ${nota}`, `A2: nota incorrecta para ${paso}`);
}

const sinComprobacion = [
  '# Plan de prueba',
  '## Pasos',
  '- [ ] Paso 1: preparar fixture',
  '## Notas',
  '- Paso 1: falta comprobación explícita; retomar definiendo una señal verificable.',
].join('\n');
const interrumpido = [
  '# Plan de prueba',
  '## Pasos',
  '- [ ] Paso 2: ejecutar recorrido. Comprobación: node recorrido.mjs; termina con exit 0.',
  '## Notas',
  '- Paso 2: interrumpido durante el recorrido; retomar revisando el estado del fixture.',
].join('\n');
validarA2({ plan: sinComprobacion, paso: 'Paso 1:', nota: 'Paso 1: falta comprobación explícita; retomar definiendo una señal verificable.' });
validarA2({ plan: interrumpido, paso: 'Paso 2:', nota: 'Paso 2: interrumpido durante el recorrido; retomar revisando el estado del fixture.' });
console.log('ok A2 sin comprobación: casilla pendiente y nota de reanudación');
console.log('ok A2 interrumpido: casilla pendiente y nota de reanudación');
const marcaAnticipada = sinComprobacion.replace('- [ ] Paso 1:', '- [x] Paso 1:');
assert.throws(
  () => validarA2({ plan: marcaAnticipada, paso: 'Paso 1:', nota: 'Paso 1: falta comprobación explícita; retomar definiendo una señal verificable.' }),
  error => error instanceof assert.AssertionError && /A2: Paso 1: debe quedar sin marcar/.test(error.message),
  'A2: el caso mutante que marca antes de comprobar debe fallar',
);
console.log('ok A2 mutante: marcar anticipadamente se rechaza');

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
