import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RESOLVER = join(RAIZ_REPO, 'scripts', 'resolver.mjs');
const temporales = [];
after(() => {
  for (const d of temporales) rmSync(d, { recursive: true, force: true });
});

// Carpeta temporal propia de cada caso (nunca ~/.pi ni ~/.claude).
function carpeta() {
  const dir = mkdtempSync(join(tmpdir(), 'flucastr-compactacion-'));
  temporales.push(dir);
  return dir;
}

// modelos.json temporal: copia del real, con los cambios que pida `modificar`.
function modelosTemporal(modificar = () => {}) {
  const c = JSON.parse(readFileSync(join(RAIZ_REPO, 'modelos.json'), 'utf8'));
  modificar(c);
  const ruta = join(carpeta(), 'modelos.json');
  writeFileSync(ruta, JSON.stringify(c, null, 2) + '\n');
  return ruta;
}
const MODELOS = modelosTemporal();

// Ejecuta el resolver con FLUCASTR_MODELOS apuntando a un modelos.json temporal.
function resolver(args, modelos = MODELOS) {
  const env = { ...process.env, FLUCASTR_MODELOS: modelos };
  return spawnSync('node', [RESOLVER, ...args], { encoding: 'utf8', timeout: 30000, env });
}

function leer(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

function leerTexto(ruta) {
  return readFileSync(ruta, 'utf8');
}

function escribir(ruta, objeto) {
  writeFileSync(ruta, JSON.stringify(objeto, null, 2) + '\n');
}

// `despues` conserva todo lo de `antes`: en objetos, cada clave sigue con su valor (puede haber claves nuevas dentro).
function contiene(despues, antes) {
  if (antes !== null && typeof antes === 'object' && !Array.isArray(antes)) {
    if (despues === null || typeof despues !== 'object') return false;
    return Object.keys(antes).every(k => k in despues && contiene(despues[k], antes[k]));
  }
  return JSON.stringify(despues) === JSON.stringify(antes);
}

// Claves de primer nivel de `antes` que faltan en `despues` o cuyo valor se perdió.
function perdidas(antes, despues) {
  return Object.keys(antes)
    .filter(k => !(k in despues) || !contiene(despues[k], antes[k]))
    .sort();
}

const MODELOS_PI = ['openai/gpt-6-astra', 'openai/gpt-6.1-sol', 'openai/gpt-6-luna'];
const OVERRIDES_172 = Object.fromEntries(MODELOS_PI.map(m => [m, { reserveTokens: 172000 }]));
const LINEAS_CREADO = MODELOS_PI.map(m => `fijado:${m}=172000:creado\n`).join('');
const LINEAS_FIJADO = MODELOS_PI.map(m => `fijado:${m}=172000\n`).join('');

// --- 1. Carpeta vacía ---
test('1. carpeta vacía: fija los tres modelos con 172000 y crea el archivo', () => {
  const ruta = join(carpeta(), 'settings.json');
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, LINEAS_CREADO);
  assert.deepEqual(leer(ruta), { compaction: { modelOverrides: OVERRIDES_172 } });
  assert.ok(leerTexto(ruta).endsWith('\n'));
});

// --- 2. Fusión ---
test('2. fusión: conserva deviceId, packages, claveNueva y compaction.keepRecentTokens', () => {
  const ruta = join(carpeta(), 'settings.json');
  const original = { deviceId: 'abc', packages: ['pkg-a'], claveNueva: { x: [1, 2] }, compaction: { keepRecentTokens: 20000 } };
  escribir(ruta, original);
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, LINEAS_FIJADO);
  const despues = leer(ruta);
  const sinOverrides = structuredClone(despues);
  delete sinOverrides.compaction.modelOverrides;
  assert.deepEqual(sinOverrides, original);
  assert.deepEqual(despues.compaction.modelOverrides, OVERRIDES_172);
});

// --- 3. Respeto al usuario ---
test('3a. override propio de un modelo: se omite ese y los otros dos se fijan', () => {
  const ruta = join(carpeta(), 'settings.json');
  escribir(ruta, { compaction: { modelOverrides: { 'openai/gpt-6.1-sol': { reserveTokens: 90000 } } } });
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'fijado:openai/gpt-6-astra=172000\nomitido-usuario:openai/gpt-6.1-sol\nfijado:openai/gpt-6-luna=172000\n');
  const despues = leer(ruta);
  assert.equal(despues.compaction.modelOverrides['openai/gpt-6.1-sol'].reserveTokens, 90000);
  assert.equal(despues.compaction.modelOverrides['openai/gpt-6-astra'].reserveTokens, 172000);
  assert.equal(despues.compaction.modelOverrides['openai/gpt-6-luna'].reserveTokens, 172000);
});

