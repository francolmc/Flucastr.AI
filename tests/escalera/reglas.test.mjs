// Reglas del planner para la escalera (tramo 6, A9 de changes/escalera-recuperacion/plan.md): planner.md manda seguir
// la escalera de core/references/planner/paused-and-interrupted.md; el relevo exige respuesta explícita y estimación.
// Las frases son literales: si cambian, cambia esta comprobación con ellas, no se debilita.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const leer = (ruta) => readFileSync(new URL(`../../${ruta}`, import.meta.url), "utf8");
const PLANNER = leer("core/agents/planner.md");
const REFERENCIA = leer("core/references/planner/paused-and-interrupted.md");
const KIT_RUN = leer("docs/kit-run.md");

describe("core/agents/planner.md (A9)", () => {
  test("la línea de PAUSED y caída remite a la escalera", () => {
    assert.ok(PLANNER.includes("- On PAUSED or crash: follow the ladder in `paused-and-interrupted.md`. Never run `docker system prune`."));
  });

  test("no ofrece ejecutar tras dos PAUSED", () => {
    assert.ok(!PLANNER.includes("After two `PAUSED`"));
    assert.ok(!REFERENCIA.includes("offer to execute"));
  });

  test("conserva el límite de dos relanzamientos", () => {
    assert.ok(PLANNER.includes("at most 2 times"));
  });
});

describe("referencia de la escalera (A9)", () => {
  test("los cuatro pasos", () => {
    for (const paso of ["Step 0", "Step 1", "Step 2", "Step 3", "Step 4"]) assert.ok(REFERENCIA.includes(paso), paso);
  });

  test("las clases de falla con sus nombres de kit run", () => {
    for (const clase of ["`infra`", "`entorno`", "`plan`", "`decision`", "`tarea`"]) assert.ok(REFERENCIA.includes(clase), clase);
  });

  test("el relevo exige respuesta explícita con estimación", () => {
    assert.ok(REFERENCIA.includes("--tokens"));
    assert.ok(REFERENCIA.includes("Without an explicit answer, nothing runs."));
    assert.ok(REFERENCIA.includes("estimate"));
  });

  test("el paso 3 exige el sí cada vez y el nivel se sube según la herramienta", () => {
    assert.ok(REFERENCIA.includes("explicit yes, every time"));
    assert.ok(REFERENCIA.includes("`model`"));
    assert.ok(REFERENCIA.includes("Codex uses `kit run --paso 3`"));
    assert.ok(REFERENCIA.includes("Pi has no single-launch mechanism"));
    assert.ok(REFERENCIA.includes("present it to the person as a decision"));
  });

  test("el consejo tiene el límite de 500 tokens y 2000 caracteres", () => {
    assert.ok(REFERENCIA.includes("500 tokens"));
    assert.ok(REFERENCIA.includes("2000 characters"));
  });

  test("explica scripts/kit-escalera.mjs, sus opciones y la devolución de la revisión", () => {
    for (const frase of ["scripts/kit-escalera.mjs", "--salida", "--resuelto", "motivo=verify", "--herramienta <claude|pi|codex>", "--raiz <project>", "`resuelto_por`"]) assert.ok(REFERENCIA.includes(frase), frase);
  });

  test("el comando de la referencia tiene la forma de kit-escalera con <kit-root>", () => {
    assert.ok(REFERENCIA.includes('node "<kit-root>/scripts/kit-escalera.mjs" <plan> --salida <file>'));
  });

  test("docs/kit-run.md muestra el comando completo y la decisión de Pi", () => {
    assert.ok(KIT_RUN.includes('node "<kit-root>/scripts/kit-escalera.mjs" <plan> --salida <archivo> --herramienta <claude|pi|codex> --raiz <proyecto>'));
    assert.ok(KIT_RUN.includes("en Pi no hay mecanismo de un solo lanzamiento"));
  });

  test("infra, entorno, plan y decisión nunca llevan relevo", () => {
    assert.ok(REFERENCIA.includes("never get relief"));
  });

  test("conserva la limpieza de Docker y la reconstrucción por git status", () => {
    assert.ok(REFERENCIA.includes("docker system prune"));
    assert.ok(REFERENCIA.includes("git status"));
  });

  test("ya no sugiere subir agents.builder.level", () => {
    assert.ok(!REFERENCIA.includes("suggest raising"));
    assert.ok(!REFERENCIA.includes("agents.builder.level"));
  });
});

describe("docs/kit-run.md (A9)", () => {
  test("describe la escalera, sus pasos y los campos del registro", () => {
    for (const frase of ["Escalera de recuperación", "`infra`", "--paso 3", "--resuelto", "`clase`", "`paso`", "`resuelto_por`"]) assert.ok(KIT_RUN.includes(frase), frase);
  });
});
