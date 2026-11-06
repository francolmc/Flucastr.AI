import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analizarCorrida } from './comprobaciones/excedido-resultado.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dir, '..');
const script = path.join(raiz, 'pruebas/correr-excedido.sh');
const temporales = path.join(raiz, 'pruebas/.temporales');
fs.mkdirSync(temporales, { recursive: true });

function entorno(extra) {
  const env = { ...process.env, FLUCASTR_SIN_PRECONDICION: '1', ...extra };
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  return env;
}

// Modelo simulado: escribe en su salida un evento de resultado; con «A» como último argumento
// (la etapa 2) añade amp_arq=1 a la línea Presupuesto: del STATUS.md del fixture (cwd).
function falso(nombre, cuerpo) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'falso-'));
  const ruta = path.join(carpeta, nombre);
  fs.writeFileSync(ruta, `#!/usr/bin/env bash\n${cuerpo}\n`, { mode: 0o755 });
  return ruta;
}

const claudeSimulado = falso('claude', `
printf '%s\\n' '{"type":"result","result":"Listo."}'
if [[ "\${@: -1}" == "A" ]]; then
  f="$PWD/definitions/STATUS.md"
  awk '/^Presupuesto:/{print $0 "; amp_arq=1"; next} {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
fi
`);

const piSimulado = falso('pi', 'exit 0');

function informeDe(resultados, sufijo) {
  const nombre = fs.readdirSync(resultados).find((n) => n.endsWith(sufijo));
  assert.ok(nombre, `no hay informe ${sufijo} en ${resultados}`);
  return fs.readFileSync(path.join(resultados, nombre), 'utf8');
}

test('correr-excedido.sh: sintaxis Bash válida', () => {
  const r = spawnSync('/bin/bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('correr-excedido.sh: sin argumento sale 2', () => {
  const r = spawnSync('/bin/bash', [script], { cwd: raiz, encoding: 'utf8', env: entorno({}) });
  assert.equal(r.status, 2, r.stderr);
});

test('correr-excedido.sh claude-code: con «A» amp_arq=1 da Veredicto: OK', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'claude-code'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_CLAUDE_BIN: claudeSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(informeDe(resultados, '-excedido-claude-code-1.md'), /Veredicto: OK/);
});

test('correr-excedido.sh pi: modelo simulado que no cambia nada da Veredicto: FALLA', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'pi'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_PI_BIN: piSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(informeDe(resultados, '-excedido-pi-1.md'), /Veredicto: FALLA/);
});

