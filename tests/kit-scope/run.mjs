// Pruebas de kit-scope contra repos git temporales (segmento 2, A1–A5). Sin red; cada repo vive en $TMPDIR y se borra al salir.
// Cada caso corre scripts/kit-scope.mjs con --json y compara filas y código de salida.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const KIT = fileURLToPath(new URL("../../scripts/kit-scope.mjs", import.meta.url));
const PLAN_REL = "changes/prueba/plan.md";
const temporales = [];

// Plan mínimo con Scope, criterios A# y Evidence (sin segment: no hay tramos).
const plan = (scope, evidencia = "(vacío)") => `---
status: approved
branch: feature/prueba
base: main
repos: [.]
executor: builder
---
# Prueba de kit-scope

## Goal
Comprobar el contraste con el Scope.

## Scope
${scope}

## Acceptance
- A1: algo

## Verification
\`./verify\`

## Evidence
${evidencia}
`;

const git = (dir, args) =>
  execFileSync("git", ["-C", dir, "-c", "user.name=prueba", "-c", "user.email=prueba@example.com", "-c", "commit.gpgsign=false", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const escribir = (dir, ruta, contenido = "x\n") => {
  const abs = join(dir, ruta);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contenido);
};

// Repo con base en main (plan, src/*, otro.txt, yarn.lock) y una rama feature/prueba.
// `enRama(dir)` aplica los cambios de la rama; no confirma (así prueba cambios sin seguimiento y sin confirmar).
function repo(scope, enRama, { planEnBase = plan(scope), confirmar = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "kit-scope-"));
  temporales.push(dir);
  git(dir, ["init", "-q", "-b", "main"]);
  escribir(dir, PLAN_REL, planEnBase);
  escribir(dir, "src/a.mjs");
  escribir(dir, "src/b.mjs");
  escribir(dir, "src/secreto/x.mjs");
  escribir(dir, "otro.txt");
  escribir(dir, "yarn.lock", "lock base\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "base"]);
  git(dir, ["switch", "-q", "-c", "feature/prueba"]);
  if (enRama) enRama(dir);
  if (confirmar) {
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "-m", "rama"]);
  }
  return dir;
}

function correr(dir, args = [], plan_ = PLAN_REL) {
  const r = spawnSync(process.execPath, [KIT, plan_, ...args], { cwd: dir, encoding: "utf8" });
  return { codigo: r.status, salida: r.stdout, error: r.stderr };
}

function informe(dir, args = []) {
  const r = correr(dir, ["--json", ...args]);
  return { codigo: r.codigo, filas: JSON.parse(r.salida).filas, crudo: r };
}

const errores = filas => filas.filter(f => f.nivel === "error");
const hallar = (filas, elemento) => filas.find(f => f.elemento === elemento);

test.after(() => {
  for (const d of temporales) rmSync(d, { recursive: true, force: true });
});

// --- A1: cambios dentro de Scope ---

test("A1: cambios todos dentro de Scope dan exit 0 y ninguna fila error", () => {
  const dir = repo("`src/a.mjs`, `src/c.mjs`", d => {
    escribir(d, "src/a.mjs", "cambio\n");
    escribir(d, "src/c.mjs", "nuevo sin seguimiento\n");
  }, { confirmar: false });
  const r = informe(dir);
  assert.equal(r.codigo, 0, r.crudo.salida);
  assert.deepEqual(errores(r.filas), []);
  assert.equal(hallar(r.filas, "src/a.mjs")?.nivel, "ok");
  assert.equal(hallar(r.filas, "src/c.mjs")?.nivel, "ok");
});

test("A1: no escribe en el repo (estado de git y índice iguales antes y después)", () => {
  const dir = repo("`src/a.mjs`", d => escribir(d, "src/a.mjs", "cambio\n"), { confirmar: false });
  const huella = () => ({
    estado: git(dir, ["status", "--porcelain"]),
    indice: createHash("sha256").update(readFileSync(join(dir, ".git", "index"))).digest("hex"),
  });
  const antes = huella();
  const r = correr(dir, ["--json"]);
  assert.equal(r.codigo, 0, r.salida);
  assert.deepEqual(huella(), antes);
});

// --- A2: fuera de Scope ---

test("A2: archivo fuera de Scope da error y exit 1", () => {
  const dir = repo("`src/a.mjs`", d => {
    escribir(d, "src/a.mjs", "cambio\n");
    escribir(d, "otro.txt", "cambio fuera\n");
  });
  const r = informe(dir);
  assert.equal(r.codigo, 1);
  const fila = hallar(r.filas, "otro.txt");
  assert.equal(fila?.nivel, "error");
  assert.match(fila.mensaje, /fuera de Scope/);
});

