import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extraer, registrar, validarEvento } from '../../scripts/registrar.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'scripts', 'registrar.mjs');
const BASE = Date.UTC(2026, 9, 1, 10, 0, 0) / 1000;
const IDENTIDAD = {
  GIT_AUTHOR_NAME: 'Autor de Prueba',
  GIT_AUTHOR_EMAIL: 'prueba@ejemplo.test',
  GIT_COMMITTER_NAME: 'Autor de Prueba',
  GIT_COMMITTER_EMAIL: 'prueba@ejemplo.test',
};
const RUTA_TAREA = 'features/F01-prueba/task-01-tarea.md';
const temporales = [];

after(() => {
  for (const d of temporales) fs.rmSync(d, { recursive: true, force: true });
});

function git(raiz, args, extra = {}) {
  const r = spawnSync('git', args, {
    cwd: raiz,
    encoding: 'utf8',
    env: { ...process.env, ...IDENTIDAD, ...extra },
  });
  assert.equal(r.status, 0, `git ${args[0]}: ${r.stderr}`);
  return r.stdout;
}

function nuevoRepo() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'registrar-test-'));
  temporales.push(raiz);
  git(raiz, ['init', '-q', '-b', 'main']);
  return raiz;
}

function escribir(raiz, rel, texto) {
  const abs = path.join(raiz, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, texto);
}

// Commit con fecha fija (orden creciente) e identidad opcional. Devuelve el sha corto (7).
function commit(raiz, mensaje, orden, identidad = {}) {
  const fecha = `${BASE + orden * 3600} +0000`;
  git(raiz, ['add', '-A']);
  git(
    raiz,
    ['-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', mensaje],
    { GIT_AUTHOR_DATE: fecha, GIT_COMMITTER_DATE: fecha, ...identidad },
  );
  return git(raiz, ['rev-parse', 'HEAD']).trim().slice(0, 7);
}

const tareaMd = (estado, descripcion = 'Descripción de prueba.', notas = '') =>
  `# task-01 — Tarea de prueba\n\nrepo: Flucastr.AI   depende_de: —   estado: ${estado}\n\n## Descripción\n${descripcion}\n\n## Evidencia\n\n## Notas\n${notas}`;

const backlogCon = (estado) =>
  [
    '# Backlog — Prueba',
    '',
    '| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |',
    '|---|---|---|---|---|---|---|---|',
    `| F01 | Feature F01 | producto | medio | bajo | Motivo. | ${estado} | |`,
    '',
  ].join('\n');

const statusCon = (texto) => `# Estado del flujo\n\n## Escalación\n${texto}\n## Otra sección\n\nnada\n`;

const correr = (raiz, args = []) => spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, ...args], { encoding: 'utf8' });

function listar(dir, base, salida = []) {
  for (const n of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, n);
    const rel = path.relative(base, abs);
    if (rel === '.git' || rel === 'registro') continue;
    const st = fs.statSync(abs);
    salida.push(`${rel} ${st.isDirectory() ? 'dir' : st.size}`);
    if (st.isDirectory()) listar(abs, base, salida);
  }
  return salida;
}

test('(1) estados → tarea_estado y puerta; un commit que solo cambia la Descripción no genera evento', () => {
  const raiz = nuevoRepo();
  escribir(raiz, RUTA_TAREA, tareaMd('borrador'));
  commit(raiz, 'c1', 0);
  escribir(raiz, RUTA_TAREA, tareaMd('aprobada'));
  commit(raiz, 'c2', 1);
  escribir(raiz, RUTA_TAREA, tareaMd('lista para revisión'));
  commit(raiz, 'c3', 2);
  escribir(raiz, RUTA_TAREA, tareaMd('lista para revisión', 'Descripción cambiada, sin tocar el estado.'));
  const shaControl = commit(raiz, 'c4', 3);
  escribir(raiz, RUTA_TAREA, tareaMd('aprobada'));
  commit(raiz, 'c5 devolución', 4);
  escribir(raiz, RUTA_TAREA, tareaMd('lista para revisión'));
  commit(raiz, 'c6', 5);
  escribir(raiz, RUTA_TAREA, tareaMd('hecha'));
  commit(raiz, 'c7', 6);

  const { eventos, descartados } = extraer(raiz);
  assert.equal(descartados, 0);

  const transiciones = eventos.filter((e) => e.evento === 'tarea_estado').map((e) => [e.de, e.a]);
  assert.deepEqual(transiciones, [
    [null, 'borrador'],
    ['borrador', 'aprobada'],
    ['aprobada', 'lista para revisión'],
    ['lista para revisión', 'aprobada'],
    ['aprobada', 'lista para revisión'],
    ['lista para revisión', 'hecha'],
  ]);

  const puertas = eventos.filter((e) => e.evento === 'puerta').map((e) => [e.n, e.resultado]);
  assert.deepEqual(puertas, [
    [3, 'aprobada'],
    [4, 'devuelta'],
    [4, 'aprobada'],
  ]);

  // Control negativo: el commit que solo cambia la Descripción no produce ningún evento.
  assert.equal(eventos.some((e) => e.sha === shaControl), false);
  for (const e of eventos) assert.deepEqual(validarEvento(e), []);
});

