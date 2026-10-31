import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Modo --skills-proyecto (copia de skills de Pi dentro de un proyecto, exclusión local y manifiesto).
// Cada entorno vive en pruebas/.temporales/ y usa un HOME temporal: nunca toca ~/.claude, ~/.pi ni
// ~/.flucastr-ai reales. Los entornos no se borran (quedan para revisar).
// Las pruebas comparten un solo entorno y corren en orden (a, b, c, d): cada una parte del estado de la anterior.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'skills-proyecto-'));
console.log(`Entorno conservado: ${corrida}`);

// Árbol mínimo derivado del real: scripts reales, un agente, dos skills de prueba y modelos.json con solo arquitecto.
// El kit va fuera de HOME/.flucastr-ai: en modo repo, desinstalar.sh no lo borra y el directorio debe quedar sin existir.
function armarRepo(dir) {
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts']) cpSync(join(raiz, p), join(dir, p), { recursive: true });
  mkdirSync(join(dir, 'agentes'), { recursive: true });
  writeFileSync(join(dir, 'agentes', 'arquitecto.md'), '---\nname: arquitecto\ndescription: "Agente de prueba."\n---\nCuerpo de prueba.\n');
  for (const skill of ['prueba', 'otra']) {
    mkdirSync(join(dir, 'skills', skill), { recursive: true });
    writeFileSync(join(dir, 'skills', skill, 'SKILL.md'), `---\nname: ${skill}\ndescription: "Skill de prueba."\n---\nContenido.\n`);
  }
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
    home, pi, kit,
    instalar: (...args) => ejecutar('bash', [join(kit, 'instalar.sh'), ...args]),
    desinstalar: (...args) => ejecutar('bash', [join(kit, 'desinstalar.sh'), ...args]),
    ejecutar
  };
}

// Proyecto con git (dentro de la corrida) o sin git (fuera del repo del kit: si no, git usaría el exclude de Flucastr.AI).
function crearProyecto(nombre, { git = true } = {}) {
  if (!git) return mkdtempSync(join(tmpdir(), 'flucastr-sin-git-'));
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

function enlaces(dir) {
  return Object.entries(snapshot(dir)).filter(([, v]) => v.tipo === 'enlace').map(([k]) => k);
}

function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }

function excludePath(proyecto) { return join(proyecto, '.git', 'info', 'exclude'); }
function excludeDe(proyecto) { return readFileSync(excludePath(proyecto), 'utf8').split('\n'); }

