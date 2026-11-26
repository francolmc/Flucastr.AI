// Editor del hook de compactación (A8 de changes/piso-planner/tramo-8.md): instalar, comprobar, quitar y simular
// en Claude Code (.claude/settings.local.json) y Codex (.codex/hooks.json). Proyectos temporales; no toca el HOME real.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const editor = join(raiz, "adapters", "shared", "compact-hook.mjs");
const creados = [];

function temporal() {
  const dir = mkdtempSync(join(tmpdir(), "compact-hook-"));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

function correr(accion, herramienta, proyecto, extra = []) {
  return spawnSyncSeguro(process.execPath, [editor, accion, herramienta, proyecto, ...extra], {
    encoding: "utf8",
    timeout: 10000,
  });
}

const ARCHIVO = { claude: join(".claude", "settings.local.json"), codex: join(".codex", "hooks.json") };

function leer(proyecto, herramienta) {
  return JSON.parse(readFileSync(join(proyecto, ARCHIVO[herramienta]), "utf8"));
}

function escribirJson(proyecto, herramienta, valor) {
  const ruta = join(proyecto, ARCHIVO[herramienta]);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, typeof valor === "string" ? valor : JSON.stringify(valor, null, 2));
}

// Hooks ajenos: un permiso en PreToolUse y otro SessionStart con matcher distinto.
const AJENOS = {
  hooks: {
    PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "node permissions-hook.mjs" }] }],
    SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: "echo ajeno" }] }],
  },
};

function entradasKit(valor) {
  return (valor.hooks?.SessionStart ?? []).filter((g) =>
    (g.hooks ?? []).some((h) => String(h.command ?? "").includes("after-compact.mjs")),
  );
}

describe("compact-hook: instalar, comprobar y quitar", () => {
  for (const herramienta of ["claude", "codex"]) {
    test(`${herramienta}: instalar en proyecto sin archivo crea la entrada compact una vez`, () => {
      const p = temporal();
      const r = correr("instalar", herramienta, p);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stdout.trim(), "fijado");
      const valor = leer(p, herramienta);
      assert.equal(entradasKit(valor).length, 1);
      const grupo = entradasKit(valor)[0];
      assert.equal(grupo.matcher, "compact");
      assert.deepEqual(grupo.hooks[0].type, "command");
      assert.equal(grupo.hooks[0].timeout, 10);
      assert.match(grupo.hooks[0].command, /after-compact\.mjs/);
    });

    test(`${herramienta}: instalar dos veces responde fijado y luego ya-estaba, sin duplicar`, () => {
      const p = temporal();
      assert.equal(correr("instalar", herramienta, p).stdout.trim(), "fijado");
      const segunda = correr("instalar", herramienta, p);
      assert.equal(segunda.status, 0, segunda.stderr);
      assert.equal(segunda.stdout.trim(), "ya-estaba");
      assert.equal(entradasKit(leer(p, herramienta)).length, 1);
    });

    test(`${herramienta}: comprobar dice ausente y luego instalado`, () => {
      const p = temporal();
      assert.equal(correr("comprobar", herramienta, p).stdout.trim(), "ausente");
      correr("instalar", herramienta, p);
      assert.equal(correr("comprobar", herramienta, p).stdout.trim(), "instalado");
    });

    test(`${herramienta}: conserva hooks ajenos al instalar y al quitar`, () => {
      const p = temporal();
      escribirJson(p, herramienta, AJENOS);
      assert.equal(correr("instalar", herramienta, p).stdout.trim(), "fijado");
      const conKit = leer(p, herramienta);
      assert.deepEqual(conKit.hooks.PreToolUse, AJENOS.hooks.PreToolUse);
      assert.equal(conKit.hooks.SessionStart.length, 2);
      assert.equal(entradasKit(conKit).length, 1);

      assert.equal(correr("quitar", herramienta, p).stdout.trim(), "quitado");
      const sinKit = leer(p, herramienta);
      assert.deepEqual(sinKit, AJENOS);
    });

    test(`${herramienta}: quitar sin entrada responde omitido y no escribe`, () => {
      const p = temporal();
      assert.equal(correr("quitar", herramienta, p).stdout.trim(), "omitido");
      assert.equal(existsSync(join(p, ARCHIVO[herramienta])), false);
    });

    test(`${herramienta}: --dry-run no escribe ni cambia el archivo`, () => {
      const p = temporal();
      const r = correr("instalar", herramienta, p, ["--dry-run"]);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(existsSync(join(p, ARCHIVO[herramienta])), false);

      escribirJson(p, herramienta, AJENOS);
      const antes = readFileSync(join(p, ARCHIVO[herramienta]), "utf8");
      correr("instalar", herramienta, p, ["--dry-run"]);
      correr("quitar", herramienta, p, ["--dry-run"]);
      assert.equal(readFileSync(join(p, ARCHIVO[herramienta]), "utf8"), antes);
    });

    test(`${herramienta}: JSON inválido sale con 1 y no escribe`, () => {
      const p = temporal();
      const roto = '{"hooks": { "SessionStart": [';
      escribirJson(p, herramienta, roto);
      const r = correr("instalar", herramienta, p);
      assert.equal(r.status, 1);
      assert.equal(readFileSync(join(p, ARCHIVO[herramienta]), "utf8"), roto);
    });

    test(`${herramienta}: quitar en un grupo compact con hook propio deja el propio`, () => {
      const p = temporal();
      const propio = { type: "command", command: "node tools/mi-hook.mjs" };
      const kit = { type: "command", command: 'node "$(cat "$HOME/.flucastr-ai/raiz")/scripts/after-compact.mjs"', timeout: 10 };
      escribirJson(p, herramienta, { hooks: { SessionStart: [{ matcher: "compact", hooks: [propio, kit] }] } });
      assert.equal(correr("comprobar", herramienta, p).stdout.trim(), "instalado");
      assert.equal(correr("quitar", herramienta, p).stdout.trim(), "quitado");
      const tras = leer(p, herramienta);
      assert.deepEqual(tras.hooks.SessionStart, [{ matcher: "compact", hooks: [propio] }]);
      assert.equal(entradasKit(tras).length, 0);
    });

    test(`${herramienta}: un hook propio con tools/my-after-compact.mjs no cuenta como del kit`, () => {
      const p = temporal();
      const propio = { matcher: "compact", hooks: [{ type: "command", command: "node tools/my-after-compact.mjs" }] };
      escribirJson(p, herramienta, { hooks: { SessionStart: [propio] } });
      assert.equal(correr("comprobar", herramienta, p).stdout.trim(), "ausente");
      assert.equal(correr("instalar", herramienta, p).stdout.trim(), "fijado");
      assert.equal(correr("quitar", herramienta, p).stdout.trim(), "quitado");
      assert.deepEqual(leer(p, herramienta), { hooks: { SessionStart: [propio] } });
    });
  }

  test("codex: quitar la única entrada borra .codex/hooks.json si queda vacío", () => {
    const p = temporal();
    correr("instalar", "codex", p);
    assert.equal(correr("quitar", "codex", p).stdout.trim(), "quitado");
    assert.equal(existsSync(join(p, ARCHIVO.codex)), false);
  });

  test("claude: quitar la única entrada conserva .claude/settings.local.json", () => {
    const p = temporal();
    correr("instalar", "claude", p);
    assert.equal(correr("quitar", "claude", p).stdout.trim(), "quitado");
    assert.equal(existsSync(join(p, ARCHIVO.claude)), true);
    assert.equal(entradasKit(leer(p, "claude")).length, 0);
  });
});
