// Pruebas del umbral de compactación por agente y herramienta (compactarEn en tools/model-resolution/models.mjs).
// Caso A1 de changes/ventana-por-agente/plan.md. Sin red ni CLIs: funciones puras y models.json del repo.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { crearResolucionModelos } from "../../tools/model-resolution/models.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const real = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
const { compactarEn, compactarCodex } = crearResolucionModelos(raiz);

describe("A1: compact_at por agente y herramienta", () => {
  test("la tabla del plan sale de models.json del repo", () => {
    assert.equal(compactarEn(real, "planner", "claude-code"), 267000);
    assert.equal(compactarEn(real, "planner", "codex"), 200000);
    assert.equal(compactarEn(real, "builder", "claude-code"), 167000);
    assert.equal(compactarEn(real, "builder", "codex"), 150000);
    assert.equal(compactarEn(real, "reviewer", "claude-code"), 267000);
    assert.equal(compactarEn(real, "reviewer", "codex"), 200000);
  });

  test("sin valor de Pi en el agente, compactarEn no devuelve umbral (Pi usa ventana − compact_reserve)", () => {
    assert.equal(compactarEn(real, "planner", "pi"), undefined);
    assert.equal(real.profiles["pi-openai"].compact_reserve, 92000);
    assert.equal(real.profiles["pi-openai"].windows["openai/gpt-6.1-terra"], 272000);
  });

  test("un número antiguo vale para todas las herramientas", () => {
    const c = { agents: { planner: { compact_at: 60000 } } };
    assert.equal(compactarEn(c, "planner", "claude-code"), 60000);
    assert.equal(compactarEn(c, "planner", "codex"), 60000);
  });

  test("un objeto sin la herramienta pedida cae al compact_at del perfil y luego al general", () => {
    const c = {
      default_profile: { codex: "codex-openai" },
      profiles: { "codex-openai": { tool: "codex", compact_at: 120000 } },
      agents: { planner: { compact_at: { "claude-code": 267000 } } },
      compact_at: 90000,
    };
    assert.equal(compactarEn(c, "planner", "codex"), 120000);
    const sinPerfil = { ...c, profiles: {}, default_profile: {} };
    assert.equal(compactarEn(sinPerfil, "planner", "codex"), 90000);
  });

  test("el revisor sin clave propia usa el valor del planner", () => {
    const c = { agents: { planner: { compact_at: { "claude-code": 267000, codex: 200000 } } } };
    assert.equal(compactarEn(c, "reviewer", "codex"), 200000);
    const conPropioSinValor = { ...c, kit_run: { reviewer: { level: "medium" } } };
    assert.equal(compactarEn(conPropioSinValor, "reviewer", "codex"), 200000);
  });

  test("el revisor con valor propio no usa el del planner", () => {
    const c = {
      agents: { planner: { compact_at: { codex: 200000 } } },
      kit_run: { reviewer: { compact_at: { codex: 180000 } } },
    };
    assert.equal(compactarEn(c, "reviewer", "codex"), 180000);
  });

  test("sin ningún valor, compactarEn y compactarCodex no devuelven umbral", () => {
    assert.equal(compactarEn({ agents: {} }, "reviewer", "codex"), undefined);
    const dir = mkdtempSync(join(tmpdir(), "ventana-sin-valor-"));
    const archivo = join(dir, "models.json");
    const previo = process.env.FLUCASTR_MODELOS;
    try {
      const sinValor = { ...real, agents: { planner: {}, builder: {} }, kit_run: {} };
      writeFileSync(archivo, JSON.stringify(sinValor));
      process.env.FLUCASTR_MODELOS = archivo;
      assert.equal(compactarCodex("reviewer"), "");
      assert.equal(compactarCodex("builder"), "");
    } finally {
      if (previo === undefined) delete process.env.FLUCASTR_MODELOS;
      else process.env.FLUCASTR_MODELOS = previo;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("compactarCodex da el valor real del repo para planner, builder y reviewer", () => {
    assert.equal(compactarCodex("planner"), "200000");
    assert.equal(compactarCodex("builder"), "150000");
    assert.equal(compactarCodex("reviewer"), "200000");
  });
});