test('(2) idempotencia: dos corridas idénticas; un commit nuevo anexa solo lo suyo; --reconstruir reproduce', () => {
  const raiz = nuevoRepo();
  const archivo = path.join(raiz, 'registro', 'eventos.jsonl');
  escribir(raiz, RUTA_TAREA, tareaMd('borrador'));
  commit(raiz, 'c1', 0);
  escribir(raiz, RUTA_TAREA, tareaMd('aprobada'));
  commit(raiz, 'c2', 1);

  const primera = correr(raiz);
  assert.equal(primera.status, 0, primera.stderr);
  assert.equal(primera.stdout, 'registrar: 3 eventos nuevos; 3 en total; 0 descartados; 0 líneas Registro: no válidas\n');
  const bytes1 = fs.readFileSync(archivo);

  const segunda = correr(raiz);
  assert.equal(segunda.stdout, 'registrar: 0 eventos nuevos; 3 en total; 0 descartados; 0 líneas Registro: no válidas\n');
  assert.ok(fs.readFileSync(archivo).equals(bytes1), 'la segunda corrida debe dejar el archivo idéntico');

  escribir(raiz, RUTA_TAREA, tareaMd('lista para revisión'));
  const sha3 = commit(raiz, 'c3', 2);
  const tercera = correr(raiz);
  assert.equal(tercera.stdout, 'registrar: 1 eventos nuevos; 4 en total; 0 descartados; 0 líneas Registro: no válidas\n');
  const bytes3 = fs.readFileSync(archivo);
  assert.ok(bytes3.subarray(0, bytes1.length).equals(bytes1), 'lo ya escrito no cambia');
  const anadidas = bytes3.subarray(bytes1.length).toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  assert.equal(anadidas.length, 1);
  assert.ok(anadidas.every((e) => e.sha === sha3), 'solo se añaden eventos del commit nuevo');

  const reconstruida = correr(raiz, ['--reconstruir']);
  assert.equal(reconstruida.status, 0, reconstruida.stderr);
  assert.equal(reconstruida.stdout, 'registrar: 0 eventos nuevos; 4 en total; 0 descartados; 0 líneas Registro: no válidas\n');
  assert.ok(fs.readFileSync(archivo).equals(bytes3), '--reconstruir reproduce el mismo contenido');
});

