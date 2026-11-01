import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chequear, formatearInforme, aplicar, UMBRALES } from '../../scripts/archivar.mjs';

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

test('(f) STATUS.md de 1537 caracteres excede y de 1536 no', () => {
  const r1 = chequear(raizTemporal({ status: 'x'.repeat(UMBRALES.STATUS + 1) }));
  const st1 = r1.archivos.find((a) => a.ruta === 'definitions/STATUS.md');
  assert.equal(st1.caracteres, 1537);
  assert.equal(st1.excede, true);

  const r2 = chequear(raizTemporal({ status: 'x'.repeat(UMBRALES.STATUS) }));
  const st2 = r2.archivos.find((a) => a.ruta === 'definitions/STATUS.md');
  assert.equal(st2.caracteres, 1536);
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

test('(j) tarea de 6145 caracteres en features/Fxx-* se avisa; 6144 no; completed/ se omite', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] } });
  const tarea = path.join(raiz, 'features', 'F01-base', 'task-01-tarea.md');
  const base = fs.readFileSync(tarea, 'utf8');
  const con = (n) => base + 'x'.repeat(n - base.length);

  fs.writeFileSync(tarea, con(UMBRALES.TAREA + 1));
  const r1 = chequear(raiz);
  assert.deepEqual(r1.tareasGrandes, [
    { ruta: 'features/F01-base/task-01-tarea.md', caracteres: UMBRALES.TAREA + 1, umbral: UMBRALES.TAREA },
  ]);
  const linea1 = formatearInforme(r1).split('\n').find((l) => l.includes('task-01-tarea.md'));
  assert.ok(linea1.endsWith(' AVISO'), linea1);

  fs.writeFileSync(tarea, con(UMBRALES.TAREA));
  const r2 = chequear(raiz);
  assert.deepEqual(r2.tareasGrandes, []);
  assert.ok(formatearInforme(r2).includes('## Tareas sobre el umbral\n- ninguna'));

  const dirCompleted = path.join(raiz, 'features', 'completed', 'F09-archivada');
  fs.mkdirSync(dirCompleted, { recursive: true });
  fs.writeFileSync(path.join(dirCompleted, 'task-01-tarea.md'), 'x'.repeat(UMBRALES.TAREA + 1));
  const r3 = chequear(raiz);
  assert.deepEqual(r3.tareasGrandes, []);
});

test('(k) con STATUS.md de 1537 y una tarea de 6145, el CLI termina en 0 y avisa', () => {
  const raiz = raizTemporal({
    carpetas: { 'F01-base': ['hecha'] },
    status: 'x'.repeat(UMBRALES.STATUS + 1),
  });
  fs.writeFileSync(
    path.join(raiz, 'features', 'F01-base', 'task-01-tarea.md'),
    'x'.repeat(UMBRALES.TAREA + 1)
  );
  const res = spawnSync(process.execPath, [SCRIPT, '--raiz', raiz], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes('AVISO'));
  assert.ok(res.stdout.includes('## Tareas sobre el umbral'));
});

// ---- task-02: --aplicar ----

const cli = (raiz, args) => spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, ...args], { encoding: 'utf8' });

test('(a) --aplicar F01 mueve la candidata completa (tareas y refinado.md) a features/completed', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha', 'hecha'] } });
  fs.writeFileSync(path.join(raiz, 'features', 'F01-base', 'refinado.md'), 'refinado de prueba\n');
  const res = spawnSync(process.execPath, [SCRIPT, '--aplicar', 'F01', '--raiz', raiz], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes('movida: features/F01-base -> features/completed/F01-base'));
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F01-base')), false);
  const destino = path.join(raiz, 'features', 'completed', 'F01-base');
  assert.ok(fs.existsSync(path.join(destino, 'task-01-tarea.md')));
  assert.ok(fs.existsSync(path.join(destino, 'task-02-tarea.md')));
  assert.equal(fs.readFileSync(path.join(destino, 'refinado.md'), 'utf8'), 'refinado de prueba\n');
  assert.ok(res.stdout.includes('Cambios sin commit.'));
});

test('(b) --aplicar F02 mueve solo F02 y deja F01', () => {
  const raiz = raizTemporal({
    filas: [fila('F01', 'hecha'), fila('F02', 'hecha')],
    carpetas: { 'F01-base': ['hecha'], 'F02-otra': ['hecha'] },
  });
  const res = cli(raiz, ['--aplicar', 'F02']);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F01-base')), true);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F02-otra')), false);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed', 'F02-otra')), true);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed', 'F01-base')), false);
});

test('(c) feature hecha con una tarea en curso no se mueve y el CLI informa el motivo', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha', 'en curso'] } });
  const res = cli(raiz, ['--aplicar', 'F01']);
  assert.equal(res.status, 1);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F01-base')), true);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed')), false);
  assert.ok(res.stdout.includes('omitida: F01') && res.stdout.includes('task-02') && res.stdout.includes('en curso'));
});

test('(d) con el destino ya existente no se mueve ni se sobrescribe', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] }, completed: ['F01-base'] });
  const destino = path.join(raiz, 'features', 'completed', 'F01-base');
  fs.writeFileSync(path.join(destino, 'viejo.txt'), 'contenido previo\n');
  const antes = listarRecursivo(raiz);
  const res = cli(raiz, ['--aplicar', 'F01']);
  assert.equal(res.status, 1);
  assert.equal(fs.readFileSync(path.join(destino, 'viejo.txt'), 'utf8'), 'contenido previo\n');
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F01-base', 'task-01-tarea.md')), true);
  assert.deepEqual(listarRecursivo(raiz), antes);
});

