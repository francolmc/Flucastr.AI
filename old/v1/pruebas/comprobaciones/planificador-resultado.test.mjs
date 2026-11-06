// Pruebas del comprobador de la corrida del planificador y de su fixture (F42, task-05). Sin modelo ni red.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analizarCorrida } from './planificador-resultado.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = path.join(RAIZ, 'pruebas/fixtures/planificador.sh');
const TEMPORALES = path.join(RAIZ, 'pruebas/.temporales');
const CARPETA = path.join('features', 'F01-demo');

fs.mkdirSync(TEMPORALES, { recursive: true });
const dirs = [];
after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });

// Una tarea válida y en borrador. «leer», «pasos», «tocar» y «sinAbiertas» se cambian para los controles negativos.
const tarea = ({ nombre, leer = '`src/a.js`, `README.md`', pasos = ['Crear.', 'Probar.'], sinLeer = false, tocar = '`archivo.mjs`', sinAbiertas = false }) => [
  `# ${nombre} — Ejemplo`,
  'repo: Flucastr.AI   depende_de: —   estado: borrador',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  `- Tocar: ${tocar}`,
  ...(sinLeer ? [] : [`- Leer: ${leer}`]),
  '',
  '## Decisiones ya tomadas',
  '- Se usa `node:test`.',
  '',
  ...(sinAbiertas ? [] : ['## Decisiones abiertas', 'Ninguna.', '']),
  '## Alcance / Fuera de alcance',
  'Alcance: un archivo nuevo.',
  'Fuera de alcance: hacer commit.',
  '',
  '## Pasos',
  ...pasos.map((p, i) => `${i + 1}. ${p}`),
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

// Fixture real del planificador en un directorio temporal, con las tareas dadas dentro de dir/fixture.
function corrida(tareas, { antes } = {}) {
  const dir = fs.mkdtempSync(path.join(TEMPORALES, 'planificador-resultado-'));
  dirs.push(dir);
  const r = spawnSync('bash', [FIXTURE, path.join(dir, 'fixture')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const carpeta = path.join(dir, 'fixture', CARPETA);
  fs.mkdirSync(carpeta, { recursive: true });
  for (const [nombre, texto] of Object.entries(tareas)) fs.writeFileSync(path.join(carpeta, nombre), texto);
  antes?.(path.join(dir, 'fixture'));
  return dir;
}

const dosValidas = () => ({
  'task-01-uno.md': tarea({ nombre: 'task-01' }),
  'task-02-dos.md': tarea({ nombre: 'task-02' }),
});

test('(a) dos tareas válidas dentro de los topes dan OK, con cifras por tarea', () => {
  const dir = corrida(dosValidas());
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, true, r.motivos.join('\n'));
  assert.match(r.informe, /Veredicto: OK/);
  assert.match(r.informe, /task-01-uno\.md: pasos 2; archivos a leer 2; bytes de contexto \d+/);
  assert.match(r.informe, /task-02-dos\.md: pasos 2; archivos a leer 2; bytes de contexto \d+/);
  assert.match(r.informe, /Formato ajeno a los topes[^\n]*\n\n?- ninguno/);
});

test('(b) control negativo: cinco archivos en «Leer» dan FALLA', () => {
  const dir = corrida({
    'task-01-uno.md': tarea({ nombre: 'task-01', leer: Array.from({ length: 5 }, () => '`README.md`').join(', ') }),
  });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, false);
  assert.match(r.informe, /Veredicto: FALLA/);
});

test('(c) control negativo: siete pasos dan FALLA', () => {
  const dir = corrida({
    'task-01-uno.md': tarea({ nombre: 'task-01', pasos: Array.from({ length: 7 }, (_, i) => `Paso ${i + 1}.`) }),
  });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, false);
  assert.match(r.informe, /Veredicto: FALLA/);
});

test('(d) control negativo: tarea sin «Leer» da FALLA', () => {
  const dir = corrida({ 'task-01-uno.md': tarea({ nombre: 'task-01', sinLeer: true }) });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, false);
  assert.match(r.informe, /Veredicto: FALLA/);
});