test('(3) privacidad: ningún dato canario sale; el validador rechaza campos y valores fuera de esquema', () => {
  const raiz = nuevoRepo();
  const identidad = {
    GIT_AUTHOR_NAME: 'Autor Canario Zq',
    GIT_AUTHOR_EMAIL: 'canario-correo-zq@ejemplo.test',
    GIT_COMMITTER_NAME: 'Autor Canario Zq',
    GIT_COMMITTER_EMAIL: 'canario-correo-zq@ejemplo.test',
  };
  const canarios = ['Autor Canario Zq', 'canario-correo-zq@ejemplo.test', 'Cliente Canario Zk', 'sk-CANARIO-LLAVE-7f3a9', 'CMSG-9q2'];
  const cuerpo = (estado) =>
    `# task-01 — Proyecto Cliente Canario Zk\n\nrepo: Flucastr.AI   depende_de: —   estado: ${estado}\n\n## Evidencia\nLlave de prueba: sk-CANARIO-LLAVE-7f3a9\n\n## Notas\nSin novedades, sk-CANARIO-LLAVE-7f3a9\n`;
  escribir(raiz, RUTA_TAREA, cuerpo('borrador'));
  commit(raiz, 'mensaje CMSG-9q2', 0, identidad);
  escribir(raiz, RUTA_TAREA, cuerpo('aprobada'));
  commit(raiz, 'segundo CMSG-9q2', 1, identidad);

  const r = registrar({ raiz });
  assert.equal(r.nuevos, 3);
  const contenido = fs.readFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), 'utf8');
  for (const canario of canarios) {
    assert.equal(contenido.includes(canario), false, `aparece el canario ${canario}`);
  }
  assert.equal(contenido.includes(raiz), false, 'aparece una ruta absoluta');

  // Control negativo: el validador rechaza a mano un campo de autor y una fecha en texto.
  const ev = extraer(raiz).eventos[0];
  assert.deepEqual(validarEvento(ev), []);
  assert.ok(validarEvento({ ...ev, autor: 'Autor Canario Zq' }).some((e) => e.includes('autor')));
  assert.ok(validarEvento({ ...ev, t: 'ayer' }).length > 0);
});

test('(4) aislamiento: registro/ queda ignorado, .env no se abre y nada fuera de registro/ cambia', () => {
  const raiz = nuevoRepo();
  escribir(raiz, RUTA_TAREA, tareaMd('borrador'));
  commit(raiz, 'c1', 0);

  const env = path.join(raiz, '.env');
  fs.writeFileSync(env, 'CANARIO_ENV=valor-canario-env\n');
  if (process.getuid?.() !== 0) fs.chmodSync(env, 0o000);
  try {
    const antes = listar(raiz, raiz);
    const res = correr(raiz);
    assert.equal(res.status, 0, res.stderr);
    assert.equal(fs.readFileSync(path.join(raiz, 'registro', '.gitignore'), 'utf8'), '*\n');
    assert.equal(git(raiz, ['status', '--porcelain']).includes('registro'), false);
    assert.equal(fs.readFileSync(SCRIPT, 'utf8').includes('.env'), false);
    assert.deepEqual(listar(raiz, raiz), antes, 'nada fuera de registro/ y .git/ cambia');
  } finally {
    if (process.getuid?.() !== 0) fs.chmodSync(env, 0o600);
  }
});

test('(5) renombre con git mv a features/completed/: historial sin duplicar y un feature_archivada', () => {
  const raiz = nuevoRepo();
  escribir(raiz, RUTA_TAREA, tareaMd('borrador'));
  commit(raiz, 'c1', 0);
  escribir(raiz, RUTA_TAREA, tareaMd('aprobada'));
  commit(raiz, 'c2', 1);
  escribir(raiz, RUTA_TAREA, tareaMd('hecha'));
  commit(raiz, 'c3', 2);

  const antes = extraer(raiz).eventos;
  assert.equal(antes.filter((e) => e.evento === 'feature_archivada').length, 0, 'control: sin archivar no hay evento');
  const tareasAntes = antes.filter((e) => e.evento === 'tarea_estado');

  fs.mkdirSync(path.join(raiz, 'features', 'completed'), { recursive: true });
  git(raiz, ['mv', 'features/F01-prueba', 'features/completed/F01-prueba']);
  const shaMover = commit(raiz, 'c4 archivada', 3);

  const despues = extraer(raiz).eventos;
  assert.deepEqual(
    despues.filter((e) => e.evento === 'feature_archivada').map((e) => [e.feature, e.sha]),
    [['F01', shaMover]],
  );
  const tareasDespues = despues.filter((e) => e.evento === 'tarea_estado');
  assert.equal(tareasDespues.length, tareasAntes.length, 'el renombre no duplica transiciones');
  assert.deepEqual(tareasDespues.map((e) => e.id).sort(), tareasAntes.map((e) => e.id).sort());
  assert.ok(tareasDespues.every((e) => e.feature === 'F01' && e.tarea === '01'));
});

