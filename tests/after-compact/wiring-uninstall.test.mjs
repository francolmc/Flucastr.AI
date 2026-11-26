// Desinstalar el hook de compactación (A10 de changes/piso-planner/tramo-10.md): `uninstall.sh --project` y la
// desinstalación global quitan solo la entrada del kit (Claude Code y Codex); --keep-settings lo conserva y --dry-run
// no escribe. Los hooks ajenos se mantienen. HOME temporal y proyectos temporales; no toca el HOME real.

import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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

function entorno(home) {
  const env = { ...process.env, HOME: home, CODEX_HOME: join(home, ".codex"), FLUCASTR_MODELOS: join(home, "models.json") };
  for (const k of ["PI_CODING_AGENT_DIR", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE"]) delete env[k];
  return env;
}

function nuevoHome() {
  const home = temporal("compact-unwire-home-");
  mkdirSync(join(home, ".claude"), { recursive: true });
  mkdirSync(join(home, ".codex"), { recursive: true });
  mkdirSync(join(home, ".local", "bin"), { recursive: true });
  copyFileSync(join(raiz, "models.json"), join(home, "models.json"));
  return home;
}

function proyecto() {
  return realpathSync(temporal("compact-unwire-proyecto-"));
}

function ejecutar(script, home, args = []) {
  return spawnSyncSeguro("bash", [script, ...args], { cwd: raiz, env: entorno(home), encoding: "utf8", timeout: 120000 });
}

function afirmarOk(r) {
  assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
}

function instalarConProyecto(home, p) {
  const r = ejecutar("install.sh", home, ["--copy", "--project", p]);
  afirmarOk(r);
}

function rutaHook(p, herramienta) {
  return join(p, herramienta === "claude" ? join(".claude", "settings.local.json") : join(".codex", "hooks.json"));
}

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

// Hook propio del usuario en ambos archivos: debe sobrevivir a cualquier desinstalación.
const PROPIO = { type: "command", command: "echo mi-hook" };

function escribirHooksPropios(p) {
  const propio = { hooks: { SessionStart: [{ matcher: "startup", hooks: [PROPIO] }] } };
  mkdirSync(join(p, ".claude"), { recursive: true });
  mkdirSync(join(p, ".codex"), { recursive: true });
  writeFileSync(rutaHook(p, "claude"), JSON.stringify(propio, null, 2));
  writeFileSync(rutaHook(p, "codex"), JSON.stringify(propio, null, 2));
}

function tieneHookPropio(p, herramienta) {
  const json = JSON.parse(readFileSync(rutaHook(p, herramienta), "utf8"));
  return JSON.stringify(json).includes("mi-hook");
}

describe("A10: desinstalar retira solo el hook del kit", () => {
  test("uninstall --project quita la entrada del kit en Claude Code y en Codex y deja el hook propio", () => {
    const home = nuevoHome();
    const p = proyecto();
    escribirHooksPropios(p);
    instalarConProyecto(home, p);
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(entradasKit(p, "codex"), 1);

    afirmarOk(ejecutar("uninstall.sh", home, ["--project", p]));
    assert.equal(entradasKit(p, "claude"), 0);
    assert.equal(entradasKit(p, "codex"), 0);
    assert.equal(tieneHookPropio(p, "claude"), true);
    assert.equal(tieneHookPropio(p, "codex"), true);
    assert.doesNotMatch(manifiesto(home), /hook-compact/);
  });

  test("uninstall global quita la entrada del proyecto y deja el hook propio", () => {
    const home = nuevoHome();
    const p = proyecto();
    escribirHooksPropios(p);
    instalarConProyecto(home, p);

    afirmarOk(ejecutar("uninstall.sh", home));
    assert.equal(entradasKit(p, "claude"), 0);
    assert.equal(entradasKit(p, "codex"), 0);
    assert.equal(tieneHookPropio(p, "claude"), true);
    assert.equal(tieneHookPropio(p, "codex"), true);
  });

  test("uninstall global con --keep-settings conserva la entrada del kit", () => {
    const home = nuevoHome();
    const p = proyecto();
    instalarConProyecto(home, p);

    afirmarOk(ejecutar("uninstall.sh", home, ["--keep-settings"]));
    assert.equal(entradasKit(p, "claude"), 1);
    assert.equal(entradasKit(p, "codex"), 1);
  });

  test("--dry-run en global y en proyecto no escribe nada", () => {
    const home = nuevoHome();
    const p = proyecto();
    escribirHooksPropios(p);
    instalarConProyecto(home, p);
    const antesClaude = readFileSync(rutaHook(p, "claude"), "utf8");
    const antesCodex = readFileSync(rutaHook(p, "codex"), "utf8");

    afirmarOk(ejecutar("uninstall.sh", home, ["--dry-run"]));
    afirmarOk(ejecutar("uninstall.sh", home, ["--dry-run", "--project", p]));
    assert.equal(readFileSync(rutaHook(p, "claude"), "utf8"), antesClaude);
    assert.equal(readFileSync(rutaHook(p, "codex"), "utf8"), antesCodex);
    assert.equal(entradasKit(p, "claude"), 1);
    assert.match(manifiesto(home), /hook-compact/);
  });
});
