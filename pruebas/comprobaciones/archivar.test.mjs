import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chequear, formatearInforme, UMBRALES } from '../../scripts/archivar.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'scripts', 'archivar.mjs');

const CABECERA = '| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |';
const SEPARADOR = '|---|---|---|---|---|---|---|---|';

const fila = (id, estado, porQue = 'Motivo.') =>
  `| ${id} | Feature ${id} | producto | medio | bajo | ${porQue} | ${estado} | |`;

function backlogCon(filas) {
  return ['# Backlog — Prueba', '', CABECERA, SEPARADOR, ...filas, '', 'Estado del documento: borrador', ''].join('\n');
}

// Crea una raíz temporal. `carpetas` = { 'F01-nombre': ['hecha', 'en curso'] } (estado de cada tarea).
// `completed` = nombres de carpetas dentro de features/completed/.
function raizTemporal({ filas = [fila('F01', 'hecha')], carpetas = {}, completed = [], status = 'x'.repeat(100) } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'archivar-test-'));
  fs.mkdirSync(path.join(raiz, 'definitions'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'AGENTS.md'), '# Agentes\n');
  fs.writeFileSync(path.join(raiz, 'definitions', 'STATUS.md'), status);
  fs.writeFileSync(path.join(raiz, 'definitions', 'BACKLOG.md'), backlogCon(filas));
  for (const [carpeta, estados] of Object.entries(carpetas)) {
    const dir = path.join(raiz, 'features', carpeta);
    fs.mkdirSync(dir, { recursive: true });
    estados.forEach((estado, i) => {
      const n = String(i + 1).padStart(2, '0');
      const texto = `# task-${n} — tarea\n\nrepo: Flucastr.AI   depende_de: —   estado: ${estado}\n`;
      fs.writeFileSync(path.join(dir, `task-${n}-tarea.md`), texto);
    });
  }
  for (const nombre of completed) {
    fs.mkdirSync(path.join(raiz, 'features', 'completed', nombre), { recursive: true });
  }
  return raiz;
}

function listarRecursivo(dir, base = dir, salida = []) {
  for (const n of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, n);
    const st = fs.statSync(abs);
    salida.push(`${path.relative(base, abs)} ${st.isDirectory() ? 'dir' : st.size}`);
    if (st.isDirectory()) listarRecursivo(abs, base, salida);
  }
  return salida;
}

test('(a) feature hecha con todas sus tareas hechas es candidata', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha', 'hecha'] } });
  const r = chequear(raiz);
  assert.deepEqual(r.candidatas, ['F01']);
  assert.deepEqual(r.inconsistentes, []);
});

test('(b) fila hecha con una tarea en curso es inconsistente y nombra la tarea', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha', 'hecha', 'en curso'] } });
  const r = chequear(raiz);
  assert.deepEqual(r.candidatas, []);
  assert.ok(r.inconsistentes.some((i) => i.id === 'F01' && i.motivo.includes('task-03') && i.motivo.includes('en curso')));
});

test('(c) fila hecha sin carpeta es inconsistente', () => {
  const raiz = raizTemporal({});
  const r = chequear(raiz);
  assert.ok(r.inconsistentes.some((i) => i.id === 'F01' && i.motivo.includes('sin carpeta')));
  assert.deepEqual(r.candidatas, []);
});

test('(d) carpeta con todas las tareas hechas y fila pendiente aparece en carpetasSinFilaHecha', () => {
  const raiz = raizTemporal({
    filas: [fila('F01', 'pendiente')],
    carpetas: { 'F01-base': ['hecha'] },
  });
  const r = chequear(raiz);
  assert.deepEqual(r.carpetasSinFilaHecha, ['F01-base']);
  assert.deepEqual(r.candidatas, []);
});

test('(e) destino features/completed ya existente es inconsistente', () => {
  const raiz = raizTemporal({
    carpetas: { 'F01-base': ['hecha'] },
    completed: ['F01-base'],
  });
  const r = chequear(raiz);
  assert.deepEqual(r.candidatas, []);
  assert.ok(r.inconsistentes.some((i) => i.id === 'F01' && i.motivo.includes('ya existe')));
});

test('(f) STATUS.md de 3073 caracteres excede y de 3072 no', () => {
  const r1 = chequear(raizTemporal({ status: 'x'.repeat(UMBRALES.STATUS + 1) }));
  const st1 = r1.archivos.find((a) => a.ruta === 'definitions/STATUS.md');
  assert.equal(st1.caracteres, 3073);
  assert.equal(st1.excede, true);

  const r2 = chequear(raizTemporal({ status: 'x'.repeat(UMBRALES.STATUS) }));
  const st2 = r2.archivos.find((a) => a.ruta === 'definitions/STATUS.md');
  assert.equal(st2.caracteres, 3072);
  assert.equal(st2.excede, false);
});

test('(g) fila hecha con celda de 301 caracteres excede y de 300 no', () => {
  const r1 = chequear(raizTemporal({ filas: [fila('F01', 'hecha', 'x'.repeat(301))] }));
  assert.deepEqual(r1.filasHecha, [{ id: 'F01', largo: 301, excede: true }]);

  const r2 = chequear(raizTemporal({ filas: [fila('F01', 'hecha', 'x'.repeat(300))] }));
  assert.deepEqual(r2.filasHecha, [{ id: 'F01', largo: 300, excede: false }]);
});

test('(h) archivo inexistente se informa como no existe y no lanza', () => {
  const raiz = raizTemporal();
  fs.rmSync(path.join(raiz, 'AGENTS.md'));
  const r = chequear(raiz);
  const ag = r.archivos.find((a) => a.ruta === 'AGENTS.md');
  assert.equal(ag.existe, false);
  assert.equal(ag.excede, false);
  const texto = formatearInforme(r);
  assert.ok(texto.includes('AGENTS.md: no existe'));
});

test('(i) el CLI con --raiz termina en 0, imprime el informe y no cambia el directorio', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] } });
  const antes = listarRecursivo(raiz);
  const res = spawnSync(process.execPath, [SCRIPT, '--raiz', raiz], { encoding: 'utf8' });
  const despues = listarRecursivo(raiz);
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('Candidatas a archivar'));
  assert.deepEqual(despues, antes);
});

test('CLI sobre el repo real termina en 0 e imprime el tamaño de lo que se lee', () => {
  const res = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', cwd: RAIZ });
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('Tamaño de lo que se lee'));
});
