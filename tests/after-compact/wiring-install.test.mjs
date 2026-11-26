// Instalador del hook de compactación (A9 de changes/piso-planner/tramo-9.md): `install.sh --project` deja la entrada
// `compact` en Claude Code (.claude/settings.local.json) y Codex (.codex/hooks.json), la registra una vez en el
// manifiesto, --dry-run no escribe, reinstalar sin proyecto conserva el hook y un hooks.json inválido avisa y sigue.
// HOME temporal, proyectos temporales y models.json temporal; no toca el HOME real ni instala en el repositorio.

import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const creados = [];

function temporal(prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

// Home con Claude Code y Codex detectables; models.json temporal (copia del del repositorio).
function nuevoHome() {
  const home = temporal("compact-wiring-home-");
  mkdirSync(join(home, ".claude"), { recursive: true });
  mkdirSync(join(home, ".codex"), { recursive: true });
  mkdirSync(join(home, ".local", "bin"), { recursive: true });
  copyFileSync(join(raiz, "models.json"), join(home, "models.json"));
  return home;
}

function proyecto() {
  return realpathSync(temporal("compact-wiring-proyecto-"));
}

// Ejecuta install.sh --copy con el HOME temporal. Sin stdin pipe (spawnSyncSeguro).
function instalar(home, extra = []) {
  const env = { ...process.env, HOME: home, CODEX_HOME: join(home, ".codex"), FLUCASTR_MODELOS: join(home, "models.json") };
  for (const k of ["PI_CODING_AGENT_DIR", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE"]) delete env[k];
  return spawnSyncSeguro("bash", ["install.sh", "--copy", ...extra], { cwd: raiz, env, encoding: "utf8", timeout: 120000 });
}

function afirmarOk(r) {
  assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
}

function rutaHook(p, herramienta) {
  return join(p, herramienta === "claude" ? join(".claude", "settings.local.json") : join(".codex", "hooks.json"));
}

// Cuántas entradas SessionStart del kit (con after-compact.mjs) tiene el archivo; 0 si no existe.
function entradasKit(p, herramienta) {
  const ruta = rutaHook(p, herramienta);
  if (!existsSync(ruta)) return 0;
  const json = JSON.parse(readFileSync(ruta, "utf8"));
  return (json.hooks?.SessionStart ?? []).filter((g) =>
    (g.hooks ?? []).some((h) => String(h.command ?? "").includes("after-compact.mjs")),
  ).length;
}

function manifiesto(home) {
  const ruta = join(home, ".flucastr-ai", "manifiesto.txt");
  return existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
}

function lineasHook(home, p, herramienta) {
  const linea = `hook-compact\t${rutaHook(p, herramienta)}\t${herramienta}`;
  return manifiesto(home).split("\n").filter((l) => l === linea).length;
}

describe("A9: install.sh instala el hook de compactación", () => {
  test("con --project deja la entrada compact en Claude Code y en Codex, registrada una vez", () => {
    const home = nuevoHome();
    const p = proyecto();
    const r = instalar(home, ["--project", p]);
    afirmarOk(r);
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(entradasKit(p, "codex"), 1);
    assert.equal(lineasHook(home, p, "claude"), 1);
    assert.equal(lineasHook(home, p, "codex"), 1);
    assert.match(r.stdout, /Codex pedirá aprobar/);
  });

  test("reinstalar con --project no duplica la entrada ni su registro", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalar(home, ["--project", p]));
    afirmarOk(instalar(home, ["--project", p]));
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(entradasKit(p, "codex"), 1);
    assert.equal(lineasHook(home, p, "claude"), 1);
    assert.equal(lineasHook(home, p, "codex"), 1);
  });

  test("--dry-run con --project no escribe el hook ni lo registra", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalar(home, ["--project", p, "--dry-run"]));
    assert.equal(entradasKit(p, "claude"), 0);
    assert.equal(entradasKit(p, "codex"), 0);
    assert.doesNotMatch(manifiesto(home), /hook-compact/);
  });

  test("reinstalar sin --project conserva el hook y su registro", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalar(home, ["--project", p]));
    afirmarOk(instalar(home));
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(entradasKit(p, "codex"), 1);
    assert.equal(lineasHook(home, p, "claude"), 1);
    assert.equal(lineasHook(home, p, "codex"), 1);
  });

  test("un .codex/hooks.json inválido avisa y sigue con Claude Code", () => {
    const home = nuevoHome();
    const p = proyecto();
    mkdirSync(join(p, ".codex"), { recursive: true });
    writeFileSync(join(p, ".codex", "hooks.json"), '{"hooks": { "SessionStart": [');
    const r = instalar(home, ["--project", p]);
    afirmarOk(r);
    assert.match(r.stdout, /AVISO: no se tocó .*hooks\.json/);
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(readFileSync(join(p, ".codex", "hooks.json"), "utf8"), '{"hooks": { "SessionStart": [');
  });
});