test('correr-excedido.sh claude-code 2: dos corridas, informes -1 y -2, Corridas: 2/2 OK', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('/bin/bash', [script, 'claude-code', '2'], {
    cwd: raiz, encoding: 'utf8',
    env: entorno({ FLUCASTR_CLAUDE_BIN: claudeSimulado, FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim().split('\n').pop(), 'Corridas: 2/2 OK');
  assert.match(informeDe(resultados, '-excedido-claude-code-1.md'), /Veredicto: OK/);
  assert.match(informeDe(resultados, '-excedido-claude-code-2.md'), /Veredicto: OK/);
});

test('correr-excedido.sh: N «0», N «x» y un tercer argumento salen 2 sin informes', () => {
  for (const args of [['pi', '0'], ['pi', 'x'], ['pi', '1', '2']]) {
    const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
    const r = spawnSync('/bin/bash', [script, ...args], {
      cwd: raiz, encoding: 'utf8',
      env: entorno({ FLUCASTR_PI_BIN: piSimulado, FLUCASTR_RESULTADOS: resultados }),
    });
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.deepEqual(fs.readdirSync(resultados), [], `${args.join(' ')} no debe crear informes`);
  }
});

// Registros sintéticos para analizarCorrida: un dir con etapa1/, etapa2/, los .jsonl y un fixture opcional.
function armarCorrida({ etapa1, etapa2, reg1 = '', reg2, validador = null }) {
  const dir = fs.mkdtempSync(path.join(temporales, 'sintetico-'));
  fs.mkdirSync(path.join(dir, 'etapa1'));
  fs.mkdirSync(path.join(dir, 'etapa2'));
  fs.mkdirSync(path.join(dir, 'fixture', 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'etapa1/STATUS.md'), etapa1);
  fs.writeFileSync(path.join(dir, 'etapa2/STATUS.md'), etapa2);
  fs.writeFileSync(path.join(dir, 'etapa1.jsonl'), reg1);
  fs.writeFileSync(path.join(dir, 'etapa2.jsonl'), reg2);
  if (validador) fs.writeFileSync(path.join(dir, 'fixture/scripts/validar-tarea.mjs'), validador);
  return dir;
}

const estado = (escalacion, presupuesto = 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0') =>
  `# Estado\nEscalación: ${escalacion}\n${presupuesto}\n`;
const jsonl = (...eventos) => eventos.map((e) => JSON.stringify(e)).join('\n');
const llamadaBash = (id, command) => ({ type: 'assistant', message: { model: 'claude-test',
  content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
const resultadoBash = (id, content, is_error = false) => ({ type: 'user', message: { role: 'user',
  content: [{ type: 'tool_result', tool_use_id: id, content, is_error }] } });
const final = (texto) => ({ type: 'result', result: texto });

test('analizarCorrida: el texto final de más de 300 letras sale íntegro y sin «…»', () => {
  const largo = `Inicio ${'x'.repeat(400)} FIN-COMPLETO`;
  const dir = armarCorrida({
    etapa1: estado('A) ampliar tope; B) cerrar F01'),
    etapa2: estado('ninguna', 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0; amp_arq=1'),
    reg2: jsonl(final(largo)),
  });
  const { informe: texto } = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.ok(texto.includes(largo));
  assert.ok(!texto.includes('…'));
  assert.match(texto, /Veredicto: OK/);
});

test('analizarCorrida: permission_denied figura denegada y «Exit code 1» no', () => {
  const dir = armarCorrida({
    etapa1: estado('A) ampliar tope; B) cerrar F01'),
    etapa2: estado('ninguna', 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0; amp_arq=1'),
    reg2: jsonl(
      llamadaBash('t1', 'node a.mjs'),
      llamadaBash('t2', 'node b.mjs'),
      { type: 'system', subtype: 'permission_denied', tool_use_id: 't1', tool_name: 'Bash', message: 'denegado' },
      resultadoBash('t1', 'Permission denied', true),
      resultadoBash('t2', 'Exit code 1\nPresupuesto F01: excedido', true),
      final('Listo'),
    ),
  });
  const { informe: texto } = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.match(texto, /- etapa 2: node a\.mjs → denegada/);
  assert.match(texto, /- etapa 2: node b\.mjs → exit 1/);
  assert.doesNotMatch(texto, /node b\.mjs → denegada/);
  assert.match(texto, /Causa probable: herramienta denegada: node a\.mjs/);
});

test('analizarCorrida: etapa 1 sin letras da la causa correspondiente', () => {
  const dir = armarCorrida({
    etapa1: estado('ninguna'),
    etapa2: estado('ninguna', 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0; amp_arq=0'),
    reg2: jsonl(final('Listo')),
  });
  const { informe: texto } = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.match(texto, /Causa probable: la etapa 1 no escribió la Escalación con letras/);
});

test('analizarCorrida: STATUS.md rechazado por el validador da su causa', () => {
  const dir = armarCorrida({
    etapa1: estado('A) ampliar tope; B) cerrar F01'),
    etapa2: estado('ninguna', 'Presupuesto: F01; rondas arq=3 plan=1; ampliado=0; amp_arq=1'),
    reg2: jsonl(final('Listo')),
    validador: "console.log('definitions/STATUS.md: rechazado por tamaño');\n",
  });
  const { informe: texto } = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.match(texto, /Causa probable: STATUS\.md rechazado por el validador/);
});
