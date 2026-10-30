import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Instalación sin clon (instalar-remoto.sh). Sin red: todo sale de FLUCASTR_ORIGEN (carpeta local con `sha` y `kit.tar.gz`).
// Cada entorno vive en pruebas/.temporales/ con HOME temporal: nunca toca ~/.claude, ~/.pi ni ~/.flucastr-ai reales.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'remoto-'));
console.log(`Entorno conservado: ${corrida}`);

const SHA_A = '1234567890abcdef1234567890abcdef12345678';
const SHA_B = 'fedcba0987654321fedcba0987654321fedcba09';
const AGENTE_OK = '---\nname: arquitecto\ndescription: "Agente de prueba."\n---\nCuerpo de prueba.\n';
const AGENTE_MALO = '---\nname: arquitecto\nmodel: modelo-prohibido\ndescription: "Agente de prueba."\n---\nCuerpo.\n';

function tar(args) {
  const r = spawnSync('tar', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

// Árbol mínimo con los scripts reales, un agente y una skill. Devuelve la carpeta origen (sha + kit.tar.gz).
function origen(dir, sha, { agente = AGENTE_OK, quitar = [] } = {}) {
  const fuente = join(dir, 'fuente');
  const raizSha = join(fuente, `Flucastr.AI-${sha}`);
  for (const p of ['instalar.sh', 'desinstalar.sh', 'instalar-remoto.sh', 'scripts']) cpSync(join(raiz, p), join(raizSha, p), { recursive: true });
  mkdirSync(join(raizSha, 'agentes'), { recursive: true });
  mkdirSync(join(raizSha, 'skills', 'prueba'), { recursive: true });
  writeFileSync(join(raizSha, 'agentes', 'arquitecto.md'), agente);
  writeFileSync(join(raizSha, 'skills', 'prueba', 'SKILL.md'), '---\nname: prueba\ndescription: "Skill de prueba."\n---\nContenido.\n');
  const real = JSON.parse(readFileSync(join(raiz, 'modelos.json'), 'utf8'));
  writeFileSync(join(raizSha, 'modelos.json'), JSON.stringify({ ...real, agentes: { arquitecto: real.agentes.arquitecto } }, null, 2) + '\n');
  for (const q of quitar) rmSync(join(raizSha, q), { recursive: true, force: true });
  tar(['-czf', join(dir, 'kit.tar.gz'), '-C', fuente, `Flucastr.AI-${sha}`]);
  writeFileSync(join(dir, 'sha'), `${sha}\n`);
  return dir;
}

// Paquete con una entrada peligrosa: «..», absoluta o enlace simbólico.
function paqueteMalo(dir, tipo) {
  const fuente = join(dir, 'fuente');
  const raizSha = join(fuente, `Flucastr.AI-${SHA_A}`);
  mkdirSync(raizSha, { recursive: true });
  writeFileSync(join(raizSha, 'inofensivo.txt'), 'x\n');
  const paquete = join(dir, 'kit.tar.gz');
  const entrada = `Flucastr.AI-${SHA_A}/inofensivo.txt`;
  if (tipo === 'enlace') {
    symlinkSync('inofensivo.txt', join(raizSha, 'enlace'));
    tar(['-czf', paquete, '-C', fuente, `Flucastr.AI-${SHA_A}`]);
  } else if (tipo === 'ruta-..') {
    tar(['-czf', paquete, '-C', fuente, '-s', `|^${entrada}|Flucastr.AI-${SHA_A}/../escapado.txt|`, entrada]);
  } else {
    tar(['-P', '-czf', paquete, '-C', fuente, '-s', `|^${entrada}|${dir}/absoluto.txt|`, entrada]);
  }
  writeFileSync(join(dir, 'sha'), `${SHA_A}\n`);
  return dir;
}

function entorno(nombre) {
  const dir = join(corrida, nombre);
  const home = join(dir, 'home');
  const pi = join(home, 'pi-aislado');
  const tmp = join(dir, 'tmp');
  for (const p of [home, pi, tmp, join(home, '.claude'), join(dir, 'origen')]) mkdirSync(p, { recursive: true });
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: pi, TMPDIR: tmp, TMP: tmp, TEMP: tmp, FLUCASTR_ORIGEN: join(dir, 'origen') };
  delete env.FLUCASTR_MODELOS;
  return { dir, home, origen: join(dir, 'origen'), env };
}

// Ejecuta instalar-remoto.sh. Sin origen solo se permite --mostrar-urls (que no se conecta).
function ejecutar(e, args, { conOrigen = true } = {}) {
  if (!conOrigen && !args.includes('--mostrar-urls')) throw new Error('prueba sin origen local: podría tocar la red');
  const env = { ...e.env };
  if (!conOrigen) delete env.FLUCASTR_ORIGEN;
  const r = spawnSync('bash', [join(raiz, 'instalar-remoto.sh'), ...args], { cwd: e.dir, env, encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error || r.signal) throw new Error(`No se pudo ejecutar instalar-remoto.sh: ${r.error ?? r.signal}`);
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}
function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }

// Árbol de HOME: enlaces, directorios y contenido. Sirve para demostrar que nada cambió.
function instantanea(dir) {
  const entradas = {};
  (function recorrer(actual, rel = '') {
    for (const nombre of readdirSync(actual).sort()) {
      const ruta = join(actual, nombre);
      const clave = join(rel, nombre);
      const s = lstatSync(ruta);
      if (s.isSymbolicLink()) entradas[clave] = { enlace: readlinkSync(ruta) };
      else if (s.isDirectory()) { entradas[clave] = { dir: s.mode & 0o777 }; recorrer(ruta, clave); }
      else entradas[clave] = { archivo: readFileSync(ruta).toString('base64'), modo: s.mode & 0o777 };
    }
  })(dir);
  return entradas;
}
const texto = (s, clave) => (s[clave]?.archivo === undefined ? undefined : Buffer.from(s[clave].archivo, 'base64').toString());

// Hechos de una primera instalación, leídos del HOME.
function hechos(home) {
  const s = instantanea(home);
  const kit = Object.keys(s).filter(k => k.startsWith('.flucastr-ai/kit/')).map(k => k.slice('.flucastr-ai/kit/'.length));
  return {
    version: texto(s, '.flucastr-ai/version'),
    manifiesto: (texto(s, '.flucastr-ai/manifiesto.txt') ?? '').split('\n')[0],
    enlaces: Object.keys(s).filter(k => s[k].enlace !== undefined),
    kit,
    marcaSkill: s['.claude/skills/prueba']?.dir !== undefined && s['.claude/skills/prueba/.flucastr-ai']?.archivo !== undefined,
    modelosPersonal: s['.flucastr-ai/modelos.json']?.archivo !== undefined,
    agenteGenerado: s['.claude/agents/arquitecto.md']?.archivo !== undefined
  };
}
function verificarPrimera(h) {
  assert.match(h.version ?? '', new RegExp(`^sha=${SHA_A}\nfecha=\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z\nref=main\n$`));
  assert.deepEqual(h.enlaces, []);
  assert.equal(h.manifiesto, 'modo\tdescarga\t');
  for (const r of ['instalar.sh', 'desinstalar.sh', 'instalar-remoto.sh', 'modelos.json', 'scripts/resolver.mjs', 'agentes/arquitecto.md', 'skills/prueba/SKILL.md']) {
    assert.ok(h.kit.includes(r), `falta ${r} en kit/`);
  }
  assert.equal(h.marcaSkill, true, 'la skill copiada no tiene marca o es un enlace');
  assert.equal(h.modelosPersonal, true, 'no se creó modelos.json personal');
  assert.equal(h.agenteGenerado, true, 'no se generó el agente de Claude Code');
}
function sinRestos(h) {
  assert.equal(h.version, undefined, 'quedó version');
  assert.equal(h.kit.length, 0, 'quedó kit/');
}

function caso(nombre, fn) { test(nombre, fn); }

caso('R1 primera instalación: copia sin enlaces, version escrito, modelos personal creado', () => {
  const e = entorno('R1');
  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const h = hechos(e.home);
  verificarPrimera(h);
  // Control negativo: el mismo verificador debe rechazar una instalación con un enlace simbólico.
  assert.throws(() => verificarPrimera({ ...h, enlaces: ['.claude/skills/prueba'] }), assert.AssertionError);
});

caso('R2 segunda corrida: al día sin cambios; sha nuevo: aviso sin tocar nada', () => {
  const e = entorno('R2');
  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const antes = instantanea(e.home);
  const repetida = ejecutar(e, []);
  exito(repetida);
  assert.match(repetida.stdout, new RegExp(`al día \\(${SHA_A}\\)`));
  assert.deepEqual(instantanea(e.home), antes, 'la segunda corrida cambió el HOME');
  // Control negativo: una salida que dice «hay versión nueva» no es «al día».
  assert.throws(() => assert.match('Hay una versión nueva', /al día/), assert.AssertionError);

  writeFileSync(join(e.origen, 'sha'), `${SHA_B}\n`);
  const nueva = ejecutar(e, []);
  exito(nueva);
  assert.match(nueva.stdout, /Hay una versión nueva; la actualización se agrega en task-03/);
  assert.deepEqual(instantanea(e.home), antes, 'el aviso de versión nueva cambió el HOME');
});

caso('R3 --estado y --mostrar-urls: no escriben ni descargan; textos exactos', () => {
  const e = entorno('R3');
  writeFileSync(join(e.origen, 'sha'), `${SHA_A}\n`); // sin kit.tar.gz: si descargara, fallaría
  const sinInstalar = instantanea(e.home);
  const est1 = ejecutar(e, ['--estado']);
  exito(est1);
  assert.equal(est1.stdout, `instalada: ninguna\npublicada: ${SHA_A}\nno instalado\n`);
  assert.deepEqual(instantanea(e.home), sinInstalar);

  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const instalado = instantanea(e.home);
  const est2 = ejecutar(e, ['--estado']);
  exito(est2);
  assert.equal(est2.stdout, `instalada: ${SHA_A}\npublicada: ${SHA_A}\nal día\n`);
  writeFileSync(join(e.origen, 'sha'), `${SHA_B}\n`);
  const est3 = ejecutar(e, ['--estado']);
  exito(est3);
  assert.equal(est3.stdout, `instalada: ${SHA_A}\npublicada: ${SHA_B}\nhay versión nueva\n`);
  assert.deepEqual(instantanea(e.home), instalado, '--estado cambió el HOME');

  const urls = ejecutar(e, ['--mostrar-urls'], { conOrigen: false });
  exito(urls);
  assert.equal(urls.stdout,
    'script: https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh\n' +
    'sha: https://api.github.com/repos/francolmc/Flucastr.AI/commits/main\n' +
    'descarga: https://codeload.github.com/francolmc/Flucastr.AI/tar.gz/<sha>\n');
  assert.deepEqual(instantanea(e.home), instalado, '--mostrar-urls cambió el HOME');
  // Control negativo: un texto con otro sha publicado no coincide con lo que se leyó.
  assert.notEqual(est3.stdout, est2.stdout);
});

caso('R4 tarball peligroso (.., absoluta, enlace) = RECHAZADO sin kit ni version; con contenido sano sí instala', () => {
  for (const tipo of ['ruta-..', 'absoluta', 'enlace']) {
    const e = entorno(`R4-${tipo}`);
    paqueteMalo(e.origen, tipo);
    const r = ejecutar(e, []);
    assert.equal(r.status, 1, `${tipo}: debía fallar`);
    assert.match(r.stderr, /RECHAZADO/, `${tipo}: falta el mensaje RECHAZADO`);
    sinRestos(hechos(e.home));
    assert.equal(existsSync(join(e.home, '.flucastr-ai', 'escapado.txt')), false);
    assert.equal(Object.keys(instantanea(e.home)).some(k => k.endsWith('escapado.txt') || k.endsWith('absoluto.txt')), false);
  }
  // Control negativo: el mismo flujo con un paquete sano sí instala (así se ve que el rechazo viene del contenido).
  const control = entorno('R4-control');
  origen(control.origen, SHA_A);
  exito(ejecutar(control, []));
});

caso('R5 tarball incompleto = RECHAZADO «falta …» sin kit ni version; completo sí instala', () => {
  const casos = [
    { quitar: ['instalar.sh'], falta: 'RECHAZADO: falta instalar.sh' },
    { quitar: ['agentes'], falta: 'RECHAZADO: falta agentes/\\*\\.md' }
  ];
  for (const { quitar, falta } of casos) {
    const e = entorno(`R5-${quitar[0]}`);
    origen(e.origen, SHA_A, { quitar });
    const r = ejecutar(e, []);
    assert.equal(r.status, 1);
    assert.match(r.stderr, new RegExp(falta));
    sinRestos(hechos(e.home));
  }
  // Control negativo: sin quitar nada, el mismo flujo instala.
  const control = entorno('R5-control');
  origen(control.origen, SHA_A);
  exito(ejecutar(control, []));
  assert.match(texto(instantanea(control.home), '.flucastr-ai/version'), new RegExp(SHA_A));
});

caso('R6 falla de instalar.sh en la primera instalación = sin kit, sin version y sin manifiesto', () => {
  const e = entorno('R6');
  origen(e.origen, SHA_A, { agente: AGENTE_MALO });
  const r = ejecutar(e, []);
  assert.equal(r.status, 1, 'debía fallar');
  assert.match(r.stderr, /La instalación falló; no se escribió version\./);
  const h = hechos(e.home);
  sinRestos(h);
  assert.equal(h.manifiesto, '', 'quedó manifiesto.txt');
  assert.equal(existsSync(join(e.home, '.claude', 'skills', 'prueba')), false, 'quedó una skill copiada');
  // Control negativo: el mismo flujo con el agente sano sí instala.
  const control = entorno('R6-control');
  origen(control.origen, SHA_A);
  exito(ejecutar(control, []));
  verificarPrimera(hechos(control.home));
});

caso('R7 instalación en modo repo previa = se niega antes de descargar, sin tocar nada', () => {
  const e = entorno('R7');
  mkdirSync(join(e.home, '.flucastr-ai'), { recursive: true });
  writeFileSync(join(e.home, '.flucastr-ai', 'manifiesto.txt'), 'modo\trepo\t\n');
  origen(e.origen, SHA_A);
  const antes = instantanea(e.home);
  const r = ejecutar(e, []);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Hay una instalación en modo repo; ejecuta desinstalar\.sh antes de cambiar de modo\./);
  assert.deepEqual(instantanea(e.home), antes, 'la negativa cambió el HOME');
  // Control negativo: sin manifiesto previo, el mismo origen instala.
  const control = entorno('R7-control');
  origen(control.origen, SHA_A);
  exito(ejecutar(control, []));
});
