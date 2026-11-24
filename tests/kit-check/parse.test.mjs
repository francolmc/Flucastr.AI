// Pruebas del analizador de criterios A# (segmento 1, A1–A5). Sin red, solo lectura de fixtures.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parsearPlan } from "../../tools/check/parse.mjs";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));
const hash = ruta => createHash("sha256").update(readFileSync(ruta)).digest("hex");

test("extrae la tabla completa (A1)", () => {
  const { filas, error } = parsearPlan(join(FIX, "tabla.md"));
  assert.equal(error, null);
  assert.deepEqual(filas.map(f => f.id), ["A1", "A2"]);
  assert.deepEqual(filas[0], {
    id: "A1",
    resultado: "Receta",
    comprobacion: "`grep -c x inventario.txt`",
    esperado: "exit 0",
    comando: "grep -c x inventario.txt",
    motivo: null,
    formato: "tabla",
    segmento: null,
    cwd: filas[0].cwd,
  });
});

test("segmento filtra historias y tramos enlazados (A2)", () => {
  const primero = parsearPlan(join(FIX, "historia.md"), { segmento: 1 });
  assert.equal(primero.error, null);
  assert.deepEqual(primero.filas.map(f => f.id), ["A1"]);
  assert.equal(primero.filas[0].formato, "historia");
  assert.equal(primero.filas[0].comando, "node --version");
  assert.equal(primero.filas[0].esperado, "exit 0");

  const segundo = parsearPlan(join(FIX, "historia.md"), { segmento: 2 });
  assert.equal(segundo.error, null);
  assert.deepEqual(segundo.filas.map(f => f.id), ["A2"]);

  const enlazado = parsearPlan(join(FIX, "enlazado", "plan.md"), { segmento: 2 });
  assert.equal(enlazado.error, null);
  assert.deepEqual(enlazado.filas.map(f => [f.id, f.segmento]), [["A2", 2]]);

  const todos = parsearPlan(join(FIX, "enlazado", "plan.md"));
  assert.deepEqual(todos.filas.map(f => f.id), ["A1", "A2"]);
});

test("malformada: error y cero filas (A3)", () => {
  const { filas, error } = parsearPlan(join(FIX, "malformada.md"));
  assert.equal(typeof error, "string");
  assert.ok(error.length > 0);
  assert.deepEqual(filas, []);
});

test("tabla global no filtrable: error (A4)", () => {
  const { filas, error } = parsearPlan(join(FIX, "tabla.md"), { segmento: 1 });
  assert.match(error, /tabla global/);
  assert.deepEqual(filas, []);
});

test("ambiguo: lista antigua y dos comandos dan comando null (A5)", () => {
  const { filas, error } = parsearPlan(join(FIX, "lista.md"));
  assert.equal(error, null);
  const [a1, a2, a3] = filas;
  assert.equal(a1.formato, "lista");
  assert.equal(a1.comando, null);
  assert.equal(typeof a1.motivo, "string");
  assert.equal(a2.formato, "historia");
  assert.equal(a2.comando, null);
  assert.match(a2.motivo, /2 comandos/);
  assert.equal(a3.comando, null);
  assert.match(a3.motivo, /ejecutable/);
});

test("solo-lee: el plan no cambia al parsear", () => {
  const ruta = join(FIX, "tabla.md");
  const antes = hash(ruta);
  parsearPlan(ruta);
  parsearPlan(ruta, { segmento: 1 });
  assert.equal(hash(ruta), antes);
});

test("cwd: raíz del proyecto o carpeta única de repos", () => {
  const temporal = mkdtempSync(join(tmpdir(), "kit-check-cwd-"));
  try {
    const cuerpo = repos => `---\nrepos: ${repos}\n---\n## Aceptación\n\n| ID | Resultado observable | Comprobación | Resultado esperado |\n|----|----|----|----|\n| A1 | x | \`node --version\` | exit 0 |\n`;
    mkdirSync(join(temporal, "changes", "x"), { recursive: true });
    mkdirSync(join(temporal, "changes", "done", "y"), { recursive: true });
    const raiz = join(temporal, "changes", "x", "plan.md");
    const hecho = join(temporal, "changes", "done", "y", "plan.md");
    const multi = join(temporal, "changes", "x", "multi.md");
    const app = join(temporal, "changes", "x", "app.md");
    writeFileSync(raiz, cuerpo("[.]"));
    writeFileSync(hecho, cuerpo("[.]"));
    writeFileSync(multi, cuerpo("[., api, web]"));
    writeFileSync(app, cuerpo("[., api]"));
    assert.equal(parsearPlan(raiz).filas[0].cwd, temporal);
    assert.equal(parsearPlan(hecho).filas[0].cwd, temporal);
    assert.equal(parsearPlan(multi).filas[0].cwd, temporal);
    assert.equal(parsearPlan(app).filas[0].cwd, join(temporal, "api"));
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
});

test("prosa que cita check with no genera fila (solo A# reales)", () => {
  const temporal = mkdtempSync(join(tmpdir(), "kit-check-prosa-"));
  try {
    const plan = join(temporal, "plan.md");
    writeFileSync(plan, [
      "---",
      "repos: [.]",
      "---",
      "## Steps",
      "",
      "### Segment 1 — Story: historia de prueba",
      "",
      "Example: la línea `- A2: lista; check with `node t.mjs`; expect exit 0.` es prosa, no un criterio.",
      "",
      "Acceptance:",
      "- A1: versión de Node; check with `node --version`; expect exit 0.",
      "",
    ].join("\n"));
    const { filas, error } = parsearPlan(plan);
    assert.equal(error, null);
    assert.deepEqual(filas.map(f => f.id), ["A1"]);
    assert.equal(filas.some(f => f.id === "?"), false);
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
});
