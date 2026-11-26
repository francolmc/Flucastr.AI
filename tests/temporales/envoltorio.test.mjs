// Pruebas del envoltorio de verify (tools/verify/envoltorio.sh). Casos A2 y A3 de changes/higiene-verify/tramo-2.md.
// Cada caso monta un repo git temporal con copia de tools/, scripts/ y core/skills/diagnose/, y un cuerpo falso.
// Nunca usa el ./verify real ni el /tmp real: la base temporal de cada caso es propia.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, test } from 'node:test';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIMPIAR = ['VERIFY_HIJO', 'VERIFY_FASE_ARCHIVO', 'VERIFY_TARGET', 'VERIFY_MIN_LIBRE_MB'];
const HORA = 60 * 60 * 1000;
const dirs = [];

// Cuerpo falso: deja marcas en pruebas/ (ignorado por el repo falso) y trabajo en $TMPDIR. FAKE_MODO elige el final.
const CUERPO = `#!/usr/bin/env bash
set -eu
if [ "\${FAKE_MODO:-}" = sinpaso ]; then echo "salida sin encabezado"; exit 3; fi
mkdir -p pruebas
printf 'hijo=%s\\n' "\${VERIFY_HIJO:-}" > pruebas/ejecutado.txt
printf '%s' "$TMPDIR" > pruebas/tmpdir.txt
printf 'trabajo' > "$TMPDIR/trabajo.txt"
if [ -n "\${FAKE_CAMBIA:-}" ]; then echo cambio > cambio.txt; fi
echo "== 1. primer paso =="
for i in $(seq 1 30); do echo "salida $i"; done
echo "error de prueba" >&2
echo "== 2. segundo paso =="
if [ -n "\${FAKE_LARGA:-}" ]; then printf '%20000s\\n' '' | tr ' ' x; fi
for i in $(seq 1 "\${FAKE_LINEAS:-1}"); do echo "paso dos $i"; done
case "\${FAKE_MODO:-ok}" in
  ok) echo "VERIFY OK"; exit 0 ;;
  falla) echo "FALLO: segundo paso" >&2; exit 3 ;;
  espera) touch pruebas/listo.txt; sleep 30 ;;
esac
`;

after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function temporal(prefijo) {
  const d = mkdtempSync(path.join(tmpdir(), prefijo));
  dirs.push(d);
  return d;
}

function repoFalso() {
  const repo = temporal('envoltorio-repo-');
  for (const dir of ['tools', 'scripts', 'core/skills/diagnose']) {
    cpSync(path.join(RAIZ, dir), path.join(repo, dir), { recursive: true });
  }
  writeFileSync(path.join(repo, '.gitignore'), 'pruebas/\n');
  writeFileSync(path.join(repo, 'cuerpo.sh'), CUERPO);
  const g = spawnSync('git', ['init', '-q', repo], { stdio: ['ignore', 'pipe', 'pipe'] });
  assert.equal(g.status, 0, String(g.stderr));
  return repo;
}

// Entorno sin variables del envoltorio y con TMPDIR propio de la prueba.
function entorno(base, extra = {}) {
  const env = { ...process.env };
  for (const k of LIMPIAR) delete env[k];
  return { ...env, TMPDIR: base, ...extra };
}

function correr(repo, base, extra = {}) {
  return spawnSync('bash', ['tools/verify/envoltorio.sh', path.join(repo, 'cuerpo.sh')], {
    cwd: repo, env: entorno(base, extra), stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
  });
}

// Lanza el envoltorio en su propio grupo, espera a que el cuerpo esté esperando y envía la señal al grupo.
function correrYSenal(repo, base, senal, extra = {}) {
  return new Promise((resolve, reject) => {
    const hijo = spawn('bash', ['tools/verify/envoltorio.sh', path.join(repo, 'cuerpo.sh')], {
      cwd: repo, env: entorno(base, extra), detached: true, stdio: 'ignore',
    });
    const listo = path.join(repo, 'pruebas', 'listo.txt');
    const inicio = Date.now();
    const sondeo = setInterval(() => {
      if (existsSync(listo)) {
        clearInterval(sondeo);
        process.kill(-hijo.pid, senal);
      } else if (Date.now() - inicio > 15000) {
        clearInterval(sondeo);
        process.kill(-hijo.pid, 'SIGKILL');
        reject(new Error('el cuerpo falso no llegó a esperar'));
      }
    }, 50);
    hijo.on('exit', (codigo) => {
      clearInterval(sondeo);
      resolve({ codigo });
    });
  });
}

