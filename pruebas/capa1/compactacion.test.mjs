import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Compactación automática (task-10): instalar.sh y desinstalar.sh escriben y deshacen el ajuste de
// Pi (settings.json global) y el de Claude Code (settings.local.json de un proyecto).
// Cada entorno vive en pruebas/.temporales/ con HOME y PI_CODING_AGENT_DIR falsos: nunca toca
// ~/.claude, ~/.pi ni ~/.flucastr-ai reales. Los entornos no se borran (quedan para revisar).
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'compactacion-'));
console.log(`Entorno conservado: ${corrida}`);

// Árbol mínimo derivado del real: scripts reales, un agente de prueba y modelos.json con solo arquitecto
// (conserva compactar_en y ventanas).
function armarRepo(dir) {
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts']) cpSync(join(raiz, p), join(dir, p), { recursive: true });
  mkdirSync(join(dir, 'agentes'), { recursive: true });
  writeFileSync(join(dir, 'agentes', 'arquitecto.md'), '---\nname: arquitecto\ndescription: "Agente de prueba."\n---\nCuerpo de prueba.\n');
  const real = JSON.parse(readFileSync(join(raiz, 'modelos.json'), 'utf8'));
  writeFileSync(join(dir, 'modelos.json'), JSON.stringify({ ...real, agentes: { arquitecto: real.agentes.arquitecto } }, null, 2) + '\n');
}

function entorno(nombre) {
  const dir = join(corrida, nombre);
  const home = join(dir, 'home');
  const pi = join(home, 'pi-aislado');
  const tmp = join(dir, 'tmp');
  const kit = join(dir, 'kit');
  for (const p of [home, pi, tmp, join(home, '.claude')]) mkdirSync(p, { recursive: true });
  armarRepo(kit);
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: pi, TMPDIR: tmp, TMP: tmp, TEMP: tmp };
  delete env.FLUCASTR_MODELOS; // ni la variable del shell de Franco debe influir en la prueba
  function ejecutar(cmd, args) {
    const r = spawnSync(cmd, args, { cwd: kit, env, encoding: 'utf8', timeout: 30000 });
    if (r.error || r.signal) throw new Error(`No se pudo ejecutar ${cmd}: ${r.error ?? r.signal}`);
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  }
  return {
    home, pi, kit, dir,
    instalar: (...args) => ejecutar('bash', [join(kit, 'instalar.sh'), ...args]),
    desinstalar: (...args) => ejecutar('bash', [join(kit, 'desinstalar.sh'), ...args]),
  };
}

