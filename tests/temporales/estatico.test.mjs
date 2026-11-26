// Prueba estática de temporales (A6 de changes/higiene-verify/tramo-4.md). Heurística textual, no un parser:
// - Shell (.sh, y `verify`): `X=$(mktemp…)` exige una línea `trap … EXIT` con `$X`, salvo bajo tools/verify/
//   (lo cubre tools/verify/envoltorio.sh). Cualquier otro `mktemp` fuera de comentario sin variable falla.
//   `-p`, `--tmpdir` o plantilla que empiece por `/` falla siempre; también `mkdir … /tmp/` literal.
// - JS (.mjs, .js, .cjs): `X = mkdtemp(Sync)(` o `X = join(tmpdir(), …)` exige `rm(Sync)(X` o `L.push(X)` con
//   un bucle `of L` que borre. Con `mkdtemp`, además `finally` o `after(` en el archivo. Plantilla `/…` o
//   `mkdirSync('/tmp/…')` falla.
// - Excepciones `ruta:variable` con motivo, declaradas abajo. Una excepción que no coincide con ningún hallazgo
//   es obsoleta y falla. Un escaneo sin creaciones falla (el escáner no ve nada).
// La propia prueba queda fuera del escaneo. Cada regla se prueba con fixtures malos y buenos.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROPIA = 'tests/temporales/estatico.test.mjs';
const RAICES = ['verify', 'install.sh', 'install-remote.sh', 'uninstall.sh', 'tools', 'scripts', 'tests', 'adapters', 'core'];
const OMITIDOS = new Set(['node_modules', '.git', 'pruebas', '.temporales']);

// Excepciones declaradas: cada una es un sitio de creación que la regla no ve, con su motivo.
export const EXCEPCIONES = [
  { clave: 'install.sh:NUEVO', motivo: 'trap de función guardar_manifiesto' },
  { clave: 'install-remote.sh:TMP', motivo: 'trap de función limpiar' },
  { clave: 'tools/install/migration/names.sh:tmp', motivo: 'rm tras uso' },
  { clave: 'adapters/claude-code/install-compaction.sh:tmp', motivo: 'mv a destino' },
  { clave: 'tools/run/process.mjs:dir', motivo: 'borra en finalizar' },
];

