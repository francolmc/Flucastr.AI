import assert from 'node:assert/strict';
import { spawnSyncSeguro } from '../../tools/spawn/sync-seguro.mjs';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { fingerprintCurrent } from '../../core/skills/diagnose/fingerprint.mjs';
import { fingerprint as referencia } from '../diagnosis-suggests/fingerprint-reference.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(raiz, 'scripts', 'kit-verificado.mjs');
const RESULTADO = path.join('pruebas', '.temporales', 'resultado.json');
const autor = {
  GIT_AUTHOR_NAME: 'Verificado Test',
  GIT_AUTHOR_EMAIL: 'verificado@example.test',
  GIT_COMMITTER_NAME: 'Verificado Test',
  GIT_COMMITTER_EMAIL: 'verificado@example.test',
};

// Repos temporales sin `git commit`: el commit se arma con plumbing (write-tree, commit-tree, update-ref).
function repo({ commit = true } = {}, callback) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ya-verificado-'));
  try {
    const g = (args) => {
      const r = spawnSyncSeguro('git', ['-C', dir, ...args], { encoding: 'utf8', env: { ...process.env, ...autor } });
      assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
      return r.stdout.trim();
    };
    g(['init', '-q']);
    writeFileSync(path.join(dir, '.gitignore'), 'pruebas/\n');
    mkdirSync(path.join(dir, 'src'), { recursive: true });
    writeFileSync(path.join(dir, 'src', 'app.js'), 'export const value = 1;\n');
    mkdirSync(path.join(dir, 'changes', 'demo'), { recursive: true });
    writeFileSync(path.join(dir, 'changes', 'demo', 'plan.md'), '## Plan\n');
    if (commit) {
      g(['add', '.']);
      const arbol = g(['write-tree']);
      const commitId = g(['commit-tree', arbol, '-m', 'base']);
      g(['update-ref', 'HEAD', commitId]);
    }
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function escribirResultado(dir, contenido) {
  const ruta = path.join(dir, RESULTADO);
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, typeof contenido === 'string' ? contenido : JSON.stringify(contenido));
}

function resultadoValido(dir, extra = {}) {
  return { fingerprint: fingerprintCurrent(dir), level: 'aceptacion', fase: 'verify', ok: true, fallo: 'ninguno', ...extra };
}

function cli_(args, dir) {
  return spawnSyncSeguro(process.execPath, [cli, ...args, '--carpeta', dir], { encoding: 'utf8' });
}

function estado(dir, nivel = 'aceptacion') {
  return cli_(['estado', '--nivel', nivel], dir);
}

test('sin seguimiento: cambiar un archivo nuevo o agregar otro cambia la huella y es estable', () => {
  repo({}, (dir) => {
    mkdirSync(path.join(dir, 'nuevo'), { recursive: true });
    writeFileSync(path.join(dir, 'nuevo', 'x.txt'), 'uno\n');
    const a = fingerprintCurrent(dir);
    assert.match(a, /^[0-9a-f]{12}$/);
    assert.equal(fingerprintCurrent(dir), a, 'dos llamadas sobre el mismo árbol deben coincidir');
    writeFileSync(path.join(dir, 'nuevo', 'x.txt'), 'dos\n');
    const b = fingerprintCurrent(dir);
    assert.notEqual(b, a, 'cambiar el contenido de un archivo sin seguir debe cambiar la huella');
    writeFileSync(path.join(dir, 'nuevo', 'y.txt'), 'tres\n');
    const c = fingerprintCurrent(dir);
    assert.notEqual(c, b, 'agregar un archivo sin seguir debe cambiar la huella');
    assert.equal(c, referencia(dir), 'la huella del módulo y la referencia del contrato deben coincidir');
  });
});

test('sin seguimiento: un archivo que no es regular no bloquea la huella ni la hace null', (t) => {
  repo({}, (dir) => {
    const fifo = path.join(dir, 'tuberia');
    const r = spawnSyncSeguro('mkfifo', [fifo], { encoding: 'utf8' });
    if (r.status !== 0) return t.skip('mkfifo no disponible en este sistema');
    const a = fingerprintCurrent(dir);
    assert.match(a, /^[0-9a-f]{12}$/, 'una FIFO no debe dejar la huella en null');
    assert.equal(fingerprintCurrent(dir), a);
  });
});