const CASOS_USUARIO_GLOBAL = [
  ['3b. compaction.enabled en el nivel superior: una sola línea y el archivo igual', { compaction: { enabled: false } }],
  ['3c. compaction.reserveTokens en el nivel superior: igual que 3b', { compaction: { reserveTokens: 5000 } }],
  ['3d. compaction como texto: igual que 3b', { compaction: 'texto' }],
];
for (const [nombre, contenido] of CASOS_USUARIO_GLOBAL) {
  test(nombre, () => {
    const ruta = join(carpeta(), 'settings.json');
    escribir(ruta, contenido);
    const antes = leerTexto(ruta);
    const r = resolver(['fijar-compactacion', 'pi', ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'omitido-usuario:*\n');
    assert.equal(leerTexto(ruta), antes);
  });
}

// --- 4. JSON inválido ---
test('4. JSON inválido: exit 1, mensaje «no es JSON válido» y el archivo sin cambios', () => {
  const ruta = join(carpeta(), 'settings.json');
  writeFileSync(ruta, '{ roto');
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no es JSON válido/);
  assert.equal(leerTexto(ruta), '{ roto');
});

// --- 5. Omisiones por datos ---
test('5a. sin ventana para un modelo: omitido-ventana y los otros dos se fijan', () => {
  const modelos = modelosTemporal(c => {
    delete c.perfiles['pi-openai'].ventanas['openai/gpt-6-luna'];
  });
  const ruta = join(carpeta(), 'settings.json');
  const r = resolver(['fijar-compactacion', 'pi', ruta], modelos);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    r.stdout,
    'fijado:openai/gpt-6-astra=172000:creado\nfijado:openai/gpt-6.1-sol=172000:creado\nomitido-ventana:openai/gpt-6-luna\n'
  );
});

test('5b. compactar_en 270000: omitido-umbral para los tres, sin fijar y sin crear el archivo', () => {
  const modelos = modelosTemporal(c => {
    c.compactar_en = 270000;
  });
  const ruta = join(carpeta(), 'settings.json');
  const r = resolver(['fijar-compactacion', 'pi', ruta], modelos);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, MODELOS_PI.map(m => `omitido-umbral:${m}\n`).join(''));
  assert.equal(existsSync(ruta), false);
});

// --- 6. --simular ---
test('6. --simular: misma salida que la real y la carpeta sigue vacía', () => {
  const dirSim = carpeta();
  const dirReal = carpeta();
  const sim = resolver(['fijar-compactacion', 'pi', join(dirSim, 'settings.json'), '--simular']);
  const real = resolver(['fijar-compactacion', 'pi', join(dirReal, 'settings.json')]);
  assert.equal(sim.status, 0, sim.stderr);
  assert.equal(real.status, 0, real.stderr);
  assert.equal(sim.stdout, real.stdout);
  assert.deepEqual(readdirSync(dirSim), []);
});

// --- 7. Bloqueo ---
test('7a. bloqueo fresco: exit 1, mensaje de bloqueo, archivo sin cambios y .lock intacto', () => {
  const ruta = join(carpeta(), 'settings.json');
  escribir(ruta, { deviceId: 'x' });
  const antes = leerTexto(ruta);
  mkdirSync(`${ruta}.lock`);
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no pude tomar el bloqueo/);
  assert.equal(leerTexto(ruta), antes);
  assert.equal(existsSync(`${ruta}.lock`), true);
});

test('7b. bloqueo de hace 60 s: procede, fija, no deja .lock ni .tmp', () => {
  const dir = carpeta();
  const ruta = join(dir, 'settings.json');
  escribir(ruta, { deviceId: 'x' });
  const lock = `${ruta}.lock`;
  mkdirSync(lock);
  const hace60 = (Date.now() - 60000) / 1000;
  utimesSync(lock, hace60, hace60);
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, LINEAS_FIJADO);
  assert.deepEqual(leer(ruta).compaction.modelOverrides, OVERRIDES_172);
  assert.equal(existsSync(lock), false);
  assert.deepEqual(readdirSync(dir), ['settings.json']);
});

