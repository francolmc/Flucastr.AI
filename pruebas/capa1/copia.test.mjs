import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Modo copia (instalar.sh --copiar). Cada entorno vive en pruebas/.temporales/ y usa un HOME temporal:
// nunca toca ~/.claude, ~/.pi ni ~/.flucastr-ai reales. Los entornos no se borran (quedan para revisar).
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'copia-'));
console.log(`Entorno conservado: ${corrida}`);

// Árbol mínimo derivado del real: scripts reales, un agente y una skill de prueba, y modelos.json con solo arquitecto.
function armarRepo(dir) {
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts']) cpSync(join(raiz, p), join(dir, p), { recursive: true });
  mkdirSync(join(dir, 'agentes'), { recursive: true });
  writeFileSync(join(dir, 'agentes', 'arquitecto.md'), '---\nname: arquitecto\ndescription: "Agente de prueba."\n---\nCuerpo de prueba.\n');
  mkdirSync(join(dir, 'skills', 'prueba'), { recursive: true });
  writeFileSync(join(dir, 'skills', 'prueba', 'SKILL.md'), '---\nname: prueba\ndescription: "Skill de prueba."\n---\nContenido.\n');
  const real = JSON.parse(readFileSync(join(raiz, 'modelos.json'), 'utf8'));
  writeFileSync(join(dir, 'modelos.json'), JSON.stringify({ ...real, agentes: { arquitecto: real.agentes.arquitecto } }, null, 2) + '\n');
}

function entorno(nombre) {
  const dir = join(corrida, nombre);
  const home = join(dir, 'home');
  const pi = join(home, 'pi-aislado');
  const tmp = join(dir, 'tmp');
  const kit = join(home, '.flucastr-ai', 'kit');
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

function enlaces(home) {
  return Object.entries(snapshot(home)).filter(([, v]) => v.tipo === 'enlace').map(([k]) => k);
}

function modoDelManifiesto(home) {
  return readFileSync(join(home, '.flucastr-ai', 'manifiesto.txt'), 'utf8').split('\n')[0].split('\t').slice(0, 2);
}

function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }

// 12 ejecuciones de instalar.sh en total: a=5, b=2, c=2, d=1, f=2.
test('a: --copiar deja copias reales con marca; sin --copiar hay enlaces; mezclar modos se rechaza sin cambiar nada', () => {
  const copia = entorno('a-copia');
  exito(copia.instalar('--copiar'));
  for (const ruta of [join(copia.home, '.claude/skills/prueba'), join(copia.pi, 'skills/prueba')]) {
    const s = lstatSync(ruta);
    assert.ok(s.isDirectory() && !s.isSymbolicLink(), `${ruta} no es una carpeta real`);
    assert.ok(existsSync(join(ruta, '.flucastr-ai')), `${ruta} no tiene la marca .flucastr-ai`);
  }
  assert.deepEqual(enlaces(copia.home), [], 'quedaron enlaces simbólicos tras --copiar');
  assert.deepEqual(modoDelManifiesto(copia.home), ['modo', 'descarga']);
  assert.match(readFileSync(join(copia.home, '.local/bin/pi-arquitecto'), 'utf8'), /^export FLUCASTR_MODELOS="[^"]+"$/m);

  const repo = entorno('a-repo');
  exito(repo.instalar());
  // control negativo: sin --copiar la misma skill sí es un enlace, y el modo queda como repo
  assert.ok(lstatSync(join(repo.home, '.claude/skills/prueba')).isSymbolicLink(), 'control: sin --copiar debía haber enlace');
  assert.deepEqual(modoDelManifiesto(repo.home), ['modo', 'repo']);
  assert.ok(!/FLUCASTR_MODELOS/.test(readFileSync(join(repo.home, '.local/bin/pi-arquitecto'), 'utf8')),
    'control: el lanzador sin --copiar no debe exportar FLUCASTR_MODELOS');

  const antesRepo = snapshot(repo.home);
  const mezclaCopia = repo.instalar('--copiar');
  assert.equal(mezclaCopia.status, 1, 'repo -> --copiar debía fallar');
  assert.match(mezclaCopia.stderr, /Hay una instalación en modo repo; ejecuta desinstalar\.sh antes de cambiar de modo\./);
  const mezclaSimular = repo.instalar('--copiar', '--simular');
  assert.equal(mezclaSimular.status, 1, 'repo -> --copiar --simular debía fallar');
  assert.deepEqual(snapshot(repo.home), antesRepo, 'el rechazo cambió el HOME');

  const antesCopia = snapshot(copia.home);
  const mezclaRepo = copia.instalar();
  assert.equal(mezclaRepo.status, 1, '--copiar -> repo debía fallar');
  assert.match(mezclaRepo.stderr, /Hay una instalación en modo descarga; ejecuta desinstalar\.sh antes de cambiar de modo\./);
  assert.deepEqual(snapshot(copia.home), antesCopia, 'el rechazo cambió el HOME de la copia');
});