test("A2: ruta excluida con Fuera da error y exit 1", () => {
  const dir = repo("`src/`. Fuera: `src/secreto/`", d => escribir(d, "src/secreto/x.mjs", "cambio\n"));
  const r = informe(dir);
  assert.equal(r.codigo, 1);
  assert.match(hallar(r.filas, "src/secreto/x.mjs")?.mensaje ?? "", /excluida/);
});

// --- A3: omisión ---

test("A3: archivo del Scope sin tocar da aviso «posible omisión» y exit 0", () => {
  const dir = repo("`src/a.mjs`, `src/b.mjs`", d => escribir(d, "src/a.mjs", "cambio\n"));
  const r = informe(dir);
  assert.equal(r.codigo, 0, r.crudo.salida);
  assert.deepEqual(errores(r.filas), []);
  const aviso = hallar(r.filas, "src/b.mjs");
  assert.equal(aviso?.nivel, "aviso");
  assert.match(aviso.mensaje, /posible omisión/);
});

// --- A4: prohibidas ---

test("A4: .env, llave y lockfile no autorizado dan error «prohibido»", () => {
  const dir = repo("`src/a.mjs`", d => {
    escribir(d, ".env", "X=1\n");
    escribir(d, "keys/k.pem", "x\n");
    escribir(d, "yarn.lock", "cambio\n");
  });
  const r = informe(dir);
  assert.equal(r.codigo, 1);
  for (const ruta of [".env", "keys/k.pem", "yarn.lock"]) {
    assert.equal(hallar(r.filas, ruta)?.nivel, "error", ruta);
    assert.match(hallar(r.filas, ruta).mensaje, /prohibido/, ruta);
  }
});

test("A4: lockfile nombrado en Scope queda ok", () => {
  const dir = repo("`src/a.mjs`, `yarn.lock`", d => escribir(d, "yarn.lock", "cambio\n"));
  const r = informe(dir);
  assert.equal(r.codigo, 0, r.crudo.salida);
  assert.equal(hallar(r.filas, "yarn.lock")?.nivel, "ok");
});

test("A4: cambiar el Scope del plan da error «prohibido: plan»", () => {
  const dir = repo("`src/a.mjs`", d => {
    escribir(d, "src/a.mjs", "cambio\n");
    escribir(d, PLAN_REL, plan("`src/a.mjs`, `src/b.mjs`"));
  });
  const r = informe(dir);
  assert.equal(r.codigo, 1);
  assert.match(hallar(r.filas, PLAN_REL)?.mensaje ?? "", /prohibido: plan/);
});

test("A4: cambiar solo Evidence del plan no da error de plan", () => {
  const dir = repo("`src/a.mjs`", d => {
    escribir(d, "src/a.mjs", "cambio\n");
    escribir(d, PLAN_REL, plan("`src/a.mjs`", "$ node --test\nexit 0"));
  });
  const r = informe(dir);
  assert.equal(r.codigo, 0, r.crudo.salida);
  assert.equal(hallar(r.filas, PLAN_REL), undefined);
});

// --- A5: no verificable ---

test("A5: base inexistente da no_verificable y exit 3", () => {
  const dir = repo("`src/a.mjs`", d => escribir(d, "src/a.mjs", "cambio\n"));
  const r = informe(dir, ["--base", "no-existe"]);
  assert.equal(r.codigo, 3);
  assert.match(r.filas.find(f => f.nivel === "no_verificable")?.mensaje ?? "", /base inexistente/);
});

test("A5: carpeta sin git da no_verificable y exit 3", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-scope-sin-git-"));
  temporales.push(dir);
  escribir(dir, PLAN_REL, plan("`src/a.mjs`"));
  const r = informe(dir);
  assert.equal(r.codigo, 3);
  assert.match(r.filas.find(f => f.nivel === "no_verificable")?.mensaje ?? "", /sin git/);
});

test("A5: Scope vacío o sin rutas da no_verificable y exit 3", () => {
  const dir = repo("Sin rutas todavía.", d => escribir(d, "src/a.mjs", "cambio\n"));
  const r = informe(dir);
  assert.equal(r.codigo, 3);
  assert.equal(r.filas[0].nivel, "no_verificable");
});

test("A5: plan inexistente sale con 2 (uso)", () => {
  const dir = repo("`src/a.mjs`", d => escribir(d, "src/a.mjs", "cambio\n"));
  assert.equal(correr(dir, [], "changes/no/plan.md").codigo, 2);
});