// --- 8. Quitar ---
test('8a. tras fijar con creado: quitado, quitado, archivo-quitado y carpeta vacía', () => {
  const dir = carpeta();
  const ruta = join(dir, 'settings.json');
  const f = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.equal(f.status, 0, f.stderr);
  const salidas = MODELOS_PI.map((m, i) => {
    const extra = i === MODELOS_PI.length - 1 ? ['creado'] : [];
    const r = resolver(['quitar-compactacion', 'pi', ruta, m, '172000', ...extra]);
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  });
  assert.deepEqual(salidas, ['quitado\n', 'quitado\n', 'archivo-quitado\n']);
  assert.deepEqual(readdirSync(dir), []);
});

test('8b. sobre archivo previo del usuario: quitar deja exactamente el objeto original', () => {
  const ruta = join(carpeta(), 'settings.json');
  const original = { deviceId: 'x', packages: ['a'], compaction: { keepRecentTokens: 20000 } };
  escribir(ruta, original);
  assert.equal(resolver(['fijar-compactacion', 'pi', ruta]).status, 0);
  for (const m of MODELOS_PI) {
    const r = resolver(['quitar-compactacion', 'pi', ruta, m, '172000']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'quitado\n');
  }
  assert.deepEqual(leer(ruta), original);
});

test('8c. si el usuario cambió el valor (171999): omitido y el valor sigue', () => {
  const ruta = join(carpeta(), 'settings.json');
  escribir(ruta, { compaction: { modelOverrides: { 'openai/gpt-6-astra': { reserveTokens: 171999 } } } });
  const r = resolver(['quitar-compactacion', 'pi', ruta, 'openai/gpt-6-astra', '172000']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'omitido\n');
  assert.equal(leer(ruta).compaction.modelOverrides['openai/gpt-6-astra'].reserveTokens, 171999);
});

test('8d. si el override tiene además keepRecentTokens: omitido y el valor sigue', () => {
  const ruta = join(carpeta(), 'settings.json');
  const override = { reserveTokens: 172000, keepRecentTokens: 5 };
  escribir(ruta, { compaction: { modelOverrides: { 'openai/gpt-6-astra': override } } });
  const r = resolver(['quitar-compactacion', 'pi', ruta, 'openai/gpt-6-astra', '172000']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'omitido\n');
  assert.deepEqual(leer(ruta).compaction.modelOverrides['openai/gpt-6-astra'], override);
});

test('8e. un {} preexistente sigue existiendo tras fijar y quitar sin creado', () => {
  const ruta = join(carpeta(), 'settings.json');
  escribir(ruta, {});
  assert.equal(resolver(['fijar-compactacion', 'pi', ruta]).status, 0);
  for (const m of MODELOS_PI) {
    const r = resolver(['quitar-compactacion', 'pi', ruta, m, '172000']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'quitado\n');
  }
  assert.equal(existsSync(ruta), true);
  assert.deepEqual(leer(ruta), {});
});

// --- 9. Controles negativos ---
function fusionar() {
  const ruta = join(carpeta(), 'settings.json');
  const antes = { deviceId: 'abc', packages: ['pkg-a'], claveNueva: { x: 1 }, compaction: { keepRecentTokens: 20000 } };
  escribir(ruta, antes);
  assert.equal(resolver(['fijar-compactacion', 'pi', ruta]).status, 0);
  return { antes, despues: leer(ruta) };
}

test('9a. control negativo: una fusión real no pierde ninguna clave', () => {
  const { antes, despues } = fusionar();
  assert.deepEqual(perdidas(antes, despues), []);
});

test('9b. control negativo: una copia dañada lista exactamente packages y deviceId', () => {
  const { antes, despues } = fusionar();
  const dañado = structuredClone(despues);
  delete dañado.packages;
  dañado.deviceId = 'otro';
  assert.deepEqual(perdidas(antes, dañado), ['deviceId', 'packages']);
});

test('9c. control negativo: con bloqueo fresco el escritor se niega (status distinto de 0)', () => {
  const ruta = join(carpeta(), 'settings.json');
  escribir(ruta, { deviceId: 'x' });
  mkdirSync(`${ruta}.lock`);
  const r = resolver(['fijar-compactacion', 'pi', ruta]);
  assert.notEqual(r.status, 0);
});