const esShell = (ruta) => ruta === 'verify' || /\.sh$/.test(ruta);
const esJs = (ruta) => /\.(mjs|js|cjs)$/.test(ruta);
const esComentario = (linea) => /^\s*(#|\/\/|\*)/.test(linea);

export function analizarShell(ruta, texto) {
  const hallazgos = [];
  const creaciones = [];
  const lineas = texto.split('\n');
  const traps = lineas.filter((l) => /^\s*trap\b.*\bEXIT\b/.test(l));
  const bajoVerify = ruta === 'verify' || ruta.startsWith('tools/verify/');
  lineas.forEach((linea, i) => {
    if (esComentario(linea)) return;
    const n = i + 1;
    if (/\bmkdir\b[^\n]*\s["']?\/tmp\//.test(linea)) hallazgos.push({ ruta, linea: n, variable: null, motivo: 'ruta /tmp/ literal' });
    if (!/\bmktemp\b/.test(linea)) return;
    if (/\bmktemp\b[^\n]*(?:\s-p\b|--tmpdir\b|\s["']?\/)/.test(linea)) {
      hallazgos.push({ ruta, linea: n, variable: null, motivo: 'mktemp con -p, --tmpdir o plantilla /' });
    }
    const m = /^\s*([A-Za-z_]\w*)=["']?\$\(\s*mktemp\b/.exec(linea);
    if (!m) {
      hallazgos.push({ ruta, linea: n, variable: null, motivo: 'mktemp sin variable' });
      return;
    }
    const x = m[1];
    creaciones.push({ ruta, linea: n, variable: x });
    const limpia = traps.some((t) => new RegExp(`\\$\\{?${x}\\b`).test(t));
    if (!bajoVerify && !limpia) hallazgos.push({ ruta, linea: n, variable: x, motivo: `sin trap EXIT con $${x}` });
  });
  return { hallazgos, creaciones };
}

export function analizarJs(ruta, texto) {
  const hallazgos = [];
  const creaciones = [];
  const lineas = texto.split('\n');
  const tieneFinally = /\bfinally\b|\bafter\s*\(/.test(texto);
  const hayRm = /\brm(?:Sync)?\s*\(/.test(texto);
  lineas.forEach((linea, i) => {
    if (esComentario(linea)) return;
    const n = i + 1;
    if (/\bmkdirSync\s*\(\s*['"`]\/tmp\//.test(linea)) hallazgos.push({ ruta, linea: n, variable: null, motivo: 'ruta /tmp/ literal' });
    if (/\bmkdtemp(?:Sync)?\s*\(\s*(?:[\w.]+\.)?(?:join\s*\(\s*)?['"`]\//.test(linea)) {
      hallazgos.push({ ruta, linea: n, variable: null, motivo: 'mkdtemp con plantilla /' });
    }
    const mk = /\b([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:[\w.]+\.)?mkdtemp(?:Sync)?\s*\(/.exec(linea);
    const tmp = /\b([A-Za-z_$][\w$]*)\s*=\s*(?:[\w.]+\.)?join\s*\(\s*(?:[\w.]+\.)?tmpdir\s*\(/.exec(linea);
    if (!mk && !tmp) {
      if (/\bmkdtemp(?:Sync)?\s*\(/.test(linea)) hallazgos.push({ ruta, linea: n, variable: null, motivo: 'mkdtemp sin variable' });
      return;
    }
    const x = (mk ?? tmp)[1];
    const esMk = Boolean(mk);
    creaciones.push({ ruta, linea: n, variable: x });
    const borrado = new RegExp(`\\brm(?:Sync)?\\s*\\(\\s*${x}\\b`).test(texto);
    const push = new RegExp(`\\b([\\w$]+)\\.push\\(\\s*${x}\\s*\\)`).exec(texto);
    const enLista = push && new RegExp(`\\bof\\s+${push[1]}\\b`).test(texto) && hayRm;
    if (!borrado && !enLista) hallazgos.push({ ruta, linea: n, variable: x, motivo: `sin rm(Sync)(${x})` });
    if (esMk && !tieneFinally) hallazgos.push({ ruta, linea: n, variable: x, motivo: 'mkdtemp sin finally o after(' });
  });
  return { hallazgos, creaciones };
}

// Analiza entradas [{ ruta, texto }] y aplica las excepciones. Devuelve los problemas tal como los vería la prueba.
export function analizar(entradas, excepciones = EXCEPCIONES) {
  const hallazgos = [];
  const creaciones = [];
  for (const { ruta, texto } of entradas) {
    if (esShell(ruta)) {
      const r = analizarShell(ruta, texto);
      hallazgos.push(...r.hallazgos);
      creaciones.push(...r.creaciones);
    } else if (esJs(ruta)) {
      const r = analizarJs(ruta, texto);
      hallazgos.push(...r.hallazgos);
      creaciones.push(...r.creaciones);
    }
  }
  const usadas = new Set();
  const problemas = [];
  for (const h of hallazgos) {
    const clave = h.variable ? `${h.ruta}:${h.variable}` : null;
    if (clave && excepciones.some((e) => e.clave === clave)) {
      usadas.add(clave);
      continue;
    }
    problemas.push(`${h.ruta}:${h.linea} ${h.motivo}`);
  }
  if (creaciones.length === 0) problemas.push('ninguna creación de temporales: el escáner no ve nada');
  for (const e of excepciones) {
    if (!usadas.has(e.clave)) problemas.push(`excepción obsoleta: ${e.clave} (${e.motivo})`);
  }
  return { creaciones: creaciones.length, problemas };
}

function recorrer(raiz, rel, salida) {
  const st = statSync(rel);
  if (st.isDirectory()) {
    for (const nombre of readdirSync(rel)) {
      if (OMITIDOS.has(nombre)) continue;
      recorrer(raiz, path.join(rel, nombre), salida);
    }
  } else {
    const r = path.relative(raiz, rel).split(path.sep).join('/');
    if (r !== PROPIA && (esShell(r) || esJs(r))) salida.push({ ruta: r, texto: readFileSync(rel, 'utf8') });
  }
  return salida;
}

// Escanea el repo (o una raíz de prueba) y devuelve creaciones y problemas.
export function escanear(raiz = RAIZ, { excepciones = EXCEPCIONES, raices = RAICES } = {}) {
  const entradas = [];
  for (const r of raices) {
    const abs = path.join(raiz, r);
    if (existsSync(abs)) recorrer(raiz, abs, entradas);
  }
  return analizar(entradas, excepciones);
}

describe('reglas de shell (A6)', () => {
  test('mktemp con variable y sin trap EXIT falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'd=$(mktemp -d)\necho "$d"\n' }], []);
    assert.ok(r.problemas.some((p) => p.includes('sin trap EXIT con $d')), r.problemas.join('\n'));
  });

  test('mktemp sin variable falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'cat "$(mktemp)"\n' }], []);
    assert.ok(r.problemas.some((p) => p.includes('mktemp sin variable')), r.problemas.join('\n'));
  });

  test('mktemp con -p o plantilla / falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 't=$(mktemp -p /tmp -d)\ntrap \'rm -rf "$t"\' EXIT\nu=$(mktemp -d /tmp/x.XXXX)\ntrap \'rm -rf "$u"\' EXIT\n' }], []);
    assert.ok(r.problemas.some((p) => p.includes('mktemp con -p, --tmpdir o plantilla /')), r.problemas.join('\n'));
  });

  test('mkdir a /tmp/ literal falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'mkdir -p /tmp/fijo\n' }], []);
    assert.ok(r.problemas.some((p) => p.includes('ruta /tmp/ literal')), r.problemas.join('\n'));
  });

  test('en tools/verify no hace falta trap propio', () => {
    const r = analizar([{ ruta: 'tools/verify/x.sh', texto: 'T=$(mktemp -d)\necho "$T"\n' }], []);
    assert.deepEqual(r.problemas.filter((p) => p.includes('trap')), []);
    assert.equal(r.creaciones, 1);
  });
});

describe('reglas de JS (A6)', () => {
  test('mkdtemp sin rm falla', () => {
    const r = analizar([{ ruta: 'tests/x.test.mjs', texto: "const d = mkdtempSync(join(tmpdir(), 'x-'));\nafter(() => {});\n" }], []);
    assert.ok(r.problemas.some((p) => p.includes('sin rm(Sync)(d)')), r.problemas.join('\n'));
  });

  test('mkdtemp sin finally ni after falla', () => {
    const r = analizar([{ ruta: 'tests/x.test.mjs', texto: "const d = mkdtempSync(join(tmpdir(), 'x-'));\nrmSync(d, { recursive: true });\n" }], []);
    assert.ok(r.problemas.some((p) => p.includes('mkdtemp sin finally o after(')), r.problemas.join('\n'));
  });

  test('mkdtemp con plantilla / o mkdirSync a /tmp/ literal falla', () => {
    const r = analizar([{ ruta: 'tests/x.test.mjs', texto: "const d = mkdtempSync('/tmp/x-');\nmkdirSync('/tmp/fijo');\nafter(() => rmSync(d));\n" }], []);
    assert.ok(r.problemas.some((p) => p.includes('mkdtemp con plantilla /')), r.problemas.join('\n'));
    assert.ok(r.problemas.some((p) => p.includes('ruta /tmp/ literal')), r.problemas.join('\n'));
  });

  test('lista de temporales con bucle que borra pasa', () => {
    const texto = "const L = [];\nconst d = mkdtempSync(join(tmpdir(), 'x-'));\nL.push(d);\nafter(() => { for (const d of L) rmSync(d, { recursive: true }); });\n";
    const r = analizar([{ ruta: 'tests/x.test.mjs', texto }], []);
    assert.deepEqual(r.problemas, []);
  });
});

describe('fixtures buenos y escaneo (A6)', () => {
  test('fixtures buenos pasan', () => {
    const r = analizar([
      { ruta: 'scripts/bueno.sh', texto: 'd=$(mktemp -d)\ntrap \'rm -rf -- "$d"\' EXIT\necho "$d"\n' },
      { ruta: 'tests/bueno.test.mjs', texto: "const d = mkdtempSync(join(tmpdir(), 'x-'));\nafter(() => rmSync(d, { recursive: true, force: true }));\n" },
    ], []);
    assert.deepEqual(r.problemas, []);
    assert.equal(r.creaciones, 2);
  });

  test('un escaneo sin creaciones falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'echo hola\n' }], []);
    assert.ok(r.problemas.some((p) => p.includes('ninguna creación')), r.problemas.join('\n'));
  });

  test('una excepción obsoleta falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'echo hola\n' }], [{ clave: 'scripts/x.sh:d', motivo: 'ya no existe' }]);
    assert.ok(r.problemas.some((p) => p.includes('excepción obsoleta: scripts/x.sh:d')), r.problemas.join('\n'));
  });

  test('una excepción usada no falla', () => {
    const r = analizar([{ ruta: 'scripts/x.sh', texto: 'd=$(mktemp -d)\n' }], [{ clave: 'scripts/x.sh:d', motivo: 'trap externo' }]);
    assert.deepEqual(r.problemas, []);
  });
});

describe('repositorio (A6)', () => {
  test('el repo pasa con las excepciones declaradas', () => {
    const r = escanear(RAIZ);
    assert.ok(r.creaciones > 0, 'el escáner no ve creaciones en el repo');
    assert.deepEqual(r.problemas, [], r.problemas.join('\n'));
  });
});
