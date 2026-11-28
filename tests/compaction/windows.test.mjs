// Comprobación de ventanas (A9 de changes/ventana-por-agente/plan.md): `resolver.mjs ventanas`.
// HOME, CODEX_HOME, PI_CODING_AGENT_DIR y models.json temporales; no toca el HOME real.
// Cada aviso tiene su caso: si se quita la regla, el caso falla.

import assert from "node:assert/strict";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const resolver = join(raiz, "scripts", "resolver.mjs");
const creados = [];
const SECRETO = "SECRETO-PRUEBA-A9-7f3c";
// Modelos de Claude Code según models.json (planner nivel medio, builder nivel bajo).
const MODELO_PLANNER = "claude-sonnet-5-5";

function temporal(prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

function escribir(ruta, texto) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
}

// Ejecuta sin shell y sin pipe en stdin (paso 19 de ./verify).
function ventanas(args, env = {}) {
  const base = { ...process.env };
  for (const k of ["FLUCASTR_MODELOS", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE", "PI_CODING_AGENT_DIR", "CODEX_HOME"]) {
    delete base[k];
  }
  const r = spawnSyncSeguro(process.execPath, [resolver, "ventanas", ...args], {
    cwd: raiz,
    env: { ...base, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 100000,
  });
  return { status: r.status, salida: r.stdout, error: r.stderr };
}

// Fixture: HOME con lanzadores y proyecto con ajustes locales.
// `builder` agrega el lanzador claude-builder; `usuario` escribe ~/.claude/settings.json.
function fixture({ claude = 300000, codex = 300000, pi = 20000, extraLocal, builder, usuario } = {}) {
  const home = temporal("ventanas-home-");
  const proy = temporal("ventanas-proy-");
  const bin = join(home, ".local", "bin");
  if (claude !== null) escribir(join(bin, "claude-planner"), `#!/bin/bash\nexec claude --autocompact ${claude} "$@"\n`);
  if (builder !== undefined) escribir(join(bin, "claude-builder"), `#!/bin/bash\nexec claude --autocompact ${builder} "$@"\n`);
  if (usuario !== undefined) escribir(join(home, ".claude", "settings.json"), JSON.stringify(usuario));
  if (codex !== null) escribir(join(bin, "codex-planner"), `#!/bin/bash\nexec codex -c model_auto_compact_token_limit=${codex} "$@"\n`);
  const pi_dir = temporal("ventanas-pi-");
  if (pi !== null) escribir(join(pi_dir, "settings.json"), JSON.stringify({ compaction: { reserveTokens: pi } }));
  escribir(join(proy, ".claude", "settings.local.json"), JSON.stringify(extraLocal ?? { permissions: { allow: [] } }));
  return { home, proy, env: { HOME: home, PI_CODING_AGENT_DIR: pi_dir, CODEX_HOME: join(home, "codex-vacio") } };
}

function filaDe(salida, patron) {
  return salida.split("\n").find((l) => patron.test(l)) ?? "";
}

describe("ventanas: filas efectivas", () => {
  test("Claude planner por lanzador: 300000 da disparo 267000 y estado OK", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    const fila = filaDe(r.salida, /claude-code\s+planner\s+claude-planner\s+300000\s+267000\s+lanzador\s+102971\s+OK$/);
    assert.ok(fila, `fila Claude planner no encontrada:\n${r.salida}`);
  });

  test("Codex planner 200000 con piso prestado 102971 da AVISO (97029 < 100000)", () => {
    const f = fixture({ codex: 200000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /codex\s+planner\s+codex-planner\s+200000\s+200000\s+.*102971 \(prestado\)\s+AVISO$/), r.salida);
    assert.ok(r.salida.includes("AVISO: (global) codex planner: disparo 200000 − piso 102971 = 97029 < work_margin 100000"), r.salida);
    assert.equal(r.status, 1);
  });

  test("Pi planner con reserve 92000 y ventana 272000 da disparo 180000 y AVISO (77029)", () => {
    const f = fixture({ codex: 300000, pi: 92000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /pi\s+planner\s+compactación global\s+272000\s+180000\s+.*AVISO$/), r.salida);
    assert.ok(r.salida.includes("AVISO: (global) pi planner: disparo 180000 − piso 102971 = 77029 < work_margin 100000"), r.salida);
  });

  test("el builder no avisa aunque no tenga piso medido («piso sin medir»)", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+builder\s+subagente\s+.*sin medir\s+piso sin medir$/), r.salida);
    assert.ok(!r.salida.includes("AVISO: " + f.proy + ": claude-code builder"), r.salida);
    assert.ok(!r.salida.includes("builder sin fijar"), r.salida);
  });
});

