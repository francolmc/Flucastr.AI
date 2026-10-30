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
const AGENTE_NUEVO = '---\nname: arquitecto\ndescription: "Agente de prueba."\n---\nCuerpo nuevo.\n';
const SKILL_OTRA = '---\nname: otra\ndescription: "Skill nueva."\n---\nContenido.\n';

function tar(args) {
  const r = spawnSync('tar', args, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

// Árbol mínimo con los scripts reales, un agente y una skill. Devuelve la carpeta origen (sha + kit.tar.gz).
// Opciones: quitar (rutas a borrar), sumar ({ruta: texto}), modelos (objeto o texto crudo) y fallo (instalar.sh
// falla a mitad de la instalación, solo en la ejecución real y no en --simular).
function origen(dir, sha, { agente = AGENTE_OK, quitar = [], sumar = {}, modelos, fallo = false } = {}) {
  const fuente = join(dir, 'fuente');
  const raizSha = join(fuente, `Flucastr.AI-${sha}`);
  for (const p of ['desinstalar.sh', 'instalar-remoto.sh', 'scripts']) cpSync(join(raiz, p), join(raizSha, p), { recursive: true });
  let instalar = readFileSync(join(raiz, 'instalar.sh'), 'utf8');
  if (fallo) {
    const ancla = '\nif [ "$INSTALAR_CLAUDE" = 1 ]; then\n  echo "Claude Code';
    if (!instalar.includes(ancla)) throw new Error('no encuentro el punto de falla en instalar.sh');
    instalar = instalar.replace(ancla, () => `\nif [ "$SIMULAR" = 0 ]; then echo "fallo simulado" >&2; exit 1; fi${ancla}`);
  }
  writeFileSync(join(raizSha, 'instalar.sh'), instalar);
  mkdirSync(join(raizSha, 'agentes'), { recursive: true });
  mkdirSync(join(raizSha, 'skills', 'prueba'), { recursive: true });
  writeFileSync(join(raizSha, 'agentes', 'arquitecto.md'), agente);
  writeFileSync(join(raizSha, 'skills', 'prueba', 'SKILL.md'), '---\nname: prueba\ndescription: "Skill de prueba."\n---\nContenido.\n');
  const real = JSON.parse(readFileSync(join(raiz, 'modelos.json'), 'utf8'));
  if (typeof modelos === 'string') writeFileSync(join(raizSha, 'modelos.json'), modelos);
  else writeFileSync(join(raizSha, 'modelos.json'), JSON.stringify(modelos ?? { ...real, agentes: { arquitecto: real.agentes.arquitecto } }, null, 2) + '\n');
  for (const [ruta, texto] of Object.entries(sumar)) {
    mkdirSync(dirname(join(raizSha, ruta)), { recursive: true });
    writeFileSync(join(raizSha, ruta), texto);
  }
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

caso('R2 segunda corrida con el mismo sha: al día sin cambios', () => {
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

caso('R8 sha nuevo: actualiza, quita la skill que ya no existe y no deja kit.anterior ni kit.nuevo', () => {
  const e = entorno('R8');
  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const antes = hechos(e.home);
  assert.ok(antes.kit.includes('skills/prueba/SKILL.md'), 'la primera instalación debía traer la skill prueba');

  origen(e.origen, SHA_B, { agente: AGENTE_NUEVO, quitar: ['skills/prueba'], sumar: { 'skills/otra/SKILL.md': SKILL_OTRA } });
  const r = ejecutar(e, []);
  exito(r);
  assert.match(r.stdout, new RegExp(`Actualizado: ${SHA_A} -> ${SHA_B}`));
  const despues = hechos(e.home);
  assert.match(despues.version, new RegExp(`^sha=${SHA_B}\n`));
  assert.ok(despues.kit.includes('skills/otra/SKILL.md'), 'falta la skill nueva en kit/');
  assert.equal(despues.kit.some(k => k.startsWith('skills/prueba')), false, 'quedó la skill que ya no existe en kit/');
  assert.equal(existsSync(join(e.home, '.claude', 'skills', 'prueba')), false, 'quedó la skill que ya no existe en el destino');
  assert.equal(existsSync(join(e.home, '.claude', 'skills', 'otra', 'SKILL.md')), true, 'no se instaló la skill nueva');
  assert.match(texto(instantanea(e.home), '.claude/agents/arquitecto.md'), /Cuerpo nuevo\./);
  assert.equal(existsSync(join(e.home, '.flucastr-ai', 'kit.anterior')), false, 'quedó kit.anterior');
  assert.equal(existsSync(join(e.home, '.flucastr-ai', 'kit.nuevo')), false, 'quedó kit.nuevo');
  // Control negativo: la skill que se quitó sí estaba antes, así que la comprobación de arriba no es trivial.
  assert.throws(() => assert.equal(despues.kit.some(k => k.startsWith('skills/prueba')), true), assert.AssertionError);
});

caso('R9 modelos.json personal: idéntico byte a byte tras actualizar; con novedades avisa sin tocarlo', () => {
  const e = entorno('R9');
  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const personal = join(e.home, '.flucastr-ai', 'modelos.json');
  const propio = JSON.parse(readFileSync(personal, 'utf8'));
  propio.agentes.arquitecto = { nivel: 'alto' };
  propio.nota_personal = 'no se toca';
  writeFileSync(personal, JSON.stringify(propio, null, 3) + '  \n');
  const bytes = readFileSync(personal);

  const real = JSON.parse(readFileSync(join(raiz, 'modelos.json'), 'utf8'));
  origen(e.origen, SHA_B, { modelos: { ...real, version: 2, agentes: { arquitecto: { nivel: 'medio' }, planificador: { nivel: 'medio' } } } });
  const r = ejecutar(e, []);
  exito(r);
  assert.match(r.stdout, /AVISO: el modelos\.json publicado trae cambios; compáralo con el tuyo:/);
  assert.match(r.stdout, /version: personal 1, publicado 2/);
  assert.match(r.stdout, /agente nuevo: planificador/);
  assert.match(r.stdout, /diff ~\/\.flucastr-ai\/modelos\.json ~\/\.flucastr-ai\/kit\/modelos\.json/);
  assert.deepEqual(readFileSync(personal), bytes, 'la actualización tocó el modelos.json personal');
  // Control negativo: el publicado sí quedó distinto del personal, así que el aviso tenía motivo.
  assert.notDeepEqual(readFileSync(join(e.home, '.flucastr-ai', 'kit', 'modelos.json')), bytes);
});

caso('R10 modelos.json inválido (del paquete o personal) = nada cambia y no se crea el personal', () => {
  // a) primera instalación con un modelos.json del paquete que no sirve: se rechaza antes de copiarlo.
  const a = entorno('R10-paquete');
  origen(a.origen, SHA_A, { modelos: '{ roto' });
  const ra = ejecutar(a, []);
  assert.equal(ra.status, 1);
  assert.match(ra.stderr, /no sirve para el agente/);
  sinRestos(hechos(a.home));
  assert.equal(existsSync(join(a.home, '.flucastr-ai', 'modelos.json')), false, 'se creó un personal roto');
  assert.equal(existsSync(join(a.home, '.flucastr-ai', 'manifiesto.txt')), false, 'quedó manifiesto');
  // Control negativo: con un paquete sano la misma primera instalación sí funciona.
  const ca = entorno('R10-paquete-control');
  origen(ca.origen, SHA_A);
  exito(ejecutar(ca, []));
  verificarPrimera(hechos(ca.home));

  // b) actualización con el personal roto: no se mueve nada y el HOME queda idéntico.
  const b = entorno('R10-personal');
  origen(b.origen, SHA_A);
  exito(ejecutar(b, []));
  writeFileSync(join(b.home, '.flucastr-ai', 'modelos.json'), '{ roto');
  origen(b.origen, SHA_B, { sumar: { 'skills/otra/SKILL.md': SKILL_OTRA } });
  const antes = instantanea(b.home);
  const rb = ejecutar(b, []);
  assert.equal(rb.status, 1);
  assert.match(rb.stderr, /no sirve para el agente/);
  assert.deepEqual(instantanea(b.home), antes, 'un personal inválido cambió el HOME');
  // Control negativo: con el personal sano, la misma actualización sí se hace.
  const cb = entorno('R10-personal-control');
  origen(cb.origen, SHA_A);
  exito(ejecutar(cb, []));
  origen(cb.origen, SHA_B, { sumar: { 'skills/otra/SKILL.md': SKILL_OTRA } });
  exito(ejecutar(cb, []));
  assert.match(texto(instantanea(cb.home), '.flucastr-ai/version'), new RegExp(SHA_B));
});

caso('R11 falla de instalar.sh en la actualización = vuelve a la versión anterior con version igual', () => {
  const e = entorno('R11');
  origen(e.origen, SHA_A);
  exito(ejecutar(e, []));
  const antes = instantanea(e.home);

  origen(e.origen, SHA_B, { agente: AGENTE_NUEVO, sumar: { 'skills/otra/SKILL.md': SKILL_OTRA }, fallo: true });
  const r = ejecutar(e, []);
  assert.equal(r.status, 1, 'debía fallar');
  assert.match(r.stderr, new RegExp(`FALLÓ la actualización; se restauró la versión anterior \\(${SHA_A}\\)\\.`));
  const despues = instantanea(e.home);
  assert.equal(texto(despues, '.flucastr-ai/version'), texto(antes, '.flucastr-ai/version'), 'version cambió');
  assert.equal(existsSync(join(e.home, '.flucastr-ai', 'kit.anterior')), false, 'quedó kit.anterior');
  assert.equal(existsSync(join(e.home, '.claude', 'skills', 'otra')), false, 'quedó la skill de la versión que falló');
  assert.deepEqual(despues, antes, 'la versión anterior no quedó como estaba');
  // Control negativo: el mismo origen sin el fallo sí actualiza.
  const c = entorno('R11-control');
  origen(c.origen, SHA_A);
  exito(ejecutar(c, []));
  origen(c.origen, SHA_B, { agente: AGENTE_NUEVO, sumar: { 'skills/otra/SKILL.md': SKILL_OTRA } });
  exito(ejecutar(c, []));
  assert.match(texto(instantanea(c.home), '.flucastr-ai/version'), new RegExp(SHA_B));
});

caso('R12 --actualizar sin instalación sale con 1; con el mismo sha no hay cambios ni aviso; comparar-modelos', () => {
  const e = entorno('R12');
  origen(e.origen, SHA_A);
  const vacio = instantanea(e.home);
  const sin = ejecutar(e, ['--actualizar']);
  assert.equal(sin.status, 1);
  assert.match(sin.stderr, /No hay instalación; corre el comando sin --actualizar\./);
  assert.deepEqual(instantanea(e.home), vacio, '--actualizar sin instalación cambió el HOME');

  exito(ejecutar(e, []));
  const instalado = instantanea(e.home);
  const igual = ejecutar(e, ['--actualizar']);
  exito(igual);
  assert.match(igual.stdout, new RegExp(`al día \\(${SHA_A}\\)`));
  assert.deepEqual(instantanea(e.home), instalado, 'al día cambió el HOME');

  origen(e.origen, SHA_B);
  const r = ejecutar(e, []);
  exito(r);
  assert.match(r.stdout, new RegExp(`Actualizado: ${SHA_A} -> ${SHA_B}`));
  // (instalar.sh puede imprimir su propio AVISO sobre el PATH de Pi; aquí solo importa el aviso de modelos.json)
  assert.doesNotMatch(r.stdout, /AVISO: el modelos\.json publicado trae cambios/, 'sin cambios en modelos.json no debe haber aviso');
  // Control negativo: el patrón sí distingue el aviso cuando lo hay (lo prueba R9).
  assert.throws(() => assert.doesNotMatch('AVISO: el modelos.json publicado trae cambios', /AVISO: el modelos\.json publicado trae cambios/), assert.AssertionError);

  // comparar-modelos directamente: iguales = nada; con novedades = las líneas esperadas.
  const dir = join(e.dir, 'comparar');
  mkdirSync(dir, { recursive: true });
  const propio = join(dir, 'propio.json');
  const igualJson = join(dir, 'igual.json');
  const nuevoJson = join(dir, 'nuevo.json');
  writeFileSync(propio, JSON.stringify({ version: 1, agentes: { arquitecto: { nivel: 'medio' } }, perfiles: { x: {} } }));
  writeFileSync(igualJson, JSON.stringify({ version: 1, agentes: { arquitecto: { nivel: 'medio' } }, perfiles: { x: {} } }));
  writeFileSync(nuevoJson, JSON.stringify({ version: 2, agentes: { arquitecto: {}, nuevo: {} }, perfiles: { x: {}, y: {} } }));
  const cmp = (b) => spawnSync('node', [join(raiz, 'scripts', 'resolver.mjs'), 'comparar-modelos', propio, b], { encoding: 'utf8' });
  const iguales = cmp(igualJson);
  assert.equal(iguales.status, 0, iguales.stderr);
  assert.equal(iguales.stdout, '', 'con modelos iguales no debe imprimir nada');
  const distintos = cmp(nuevoJson);
  assert.equal(distintos.status, 0, distintos.stderr);
  assert.equal(distintos.stdout, 'version: personal 1, publicado 2\nagente nuevo: nuevo\nperfil nuevo: y\n');
  // Control negativo: un JSON ilegible sale con error, no con «sin diferencias».
  writeFileSync(join(dir, 'roto.json'), '{ roto');
  const roto = cmp(join(dir, 'roto.json'));
  assert.notEqual(roto.status, 0, 'un JSON ilegible debía fallar');
});
