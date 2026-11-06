import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { comprobarModelos } from './modelos-agentes.mjs';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporales = [];
after(() => {
  for (const d of temporales) rmSync(d, { recursive: true, force: true });
});

// Copia el repo a una carpeta temporal y lo instala con bash instalar.sh en un HOME aislado.
function instalacionAislada() {
  const base = mkdtempSync(join(tmpdir(), 'flucastr-modelos-'));
  temporales.push(base);
  const repo = join(base, 'repo');
  const home = join(base, 'home');
  const piDir = join(home, 'pi');
  mkdirSync(repo, { recursive: true });
  mkdirSync(join(home, '.claude'), { recursive: true });
  mkdirSync(piDir, { recursive: true });
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts', 'agentes', 'skills', 'modelos.json']) {
    cpSync(join(RAIZ_REPO, p), join(repo, p), { recursive: true });
  }
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: piDir };
  const r = spawnSync('bash', [join(repo, 'instalar.sh')], { cwd: repo, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return {
    raiz: repo,
    claudeDir: join(home, '.claude'),
    piDir,
    binDir: join(home, '.local', 'bin'),
  };
}

test('(a) tras instalar.sh en entorno aislado no hay errores', () => {
  const inst = instalacionAislada();
  assert.deepEqual(comprobarModelos(inst), []);
});

test('(b) modelos.json cambiado sin reinstalar: error que nombra al constructor', () => {
  const inst = instalacionAislada();
  const ruta = join(inst.raiz, 'modelos.json');
  const config = JSON.parse(readFileSync(ruta, 'utf8'));
  config.agentes.constructor.nivel = 'alto';
  writeFileSync(ruta, JSON.stringify(config, null, 2) + '\n');
  const errores = comprobarModelos(inst);
  assert.ok(errores.length >= 1, 'debe haber al menos un error');
  assert.ok(errores.some(e => e.includes('constructor')), errores.join('\n'));
});

test('(c) lanzador pi-constructor ausente: error que nombra al lanzador', () => {
  const inst = instalacionAislada();
  unlinkSync(join(inst.binDir, 'pi-constructor'));
  const errores = comprobarModelos(inst);
  assert.ok(errores.some(e => e.includes('pi-constructor')), errores.join('\n'));
});