function gitStatus(proyecto) {
  const r = spawnSync('git', ['-C', proyecto, 'status', '--porcelain'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.split('\n').filter(Boolean);
}

// Líneas del manifiesto como [tipo, ruta, extra].
function manifiesto(e) {
  return readFileSync(join(e.home, '.flucastr-ai', 'manifiesto.txt'), 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
}

const esDe = (ruta, proyecto) => ruta === proyecto || ruta.startsWith(proyecto + '/');

// Entorno y proyecto compartidos por las cuatro pruebas (en orden).
const e = entorno('compartido');
const p = crearProyecto('p');

// Instalaciones de instalar.sh en el archivo (cada una cuenta en el máximo): a=5, b=1, c=1. desinstalar.sh: d=2.
test('a: copia y exclusión', () => {
  // Errores de flag: salen con 1 antes de escribir nada.
  const antes = snapshot(e.home);
  const sinProyecto = e.instalar('--skills-proyecto');
  assert.equal(sinProyecto.status, 1);
  assert.match(sinProyecto.stderr, /--skills-proyecto necesita --proyecto <ruta>/);
  const conSolo = e.instalar('--proyecto', p, '--skills-proyecto', '--solo', 'claude');
  assert.equal(conSolo.status, 1);
  assert.match(conSolo.stderr, /--skills-proyecto no se combina con --solo claude/);
  assert.deepEqual(snapshot(e.home), antes, 'el rechazo del flag cambió el HOME');

  // Simulación en otra carpeta: lista lo que copiaría y no crea .pi.
  const s = crearProyecto('s');
  const sim = e.instalar('--simular', '--proyecto', s, '--skills-proyecto');
  exito(sim);
  assert.match(sim.stdout, /copiaría: .*\.pi\/skills\/prueba/);
  assert.ok(!existsSync(join(s, '.pi')), 'la simulación creó .pi');

  // Instalación real: carpetas reales con marca, sin enlaces, excluidas en git.
  exito(e.instalar('--proyecto', p, '--skills-proyecto'));
  for (const skill of ['prueba', 'otra']) {
    const ruta = join(p, '.pi', 'skills', skill);
    const st = lstatSync(ruta);
    assert.ok(st.isDirectory() && !st.isSymbolicLink(), `${ruta} no es una carpeta real`);
    assert.ok(existsSync(join(ruta, '.flucastr-ai')), `${ruta} no tiene la marca .flucastr-ai`);
  }
  assert.deepEqual(enlaces(join(p, '.pi', 'skills')), [], 'quedaron enlaces simbólicos en .pi/skills');
  const ex = excludeDe(p);
  assert.ok(ex.includes('/.pi/skills/prueba/'), 'falta la exclusión de prueba');
  assert.ok(ex.includes('/.pi/skills/otra/'), 'falta la exclusión de otra');
  // git status: .pi no aparece. Real hoy: --proyecto fija el agente en .claude/settings.local.json, sin ignorar
  // (task-03, Notas), y git lo muestra como carpeta «?? .claude/». Es el comportamiento conocido hasta que Franco decida.
  assert.deepEqual(gitStatus(p), ['?? .claude/'], 'git status: solo debía quedar el ajuste del agente (.claude/)');
  const m = manifiesto(e);
  assert.equal(m.filter((l) => l[0] === 'skills-proyecto' && l[1] === p).length, 1, 'skills-proyecto de p');
  assert.equal(m.filter((l) => l[0] === 'directorio' && esDe(l[1], join(p, '.pi', 'skills'))).length, 2, 'directorios de p');
  assert.equal(m.filter((l) => l[0] === 'exclusion' && l[1] === excludePath(p)).length, 2, 'exclusiones de p');

  // Control negativo: un proyecto instalado sin el flag no recibe .pi/; con el flag sí hay marca (la misma comprobación pasa).
  const n = crearProyecto('n');
  exito(e.instalar('--proyecto', n));
  assert.ok(!existsSync(join(n, '.pi')), 'control negativo: sin --skills-proyecto no debe haber .pi/');
  assert.ok(existsSync(join(p, '.pi', 'skills', 'prueba', '.flucastr-ai')), 'control: con el flag debe haber marca');
});

test('b: reinstalación', () => {
  // El kit cambia; una carpeta ajena (sin marca) dentro de .pi/skills debe quedar intacta.
  writeFileSync(join(e.kit, 'skills', 'prueba', 'SKILL.md'), '---\nname: prueba\ndescription: "Skill de prueba."\n---\nContenido nuevo.\n');
  const propia = join(p, '.pi', 'skills', 'propia');
  mkdirSync(propia, { recursive: true });
  writeFileSync(join(propia, 'SKILL.md'), 'propia\n');

  exito(e.instalar());
  assert.match(readFileSync(join(p, '.pi', 'skills', 'prueba', 'SKILL.md'), 'utf8'), /Contenido nuevo\./, 'la copia no se actualizó');
  for (const skill of ['prueba', 'otra']) {
    const cuenta = excludeDe(p).filter((l) => l === `/.pi/skills/${skill}/`).length;
    assert.equal(cuenta, 1, `exclusión de ${skill} duplicada o ausente (${cuenta})`);
  }
  const m = manifiesto(e);
  assert.equal(m.filter((l) => l[0] === 'skills-proyecto' && l[1] === p).length, 1, 'skills-proyecto de p duplicado');
  assert.ok(!m.some((l) => l[1] && l[1].includes('propia')), 'la carpeta ajena quedó en el manifiesto');
  assert.ok(!excludeDe(p).includes('/.pi/skills/propia/'), 'la carpeta ajena quedó excluida');
  assert.equal(readFileSync(join(propia, 'SKILL.md'), 'utf8'), 'propia\n', 'la carpeta ajena cambió');
});

test('c: sin git', () => {
  const q = crearProyecto('q', { git: false });
  const r = e.instalar('--proyecto', q, '--skills-proyecto');
  exito(r);
  assert.match(r.stdout, /no es un repo git/);
  assert.ok(!existsSync(join(q, '.git')), 'el proyecto de prueba no debía ser repo git');
  for (const skill of ['prueba', 'otra']) {
    assert.ok(existsSync(join(q, '.pi', 'skills', skill, '.flucastr-ai')), `falta la copia de ${skill}`);
  }
  const m = manifiesto(e);
  assert.equal(m.filter((l) => l[0] === 'skills-proyecto' && l[1] === q).length, 1, 'skills-proyecto de q');
  assert.equal(m.filter((l) => l[0] === 'exclusion' && esDe(l[1], q)).length, 0, 'sin git no debía haber exclusión de q');
});

test('d: desinstalación', () => {
  // Una línea previa del cliente en el exclude: debe sobrevivir.
  appendFileSync(excludePath(p), '*.log\n');
  exito(e.desinstalar('--proyecto', p));
  assert.ok(existsSync(join(p, '.pi')), 'p/.pi no debía desaparecer: queda la carpeta ajena');
  assert.deepEqual(readdirSync(join(p, '.pi')), ['skills'], 'p/.pi tiene más de lo ajeno');
  assert.deepEqual(readdirSync(join(p, '.pi', 'skills')), ['propia'], 'p/.pi/skills tiene más de la carpeta ajena');
  const ex = excludeDe(p);
  assert.ok(ex.includes('*.log'), 'se perdió la línea previa del cliente');
  assert.ok(!ex.includes('/.pi/skills/prueba/') && !ex.includes('/.pi/skills/otra/'), 'quedan exclusiones de Flucastr.AI');
  assert.ok(existsSync(join(e.home, '.claude', 'agents', 'arquitecto.md')), 'el agente global se borró');
  assert.ok(!manifiesto(e).some((l) => l[1] && esDe(l[1], p)), 'quedan líneas de p en el manifiesto');
  assert.ok(!manifiesto(e).some((l) => l[0] === 'skills-proyecto' && l[1] === join(corrida, 'proyecto-n')), 'control: n no debía estar registrado');

  // Desinstalación total: borra lo que instaló (también el proyecto de c) y deja .flucastr-ai sin existir.
  const q = manifiesto(e).find((l) => l[0] === 'skills-proyecto')?.[1];
  assert.ok(q, 'control: debía quedar el proyecto sin git de c');
  exito(e.desinstalar());
  assert.ok(!existsSync(join(q, '.pi', 'skills', 'prueba')), 'la desinstalación total dejó la copia de c');
  assert.ok(!existsSync(join(e.home, '.claude', 'agents', 'arquitecto.md')), 'la desinstalación total dejó el agente');
  assert.ok(!existsSync(join(e.home, '.flucastr-ai')), '.flucastr-ai debía dejar de existir');
  assert.ok(existsSync(join(p, '.pi', 'skills', 'propia', 'SKILL.md')), 'la carpeta ajena de p se borró');
});
