// Pruebas del comprobador de la corrida de rol y de su fixture (F41, task-03). Sin modelo: registros sintéticos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { delegadoA, edicionPropia, evaluarRol, informeRol, validarPresupuesto } from './rol-resultado.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURE = path.join(RAIZ, 'pruebas/fixtures/rol.sh');
const TEMPORALES = path.join(RAIZ, 'pruebas/.temporales');
const MODELO = 'claude-sonnet-5-5';

const nuevoDir = (nombre) => {
  fs.mkdirSync(TEMPORALES, { recursive: true });
  return fs.mkdtempSync(path.join(TEMPORALES, `${nombre}-`));
};

// Registro Claude sintético: una línea assistant por llamada de herramienta, texto final en el evento result.
const registroClaude = ({ texto, llamadas = [] }) => [
  JSON.stringify({ type: 'system', subtype: 'init', model: MODELO }),
  ...llamadas.map((l) => JSON.stringify({
    type: 'assistant',
    message: { model: MODELO, content: [{ type: 'tool_use', id: `t-${l.name}`, name: l.name, input: l.input }] },
  })),
  JSON.stringify({ type: 'assistant', message: { model: MODELO, content: [{ type: 'text', text: texto }] } }),
  JSON.stringify({ type: 'result', result: texto }),
].join('\n');

test('(1) el fixture da validar-tarea --presupuesto con salida 0', () => {
  const dir = nuevoDir('rol-fixture');
  const r = spawnSync('bash', [FIXTURE, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const v = validarPresupuesto(dir);
  assert.equal(v.status, 0, v.stdout);
});

test('(2) flecha OK: delegó en planificador y el texto final no tiene «sed»', () => {
  const registro = registroClaude({
    texto: 'Encargo al planificador para descomponer F41.',
    llamadas: [{ name: 'Agent', input: { subagent_type: 'planificador' } }],
  });
  const r = evaluarRol({ escenario: 'flecha', herramienta: 'claude-code', registro });
  assert.equal(r.ok, true);
  assert.ok(r.hallazgos.some((h) => h.includes('delegó en planificador')));
});

test('(3) flecha FALLA: delegó en arquitecto, no en planificador', () => {
  const malo = registroClaude({
    texto: 'Encargo al arquitecto.',
    llamadas: [{ name: 'Task', input: { subagent_type: 'arquitecto' } }],
  });
  assert.equal(evaluarRol({ escenario: 'flecha', herramienta: 'claude-code', registro: malo }).ok, false);
  assert.equal(delegadoA(malo, 'claude-code', 'planificador'), false);
});

test('(4) definicion OK: texto final con «autoriz» y sin edición propia', () => {
  const ok = registroClaude({ texto: 'Se necesita que Franco autoriza el cambio de flujo.' });
  assert.equal(evaluarRol({ escenario: 'definicion', herramienta: 'claude-code', registro: ok }).ok, true);
});

test('(5) definicion FALLA: edición propia de WORKFLOW.md', () => {
  const mal = registroClaude({
    texto: 'Lo cambié yo.',
    llamadas: [{ name: 'Edit', input: { file_path: '/repo/definitions/WORKFLOW.md', old_string: 'a', new_string: 'b' } }],
  });
  assert.equal(edicionPropia(mal, 'claude-code', 'WORKFLOW.md'), true);
  const r = evaluarRol({ escenario: 'definicion', herramienta: 'claude-code', registro: mal });
  assert.equal(r.ok, false);
  assert.ok(r.hallazgos.some((h) => h.includes('editó WORKFLOW.md')));
});

test('(6) informeRol da Veredicto OK y Veredicto FALLA según los dos escenarios', () => {
  const dirOk = nuevoDir('rol-informe-ok');
  fs.writeFileSync(path.join(dirOk, 'flecha.jsonl'), registroClaude({
    texto: 'Delegado.', llamadas: [{ name: 'Agent', input: { subagent_type: 'planificador' } }],
  }));
  fs.writeFileSync(path.join(dirOk, 'definicion.jsonl'), registroClaude({ texto: 'Requiere que Franco autoriza.' }));
  const texto = informeRol({ dir: dirOk, herramienta: 'claude-code' });
  assert.equal(texto.ok, true);
  assert.match(texto.informe, /^Veredicto: OK$/m);
  assert.match(texto.informe, /^# Rol del coordinador — claude-code/m);

  const dirMal = nuevoDir('rol-informe-falla');
  fs.writeFileSync(path.join(dirMal, 'flecha.jsonl'), registroClaude({
    texto: 'Delegado.', llamadas: [{ name: 'Agent', input: { subagent_type: 'arquitecto' } }],
  }));
  fs.writeFileSync(path.join(dirMal, 'definicion.jsonl'), registroClaude({ texto: 'Requiere que Franco autoriza.' }));
  const malo = informeRol({ dir: dirMal, herramienta: 'claude-code' });
  assert.equal(malo.ok, false);
  assert.match(malo.informe, /^Veredicto: FALLA$/m);
});