test('(6) feature_estado desde BACKLOG y escalacion al pasar de vacía a con texto; control: de con texto a vacía no genera evento', () => {
  const raiz = nuevoRepo();
  escribir(raiz, 'definitions/BACKLOG.md', backlogCon('pendiente'));
  escribir(raiz, 'definitions/STATUS.md', statusCon(''));
  commit(raiz, 'c1', 0);
  escribir(raiz, 'definitions/BACKLOG.md', backlogCon('en curso'));
  escribir(raiz, 'definitions/STATUS.md', statusCon('Texto de escalación canario Qk.\n'));
  const shaEscalacion = commit(raiz, 'c2', 1);
  escribir(raiz, 'definitions/BACKLOG.md', backlogCon('hecha'));
  escribir(raiz, 'definitions/STATUS.md', statusCon(''));
  const shaVacia = commit(raiz, 'c3', 2);

  const { eventos, descartados } = extraer(raiz);
  assert.equal(descartados, 0);
  assert.deepEqual(
    eventos.filter((e) => e.evento === 'feature_estado').map((e) => [e.de, e.a]),
    [
      [null, 'pendiente'],
      ['pendiente', 'en curso'],
      ['en curso', 'hecha'],
    ],
  );
  const escalaciones = eventos.filter((e) => e.evento === 'escalacion');
  assert.deepEqual(escalaciones.map((e) => e.sha), [shaEscalacion]);
  // Control negativo: el commit que vacía la sección (c3) no genera escalación.
  assert.equal(escalaciones.some((e) => e.sha === shaVacia), false);
  assert.equal(JSON.stringify(eventos).includes('canario Qk'), false, 'el texto de la escalación no se guarda');
});

// Línea `Registro:` (definitions/REGISTRO.md §3) y modelo configurado desde un modelos.json temporal.
const MODELOS_PRUEBA = {
  version: 1,
  niveles: ['alto', 'medio', 'bajo'],
  nivel_por_defecto: 'medio',
  respaldo: { alto: ['medio', 'bajo'], medio: ['alto', 'bajo'], bajo: ['medio', 'alto'] },
  perfiles: {
    'claude-code': {
      herramienta: 'claude-code',
      proveedor: 'prueba',
      modelos: { alto: 'modelo-prueba-alto', medio: 'modelo-prueba-medio', bajo: 'modelo-prueba-bajo' },
    },
  },
  perfil_por_defecto: { 'claude-code': 'claude-code' },
  agentes: { constructor: { nivel: 'bajo' } },
};

// Ejecuta fn con FLUCASTR_MODELOS apuntando a un modelos.json temporal, y restaura la variable después.
function conModelosPrueba(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'registrar-modelos-'));
  temporales.push(dir);
  const archivo = path.join(dir, 'modelos.json');
  fs.writeFileSync(archivo, JSON.stringify(MODELOS_PRUEBA));
  const previo = process.env.FLUCASTR_MODELOS;
  process.env.FLUCASTR_MODELOS = archivo;
  try {
    return fn();
  } finally {
    if (previo === undefined) delete process.env.FLUCASTR_MODELOS;
    else process.env.FLUCASTR_MODELOS = previo;
  }
}

const leerEventos = (raiz) =>
  fs.readFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const tareaConRegistros = (notas, evidencia = '') =>
  `# task-01 — Tarea de prueba\n\nrepo: Flucastr.AI   depende_de: —   estado: lista para revisión\n\n## Descripción\nDescripción de prueba.\n\n## Evidencia\n${evidencia}\n## Notas\n${notas}`;

const LINEA_1 = 'Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna';
const LINEA_2 = 'Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=parcial; huecos=0; resultado=bloqueada; causa=verificacion_x2';

