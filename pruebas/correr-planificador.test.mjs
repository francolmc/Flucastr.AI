// Pruebas de la corrida del planificador (F42, task-06) con modelo simulado. Sin modelo real ni red.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(dir, '..');
const script = path.join(raiz, 'pruebas/correr-planificador.sh');
const temporales = path.join(raiz, 'pruebas/.temporales');
fs.mkdirSync(temporales, { recursive: true });

function entorno(extra) {
  const env = { ...process.env, FLUCASTR_SIN_PRECONDICION: '1', ...extra };
  delete env.CLAUDE_CODE_SUBAGENT_MODEL;
  return env;
}

// Una tarea en borrador. «leer» es la lista de archivos de «- Leer:» (el tope la limita a cuatro).
const tarea = ({ nombre, leer }) => [
  `# ${nombre} — Ejemplo`,
  'repo: Flucastr.AI   depende_de: —   estado: borrador',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  '- Tocar: `archivo.mjs`',
  `- Leer: ${leer}`,
  '',
  '## Decisiones ya tomadas',
  '- Se usa `node:test`.',
  '',
  '## Decisiones abiertas',
  'Ninguna.',
  '',
  '## Alcance / Fuera de alcance',
  'Alcance: un archivo nuevo.',
  'Fuera de alcance: hacer commit.',
  '',
  '## Pasos',
  '1. Crear.',
  '2. Probar.',
  '',
  '## Criterios de aceptación',
  '1. Pasa la prueba.',
  '',
  '## Verificación',
  '```',
  'node --test archivo.test.mjs',
  '```',
  'Salida esperada: `ℹ fail 0`.',
  '',
  '## Evidencia',
  '',
  '## Notas',
  '',
].join('\n');

// Carpeta con las tareas que el modelo simulado copia a features/F01-demo del fixture.
function tareasSimuladas(tareas) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'tareas-'));
  for (const [nombre, texto] of Object.entries(tareas)) fs.writeFileSync(path.join(carpeta, nombre), texto);
  return carpeta;
}

// Modelo simulado: en el fixture (cwd) escribe las tareas dadas y devuelve un evento de resultado.
function falso(nombre) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'falso-'));
  const ruta = path.join(carpeta, nombre);
  fs.writeFileSync(ruta, `#!/usr/bin/env bash
mkdir -p "$PWD/features/F01-demo"
cp "$FLUCASTR_TEST_TAREAS"/*.md "$PWD/features/F01-demo/"
printf '%s\\n' '{"type":"result","result":"Feature descompuesta en tareas en borrador."}'
`, { mode: 0o755 });
  return ruta;
}

// Modelo simulado que responde un texto final y no crea tareas.
function falsoSinTareas(respuesta) {
  const carpeta = fs.mkdtempSync(path.join(temporales, 'falso-'));
  const ruta = path.join(carpeta, 'claude');
  fs.writeFileSync(ruta, `#!/usr/bin/env bash
printf '%s\\n' '{"type":"result","result":"${respuesta}"}'
`, { mode: 0o755 });
  return ruta;
}

function informeDe(resultados, sufijo) {
  const nombre = fs.readdirSync(resultados).find((n) => n.endsWith(sufijo));
  assert.ok(nombre, `no hay informe ${sufijo} en ${resultados}`);
  return fs.readFileSync(path.join(resultados, nombre), 'utf8');
}

test('(a) tareas dentro de los topes con modelo simulado dan Veredicto: OK', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const tareas = tareasSimuladas({
    'task-01-uno.md': tarea({ nombre: 'task-01', leer: '`src/a.js`, `README.md`' }),
    'task-02-dos.md': tarea({ nombre: 'task-02', leer: '`src/b.js`, `AGENTS.md`' }),
  });
  const r = spawnSync('bash', [script, 'claude-code'], {
    encoding: 'utf8',
    env: entorno({
      FLUCASTR_CLAUDE_BIN: falso('claude'),
      FLUCASTR_TEST_TAREAS: tareas,
      FLUCASTR_RESULTADOS: resultados,
    }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /informe: .*-planificador-claude-code-1\.md/);
  assert.match(r.stdout, /Veredicto: OK/);
  assert.match(informeDe(resultados, '-planificador-claude-code-1.md'), /Veredicto: OK/);
  // Control negativo: con tareas no se añade la respuesta del planificador.
  assert.doesNotMatch(informeDe(resultados, '-planificador-claude-code-1.md'), /Respuesta del planificador:/);
});

test('(b) una tarea con cinco archivos a leer (control negativo) da Veredicto: FALLA', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const tareas = tareasSimuladas({
    'task-01-rota.md': tarea({
      nombre: 'task-01',
      leer: '`src/a.js`, `src/b.js`, `src/c.js`, `src/d.js`, `src/e.js`',
    }),
  });
  const r = spawnSync('bash', [script, 'claude-code'], {
    encoding: 'utf8',
    env: entorno({
      FLUCASTR_CLAUDE_BIN: falso('claude'),
      FLUCASTR_TEST_TAREAS: tareas,
      FLUCASTR_RESULTADOS: resultados,
    }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Veredicto: FALLA/);
  assert.match(informeDe(resultados, '-planificador-claude-code-1.md'), /Veredicto: FALLA/);
});

test('(c) herramienta inválida sale 2 con uso y sin informe', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('bash', [script, 'otra'], {
    encoding: 'utf8',
    env: entorno({ FLUCASTR_RESULTADOS: resultados }),
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /uso: correr-planificador\.sh/);
  assert.equal(fs.readdirSync(resultados).length, 0);
});

test('(d) modelo que responde REFINAR sin crear tareas: el informe da FALLA y muestra la respuesta', () => {
  const resultados = fs.mkdtempSync(path.join(temporales, 'resultados-'));
  const r = spawnSync('bash', [script, 'claude-code'], {
    encoding: 'utf8',
    env: entorno({
      FLUCASTR_CLAUDE_BIN: falsoSinTareas('REFINAR: feature=F01; preguntas=1'),
      FLUCASTR_RESULTADOS: resultados,
    }),
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Veredicto: FALLA/);
  const informe = informeDe(resultados, '-planificador-claude-code-1.md');
  assert.match(informe, /Respuesta del planificador:/);
  assert.match(informe, /REFINAR: feature=F01/);
});

test('(e) el fixture trae Decisiones de alcance con src/cli.js en PROJECT.md', () => {
  const dir = fs.mkdtempSync(path.join(temporales, 'fixture-'));
  const destino = path.join(dir, 'fixture');
  const r = spawnSync('bash', [path.join(raiz, 'pruebas/fixtures/planificador.sh'), destino], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const proyecto = fs.readFileSync(path.join(destino, 'definitions/PROJECT.md'), 'utf8');
  assert.match(proyecto, /Decisiones de alcance/);
  assert.match(proyecto, /src\/cli\.js/);
});
