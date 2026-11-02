import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Raíz del kit (~/.flucastr-ai/raiz) y lanzador fijo (~/.flucastr-ai/validar-tarea.mjs) de instalar.sh / desinstalar.sh.
// Todo corre con HOME temporal: nunca toca ~/.claude, ~/.pi ni ~/.flucastr-ai reales.

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'raiz-kit-'));
console.log(`Entorno conservado: ${corrida}`);

let contador = 0;
function entorno() {
  const dir = join(corrida, `caso-${++contador}`);
  const repo = join(dir, 'repo');
  const home = join(dir, 'home');
  const pi = join(home, 'pi-aislado');
  const tmp = join(dir, 'tmp');
  const sinScripts = join(dir, 'sin-scripts');
  for (const p of [repo, home, pi, tmp, sinScripts, join(home, '.claude')]) mkdirSync(p, { recursive: true });
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts', 'agentes', 'skills', 'modelos.json']) {
    cpSync(join(raiz, p), join(repo, p), { recursive: true });
  }
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: pi, TMPDIR: tmp, TMP: tmp, TEMP: tmp };
  const estado = join(home, '.flucastr-ai');
  const correr = (cmd, args, cwd = repo) => {
    const r = spawnSync(cmd, args, { cwd, env, encoding: 'utf8', timeout: 30000 });
    if (r.error || r.signal) throw new Error(`No se pudo ejecutar ${cmd}: ${r.error ?? r.signal}`);
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  };
  return {
    repo, home, estado, sinScripts,
    instalar: (...args) => correr('bash', [join(repo, 'instalar.sh'), ...args]),
    desinstalar: (...args) => correr('bash', [join(repo, 'desinstalar.sh'), ...args]),
    lanzador: (...args) => correr(process.execPath, [join(estado, 'validar-tarea.mjs'), ...args], sinScripts),
  };
}

function manifiesto(e) {
  return readFileSync(join(e.estado, 'manifiesto.txt'), 'utf8').split('\n').filter(Boolean);
}

function escribirTareaVacia(e) {
  const archivo = join(e.sinScripts, 'vacia.md');
  writeFileSync(archivo, '');
  return archivo;
}

for (const extra of [[], ['--copiar']]) {
  const modo = extra.length ? 'descarga' : 'repo';
  test(`(a/b) modo ${modo}: instalar.sh escribe raiz y lanzador, y los registra tras la línea modo`, () => {
    const e = entorno();
    const r = e.instalar(...extra, '--solo', 'claude');
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.equal(readFileSync(join(e.estado, 'raiz'), 'utf8').trim(), e.repo);
    assert.ok(existsSync(join(e.estado, 'validar-tarea.mjs')));
    const lineas = manifiesto(e);
    assert.match(lineas[0], /^modo\t/);
    assert.ok(lineas.includes(`raiz\t${join(e.estado, 'raiz')}\t`), lineas.join('\n'));
    assert.ok(lineas.includes(`raiz\t${join(e.estado, 'validar-tarea.mjs')}\t`), lineas.join('\n'));
    const indice = lineas.findIndex((l) => l.startsWith('raiz\t'));
    assert.ok(indice > 0);
  });
}

test('(c) lanzador: sin scripts/ en el cwd, llega al script real (salida 1 con ruta; ruta inexistente, salida 2)', () => {
  const e = entorno();
  assert.equal(e.instalar('--solo', 'claude').status, 0);
  const vacia = escribirTareaVacia(e);
  const invalida = e.lanzador(vacia);
  assert.equal(invalida.status, 1, invalida.stdout + invalida.stderr);
  assert.ok((invalida.stdout + invalida.stderr).includes(vacia), invalida.stdout + invalida.stderr);

  const inexistente = join(e.sinScripts, 'no-existe.md');
  const sinArchivo = e.lanzador(inexistente);
  assert.equal(sinArchivo.status, 2, sinArchivo.stdout + sinArchivo.stderr);
});

test('(d) desinstalar.sh borra raiz y lanzador (los registra el manifiesto)', () => {
  const e = entorno();
  assert.equal(e.instalar('--solo', 'claude').status, 0);
  assert.ok(existsSync(join(e.estado, 'raiz')));
  const r = e.desinstalar();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(existsSync(join(e.estado, 'raiz')), false);
  assert.equal(existsSync(join(e.estado, 'validar-tarea.mjs')), false);
});

test('(e) --simular no crea raiz ni lanzador', () => {
  const e = entorno();
  const r = e.instalar('--simular', '--solo', 'claude');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /SIMULACIÓN: se escribirá .*raiz y .*validar-tarea\.mjs/);
  assert.equal(existsSync(join(e.estado, 'raiz')), false);
  assert.equal(existsSync(join(e.estado, 'validar-tarea.mjs')), false);
});

test('control (i): desinstalar.sh no borra raiz ni lanzador que el manifiesto no registra', () => {
  const e = entorno();
  assert.equal(e.instalar('--solo', 'claude').status, 0);
  // se quitan las líneas raiz del manifiesto y se crean los archivos a mano
  const sin = manifiesto(e).filter((l) => !l.startsWith('raiz\t'));
  writeFileSync(join(e.estado, 'manifiesto.txt'), sin.join('\n') + '\n');
  writeFileSync(join(e.estado, 'raiz'), e.repo + '\n');
  writeFileSync(join(e.estado, 'validar-tarea.mjs'), '// a mano\n');
  const r = e.desinstalar();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(existsSync(join(e.estado, 'raiz')));
  assert.ok(existsSync(join(e.estado, 'validar-tarea.mjs')));
});

test('control (ii): con raiz borrada, el lanzador sale 2 y pide reinstalar', () => {
  const e = entorno();
  assert.equal(e.instalar('--solo', 'claude').status, 0);
  rmSync(join(e.estado, 'raiz'));
  const r = e.lanzador(escribirTareaVacia(e));
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /reinstala el kit/);
});
