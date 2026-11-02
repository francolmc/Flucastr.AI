// Pruebas de scripts/crecimiento-definiciones.mjs: casos puros y CLI sobre un repo temporal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOPE_PASADA, crecimiento } from "../../scripts/crecimiento-definiciones.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = join(RAIZ, "scripts", "crecimiento-definiciones.mjs");

function ejecutar(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
}

// Crea un repo temporal con definitions/<nombre> commiteados en HEAD.
function repoTemporal(archivos) {
  const dir = mkdtempSync(join(tmpdir(), "crecimiento-"));
  const defs = join(dir, "definitions");
  mkdirSync(defs);
  for (const [nombre, contenido] of Object.entries(archivos)) {
    writeFileSync(join(defs, nombre), contenido);
  }
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base"], { cwd: dir });
  return dir;
}

test("el tope por pasada es 12288 bytes", () => {
  assert.equal(TOPE_PASADA, 12288);
});

test("un archivo nuevo cuenta entero", () => {
  assert.equal(crecimiento({}, { "a.md": 500 }), 500);
});

test("un archivo que encoge cuenta 0", () => {
  assert.equal(crecimiento({ "a.md": 500 }, { "a.md": 300 }), 0);
});

test("suma los aumentos de varios archivos", () => {
  const antes = { "a.md": 100, "b.md": 200, "c.md": 300 };
  const despues = { "a.md": 150, "b.md": 150, "c.md": 400, "d.md": 50 };
  // a: +50, b: encoge (0), c: +100, d: nuevo +50
  assert.equal(crecimiento(antes, despues), 200);
});

test("exactamente 12288 bytes de crecimiento está dentro del tope", () => {
  const total = crecimiento({ "a.md": 1000 }, { "a.md": 1000 + TOPE_PASADA });
  assert.equal(total, TOPE_PASADA);
  assert.ok(total <= TOPE_PASADA);
});

test("CLI: crecimiento de 100 bytes sale 0", () => {
  const dir = repoTemporal({ "A.md": "x".repeat(1000) });
  try {
    writeFileSync(join(dir, "definitions", "A.md"), "x".repeat(1100));
    const r = ejecutar(["--raiz", dir], RAIZ);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Crecimiento: 100 bytes/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: control negativo, +12289 bytes sale 1 con FALLA en stderr", () => {
  const dir = repoTemporal({ "A.md": "x".repeat(1000) });
  try {
    writeFileSync(join(dir, "definitions", "A.md"), "x".repeat(1000 + TOPE_PASADA + 1));
    const r = ejecutar(["--raiz", dir], RAIZ);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /FALLA/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: --tope 10 con +100 bytes sale 1", () => {
  const dir = repoTemporal({ "A.md": "x".repeat(1000) });
  try {
    writeFileSync(join(dir, "definitions", "A.md"), "x".repeat(1100));
    const r = ejecutar(["--raiz", dir, "--tope", "10"], RAIZ);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /FALLA/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: argumento desconocido sale 2 con Uso", () => {
  const r = ejecutar(["--bogus"], RAIZ);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Uso:/);
});
