import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RESOLVER = join(RAIZ_REPO, 'scripts', 'resolver.mjs');
const temporales = [];
after(() => {
  for (const d of temporales) rmSync(d, { recursive: true, force: true });
});

function resolver(...args) {
  const r = spawnSync('node', [RESOLVER, ...args], { encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r.stdout;
}

// Escribe un agente temporal con el `name` que corresponde a su nombre de archivo.
function agenteTemporal(nombre, tools) {
  const dir = mkdtempSync(join(tmpdir(), 'flucastr-resolver-'));
  temporales.push(dir);
  const ruta = join(dir, `${nombre}.md`);
  const cabecera = [`name: ${nombre}`, 'description: "agente de prueba"'];
  if (tools !== undefined) cabecera.push(`tools: ${tools}`);
  writeFileSync(ruta, `---\n${cabecera.join('\n')}\n---\n\n# Cuerpo de prueba\n`);
  return ruta;
}

function lineaTools(salida) {
  return salida.split('\n').find(l => l.startsWith('tools:'));
}

function sinLineaModelo(salida) {
  return salida.split('\n').filter(l => !l.startsWith('model:')).join('\n');
}

test('(1) agente-pi reduce Bash(...) a Bash y conserva el resto de tools', () => {
  const ruta = agenteTemporal('prueba-bash', 'Read, Bash(node a.mjs), Bash(node b.mjs F*), Skill');
  assert.equal(lineaTools(resolver('agente-pi', ruta)), 'tools: Read, Bash, Skill');
});

test('(2) agente-claude conserva los patrones de Bash', () => {
  const ruta = agenteTemporal('prueba-bash', 'Read, Bash(node a.mjs), Bash(node b.mjs F*), Skill');
  assert.equal(lineaTools(resolver('agente-claude', ruta)), 'tools: Read, Bash(node a.mjs), Bash(node b.mjs F*), Skill');
});

test('(3) agente sin Bash queda idéntico en ambas salidas salvo model:', () => {
  const ruta = agenteTemporal('prueba-sin-bash', 'Read, Grep, Skill');
  const pi = resolver('agente-pi', ruta);
  const claude = resolver('agente-claude', ruta);
  assert.equal(sinLineaModelo(pi), sinLineaModelo(claude));
});

test('(4) coordinador: agente-pi declara Bash sin patrones y conserva Agent, Read, Grep, Glob, Write, Edit, Skill', () => {
  const ruta = join(RAIZ_REPO, 'agentes', 'coordinador.md');
  const tools = lineaTools(resolver('agente-pi', ruta));
  assert.ok(tools.includes('Bash'), tools);
  assert.ok(!tools.includes('Bash('), tools);
  for (const t of ['Agent(arquitecto, planificador, constructor)', 'Read', 'Grep', 'Glob', 'Write', 'Edit', 'Skill']) {
    assert.ok(tools.includes(t), `${t} falta en: ${tools}`);
  }
});

test('(5) coordinador: agente-claude conserva los tres patrones Bash(...)', () => {
  const ruta = join(RAIZ_REPO, 'agentes', 'coordinador.md');
  const tools = lineaTools(resolver('agente-claude', ruta));
  assert.ok(tools.includes('Bash(node scripts/registrar.mjs)'), tools);
  assert.ok(tools.includes('Bash(node scripts/archivar.mjs)'), tools);
  assert.ok(tools.includes('Bash(node scripts/archivar.mjs --aplicar F*)'), tools);
});

test('(6) arquitecto, planificador y constructor no cambian en agente-pi (comparado con agente-claude sin model:)', () => {
  for (const nombre of ['arquitecto', 'planificador', 'constructor']) {
    const ruta = join(RAIZ_REPO, 'agentes', `${nombre}.md`);
    assert.equal(
      sinLineaModelo(resolver('agente-pi', ruta)),
      sinLineaModelo(resolver('agente-claude', ruta)),
      nombre
    );
  }
});

test('(7) instalación aislada: Claude Code conserva patrones y Pi declara Bash sin patrones', () => {
  const base = mkdtempSync(join(tmpdir(), 'flucastr-resolver-inst-'));
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
  const r = spawnSync('bash', [join(repo, 'instalar.sh')], { cwd: repo, env, encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);

  const claude = readFileSync(join(home, '.claude', 'agents', 'coordinador.md'), 'utf8');
  const pi = readFileSync(join(piDir, 'agents', 'coordinador.md'), 'utf8');
  const tClaude = claude.split('\n').find(l => l.startsWith('tools:'));
  const tPi = pi.split('\n').find(l => l.startsWith('tools:'));
  assert.ok(tClaude.includes('Bash(node scripts/registrar.mjs)'), tClaude);
  assert.ok(tClaude.includes('Bash(node scripts/archivar.mjs --aplicar F*)'), tClaude);
  assert.ok(tPi.includes('Bash'), tPi);
  assert.ok(!tPi.includes('Bash('), tPi);
});