describe("ventanas: avisos", () => {
  test("planner sin fijar en Claude Code avisa", () => {
    const f = fixture({ claude: null, codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(r.salida.includes(`AVISO: ${f.proy}: claude-code planner sin fijar`), r.salida);
    assert.equal(r.status, 1);
  });

  test("revisor sin fijar en Codex avisa aunque el planner esté fijado (revisor usa compact_at de models.json)", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(r.salida.includes("AVISO: (global) codex revisor: disparo 200000 − piso 102971 = 97029 < work_margin 100000"), r.salida);
  });

  test("CLAUDE_CODE_AUTO_COMPACT_WINDOW en el entorno avisa y anula el lanzador", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], { ...f.env, CLAUDE_CODE_AUTO_COMPACT_WINDOW: "250000" });
    assert.ok(r.salida.includes("AVISO: CLAUDE_CODE_AUTO_COMPACT_WINDOW en el entorno anula los demás ajustes"), r.salida);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+.*\s+250000\s+217000\s+/), r.salida);
  });

  test("CLAUDE_AUTOCOMPACT_PCT_OVERRIDE en el entorno avisa", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], { ...f.env, CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "50" });
    assert.ok(r.salida.includes("AVISO: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE en el entorno cambia el disparo"), r.salida);
  });

  test("modelSettings.<modelo>.autoCompactWindow en ajustes locales avisa nombrando modelo y archivo", () => {
    const f = fixture({ claude: null, codex: 300000, pi: 20000, extraLocal: { modelSettings: { [MODELO_PLANNER]: { autoCompactWindow: 250000 } } } });
    const r = ventanas([f.proy], f.env);
    const ruta = join(f.proy, ".claude", "settings.local.json");
    assert.ok(r.salida.includes(`AVISO: modelSettings.${MODELO_PLANNER}.autoCompactWindow en ${ruta} puede cambiar la ventana de Claude Code`), r.salida);
  });

  test("un valor secreto en ajustes no aparece en la salida ni en stderr", () => {
    const f = fixture({ codex: 200000, pi: 92000, extraLocal: { apiKey: SECRETO, modelSettings: {} } });
    const r = ventanas([f.proy], f.env);
    assert.ok(!r.salida.includes(SECRETO), "el secreto apareció en stdout");
    assert.ok(!r.error.includes(SECRETO), "el secreto apareció en stderr");
  });
});

describe("ventanas: ventana por modelo, sesión y subagente", () => {
  test("sin autoCompactWindow no avisa aunque haya una entrada de modelSettings", () => {
    const f = fixture({ claude: null, codex: 300000, pi: 20000, extraLocal: { modelSettings: { [MODELO_PLANNER]: {} } } });
    const r = ventanas([f.proy], f.env);
    assert.ok(!r.salida.includes("modelSettings."), r.salida);
  });

  test("autoCompactWindow por modelo fija la sesión planner en su archivo", () => {
    const f = fixture({ claude: null, codex: 300000, pi: 20000, extraLocal: { modelSettings: { [MODELO_PLANNER]: { autoCompactWindow: 250000 } } } });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+sesión\s+250000\s+217000\s+/), r.salida);
  });

  test("autoCompactWindow local gana a modelSettings del usuario", () => {
    const f = fixture({
      claude: null,
      codex: 300000,
      pi: 20000,
      extraLocal: { autoCompactWindow: 250000 },
      usuario: { modelSettings: { [MODELO_PLANNER]: { autoCompactWindow: 180000 } } },
    });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+sesión\s+250000\s+217000\s+/), r.salida);
    assert.ok(!filaDe(r.salida, /claude-code\s+planner\s+sesión\s+180000\s/), r.salida);
  });

  test("fila claude-builder con su lanzador 200000 da disparo 167000", () => {
    const f = fixture({ codex: 300000, pi: 20000, builder: 200000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+builder\s+claude-builder\s+200000\s+167000\s+lanzador\s+/), r.salida);
  });

  test("con lanzador y ajustes, el planner muestra fila lanzador y fila sesión", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000, extraLocal: { autoCompactWindow: 250000 } });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+claude-planner\s+300000\s+267000\s+/), r.salida);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+sesión\s+250000\s+217000\s+/), r.salida);
  });

  test("sesión sin fijar no avisa si el lanzador del planner fija la ventana", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+sesión\s+-\s+-\s+-\s+/), r.salida);
    assert.ok(!r.salida.includes(`AVISO: ${f.proy}: claude-code planner sin fijar`), r.salida);
  });
});

