// Refresco al reinstalar (caso A6 de changes/ventana-por-agente/plan.md): la compactación de Claude Code de los
// proyectos registrados se actualiza si la escribió el kit (133000 o el valor registrado); un valor de la persona
// se respeta; una carpeta ausente avisa y conserva el registro; --dry-run no escribe; uninstall conserva el valor
// de la persona y las demás claves. HOME temporal, proyectos temporales y models.json temporal; no toca el HOME real.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

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

function modelosCon(cambios = () => {}) {
  const m = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  cambios(m);
  const archivo = join(temporal("refresco-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

function nuevoHome() {
  const home = temporal("refresco-home-");
  mkdirSync(join(home, ".local", "bin"), { recursive: true });
  return home;
}

function proyecto() {
  return temporal("refresco-proyecto-");
}

function bin(home, nombre) {
  return join(home, ".local", "bin", nombre);
}

function ajustes(ruta) {
  return join(ruta, ".claude", "settings.local.json");
}

function leerAjustes(ruta) {
  return JSON.parse(readFileSync(ajustes(ruta), "utf8"));
}

function escribirAjustes(ruta, obj) {
  mkdirSync(join(ruta, ".claude"), { recursive: true });
  writeFileSync(ajustes(ruta), JSON.stringify(obj, null, 2));
}

function manifiesto(home) {
  return readFileSync(join(home, ".flucastr-ai", "manifiesto.txt"), "utf8");
}

// Instala con el models.json dado; extra admite --project <ruta>, --dry-run, etc.
function instalarEn(home, modelos, extra = []) {
  return correr(["bash", "install.sh", "--copy", ...extra], {
    HOME: home,
    CODEX_HOME: join(home, ".codex"),
    FLUCASTR_MODELOS: modelos,
  });
}

function afirmarOk(r) {
  assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
}

describe("A6: refresco de la compactación de Claude Code al reinstalar", () => {
  test("instalación nueva con --project: planner fija 300000 y el builder lleva su propio ajuste", () => {
    const home = nuevoHome();
    const p = proyecto();
    const r = instalarEn(home, modelosCon(), ["--project", p]);
    afirmarOk(r);
    assert.equal(leerAjustes(p).autoCompactWindow, 300000);
    assert.match(readFileSync(bin(home, "claude-planner"), "utf8"), / --autocompact 300000/);
    assert.match(readFileSync(bin(home, "claude-builder"), "utf8"), / --autocompact 200000/);
    assert.match(readFileSync(join(home, ".claude", "agents", "builder.md"), "utf8"), /autoCompactWindow: 200000/);
    assert.doesNotMatch(readFileSync(join(home, ".claude", "agents", "planner.md"), "utf8"), /autoCompactWindow/);
    assert.match(manifiesto(home), /compactacion\t.*\tclaude:300000/);
  });

  test("reinstalar sobre 133000 (valor del kit sin registrar) lo actualiza a 300000 con aviso", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", p]));
    escribirAjustes(p, { ...leerAjustes(p), autoCompactWindow: 133000 });

    const r = instalarEn(home, modelosCon(), ["--project", p]);
    afirmarOk(r);
    assert.match(r.stdout, /compactación de Claude Code actualizada: 133000 → 300000/);
    assert.equal(leerAjustes(p).autoCompactWindow, 300000);
  });

  test("reinstalar sobre 150000 (valor de la persona) lo respeta", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", p]));
    escribirAjustes(p, { ...leerAjustes(p), autoCompactWindow: 150000 });

    const r = instalarEn(home, modelosCon(), ["--project", p]);
    afirmarOk(r);
    assert.match(r.stdout, /OMITIDO \(el proyecto ya define autoCompactWindow: se respeta\)/);
    assert.equal(leerAjustes(p).autoCompactWindow, 150000);
  });

  test("reinstalar sin --project actualiza el proyecto registrado y mantiene su registro", () => {
    const home = nuevoHome();
    const q = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", q]));
    escribirAjustes(q, { ...leerAjustes(q), autoCompactWindow: 133000 });

    const r = instalarEn(home, modelosCon());
    afirmarOk(r);
    assert.match(r.stdout, /Compactación de Claude Code de proyectos registrados/);
    assert.match(r.stdout, /compactación de Claude Code actualizada: 133000 → 300000/);
    assert.equal(leerAjustes(q).autoCompactWindow, 300000);
    assert.match(manifiesto(home), new RegExp(`compactacion\\t${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/\\.claude/settings\\.local\\.json\\tclaude:300000`));
  });

  test("una carpeta registrada que ya no existe avisa, sigue y conserva el registro", () => {
    const home = nuevoHome();
    const q = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", q]));
    rmSync(q, { recursive: true, force: true });

    const r = instalarEn(home, modelosCon());
    afirmarOk(r);
    assert.match(r.stdout, /AVISO: el proyecto registrado ya no existe, se omite \(registro conservado\)/);
    assert.match(manifiesto(home), new RegExp(`compactacion\\t${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });

  test("--dry-run no cambia el valor del proyecto registrado", () => {
    const home = nuevoHome();
    const q = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", q]));
    escribirAjustes(q, { ...leerAjustes(q), autoCompactWindow: 133000 });
    const antes = readFileSync(ajustes(q), "utf8");

    const r = instalarEn(home, modelosCon(), ["--dry-run"]);
    afirmarOk(r);
    assert.match(r.stdout, /\(simulación\) compactación de Claude Code actualizada: 133000 → 300000/);
    assert.equal(readFileSync(ajustes(q), "utf8"), antes);
  });

  test("uninstall del proyecto conserva el valor de la persona y las demás claves", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", p]));
    escribirAjustes(p, { ...leerAjustes(p), autoCompactWindow: 150000, x: 1 });

    const r = correr(["bash", "uninstall.sh", "--project", p], {
      HOME: home,
      CODEX_HOME: join(home, ".codex"),
    });
    afirmarOk(r);
    const ajustesFinales = leerAjustes(p);
    assert.equal(ajustesFinales.autoCompactWindow, 150000);
    assert.equal(ajustesFinales.x, 1);
  });

  test("uninstall del proyecto quita el valor que escribió el kit y conserva las demás claves", () => {
    const home = nuevoHome();
    const p = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", p]));
    escribirAjustes(p, { ...leerAjustes(p), x: 1 });

    afirmarOk(correr(["bash", "uninstall.sh", "--project", p], { HOME: home, CODEX_HOME: join(home, ".codex") }));
    const ajustesFinales = leerAjustes(p);
    assert.equal("autoCompactWindow" in ajustesFinales, false);
    assert.equal(ajustesFinales.x, 1);
  });

  test("un JSON inválido en un proyecto registrado avisa y no aborta la instalación", () => {
    const home = nuevoHome();
    const q = proyecto();
    afirmarOk(instalarEn(home, modelosCon(), ["--project", q]));
    mkdirSync(join(q, ".claude"), { recursive: true });
    writeFileSync(ajustes(q), "{ esto no es json");

    const r = instalarEn(home, modelosCon());
    afirmarOk(r);
    assert.match(r.stdout, /AVISO: no se tocó .*settings\.local\.json/);
    assert.equal(readFileSync(ajustes(q), "utf8"), "{ esto no es json");
  });
});