// Proyecto con git dentro de la corrida (sin git, git usaría el exclude del repo del kit).
function crearProyecto(nombre) {
  const dir = join(corrida, `proyecto-${nombre}`);
  mkdirSync(dir, { recursive: true });
  const r = spawnSync('git', ['init', '-q', dir], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git init falló: ${r.stderr}`);
  return dir;
}

function snapshot(dir) {
  const entradas = {};
  if (!existsSync(dir)) return entradas;
  function recorrer(actual, relativo = '') {
    for (const nombre of readdirSync(actual).sort()) {
      const ruta = join(actual, nombre);
      const clave = join(relativo, nombre);
      const s = lstatSync(ruta);
      if (s.isSymbolicLink()) entradas[clave] = { tipo: 'enlace', destino: readlinkSync(ruta) };
      else if (s.isDirectory()) { entradas[clave] = { tipo: 'directorio', modo: s.mode }; recorrer(ruta, clave); }
      else entradas[clave] = { tipo: 'archivo', modo: s.mode, contenido: readFileSync(ruta).toString('base64') };
    }
  }
  recorrer(dir);
  return entradas;
}

// Ayudante de control: pasa si las dos instantáneas son iguales.
function sinCambios(antes, despues) {
  assert.deepEqual(despues, antes, 'el árbol cambió');
}

// Igual que el caso I3 de instalacion.test.mjs: al desinstalar quedan carpetas vacías que el kit crea
// (agents, skills, .local/bin); no son de la compactación, así que la restauración compara solo archivos y enlaces.
function sinDirectorios(estado) {
  return Object.fromEntries(Object.entries(estado).filter(([, entrada]) => entrada.tipo !== 'directorio'));
}

// Ayudante de control: nombres de nivel superior de `antes` que cambiaron o faltan en `despues`.
// Recorre las hojas de `antes`; una hoja perdida o distinta reporta su clave de nivel superior.
function perdidas(antes, despues) {
  const malas = new Set();
  function recorrer(a, b, clave) {
    if (a !== null && typeof a === 'object') {
      for (const k of Object.keys(a)) recorrer(a[k], b?.[k], clave ?? k);
      return;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) malas.add(clave);
  }
  recorrer(antes, despues, null);
  return [...malas].sort();
}

function leerJson(ruta) { return JSON.parse(readFileSync(ruta, 'utf8')); }
function lineasManifiesto(e) {
  const ruta = join(e.home, '.flucastr-ai', 'manifiesto.txt');
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
}
function compactaciones(e) { return lineasManifiesto(e).filter((l) => l[0] === 'compactacion'); }
function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }
function archivosTemporales(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.lock') || n.endsWith('.tmp')) : [];
}

const MODELOS_PI = ['openai/gpt-6-astra', 'openai/gpt-6.1-sol', 'openai/gpt-6-luna'];

// a. Pi limpio: instalar, desinstalar y HOME idéntico al inicial.
test('a: Pi limpio, instalar y desinstalar', () => {
  const e = entorno('pi-limpio');
  const inicial = snapshot(e.home);
  const antesReal = snapshot(e.home);
  const r = e.instalar();
  exito(r);
  assert.match(r.stdout, /compactación fijada:/);
  assert.match(r.stdout, /Pi no relee settings.json/);

  const ajustes = leerJson(join(e.pi, 'settings.json'));
  assert.deepEqual(Object.keys(ajustes.compaction.modelOverrides).sort(), [...MODELOS_PI].sort());
  for (const m of MODELOS_PI) assert.equal(ajustes.compaction.modelOverrides[m].reserveTokens, 172000, m);

  const comp = compactaciones(e);
  assert.equal(comp.length, 3, 'deben ser tres líneas compactacion');
  for (const l of comp) assert.match(l[2], /^pi:openai\/gpt-6[^=]*=172000:creado$/);

  assert.deepEqual(archivosTemporales(e.pi), [], 'quedó un .lock o .tmp');

  // Control negativo: la instalación real escribe, así que sinCambios debe rechazarla.
  const trasInstalar = snapshot(e.home);
  assert.throws(() => sinCambios(antesReal, trasInstalar));

  exito(e.desinstalar());
  sinCambios(sinDirectorios(inicial), sinDirectorios(snapshot(e.home)));
});

// b. Pi con archivo del usuario: se respeta lo suyo, se fijan los demás y la desinstalación conserva el archivo.
test('b: Pi con settings.json del usuario', () => {
  const e = entorno('pi-usuario');
  const original = {
    deviceId: 'x',
    packages: ['p'],
    claveNueva: { valor: 'nuevo' },
    compaction: { modelOverrides: { 'openai/gpt-6.1-sol': { reserveTokens: 100000 } } }
  };
  writeFileSync(join(e.pi, 'settings.json'), JSON.stringify(original, null, 2) + '\n');

  const r1 = e.instalar();
  exito(r1);
  assert.match(r1.stdout, /OMITIDO \(ya define compaction para openai\/gpt-6\.1-sol: se respeta\)/);
  const trasInstalar = leerJson(join(e.pi, 'settings.json'));
  assert.deepEqual(perdidas(original, trasInstalar), [], 'la instalación tocó lo del usuario');
  assert.equal(trasInstalar.compaction.modelOverrides['openai/gpt-6-astra'].reserveTokens, 172000);
  assert.equal(trasInstalar.compaction.modelOverrides['openai/gpt-6-luna'].reserveTokens, 172000);
  assert.equal(trasInstalar.compaction.modelOverrides['openai/gpt-6.1-sol'].reserveTokens, 100000);

  const comp = compactaciones(e);
  assert.equal(comp.length, 2, 'deben ser dos líneas compactacion');
  for (const l of comp) assert.doesNotMatch(l[2], /:creado$/);

  // Reinstalar dos veces seguidas deja el mismo settings.json.
  exito(e.instalar());
  const segunda = leerJson(join(e.pi, 'settings.json'));
  exito(e.instalar());
  assert.deepEqual(leerJson(join(e.pi, 'settings.json')), segunda, 'la reinstalación cambió el archivo');
  assert.deepEqual(segunda, trasInstalar);

  // Desinstalar: el archivo sigue existiendo y lo del usuario está igual (el formato puede cambiar).
  exito(e.desinstalar());
  const trasDesinstalar = leerJson(join(e.pi, 'settings.json'));
  assert.deepEqual(perdidas(original, trasDesinstalar), [], 'desinstalar tocó lo del usuario');
  assert.deepEqual(trasDesinstalar, original);
});

// c. Proyecto: settings.local.json con el agente y la compactación de Claude Code; simetría al desinstalar.
test('c: proyecto con Claude Code', () => {
  const e = entorno('proyecto');
  const p = crearProyecto('c');
  const inicial = snapshot(e.home);
  const ajustesLocales = join(p, '.claude', 'settings.local.json');

  exito(e.instalar('--proyecto', p));
  assert.deepEqual(leerJson(ajustesLocales), { agent: 'arquitecto', autoCompactWindow: 133000 });
  const claude = compactaciones(e).filter((l) => l[2] === 'claude:133000');
  assert.equal(claude.length, 1, 'falta la línea claude:133000');

  // Instalar sin --proyecto conserva la línea y el archivo del proyecto.
  exito(e.instalar());
  assert.deepEqual(leerJson(ajustesLocales), { agent: 'arquitecto', autoCompactWindow: 133000 });
  assert.equal(compactaciones(e).filter((l) => l[2] === 'claude:133000').length, 1, 'se perdió la línea claude:');

  // Desinstalar el proyecto borra el archivo y la carpeta .claude, y quita la línea claude (las de pi siguen).
  exito(e.desinstalar('--proyecto', p));
  assert.equal(existsSync(ajustesLocales), false, 'quedó settings.local.json');
  assert.equal(existsSync(join(p, '.claude')), false, 'quedó la carpeta .claude del proyecto');
  const restantes = compactaciones(e);
  assert.equal(restantes.filter((l) => l[2].startsWith('claude:')).length, 0, 'quedó la línea claude:');
  assert.equal(restantes.filter((l) => l[2].startsWith('pi:')).length, 3, 'se perdieron las líneas pi:');

  // Desinstalar completo deja el HOME como al principio (archivos y enlaces; ver sinDirectorios).
  exito(e.desinstalar());
  sinCambios(sinDirectorios(inicial), sinDirectorios(snapshot(e.home)));
});

// d. Simulación: no escribe nada en el HOME ni en el proyecto.
test('d: simulación sin cambios', () => {
  const e = entorno('simular');
  const p = crearProyecto('d');
  const homeAntes = snapshot(e.home);
  const proyectoAntes = snapshot(p);

  const r = e.instalar('--simular', '--proyecto', p);
  exito(r);
  assert.match(r.stdout, /\(simulación\) compactación fijada:/);
  assert.match(r.stdout, /\(simulación\) compactación de Claude Code fijada/);

  sinCambios(homeAntes, snapshot(e.home));
  sinCambios(proyectoAntes, snapshot(p));
});

// e. Casos de borde.
test('e1: modelos.json sin ventanas ni compactar_en (personal antiguo)', () => {
  const e = entorno('sin-ventanas');
  const kitModelos = join(e.kit, 'modelos.json');
  const modelos = JSON.parse(readFileSync(kitModelos, 'utf8'));
  delete modelos.compactar_en;
  for (const perfil of Object.values(modelos.perfiles)) {
    delete perfil.ventanas;
    delete perfil.compactar_en;
  }
  writeFileSync(kitModelos, JSON.stringify(modelos, null, 2) + '\n');

  const r = e.instalar();
  exito(r);
  assert.match(r.stdout, /OMITIDO \(modelos\.json no declara la ventana de/);
  assert.equal(existsSync(join(e.pi, 'settings.json')), false, 'se creó settings.json');
  assert.ok(existsSync(join(e.home, '.claude', 'agents', 'arquitecto.md')), 'no se instaló el agente de Claude Code');
});

test('e2: settings.json de Pi que no es JSON válido', () => {
  const e = entorno('roto');
  const ruta = join(e.pi, 'settings.json');
  writeFileSync(ruta, '{ roto');
  const bytesAntes = readFileSync(ruta);

  const r = e.instalar();
  exito(r);
  assert.match(r.stdout, /AVISO: no se tocó/);
  assert.deepEqual(readFileSync(ruta), bytesAntes, 'el archivo roto cambió');
});

test('e3: settings.local.json del proyecto con autoCompactWindow del usuario', () => {
  const e = entorno('proyecto-usuario');
  const p = crearProyecto('e3');
  mkdirSync(join(p, '.claude'), { recursive: true });
  writeFileSync(join(p, '.claude', 'settings.local.json'), JSON.stringify({ autoCompactWindow: 150000 }, null, 2) + '\n');

  const r = e.instalar('--proyecto', p);
  exito(r);
  assert.match(r.stdout, /OMITIDO \(el proyecto ya define autoCompactWindow: se respeta\)/);
  assert.equal(leerJson(join(p, '.claude', 'settings.local.json')).autoCompactWindow, 150000);
  assert.equal(compactaciones(e).filter((l) => l[2].startsWith('claude:')).length, 0, 'hay línea claude: en el manifiesto');
});

// f. Controles negativos sobre los ayudantes de comparación. Usan instantáneas ya tomadas arriba.
test('f1: sinCambios acepta la simulación y rechaza una instalación real', () => {
  const e = entorno('control-simular');
  const p = crearProyecto('f1');
  const antes = snapshot(e.home);
  exito(e.instalar('--simular', '--proyecto', p));
  sinCambios(antes, snapshot(e.home));

  const antesReal = snapshot(e.home);
  exito(e.instalar('--proyecto', p));
  assert.throws(() => sinCambios(antesReal, snapshot(e.home)));
});

test('f2: perdidas detecta packages borrado y no reporta nada con el resultado real', () => {
  const e = entorno('control-perdidas');
  const original = {
    deviceId: 'x',
    packages: ['p'],
    claveNueva: { valor: 'nuevo' },
    compaction: { modelOverrides: { 'openai/gpt-6.1-sol': { reserveTokens: 100000 } } }
  };
  const ruta = join(e.pi, 'settings.json');
  writeFileSync(ruta, JSON.stringify(original, null, 2) + '\n');
  exito(e.instalar());
  const real = leerJson(ruta);
  assert.deepEqual(perdidas(original, real), []);

  const dañada = structuredClone(real);
  delete dañada.packages;
  assert.deepEqual(perdidas(original, dañada), ['packages']);
});
