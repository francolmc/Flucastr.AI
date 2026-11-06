import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// fijar-hook / quitar-hook del resolver (F38, task-05): el hook PostToolUse del validador en
// settings.local.json de un proyecto. Cada caso vive en pruebas/.temporales/ con HOME falso:
// nunca toca ~/.claude ni ~/.flucastr-ai reales. Los entornos no se borran (quedan para revisar).
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'hook-claude-'));
console.log(`Entorno conservado: ${corrida}`);

const COMANDO = 'node ~/.flucastr-ai/validar-tarea.mjs --hook';
const ENTRADA = { matcher: 'Write|Edit|MultiEdit', hooks: [{ type: 'command', command: COMANDO }] };
const ajeno = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo ajeno' }] };

// Formato que escribe el resolver: JSON con sangría de 2 y salto final.
function escribirJson(ruta, objeto) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, JSON.stringify(objeto, null, 2) + '\n');
}

function ruta(nombre) {
  const dir = join(corrida, nombre);
  mkdirSync(dir, { recursive: true });
  return join(dir, '.claude', 'settings.local.json');
}

function resolver(...args) {
  const home = join(corrida, 'home');
  mkdirSync(home, { recursive: true });
  return spawnSync(process.execPath, [join(raiz, 'scripts', 'resolver.mjs'), ...args], {
    cwd: raiz,
    encoding: 'utf8',
    env: { ...process.env, HOME: home, FLUCASTR_MODELOS: '' },
    timeout: 30000,
  });
}

