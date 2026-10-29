import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validarCoherencia } from './coherencia-features.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

const CABECERA = '| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |';
const SEPARADOR = '|---|---|---|---|---|---|---|---|';

const BACKLOG_VALIDO = [
  '# Backlog — Prueba',
  '',
  CABECERA,
  SEPARADOR,
  '| F01 | Base de verificación | habilitante | alto | bajo | Va primero porque habilita lo demás. | hecha | |',
  '| F02 | Planificar desde archivos | producto | alto | medio | Depende de la base. | pendiente | → |',
  '',
  'Estado del documento: aprobado',
  '',
].join('\n');

// Construye una tarea con cabecera (primera línea y segunda línea) y cuerpo mínimo.
function tarea(numero, slug, { dep = '—', estado = 'aprobada', primera = numero } = {}) {
  return {
    archivo: `task-${numero}-${slug}.md`,
    texto: [
      `# task-${primera} — ${slug}`,
      `repo: Flucastr.AI   depende_de: ${dep}   estado: ${estado}`,
      '',
      '## Evidencia',
      '',
    ].join('\n'),
  };
}

function muestraValida() {
  return {
    backlog: BACKLOG_VALIDO,
    features: [
      {
        carpeta: 'F01-base-verificacion',
        tareas: [tarea('01', 'limpieza', { estado: 'hecha' }), tarea('02', 'comando', { dep: 'task-01', estado: 'hecha' })],
      },
      {
        carpeta: 'F02-planificar-y-coordinar',
        tareas: [tarea('01', 'mover', { estado: 'en curso' }), tarea('02', 'coordinador', { dep: 'task-01' })],
      },
    ],
  };
}

test('muestra válida: no hay errores', () => {
  assert.deepEqual(validarCoherencia(muestraValida()), []);
});

test('regla 1: ID de carpeta ausente del backlog se rechaza', () => {
  const m = muestraValida();
  m.backlog = BACKLOG_VALIDO.replace('| F02 |', '| F09 |');
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('no tiene fila «F02»')));
});

test('regla 2: número de tarea repetido se rechaza', () => {
  const m = muestraValida();
  m.features[1].tareas = [tarea('01', 'mover', { estado: 'en curso' }), tarea('01', 'otra', { estado: 'aprobada' })];
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('task-01 aparece más de una vez')));
});

test('regla 2: hueco en la numeración se rechaza', () => {
  const m = muestraValida();
  m.features[1].tareas = [tarea('01', 'mover', { estado: 'en curso' }), tarea('03', 'otra', { estado: 'aprobada' })];
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('no es consecutiva') && e.includes('task-02')));
});

test('regla 2: primera línea con número distinto al del archivo se rechaza', () => {
  const m = muestraValida();
  m.features[1].tareas = [tarea('01', 'mover', { estado: 'en curso' }), tarea('02', 'coordinador', { dep: 'task-01', primera: '03' })];
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('primera línea') && e.includes('task-02-coordinador.md')));
});

test('regla 3: dependencia hacia una tarea de número mayor se rechaza', () => {
  const m = muestraValida();
  m.features[1].tareas = [tarea('01', 'mover', { dep: 'task-02', estado: 'en curso' }), tarea('02', 'coordinador')];
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('depende de task-02')));
});

test('regla 4: feature hecha con una tarea sin hacer se rechaza', () => {
  const m = muestraValida();
  m.features[0].tareas[1] = tarea('02', 'comando', { dep: 'task-01', estado: 'aprobada' });
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('está «hecha» en el backlog') && e.includes('«aprobada»')));
});

test('regla 5: tarea bloqueada en una feature hecha se rechaza', () => {
  const m = muestraValida();
  m.features[0].tareas[1] = tarea('02', 'comando', { dep: 'task-01', estado: 'bloqueada' });
  const errores = validarCoherencia(m);
  assert.ok(errores.some((e) => e.includes('«bloqueada», pero la feature F01 figura como «hecha»')));
});

test('definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes', () => {
  const carpetas = fs.readdirSync(`${RAIZ}features`).filter((d) => /^F\d{2}-/.test(d));
  assert.ok(carpetas.length >= 2, `se esperaban al menos dos carpetas de feature y hay ${carpetas.length}`);
  const features = carpetas.map((carpeta) => ({
    carpeta,
    tareas: fs
      .readdirSync(`${RAIZ}features/${carpeta}`)
      .filter((n) => n.startsWith('task-') && n.endsWith('.md'))
      .map((archivo) => ({ archivo, texto: fs.readFileSync(`${RAIZ}features/${carpeta}/${archivo}`, 'utf8') })),
  }));
  const backlog = fs.readFileSync(`${RAIZ}definitions/BACKLOG.md`, 'utf8');
  assert.deepEqual(validarCoherencia({ backlog, features }), []);
});