describe("ventanas: entorno y bloque env ganan al lanzador (E1)", () => {
  test("con lanzador 300000 y entorno 133000, claude-planner muestra 133000 y AVISO (100000 − 102971 < margen)", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000 });
    const r = ventanas([f.proy], { ...f.env, CLAUDE_CODE_AUTO_COMPACT_WINDOW: "133000" });
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+claude-planner\s+133000\s+100000\s+variable de entorno\s+102971\s+AVISO$/), r.salida);
    assert.ok(!filaDe(r.salida, /claude-planner\s+300000\s+267000/), r.salida);
  });

  test("con lanzador 300000 y bloque env 133000, claude-planner muestra 133000 con origen del archivo", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000, extraLocal: { env: { CLAUDE_CODE_AUTO_COMPACT_WINDOW: "133000" } } });
    const r = ventanas([f.proy], f.env);
    assert.ok(filaDe(r.salida, /claude-code\s+planner\s+claude-planner\s+133000\s+100000\s+\S+\s+102971\s+AVISO$/), r.salida);
  });

  test("con lanzador builder 200000 y entorno 133000, claude-builder muestra 133000", () => {
    const f = fixture({ claude: 300000, codex: 300000, pi: 20000, builder: 200000 });
    const r = ventanas([f.proy], { ...f.env, CLAUDE_CODE_AUTO_COMPACT_WINDOW: "133000" });
    assert.ok(filaDe(r.salida, /claude-code\s+builder\s+claude-builder\s+133000\s+100000\s+variable de entorno\s+/), r.salida);
  });

  test("modelSettings con la clave del planner fija la sesión; con otra clave no fija al planner", () => {
    const conClave = fixture({ claude: null, codex: 300000, pi: 20000, extraLocal: { modelSettings: { [MODELO_PLANNER]: { autoCompactWindow: 250000 } } } });
    const r1 = ventanas([conClave.proy], conClave.env);
    assert.ok(filaDe(r1.salida, /claude-code\s+planner\s+sesión\s+250000\s+217000\s+/), r1.salida);
    const otraClave = fixture({ claude: null, codex: 300000, pi: 20000, extraLocal: { modelSettings: { "modelo-ajeno": { autoCompactWindow: 250000 } } } });
    const r2 = ventanas([otraClave.proy], otraClave.env);
    assert.ok(filaDe(r2.salida, /claude-code\s+planner\s+sesión\s+-\s+-\s+-\s+/), r2.salida);
  });
});

describe("ventanas: salida y uso", () => {
  test("sin avisos sale 0", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const modelos = temporal("ventanas-modelos-");
    const copia = join(modelos, "models.json");
    copyFileSync(join(raiz, "models.json"), copia);
    const cfg = JSON.parse(readFileSync(copia, "utf8"));
    cfg.kit_run.reviewer.compact_at.codex = 300000;
    writeFileSync(copia, JSON.stringify(cfg));
    const r = ventanas([f.proy], { ...f.env, FLUCASTR_MODELOS: copia });
    assert.equal(r.status, 0, r.salida);
  });

  test("una opción desconocida sale 2 por uso", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    const r = ventanas(["--x"], f.env);
    assert.equal(r.status, 2, r.salida);
    assert.ok(r.error.includes("uso: resolver.mjs ventanas"), r.error);
  });

  test("suma los proyectos del manifiesto a los argumentos", () => {
    const f = fixture({ codex: 300000, pi: 20000 });
    escribir(join(f.home, ".flucastr-ai", "manifiesto.txt"), `compactacion\t${join(f.proy, ".claude", "settings.local.json")}\tclaude:300000\n`);
    const r = ventanas([], f.env);
    assert.ok(r.salida.includes(f.proy), r.salida);
  });
});