function leer(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

test('fijar-hook en archivo inexistente: fijado y contenido exacto', () => {
  const f = ruta('inexistente');
  const r = resolver('fijar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'fijado');
  assert.equal(readFileSync(f, 'utf8'), JSON.stringify({ hooks: { PostToolUse: [ENTRADA] } }, null, 2) + '\n');
});

test('fijar-hook por segunda vez: ya-estaba y el archivo no cambia', () => {
  const f = ruta('idempotente');
  assert.equal(resolver('fijar-hook', 'claude', f).stdout.trim(), 'fijado');
  const antes = readFileSync(f);
  const r = resolver('fijar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'ya-estaba');
  assert.deepEqual(readFileSync(f), antes);
});

test('fijar-hook conserva agent y un hook ajeno de PostToolUse; el nuestro queda al final', () => {
  const f = ruta('con-ajustes');
  escribirJson(f, { agent: 'arquitecto', autoCompactWindow: 150000, hooks: { PostToolUse: [ajeno] } });
  const r = resolver('fijar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'fijado');
  const ajustes = leer(f);
  assert.equal(ajustes.agent, 'arquitecto');
  assert.equal(ajustes.autoCompactWindow, 150000);
  assert.deepEqual(ajustes.hooks.PostToolUse, [ajeno, ENTRADA]);
});

test('fijar-hook --simular no escribe, ni en archivo nuevo ni en uno existente', () => {
  const nuevo = ruta('simular-nuevo');
  const r1 = resolver('fijar-hook', 'claude', nuevo, '--simular');
  assert.equal(r1.status, 0, r1.stderr);
  assert.equal(r1.stdout.trim(), 'fijado');
  assert.equal(existsSync(nuevo), false);

  const existente = ruta('simular-existente');
  escribirJson(existente, { agent: 'arquitecto' });
  const antes = readFileSync(existente);
  const r2 = resolver('fijar-hook', 'claude', existente, '--simular');
  assert.equal(r2.status, 0, r2.stderr);
  assert.deepEqual(readFileSync(existente), antes);
});

test('fijar-hook con JSON inválido: error y archivo intacto', () => {
  const f = ruta('json-invalido');
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, '{ no es json');
  const r = resolver('fijar-hook', 'claude', f);
  assert.notEqual(r.status, 0);
  assert.equal(readFileSync(f, 'utf8'), '{ no es json');
});

test('fijar-hook con hooks o PostToolUse de tipo inesperado: error y archivo intacto', () => {
  const casos = {
    'hooks-texto': { hooks: 'x' },
    'hooks-arreglo': { hooks: [] },
    'posttooluse-objeto': { hooks: { PostToolUse: {} } },
  };
  for (const [nombre, contenido] of Object.entries(casos)) {
    const f = ruta(nombre);
    escribirJson(f, contenido);
    const antes = readFileSync(f);
    const r = resolver('fijar-hook', 'claude', f);
    assert.notEqual(r.status, 0, `${nombre} debería fallar`);
    assert.deepEqual(readFileSync(f), antes, `${nombre} cambió el archivo`);
  }
});

test('fijar-hook y quitar-hook solo aceptan settings.local.json', () => {
  const dir = join(corrida, 'nombre-incorrecto');
  mkdirSync(dir, { recursive: true });
  const f = join(dir, 'settings.json');
  const r1 = resolver('fijar-hook', 'claude', f);
  assert.notEqual(r1.status, 0);
  assert.equal(existsSync(f), false);

  escribirJson(f, { agent: 'arquitecto' });
  const antes = readFileSync(f);
  const r2 = resolver('quitar-hook', 'claude', f);
  assert.notEqual(r2.status, 0);
  assert.deepEqual(readFileSync(f), antes);
});

test('fijar-hook seguido de quitar-hook deja el archivo byte a byte igual', () => {
  const f = ruta('ida-y-vuelta');
  escribirJson(f, { agent: 'arquitecto', hooks: { PostToolUse: [ajeno] }, autoCompactWindow: 150000 });
  const antes = readFileSync(f);
  assert.equal(resolver('fijar-hook', 'claude', f).stdout.trim(), 'fijado');
  const r = resolver('quitar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'quitado');
  assert.deepEqual(readFileSync(f), antes);
});

test('quitar-hook cuando solo estaba el hook: archivo-quitado', () => {
  const f = ruta('solo-hook');
  assert.equal(resolver('fijar-hook', 'claude', f).stdout.trim(), 'fijado');
  const r = resolver('quitar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'archivo-quitado');
  assert.equal(existsSync(f), false);
});

test('quitar-hook sin nuestro hook: omitido y archivo intacto', () => {
  const f = ruta('sin-hook');
  escribirJson(f, { agent: 'arquitecto', hooks: { PostToolUse: [ajeno] } });
  const antes = readFileSync(f);
  const r = resolver('quitar-hook', 'claude', f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'omitido');
  assert.deepEqual(readFileSync(f), antes);

  const inexistente = ruta('sin-archivo');
  const r2 = resolver('quitar-hook', 'claude', inexistente);
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.stdout.trim(), 'omitido');
  assert.equal(existsSync(inexistente), false);
});

// --- Ciclo instalar.sh / desinstalar.sh con el hook (F38, task-06) ---
// Mismo patrón que compactacion.test.mjs: árbol mínimo derivado del real y HOME falso por caso.
// Los helpers son locales (copiados de compactacion.test.mjs). Nunca se toca ~/.claude/settings.json real.

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
  delete env.FLUCASTR_MODELOS;
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
function crearProyectoCiclo(nombre) {
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

function sinCambios(antes, despues) {
  assert.deepEqual(despues, antes, 'el árbol cambió');
}

// Quedan carpetas vacías que el kit crea (agents, skills, .local/bin); la restauración compara archivos y enlaces.
function sinDirectorios(estado) {
  return Object.fromEntries(Object.entries(estado).filter(([, entrada]) => entrada.tipo !== 'directorio'));
}

function lineasManifiesto(e) {
  const ruta = join(e.home, '.flucastr-ai', 'manifiesto.txt');
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
}
function lineasHook(e) { return lineasManifiesto(e).filter((l) => l[0] === 'hook'); }
function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }

test('ciclo: instalar --proyecto fija el hook y registra una sola línea hook', () => {
  const e = entorno('ciclo-instalar');
  const p = crearProyectoCiclo('ciclo-instalar');
  const ajustes = join(p, '.claude', 'settings.local.json');
  exito(e.instalar('--proyecto', p));
  assert.deepEqual(leer(ajustes).hooks.PostToolUse, [ENTRADA]);
  assert.deepEqual(lineasHook(e), [['hook', ajustes, 'claude']]);
});

test('ciclo: reinstalar no duplica la entrada ni la línea hook, y reinstalar sin --proyecto conserva la línea', () => {
  const e = entorno('ciclo-reinstalar');
  const p = crearProyectoCiclo('ciclo-reinstalar');
  const ajustes = join(p, '.claude', 'settings.local.json');
  exito(e.instalar('--proyecto', p));
  exito(e.instalar('--proyecto', p));
  assert.deepEqual(leer(ajustes).hooks.PostToolUse, [ENTRADA]);
  assert.equal(lineasHook(e).length, 1, 'reinstalar con --proyecto duplicó la línea hook');

  exito(e.instalar());
  assert.deepEqual(leer(ajustes).hooks.PostToolUse, [ENTRADA]);
  assert.deepEqual(lineasHook(e), [['hook', ajustes, 'claude']], 'reinstalar sin --proyecto perdió la línea hook');
});

test('ciclo: --simular de instalar y de desinstalar no cambia HOME ni el proyecto', () => {
  const e = entorno('ciclo-simular');
  const p = crearProyectoCiclo('ciclo-simular');
  const home0 = snapshot(e.home);
  const proyecto0 = snapshot(p);
  const r1 = e.instalar('--proyecto', p, '--simular');
  exito(r1);
  assert.match(r1.stdout, /\(simulación\) hook de Claude Code fijado/);
  sinCambios(home0, snapshot(e.home));
  sinCambios(proyecto0, snapshot(p));

  exito(e.instalar('--proyecto', p));
  const home1 = snapshot(e.home);
  const proyecto1 = snapshot(p);
  exito(e.desinstalar('--proyecto', p, '--simular'));
  sinCambios(home1, snapshot(e.home));
  sinCambios(proyecto1, snapshot(p));
});

test('ciclo: un hook ajeno de PostToolUse se conserva al instalar y al desinstalar --proyecto', () => {
  const e = entorno('ciclo-ajeno');
  const p = crearProyectoCiclo('ciclo-ajeno');
  const ajustes = join(p, '.claude', 'settings.local.json');
  escribirJson(ajustes, { hooks: { PostToolUse: [ajeno] } });
  exito(e.instalar('--proyecto', p));
  assert.deepEqual(leer(ajustes).hooks.PostToolUse, [ajeno, ENTRADA]);

  exito(e.desinstalar('--proyecto', p));
  assert.deepEqual(leer(ajustes), { hooks: { PostToolUse: [ajeno] } });
  assert.equal(lineasHook(e).length, 0, 'quedó la línea hook');
});

test('ciclo: desinstalar --proyecto borra el archivo y .claude si eran nuevos', () => {
  const e = entorno('ciclo-desinstalar-proyecto');
  const p = crearProyectoCiclo('ciclo-desinstalar-proyecto');
  const proyecto0 = sinDirectorios(snapshot(p));
  exito(e.instalar('--proyecto', p));
  exito(e.desinstalar('--proyecto', p));
  assert.equal(existsSync(join(p, '.claude', 'settings.local.json')), false, 'quedó settings.local.json');
  assert.equal(existsSync(join(p, '.claude')), false, 'quedó la carpeta .claude del proyecto');
  assert.equal(lineasHook(e).length, 0, 'quedó la línea hook');
  sinCambios(proyecto0, sinDirectorios(snapshot(p)));
});

test('ciclo: control, settings.local.json inválido: instalar sale con 1 y no toca el archivo', () => {
  const e = entorno('ciclo-invalido');
  const p = crearProyectoCiclo('ciclo-invalido');
  const ajustes = join(p, '.claude', 'settings.local.json');
  mkdirSync(dirname(ajustes), { recursive: true });
  writeFileSync(ajustes, '{ no es json');
  const r = e.instalar('--proyecto', p);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /no es JSON válido/);
  assert.equal(readFileSync(ajustes, 'utf8'), '{ no es json');
  assert.equal(lineasHook(e).length, 0, 'se registró una línea hook sin fijar nada');
});

test('ciclo: desinstalación completa deja el HOME y el proyecto como al principio, sin tocar ~/.claude/settings.json', () => {
  const e = entorno('ciclo-completa');
  const p = crearProyectoCiclo('ciclo-completa');
  const home0 = sinDirectorios(snapshot(e.home));
  const proyecto0 = sinDirectorios(snapshot(p));
  exito(e.instalar('--proyecto', p));
  exito(e.desinstalar());
  sinCambios(home0, sinDirectorios(snapshot(e.home)));
  assert.equal(existsSync(join(e.home, '.claude', 'settings.json')), false, 'apareció ~/.claude/settings.json');
  sinCambios(proyecto0, sinDirectorios(snapshot(p)));
  assert.equal(lineasHook(e).length, 0, 'quedó la línea hook');
});