const restos = (base) => readdirSync(base).filter((n) => n.startsWith('flucastr-verify.'));
const resultado = (repo) => JSON.parse(readFileSync(path.join(repo, 'pruebas', '.temporales', 'resultado.json'), 'utf8'));

describe('envoltorio: temporal de la corrida (A2)', () => {
  test('tras éxito no queda el temporal y resultado.json registra ok true', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(restos(base), []);
    assert.match(readFileSync(path.join(repo, 'pruebas', 'ejecutado.txt'), 'utf8'), /hijo=1/);
    // El hijo trabaja en su propio temporal: su TMPDIR es <base>/flucastr-verify.XXXXXX (export TMPDIR=$d).
    const tmpHijo = readFileSync(path.join(repo, 'pruebas', 'tmpdir.txt'), 'utf8');
    assert.equal(path.dirname(tmpHijo), base);
    assert.match(path.basename(tmpHijo), /^flucastr-verify\./);
    assert.equal(resultado(repo).ok, true);
  });

  test('tras fallo sale con el mismo código, no deja temporal y registra ok false', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'falla' });
    assert.equal(r.status, 3, r.stderr);
    assert.deepEqual(restos(base), []);
    assert.equal(resultado(repo).ok, false);
  });

  test('con TERM sale 143 y no deja temporal', async () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = await correrYSenal(repo, base, 'SIGTERM', { FAKE_MODO: 'espera' });
    assert.equal(r.codigo, 143);
    assert.deepEqual(restos(base), []);
  });

  test('con INT sale 130 y no deja temporal', async () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = await correrYSenal(repo, base, 'SIGINT', { FAKE_MODO: 'espera' });
    assert.equal(r.codigo, 130);
    assert.deepEqual(restos(base), []);
  });

  test('con VERIFY_TARGET corre igual y no registra nada', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { VERIFY_TARGET: 'http://127.0.0.1:9' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(restos(base), []);
    assert.equal(existsSync(path.join(repo, 'pruebas', '.temporales', 'resultado.json')), false);
  });
});

describe('envoltorio: espacio libre y barrido (A3)', () => {
  test('con menos espacio que VERIFY_MIN_LIBRE_MB sale 1 sin correr pasos', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { VERIFY_MIN_LIBRE_MB: '999999999' });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /FALLO: sin espacio libre en .*: hay \d+ MB y se piden 999999999 MB \(No space left\)/);
    assert.equal(existsSync(path.join(repo, 'pruebas', 'ejecutado.txt')), false);
    assert.deepEqual(restos(base), []);
  });

  test('barre los flucastr-verify.* viejos antes de comprobar el espacio', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const viejo = path.join(base, 'flucastr-verify.viejo1');
    mkdirSync(viejo);
    const hace = new Date(Date.now() - 3 * HORA);
    utimesSync(viejo, hace, hace);
    const r = correr(repo, base);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(viejo), false);
    assert.deepEqual(restos(base), []);
  });
});

describe('envoltorio: resumen verde y log (A4)', () => {
  test('en verde imprime como mucho 5 líneas, deja la salida completa en el log y termina con VERIFY OK', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base);
    assert.equal(r.status, 0, r.stderr);
    const lineas = (r.stdout + r.stderr).split('\n').filter(Boolean);
    assert.ok(lineas.length <= 5, `salida de ${lineas.length} líneas`);
    assert.equal(r.stdout.trimEnd().split('\n').at(-1), 'VERIFY OK');
    assert.match(r.stdout, /verify: 2 pasos; detalle en pruebas\/\.temporales\/verify\.log/);
    const log = readFileSync(path.join(repo, 'pruebas', '.temporales', 'verify.log'), 'utf8');
    assert.match(log, /salida 30/);
    assert.match(log, /error de prueba/);
    assert.match(log, /== 2\. segundo paso ==/);
  });

  test('en verde muestra la línea resultado registrado de kit-verificado', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^resultado registrado: Fingerprint: [0-9a-f]{12}$/m);
  });

  test('en verde muestra no se registra cuando el árbol cambia durante la corrida', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_CAMBIA: '1' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^no se registra: motivo=huella_cambio$/m);
    assert.equal(r.stdout.trimEnd().split('\n').at(-1), 'VERIFY OK');
    assert.ok(r.stdout.split('\n').filter(Boolean).length <= 5);
  });
});

