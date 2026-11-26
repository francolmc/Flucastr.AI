// Ventana de Claude Code por agente (caso A2 de changes/ventana-por-agente/plan.md):
// ventana-claude, autoCompactWindow en el agente generado y --autocompact en el lanzador.
// HOME temporal y models.json temporal; no toca el HOME real.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const resolver = join(raiz, "scripts", "resolver.mjs");
const creados = [];

function temporal(prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

// Ejecuta sin shell y sin pipe en stdin (paso 19 de ./verify).
function correr(args, env = {}, cwd = raiz) {
  const base = { ...process.env };
  for (const k of ["FLUCASTR_MODELOS", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE", "PI_CODING_AGENT_DIR"]) {
    delete base[k];
  }
  return spawnSync(args[0], args.slice(1), {
    cwd,
    env: { ...base, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 100000,
  });
}

// models.json real con cambios opcionales; devuelve la ruta del archivo temporal.
function modelosCon(cambios = () => {}) {
  const m = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  cambios(m);
  const archivo = join(temporal("ventana-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

function resolverCon(modelos, ...args) {
  return correr(["node", resolver, ...args], { FLUCASTR_MODELOS: modelos });
}

// Instala con HOME temporal y el models.json dado; devuelve la carpeta HOME.
function instalar(modelos) {
  const home = temporal("ventana-home-");
  const r = correr(["bash", "install.sh", "--copy"], {
    HOME: home,
    CODEX_HOME: join(home, ".codex"),
    FLUCASTR_MODELOS: modelos,
  });
  assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
  return home;
}

describe("A2: ventana de Claude Code por agente", () => {
  test("ventana-claude da compact_at de claude-code + 33000 (planner 300000, builder 200000)", () => {
    const real = modelosCon();
    const planner = resolverCon(real, "ventana-claude", "planner");
    assert.equal(planner.stdout.trim(), "300000");
    const builder = resolverCon(real, "ventana-claude", "builder");
    assert.equal(builder.stdout.trim(), "200000");
  });

  test("ventana-claude no imprime nada si la ventana cae fuera de 100000–1000000", () => {
    const bajo = modelosCon((m) => { m.agents.builder.compact_at = { "claude-code": 10000 }; });
    const r = resolverCon(bajo, "ventana-claude", "builder");
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  });

  test("un planner antiguo en 60000 no da ventana ni autoCompactWindow en el builder", () => {
    const antiguo = modelosCon((m) => { m.agents.planner.compact_at = 60000; });
    const planner = resolverCon(antiguo, "ventana-claude", "planner");
    assert.equal(planner.status, 0);
    assert.equal(planner.stdout, "");
    const builder = resolverCon(antiguo, "agente-claude", "core/agents/builder.md");
    assert.equal(builder.status, 0, (builder.stderr || "").slice(-400));
    assert.equal(builder.stdout.includes("autoCompactWindow"), false);
  });

  test("agente-claude escribe autoCompactWindow solo en el builder, no en el planner", () => {
    const real = modelosCon();
    const builder = resolverCon(real, "agente-claude", "core/agents/builder.md");
    assert.equal(builder.status, 0, (builder.stderr || "").slice(-400));
    assert.match(builder.stdout, /^autoCompactWindow: 200000$/m);
    const planner = resolverCon(real, "agente-claude", "core/agents/planner.md");
    assert.equal(planner.status, 0, (planner.stderr || "").slice(-400));
    assert.equal(planner.stdout.includes("autoCompactWindow"), false);
  });

  test("el agente de Pi no lleva autoCompactWindow aunque el builder tenga ventana", () => {
    const real = modelosCon();
    const r = resolverCon(real, "agente-pi", "core/agents/builder.md");
    assert.equal(r.status, 0, (r.stderr || "").slice(-400));
    assert.equal(r.stdout.includes("autoCompactWindow"), false);
  });

  test("install.sh deja --autocompact en claude-planner y claude-builder, y autoCompactWindow en builder.md", () => {
    const home = instalar(modelosCon());
    const planner = readFileSync(join(home, ".local", "bin", "claude-planner"), "utf8");
    assert.match(planner, / --autocompact 300000/);
    assert.match(planner, / --effort medium/);
    const builder = readFileSync(join(home, ".local", "bin", "claude-builder"), "utf8");
    assert.match(builder, /exec claude --agent builder --effort high --autocompact 200000 /);
    const agenteBuilder = readFileSync(join(home, ".claude", "agents", "builder.md"), "utf8");
    assert.match(agenteBuilder, /^autoCompactWindow: 200000$/m);
    const agentePlanner = readFileSync(join(home, ".claude", "agents", "planner.md"), "utf8");
    assert.equal(agentePlanner.includes("autoCompactWindow"), false);
  });

  test("con planner antiguo en 60000 install.sh no pone --autocompact en claude-planner ni autoCompactWindow en builder", () => {
    const home = instalar(modelosCon((m) => { m.agents.planner.compact_at = 60000; }));
    const planner = readFileSync(join(home, ".local", "bin", "claude-planner"), "utf8");
    assert.equal(planner.includes("--autocompact"), false);
    const agenteBuilder = readFileSync(join(home, ".claude", "agents", "builder.md"), "utf8");
    assert.equal(agenteBuilder.includes("autoCompactWindow"), false);
    assert.equal(existsSync(join(home, ".local", "bin", "claude-planner")), true);
  });
});
