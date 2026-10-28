import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, lstatSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { comprobar } from '../comprobaciones/capa1.mjs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = join(raiz, 'pruebas', '.temporales');
mkdirSync(base, { recursive: true });
const corrida = mkdtempSync(join(base, 'capa1-'));
console.log(`Entorno conservado: ${corrida}`);

// Sin limpieza automática: todos los artefactos permanecen dentro de pruebas/.
function entorno(nombre) {
  const dir = join(corrida, nombre);
  const repo = join(dir, 'repo');
  const home = join(dir, 'home');
  const pi = join(home, 'pi-aislado');
  const tmp = join(dir, 'tmp');
  for (const p of [repo, home, pi, tmp, join(home, '.claude')]) mkdirSync(p, { recursive: true });
  for (const p of ['instalar.sh', 'desinstalar.sh', 'scripts', 'agentes', 'skills', 'modelos.json']) {
    cpSync(join(raiz, p), join(repo, p), { recursive: true });
  }
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: pi, TMPDIR: tmp, TMP: tmp, TEMP: tmp };
  function ejecutar(cmd, args) {
    const r = spawnSync(cmd, args, { cwd: repo, env, encoding: 'utf8', timeout: 30000 });
    if (r.error || r.signal) throw new Error(`No se pudo ejecutar ${cmd}: ${r.error ?? r.signal}`);
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  }
  return { repo, home, pi, ejecutar,
    resolver: (...args) => ejecutar(process.execPath, [join(repo, 'scripts/resolver.mjs'), ...args]),
    instalar: (...args) => ejecutar('bash', [join(repo, 'instalar.sh'), ...args]),
    desinstalar: (...args) => ejecutar('bash', [join(repo, 'desinstalar.sh'), ...args]) };
}
function snapshot(dir) {
  const entradas = {};
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
function exito(r) { assert.equal(r.status, 0, r.stderr || r.stdout); }
function guardar(nombre, datos) { writeFileSync(join(corrida, `${nombre}.json`), JSON.stringify(datos, null, 2) + '\n'); }
function caso(id, obtener) {
  test(`${id}: comprobación real`, () => {
    const datos = obtener();
    guardar(id, datos);
    comprobar(id, datos);
  });
}

caso('I1', () => {
  const e = entorno('I1');
  const config = JSON.parse(readFileSync(join(e.repo, 'modelos.json')));
  return ['claude-code', 'pi'].map(herramienta => ({ herramienta,
    modelos: Object.values(config.perfiles).filter(p => p.herramienta === herramienta).flatMap(p => Object.values(p.modelos)),
    ...e.resolver('modelo', 'arquitecto', herramienta) }));
});
caso('I2', () => {
  const e = entorno('I2');
  exito(e.instalar());
  return [join(e.home, '.claude/agents'), join(e.pi, 'agents')].flatMap(dir =>
    readdirSync(dir).filter(n => n.endsWith('.md')).map(n => ({ nombre: n.slice(0, -3), texto: readFileSync(join(dir, n), 'utf8') })));
});
caso('I3', () => {
  const e = entorno('I3');
  writeFileSync(join(e.home, '.claude', 'personal.txt'), 'No modificar\n');
  const antes = snapshot(e.home);
  exito(e.instalar());
  exito(e.desinstalar());
  return [{ antes, despues: snapshot(e.home), motivo: 'instalar/desinstalar no restauró el árbol inicial (incluye directorios)' }];
});
caso('I4', () => {
  const e = entorno('I4');
  // Colisiones ajenas tanto de agentes como de lanzadores y skills.
  for (const dir of [join(e.home, '.claude/agents'), join(e.pi, 'agents'), join(e.home, '.local/bin')]) mkdirSync(dir, { recursive: true });
  for (const ruta of [join(e.home, '.claude/agents/arquitecto.md'), join(e.pi, 'agents/arquitecto.md'), join(e.home, '.local/bin/pi-arquitecto')]) writeFileSync(ruta, 'archivo personal\n');
  for (const dir of [join(e.home, '.claude/skills/definir-proyecto'), join(e.pi, 'skills/definir-proyecto')]) {
    mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'SKILL.md'), 'skill personal\n');
  }
  const colisiones = snapshot(e.home);
  exito(e.instalar());
  const primera = snapshot(e.home);
  const conservados = Object.fromEntries(Object.keys(colisiones).map(k => [k, primera[k]]));
  exito(e.instalar());
  const segunda = snapshot(e.home);
  exito(e.instalar('--simular'));
  exito(e.desinstalar('--simular'));
  const limpia = entorno('I4-simulacion-limpia');
  const antesLimpia = snapshot(limpia.home);
  const simulacion = limpia.ejecutar('bash', ['-x', join(limpia.repo, 'instalar.sh'), '--simular']);
  exito(simulacion);
  return [
    { antes: colisiones, despues: conservados, motivo: 'pisó archivos personales' },
    { antes: primera, despues: segunda, motivo: 'segunda instalación cambió contenido, permisos o enlaces' },
    { antes: segunda, despues: snapshot(e.home), motivo: 'simulación sobre instalación escribió' },
    { antes: antesLimpia, despues: snapshot(limpia.home), motivo: 'simulación limpia escribió',
      creoTemporal: /\+\+ mktemp\n\+ NUEVO=\S+/.test(simulacion.stderr), traza: simulacion.stderr }
  ];
});
caso('I5', () => ['json-roto', 'nivel-inexistente'].flatMap(caso => {
  const e = entorno(`I5-${caso}`);
  const ruta = join(e.repo, 'modelos.json');
  if (caso === 'json-roto') writeFileSync(ruta, '{ roto');
  else {
    const c = JSON.parse(readFileSync(ruta));
    c.agentes.arquitecto.nivel = 'inexistente';
    writeFileSync(ruta, JSON.stringify(c));
  }
  const mensaje = caso === 'json-roto' ? /error: no pude leer modelos\.json/ : /error: el nivel 'inexistente'.*no está en 'niveles'/;
  const antes = snapshot(e.home);
  const resoluciones = ['claude-code', 'pi'].map(h => ({ caso: `${caso}/resolver/${h}`, mensaje, ...e.resolver('modelo', 'arquitecto', h), antes, despues: snapshot(e.home) }));
  const instalacion = e.instalar();
  return [...resoluciones, { caso: `${caso}/instalar`, mensaje, ...instalacion, antes, despues: snapshot(e.home) }];
}));
caso('I6', () => {
  const e = entorno('I6');
  const archivo = join(e.repo, 'agentes/arquitecto.md');
  const original = readFileSync(archivo, 'utf8');
  writeFileSync(archivo, original.replace(/^---\r?\n/, '---\nmodel: modelo-prohibido\n'));
  return ['agente-claude', 'agente-pi'].map(orden => e.resolver(orden, archivo));
});

// Salidas falsas: la MISMA comprobación debe rechazarlas. No se altera el producto.
const falsos = {
  I1: [{ herramienta: 'pi', status: 0, stdout: 'inventado', modelos: ['valido'] }],
  I2: [{ nombre: 'arquitecto', texto: '---\nname: otro\n---\n' }],
  I3: [{ antes: {}, despues: { resto: 'archivo' }, motivo: 'quedó un archivo' }],
  I4: [{ antes: { personal: 'original' }, despues: { personal: 'pisado' }, motivo: 'pisó archivo' }],
  I5: [{ caso: 'falso-exito', status: 0, stderr: '', mensaje: /error:/, antes: {}, despues: {} }],
  I6: [{ status: 0, stdout: 'agente aceptado', stderr: '' }]
};
for (const [id, dato] of Object.entries(falsos)) {
  test(`${id}: control negativo rechaza salida falsa`, () => {
    assert.throws(() => comprobar(id, dato), assert.AssertionError);
    guardar(`${id}-negativo`, { dato, resultado: 'La comprobación rechazó la salida falsa' });
  });
}