test('sin cambios: árbol intacto con resultado válido ok true da ya verificado y exit 0', () => {
  repo({}, (dir) => {
    escribirResultado(dir, resultadoValido(dir));
    const r = estado(dir);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /ya verificado/);
    assert.match(r.stdout, new RegExp(`Fingerprint: ${fingerprintCurrent(dir)}`));
  });
});

test('cambió el árbol: archivo seguido, archivo nuevo o archivo nuevo modificado dan exit 1 con huella_distinta', () => {
  const cambios = {
    'archivo seguido modificado': (dir) => writeFileSync(path.join(dir, 'src', 'app.js'), 'export const value = 2;\n'),
    'archivo nuevo': (dir) => writeFileSync(path.join(dir, 'nuevo.js'), 'export const n = 1;\n'),
    'archivo nuevo modificado': (dir) => {
      writeFileSync(path.join(dir, 'nuevo.js'), 'export const n = 1;\n');
      writeFileSync(path.join(dir, 'nuevo.js'), 'export const n = 2;\n');
    },
  };
  for (const [nombre, cambiar] of Object.entries(cambios)) {
    repo({}, (dir) => {
      escribirResultado(dir, resultadoValido(dir));
      cambiar(dir);
      const r = estado(dir);
      assert.equal(r.status, 1, `${nombre}: ${r.stdout}${r.stderr}`);
      assert.match(r.stdout, /motivo=huella_distinta/, nombre);
    });
  }
});

test('resultado corrupto: ningún caso sale con exit 0', (t) => {
  const casos = [
    ['no es JSON', 'no es json'],
    ['JSON vacío', ''],
    ['falta el campo fallo', (dir) => { const o = resultadoValido(dir); delete o.fallo; return o; }],
    ['fingerprint de otro largo', (dir) => resultadoValido(dir, { fingerprint: 'abc' })],
    ['ok como texto', (dir) => resultadoValido(dir, { ok: 'true' })],
    ['nivel desconocido', (dir) => resultadoValido(dir, { level: 'total' })],
    ['fallo desconocido', (dir) => resultadoValido(dir, { ok: false, fallo: 'raro' })],
    ['ok true con fallo', (dir) => resultadoValido(dir, { fallo: 'prueba' })],
    ['ok false con fallo ninguno', (dir) => resultadoValido(dir, { ok: false, fallo: 'ninguno' })],
    ['nivel menor que el pedido', (dir) => resultadoValido(dir, { level: 'rapida' })],
    ['sin archivo', null],
  ];
  assert.ok(casos.length > 0);
  for (const [nombre, caso] of casos) {
    repo({}, (dir) => {
      if (typeof caso === 'function') escribirResultado(dir, caso(dir));
      else if (typeof caso === 'string') escribirResultado(dir, caso);
      const r = estado(dir);
      t.diagnostic(`${nombre}: exit ${r.status}`);
      assert.notEqual(r.status, 0, `${nombre}: ${r.stdout}`);
    });
  }
});

test('fallo nunca cuenta como verificado: mismo árbol con ok false da exit 3; otro árbol da exit 1', () => {
  repo({}, (dir) => {
    escribirResultado(dir, resultadoValido(dir, { ok: false, fallo: 'prueba' }));
    const r = estado(dir);
    assert.equal(r.status, 3, r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`Fingerprint: ${fingerprintCurrent(dir)}`));
  });
  repo({}, (dir) => {
    escribirResultado(dir, resultadoValido(dir, { ok: false, fallo: 'prueba', fingerprint: '000000000000' }));
    const r = estado(dir);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=huella_distinta/);
  });
});

test('sin HEAD: estado funciona sin commit y detecta cambios en archivos sin seguimiento', () => {
  repo({ commit: false }, (dir) => {
    escribirResultado(dir, resultadoValido(dir));
    const quieto = estado(dir);
    assert.equal(quieto.status, 0, quieto.stdout + quieto.stderr);
    writeFileSync(path.join(dir, 'src', 'app.js'), 'export const value = 9;\n');
    const cambiado = estado(dir);
    assert.equal(cambiado.status, 1, cambiado.stdout + cambiado.stderr);
    assert.match(cambiado.stdout, /motivo=huella_distinta/);
  });
});