test('(e) control negativo: un archivo modificado fuera de features/ da FALLA', () => {
  const dir = corrida(dosValidas(), {
    antes: (fixture) => fs.appendFileSync(path.join(fixture, 'src', 'a.js'), 'export const extra = 1;\n'),
  });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, false);
  assert.match(r.informe, /Veredicto: FALLA/);
  assert.match(r.motivos.join('\n'), /src\/a\.js/);
});

test('(f) el fixture deja BACKLOG válido, en la rama feature/F01-demo y con bash -n sin salida', () => {
  const dir = corrida({});
  const fixture = path.join(dir, 'fixture');
  const rama = spawnSync('git', ['-C', fixture, 'branch', '--show-current'], { encoding: 'utf8' }).stdout.trim();
  assert.equal(rama, 'feature/F01-demo');
  const backlog = fs.readFileSync(path.join(fixture, 'definitions', 'BACKLOG.md'), 'utf8');
  assert.match(backlog, /\| F01 \| Medir el tiempo de cada comando en los cinco módulos de `src\/` y mostrarlo con `--tiempos` \|/);
  assert.match(backlog, /\| pendiente \| → \|/);
  const sintaxis = spawnSync('bash', ['-n', FIXTURE], { encoding: 'utf8' });
  assert.equal(sintaxis.status, 0);
  assert.equal(sintaxis.stdout + sintaxis.stderr, '');
});

test('(g) el fixture trae BACKLOG y PROJECT.md aprobados, WORKFLOW con «Decisiones abiertas» y AGENTS.md con validar-tarea.mjs', () => {
  const dir = corrida({});
  const fixture = path.join(dir, 'fixture');
  const leer = (ruta) => fs.readFileSync(path.join(fixture, ruta), 'utf8');
  const backlog = leer('definitions/BACKLOG.md');
  const proyecto = leer('definitions/PROJECT.md');
  assert.doesNotMatch(backlog, /borrador/);
  assert.match(backlog, /Estado del documento: aprobado/);
  assert.doesNotMatch(proyecto, /borrador/);
  assert.match(proyecto, /> Estado: \*\*aprobado\*\* \(2026-11-05\)\./);
  assert.match(leer('definitions/WORKFLOW.md'), /^## Decisiones abiertas\b/m);
  assert.match(leer('AGENTS.md'), /validar-tarea\.mjs/);
});

test('(h) tarea con topes en regla pero sin «Decisiones abiertas» y con «Tocar» sin comillas da OK y lista el formato aparte', () => {
  const dir = corrida({
    'task-01-uno.md': tarea({ nombre: 'task-01', sinAbiertas: true, tocar: 'archivo.mjs' }),
  });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, true, r.motivos.join('\n'));
  assert.match(r.informe, /Veredicto: OK/);
  assert.match(r.informe, /Formato ajeno a los topes/);
  assert.match(r.informe, /Falta la sección/);
});

test('(i) control negativo: «Tocar» con 4 rutas, una vez entre comillas y otra sin ellas, da FALLA las dos veces', () => {
  for (const tocar of ['`a.mjs`, `b.mjs`, `c.mjs`, `d.mjs`', 'a.mjs, b.mjs, c.mjs, d.mjs']) {
    const dir = corrida({ 'task-01-uno.md': tarea({ nombre: 'task-01', tocar }) });
    const r = analizarCorrida({ dir, herramienta: 'claude-code' });
    assert.equal(r.ok, false, `tocar: ${tocar}`);
    assert.match(r.informe, /Veredicto: FALLA/);
    assert.match(r.motivos.join('\n'), /«Tocar».*\b4\b/);
  }
});

test('(j) control negativo: 7 pasos y sin «Decisiones abiertas» da FALLA; el motivo de pasos va en «Motivos» y la falta de la sección solo bajo el formato', () => {
  const dir = corrida({
    'task-01-uno.md': tarea({ nombre: 'task-01', pasos: Array.from({ length: 7 }, (_, i) => `Paso ${i + 1}.`), sinAbiertas: true }),
  });
  const r = analizarCorrida({ dir, herramienta: 'claude-code' });
  assert.equal(r.ok, false);
  assert.match(r.informe, /Veredicto: FALLA/);
  const [motivos, formato] = r.informe.split('Motivos:')[1].split('Formato ajeno a los topes');
  assert.match(motivos, /«Pasos» debe tener/);
  assert.doesNotMatch(motivos, /Falta la sección/);
  assert.match(formato, /Falta la sección/);
});