test('(7) Registro: en Notas da un ejecucion por n con su modelo configurado; fuera de Notas o con un valor fuera de lista no genera evento', () => {
  conModelosPrueba(() => {
    const raiz = nuevoRepo();
    const notas = `${LINEA_1}\n${LINEA_2}\nRegistro: n=3; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=otro; causa=ninguna\n`;
    const evidencia = 'Registro: n=4; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna\n';
    escribir(raiz, RUTA_TAREA, tareaConRegistros(notas, evidencia));
    commit(raiz, 'c1', 0);

    const res = correr(raiz);
    assert.equal(res.status, 0, res.stderr);
    // Tres eventos: el tarea_estado del commit (primer estado de la tarea) y dos ejecucion.
    assert.equal(res.stdout, 'registrar: 3 eventos nuevos; 3 en total; 0 descartados; 1 líneas Registro: no válidas\n');

    // El orden de eventos.jsonl es por t e id (el id es un hash): se ordena por n antes de comparar.
    const ejecuciones = leerEventos(raiz).filter((e) => e.evento === 'ejecucion').sort((a, b) => a.n - b.n);
    assert.deepEqual(
      ejecuciones.map((e) => [e.n, e.herramienta, e.modo, e.intentos, e.verificacion, e.huecos, e.resultado, e.causa, e.modelo]),
      [
        [1, 'claude-code', 'normal', 2, 'pasa', 1, 'lista', 'ninguna', 'modelo-prueba-bajo'],
        [2, 'claude-code', 'yolo', 1, 'parcial', 0, 'bloqueada', 'verificacion_x2', 'modelo-prueba-bajo'],
      ],
    );
    for (const e of ejecuciones) assert.deepEqual(validarEvento(e), []);
    assert.equal(ejecuciones.some((e) => e.n === 4), false, 'una línea fuera de Notas no genera evento');
  });
});

test('(8) repetir la corrida no duplica; una línea nueva añade solo su n; --reconstruir reproduce el mismo contenido', () => {
  conModelosPrueba(() => {
    const raiz = nuevoRepo();
    const archivo = path.join(raiz, 'registro', 'eventos.jsonl');
    escribir(raiz, RUTA_TAREA, tareaConRegistros(`${LINEA_1}\n`));
    commit(raiz, 'c1', 0);
    assert.equal(correr(raiz).status, 0);
    const bytes1 = fs.readFileSync(archivo);
    assert.equal(leerEventos(raiz).filter((e) => e.evento === 'ejecucion').length, 1);

    const segunda = correr(raiz);
    assert.equal(segunda.stdout, 'registrar: 0 eventos nuevos; 2 en total; 0 descartados; 0 líneas Registro: no válidas\n');
    assert.ok(fs.readFileSync(archivo).equals(bytes1), 'la segunda corrida deja el archivo idéntico');

    // Control: n=1 repetido en un commit posterior no genera evento nuevo; n=2 sí.
    escribir(raiz, RUTA_TAREA, tareaConRegistros(`${LINEA_1}\n${LINEA_2}\n`));
    const sha2 = commit(raiz, 'c2', 1);
    const tercera = correr(raiz);
    assert.equal(tercera.stdout, 'registrar: 1 eventos nuevos; 3 en total; 0 descartados; 0 líneas Registro: no válidas\n');
    const nuevas = leerEventos(raiz).filter((e) => e.evento === 'ejecucion' && e.sha === sha2);
    assert.deepEqual(nuevas.map((e) => e.n), [2]);
    const bytes3 = fs.readFileSync(archivo);

    const reconstruida = correr(raiz, ['--reconstruir']);
    assert.equal(reconstruida.status, 0, reconstruida.stderr);
    assert.ok(fs.readFileSync(archivo).equals(bytes3), '--reconstruir reproduce el mismo contenido');
  });
});

test('(9) canarios en el resto de Notas y una clave extra (titulo=) no llegan a eventos.jsonl', () => {
  conModelosPrueba(() => {
    const raiz = nuevoRepo();
    const extra = 'Registro: n=2; herramienta=claude-code; modo=normal; intentos=1; titulo=Cliente Canario Wx; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';
    const notas = `Canario de notas Vb.\n${LINEA_1}\n${extra}\nOtra nota con sk-CANARIO-NOTA-3d.\n`;
    escribir(raiz, RUTA_TAREA, tareaConRegistros(notas));
    commit(raiz, 'c1', 0);

    const res = correr(raiz);
    assert.equal(res.status, 0, res.stderr);
    assert.equal(res.stdout, 'registrar: 2 eventos nuevos; 2 en total; 0 descartados; 1 líneas Registro: no válidas\n');
    const contenido = fs.readFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), 'utf8');
    for (const canario of ['Canario de notas Vb', 'Cliente Canario Wx', 'sk-CANARIO-NOTA-3d', 'titulo']) {
      assert.equal(contenido.includes(canario), false, `aparece ${canario}`);
    }
    assert.equal(leerEventos(raiz).filter((e) => e.evento === 'ejecucion').length, 1);
  });
});