test('(e) --aplicar F09 sin candidata termina en 1 y no mueve nada', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] } });
  const antes = listarRecursivo(raiz);
  const res = cli(raiz, ['--aplicar', 'F09']);
  assert.equal(res.status, 1);
  assert.ok(res.stdout.includes('omitida: F09: no existe la fila'));
  assert.deepEqual(listarRecursivo(raiz), antes);
});

test('(f) argumento desconocido termina en 1 con stderr y no mueve nada', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] } });
  const antes = listarRecursivo(raiz);
  const res = cli(raiz, ['--aplicar', '--borrar']);
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes('argumento desconocido'));
  assert.deepEqual(listarRecursivo(raiz), antes);
});

test('(g) tras mover, BACKLOG.md y definitions/STATUS.md tienen el mismo contenido', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] }, status: 'estado de prueba\n' });
  const backlogAntes = fs.readFileSync(path.join(raiz, 'definitions', 'BACKLOG.md'), 'utf8');
  const statusAntes = fs.readFileSync(path.join(raiz, 'definitions', 'STATUS.md'), 'utf8');
  const res = cli(raiz, ['--aplicar', 'F01']);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed', 'F01-base')), true);
  assert.equal(fs.readFileSync(path.join(raiz, 'definitions', 'BACKLOG.md'), 'utf8'), backlogAntes);
  assert.equal(fs.readFileSync(path.join(raiz, 'definitions', 'STATUS.md'), 'utf8'), statusAntes);
});

test('(h) el modo chequeo sigue sin mover nada', () => {
  const raiz = raizTemporal({ carpetas: { 'F01-base': ['hecha'] } });
  const antes = listarRecursivo(raiz);
  const res = cli(raiz, []);
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('Candidatas a archivar'));
  assert.deepEqual(listarRecursivo(raiz), antes);
});

test('--aplicar F01 sin candidata no mueve nada, no imprime «Nada que archivar.» y termina en 1', () => {
  const raiz = raizTemporal({ filas: [fila('F01', 'pendiente')], carpetas: { 'F01-base': ['en curso'] } });
  const antes = listarRecursivo(raiz);
  const res = cli(raiz, ['--aplicar', 'F01']);
  assert.equal(res.status, 1);
  assert.ok(res.stdout.includes('omitida: F01: no tiene fila hecha (está pendiente)'));
  assert.equal(res.stdout.includes('Nada que archivar.'), false);
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed')), false);
  assert.deepEqual(listarRecursivo(raiz), antes);
});

// ---- task-01: argumentos ambiguos o mal formados del CLI de --aplicar ----

const rechazos = [
  ['--aplicar sin Fxx', (r) => ['--raiz', r, '--aplicar'], '--aplicar exige un Fxx explícito'],
  ['varios Fxx', (r) => ['--raiz', r, '--aplicar', 'F01', 'F02'], '--aplicar acepta un solo Fxx'],
  ['--aplicar repetido', (r) => ['--raiz', r, '--aplicar', 'F01', '--aplicar'], "opción repetida '--aplicar'"],
  ['--raiz repetido', (r) => ['--raiz', r, '--raiz', r, '--aplicar', 'F01'], "opción repetida '--raiz'"],
  ['Fxx sin --aplicar', (r) => ['--raiz', r, 'F01'], 'los IDs solo van con --aplicar'],
  ['Fxx con un dígito', (r) => ['--raiz', r, '--aplicar', 'F1'], "argumento desconocido 'F1'"],
  ['Fxx en minúscula', (r) => ['--raiz', r, '--aplicar', 'f01'], "argumento desconocido 'f01'"],
];

for (const [nombre, armar, esperado] of rechazos) {
  test(`CLI rechaza ${nombre}: código 1, stderr con el mensaje y sin mover nada`, () => {
    const raiz = raizTemporal({
      filas: [fila('F01', 'hecha'), fila('F02', 'hecha')],
      carpetas: { 'F01-base': ['hecha'], 'F02-otra': ['hecha'] },
    });
    const antes = listarRecursivo(raiz);
    const res = spawnSync(process.execPath, [SCRIPT, ...armar(raiz)], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.ok(res.stderr.includes(esperado), res.stderr);
    assert.deepEqual(listarRecursivo(raiz), antes);
    assert.equal(fs.existsSync(path.join(raiz, 'features', 'completed')), false);
  });
}

test('aplicar() devuelve movidas y omitidas y solo mueve la candidata pedida', () => {
  const raiz = raizTemporal({
    filas: [fila('F01', 'hecha'), fila('F02', 'hecha')],
    carpetas: { 'F01-base': ['hecha'], 'F02-otra': ['en curso'] },
  });
  const r = aplicar(raiz, ['F01', 'F02']);
  assert.deepEqual(r.movidas, [{ id: 'F01', desde: 'features/F01-base', hasta: 'features/completed/F01-base' }]);
  assert.equal(r.omitidas.length, 1);
  assert.equal(r.omitidas[0].id, 'F02');
  assert.ok(r.omitidas[0].motivo.includes('en curso'));
  assert.equal(fs.existsSync(path.join(raiz, 'features', 'F02-otra')), true);
});
