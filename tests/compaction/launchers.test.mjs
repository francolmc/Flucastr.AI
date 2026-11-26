// Regeneración de lanzadores Pi y kit-run (caso A4 de changes/ventana-por-agente/plan.md):
// un lanzador con la marca del kit que el manifiesto ya no registra se regenera al reinstalar;
// un archivo sin marca se conserva. HOME temporal; no toca el HOME real.

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
  const archivo = join(temporal("lanzadores-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

// HOME con Pi y Codex detectados (sus directorios existen), para que install.sh genere sus lanzadores.
function nuevoHome() {
  const home = temporal("lanzadores-home-");
  mkdirSync(join(home, ".local", "bin"), { recursive: true });
  mkdirSync(join(home, ".pi", "agent"), { recursive: true });
  mkdirSync(join(home, ".codex"), { recursive: true });
  return home;
}

function instalarEn(home, modelos) {
  return correr(["bash", "install.sh", "--copy"], {
    HOME: home,
    CODEX_HOME: join(home, ".codex"),
    PI_CODING_AGENT_DIR: join(home, ".pi", "agent"),
    FLUCASTR_MODELOS: modelos,
  });
}

function bin(home, nombre) {
  return join(home, ".local", "bin", nombre);
}

function manifiesto(home) {
  return readFileSync(join(home, ".flucastr-ai", "manifiesto.txt"), "utf8");
}

// Quita del manifiesto las líneas que nombran el destino; devuelve cuántas quitó.
function quitarDelManifiesto(home, destino) {
  const archivo = join(home, ".flucastr-ai", "manifiesto.txt");
  const lineas = readFileSync(archivo, "utf8").split("\n");
  const quedan = lineas.filter((l) => !l.includes(destino));
  writeFileSync(archivo, quedan.join("\n"));
  return lineas.length - quedan.length;
}

// Simula un lanzador generado con otra raíz: la marca sigue en la línea 2 y solo cambia RAIZ.
function conOtraRaiz(contenido) {
  return contenido.replace(/^RAIZ=".*"$/m, 'RAIZ="/otra/raiz"');
}

describe("A4: lanzadores Pi y kit-run", () => {
  test("pi-planner marcado y sin registrar se regenera con la raíz actual", () => {
    const home = nuevoHome();
    const destino = bin(home, "pi-planner");
    const r1 = instalarEn(home, modelosCon());
    assert.equal(r1.status, 0, (r1.stderr || r1.stdout).slice(-800));
    const original = readFileSync(destino, "utf8");

    writeFileSync(destino, conOtraRaiz(original));
    assert.ok(quitarDelManifiesto(home, destino) > 0, "el manifiesto debía registrar pi-planner antes de quitarlo");

    const r2 = instalarEn(home, modelosCon());
    assert.equal(r2.status, 0, (r2.stderr || r2.stdout).slice(-800));
    assert.match(r2.stdout, /reemplazando archivo generado anterior: .*pi-planner/);
    // El contenido incluye la ruta temporal de FLUCASTR_MODELOS, que cambia entre instalaciones: se compara la raíz.
    const regenerado = readFileSync(destino, "utf8");
    assert.equal(regenerado.includes("/otra/raiz"), false);
    assert.ok(regenerado.includes(`RAIZ="${raiz}"`), "la raíz debe ser la actual");
    assert.match(manifiesto(home), /pi-planner/, "tras regenerarlo debe quedar registrado");
  });

  test("kit-run marcado con otra raíz se regenera con la raíz actual y queda registrado", () => {
    const home = nuevoHome();
    const destino = bin(home, "kit-run");
    const r1 = instalarEn(home, modelosCon());
    assert.equal(r1.status, 0, (r1.stderr || r1.stdout).slice(-800));
    const original = readFileSync(destino, "utf8");

    writeFileSync(destino, conOtraRaiz(original));
    assert.ok(quitarDelManifiesto(home, destino) > 0, "el manifiesto debía registrar kit-run antes de quitarlo");

    const r2 = instalarEn(home, modelosCon());
    assert.equal(r2.status, 0, (r2.stderr || r2.stdout).slice(-800));
    assert.match(r2.stdout, /reemplazando archivo generado anterior: .*kit-run/);
    const regenerado = readFileSync(destino, "utf8");
    assert.equal(regenerado.includes("/otra/raiz"), false);
    assert.ok(regenerado.includes(`RAIZ="${raiz}"`), "la raíz debe ser la actual");
    assert.match(manifiesto(home), /kit-run/, "tras regenerarlo debe quedar registrado");
  });

  test("pi-builder sin marca del kit se conserva y se omite", () => {
    const home = nuevoHome();
    const destino = bin(home, "pi-builder");
    const ajeno = "#!/usr/bin/env bash\necho mio\n";
    writeFileSync(destino, ajeno);

    const r = instalarEn(home, modelosCon());
    assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
    assert.match(r.stdout, /OMITIDO \(ya existe\): .*pi-builder/);
    assert.equal(readFileSync(destino, "utf8"), ajeno);
  });

  test("kit-run sin marca del kit se conserva y se omite", () => {
    const home = nuevoHome();
    const destino = bin(home, "kit-run");
    const ajeno = "#!/usr/bin/env bash\necho mi kit-run\n";
    writeFileSync(destino, ajeno);

    const r = instalarEn(home, modelosCon());
    assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
    assert.match(r.stdout, /OMITIDO \(ya existe\): .*kit-run/);
    assert.equal(readFileSync(destino, "utf8"), ajeno);
  });
});