describe('envoltorio: rojo acotado (A5)', () => {
  test('en rojo muestra el encabezado del paso fallido y su cola, sin pasos anteriores, y la línea final', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'falla', FAKE_LINEAS: '200' });
    assert.equal(r.status, 3, r.stderr);
    const salida = r.stdout + r.stderr;
    const lineas = salida.split('\n').filter(Boolean);
    assert.ok(lineas.length <= 40, `${lineas.length} líneas`);
    assert.ok(Buffer.byteLength(salida) <= 4096, 'más de 4096 bytes');
    assert.equal(lineas[0], '== 2. segundo paso ==');
    assert.doesNotMatch(salida, /salida \d+/);
    assert.doesNotMatch(salida, /error de prueba/);
    assert.match(salida, /FALLO: segundo paso/);
    assert.equal(lineas.at(-1), 'VERIFY FALLO: paso 2 (exit 3); detalle en pruebas/.temporales/verify.log');
    assert.deepEqual(restos(base), []);
  });

  test('una línea muy larga no hace salir más de 4096 bytes', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'falla', FAKE_LARGA: '1' });
    assert.equal(r.status, 3, r.stderr);
    const salida = r.stdout + r.stderr;
    assert.ok(Buffer.byteLength(salida) <= 4096, `${Buffer.byteLength(salida)} bytes`);
    assert.match(salida, /VERIFY FALLO: paso 2 \(exit 3\);/);
  });

  test('en rojo muestra la línea resultado registrado antes de la línea final, dentro de 40 líneas y 4096 bytes', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'falla', FAKE_LINEAS: '200' });
    assert.equal(r.status, 3, r.stderr);
    const salida = r.stdout + r.stderr;
    const lineas = salida.split('\n').filter(Boolean);
    assert.ok(lineas.length <= 40, `${lineas.length} líneas`);
    assert.ok(Buffer.byteLength(salida) <= 4096, `${Buffer.byteLength(salida)} bytes`);
    const registrada = lineas.findIndex((l) => /^resultado registrado: Fingerprint: [0-9a-f]{12}$/.test(l));
    assert.ok(registrada > 0, 'falta resultado registrado');
    assert.equal(lineas.filter((l) => l.startsWith('resultado registrado')).length, 1, 'repetida');
    assert.equal(lineas.at(-1), 'VERIFY FALLO: paso 2 (exit 3); detalle en pruebas/.temporales/verify.log');
    assert.ok(registrada < lineas.length - 1);
  });

  test('en rojo muestra no se registra cuando el árbol cambia, dentro de 40 líneas y 4096 bytes', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'falla', FAKE_LINEAS: '200', FAKE_CAMBIA: '1' });
    assert.equal(r.status, 3, r.stderr);
    const salida = r.stdout + r.stderr;
    const lineas = salida.split('\n').filter(Boolean);
    assert.ok(lineas.length <= 40, `${lineas.length} líneas`);
    assert.ok(Buffer.byteLength(salida) <= 4096, `${Buffer.byteLength(salida)} bytes`);
    assert.match(salida, /^no se registra: motivo=huella_cambio$/m);
    assert.equal(lineas.at(-1), 'VERIFY FALLO: paso 2 (exit 3); detalle en pruebas/.temporales/verify.log');
  });

  test('sin encabezado de paso muestra la cola del log y VERIFY FALLO sin paso', () => {
    const repo = repoFalso();
    const base = temporal('envoltorio-base-');
    const r = correr(repo, base, { FAKE_MODO: 'sinpaso' });
    assert.equal(r.status, 3, r.stderr);
    assert.match(r.stdout, /salida sin encabezado/);
    assert.equal(r.stdout.trimEnd().split('\n').at(-1), 'VERIFY FALLO: sin paso (exit 3); detalle en pruebas/.temporales/verify.log');
  });
});