test('b: el modelos.json personal determina el modelo y no cambia al reinstalar', () => {
  const e = entorno('b');
  exito(e.instalar('--copiar'));
  const personal = join(e.home, '.flucastr-ai', 'modelos.json');
  const cfg = JSON.parse(readFileSync(personal, 'utf8'));
  cfg.agentes.arquitecto.nivel = 'alto';
  writeFileSync(personal, JSON.stringify(cfg, null, 2) + '\n');
  const bytes = readFileSync(personal);
  exito(e.instalar('--copiar'));
  const modeloDe = (nivel, ruta) => {
    const c = JSON.parse(readFileSync(ruta, 'utf8'));
    return c.perfiles[c.perfil_por_defecto['claude-code']].modelos[nivel];
  };
  const esperado = modeloDe('alto', personal);
  const delRepo = modeloDe('medio', join(e.kit, 'modelos.json'));
  const generado = readFileSync(join(e.home, '.claude/agents/arquitecto.md'), 'utf8').match(/^model: (.+)$/m)?.[1];
  assert.equal(generado, esperado, 'el agente no usa el modelo del modelos.json personal');
  assert.notEqual(esperado, delRepo, 'control: el modelo del repo debía ser otro');
  assert.deepEqual(readFileSync(personal), bytes, 'el modelos.json personal cambió al reinstalar');
});

test('c: modelos.json personal roto con instalación previa falla sin cambiar el HOME', () => {
  const e = entorno('c');
  exito(e.instalar('--copiar'));
  writeFileSync(join(e.home, '.flucastr-ai', 'modelos.json'), '{ roto');
  const antes = snapshot(e.home);
  const r = e.instalar('--copiar');
  assert.notEqual(r.status, 0, 'con modelos.json roto debía fallar');
  assert.match(r.stderr, /no pude leer modelos\.json/);
  assert.deepEqual(snapshot(e.home), antes, 'el fallo cambió el HOME');
});

test('d: carpeta de skill sin marca se omite y desinstalar.sh no la borra', () => {
  const e = entorno('d');
  const propia = join(e.home, '.claude/skills/prueba');
  mkdirSync(propia, { recursive: true });
  writeFileSync(join(propia, 'SKILL.md'), 'skill personal\n');
  const r = e.instalar('--copiar');
  exito(r);
  assert.match(r.stdout, /OMITIDO \(ya existe y no es una copia de Flucastr\.AI\): .*\.claude\/skills\/prueba/);
  assert.equal(readFileSync(join(propia, 'SKILL.md'), 'utf8'), 'skill personal\n');
  assert.ok(!existsSync(join(propia, '.flucastr-ai')), 'la carpeta personal recibió la marca');
  // control negativo: la otra herramienta sí recibió su copia; el omitido es por la carpeta, no por el modo
  assert.ok(existsSync(join(e.pi, 'skills/prueba/.flucastr-ai')), 'control: Pi debía recibir su copia');
  exito(e.desinstalar());
  assert.equal(readFileSync(join(propia, 'SKILL.md'), 'utf8'), 'skill personal\n', 'desinstalar.sh borró la carpeta personal');
});

test('f: desinstalar quita copias, agente y kit/ y conserva modelos.json; con --todo lo borra', () => {
  const e = entorno('f');
  exito(e.instalar('--copiar'));
  const personal = join(e.home, '.flucastr-ai', 'modelos.json');
  const bytes = readFileSync(personal);
  const instalados = [
    join(e.home, '.claude/skills/prueba'), join(e.pi, 'skills/prueba'),
    join(e.home, '.claude/agents/arquitecto.md'), join(e.pi, 'agents/arquitecto.md'),
    join(e.home, '.local/bin/pi-arquitecto')
  ];
  for (const r of instalados) assert.ok(existsSync(r), `control: falta ${r} antes de desinstalar`);

  exito(e.desinstalar());
  for (const r of instalados) assert.ok(!existsSync(r), `sigue ${r} tras desinstalar`);
  assert.ok(!existsSync(e.kit), 'kit/ sigue existiendo tras desinstalar');
  assert.ok(!existsSync(join(e.home, '.flucastr-ai', 'manifiesto.txt')), 'sigue el manifiesto');
  assert.deepEqual(readdirSync(join(e.home, '.flucastr-ai')), ['modelos.json']);
  assert.deepEqual(readFileSync(personal), bytes, 'desinstalar cambió modelos.json');

  // reinstalar para probar --todo con manifiesto presente: el kit se vuelve a copiar, como hará task-02
  armarRepo(e.kit);
  exito(e.instalar('--copiar'));
  exito(e.desinstalar('--todo'));
  for (const r of instalados) assert.ok(!existsSync(r), `sigue ${r} tras --todo`);
  assert.ok(!existsSync(join(e.home, '.flucastr-ai')), '--todo debía dejar .flucastr-ai sin existir');
});