test('uso y motivos: carpeta que no es raíz da sin_huella, varias carpetas multi_repo y nivel inválido exit 2', () => {
  repo({}, (dir) => {
    escribirResultado(dir, resultadoValido(dir));
    const sub = cli_(['estado', '--nivel', 'aceptacion'], path.join(dir, 'src'));
    assert.equal(sub.status, 1, sub.stdout + sub.stderr);
    assert.match(sub.stdout, /motivo=sin_huella/);
    const varias = spawnSyncSeguro(process.execPath, [cli, 'estado', '--nivel', 'aceptacion', '--carpeta', dir, '--carpeta', dir], { encoding: 'utf8' });
    assert.equal(varias.status, 1, varias.stdout + varias.stderr);
    assert.match(varias.stdout, /motivo=multi_repo/);
    const malo = estado(dir, 'total');
    assert.equal(malo.status, 2, malo.stdout + malo.stderr);
  });
});

test('cerrar escribe de forma atómica y iniciar borra el anterior', () => {
  repo({}, (dir) => {
    escribirResultado(dir, resultadoValido(dir, { fingerprint: '000000000000' }));
    const ini = cli_(['iniciar'], dir);
    assert.equal(ini.status, 0, ini.stderr);
    const huella = ini.stdout.match(/^Fingerprint: ([0-9a-f]{12})$/m)?.[1];
    assert.ok(huella, ini.stdout);
    assert.equal(existsSync(path.join(dir, RESULTADO)), false, 'iniciar debe borrar el resultado anterior');
    const cie = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'verify', '--ok', 'true', '--fallo', 'ninguno', '--huella-inicio', huella], dir);
    assert.equal(cie.status, 0, cie.stdout + cie.stderr);
    assert.deepEqual(JSON.parse(readFileSync(path.join(dir, RESULTADO), 'utf8')), {
      fingerprint: huella, level: 'aceptacion', fase: 'verify', ok: true, fallo: 'ninguno',
    });
    assert.deepEqual(readdirSync(path.dirname(path.join(dir, RESULTADO))), ['resultado.json'], 'no debe quedar archivo temporal');
    const luego = estado(dir);
    assert.equal(luego.status, 0, luego.stdout + luego.stderr);
    assert.match(luego.stdout, /ya verificado/);
  });
});

test('cerrar no escribe si la huella de inicio no coincide o si ok y fallo son incoherentes', () => {
  repo({}, (dir) => {
    const ini = cli_(['iniciar'], dir);
    const huella = ini.stdout.match(/^Fingerprint: ([0-9a-f]{12})$/m)[1];
    const otra = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'verify', '--ok', 'true', '--fallo', 'ninguno', '--huella-inicio', '000000000000'], dir);
    assert.equal(otra.status, 1, otra.stdout + otra.stderr);
    assert.equal(existsSync(path.join(dir, RESULTADO)), false);
    const incoherente = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'verify', '--ok', 'true', '--fallo', 'prueba', '--huella-inicio', huella], dir);
    assert.equal(incoherente.status, 2, incoherente.stdout + incoherente.stderr);
    assert.equal(existsSync(path.join(dir, RESULTADO)), false);
    const malo = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'verify', '--ok', 'false', '--fallo', 'ninguno', '--huella-inicio', huella], dir);
    assert.equal(malo.status, 2, malo.stdout + malo.stderr);
    assert.equal(existsSync(path.join(dir, RESULTADO)), false);
  });
});

test('cerrar no escribe si el árbol cambió durante la corrida y registra un fallo cuando ok es false', () => {
  repo({}, (dir) => {
    const ini = cli_(['iniciar'], dir);
    const huella = ini.stdout.match(/^Fingerprint: ([0-9a-f]{12})$/m)[1];
    writeFileSync(path.join(dir, 'src', 'app.js'), 'export const value = 3;\n');
    const cambio = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'verify', '--ok', 'true', '--fallo', 'ninguno', '--huella-inicio', huella], dir);
    assert.equal(cambio.status, 1, cambio.stdout + cambio.stderr);
    assert.equal(existsSync(path.join(dir, RESULTADO)), false);
    writeFileSync(path.join(dir, 'src', 'app.js'), 'export const value = 1;\n');
    const ini2 = cli_(['iniciar'], dir);
    const huella2 = ini2.stdout.match(/^Fingerprint: ([0-9a-f]{12})$/m)[1];
    const falla = cli_(['cerrar', '--nivel', 'aceptacion', '--fase', 'tests', '--ok', 'false', '--fallo', 'prueba', '--huella-inicio', huella2], dir);
    assert.equal(falla.status, 0, falla.stdout + falla.stderr);
    assert.equal(JSON.parse(readFileSync(path.join(dir, RESULTADO), 'utf8')).ok, false);
    const r = estado(dir);
    assert.equal(r.status, 3, r.stdout + r.stderr);
  });
});
