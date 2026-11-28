import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { crearTerminacion, registrarTermino, validarRetorno } from "../../tools/run/termination.mjs";
import { historial } from "../../tools/run/escalera.mjs";
import { leerRegistro } from "../../tools/run/informe.mjs";

const intento = {
  plan: "changes/demo/plan.md", tramo: 1, fecha: "2026-11-27T12:00:00.000Z", herramienta: "codex",
  builder_ms: 1, verify_ms: 2, revisor_ms: 3, resultado: "DONE", motivo_relanzamiento: null,
};

test("A1: valida retornos DONE y PAUSED con y sin tramo", () => {
  assert.deepEqual(validarRetorno("DONE: plan=changes/demo/plan.md; segment=1; verify=pasa\nextra"), {
    ok: true, resultado: "DONE", plan: "changes/demo/plan.md", tramo: 1,
  });
  assert.deepEqual(validarRetorno("DONE: plan=changes/demo/plan.md; verify=pasa"), {
    ok: true, resultado: "DONE", plan: "changes/demo/plan.md", tramo: null,
  });
  assert.deepEqual(validarRetorno("PAUSED: plan=changes/demo/plan.md; segment=1; motivo=verify; hecho=2/4; siguiente=paso dos; no_intentado=falló"), {
    ok: true, resultado: "PAUSED", plan: "changes/demo/plan.md", tramo: 1,
    motivo: "verify", hecho: "2/4", siguiente: "paso dos", no_intentado: "falló",
  });
  assert.equal(validarRetorno("texto sin retorno").ok, false);
});

test("A1: registra un término acotado y mantiene compatibilidad de intentos", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-await-contract-"));
  try {
    const ruta = join(dir, "runs.jsonl");
    const r = registrarTermino(ruta, intento, "PAUSED", {
      motivo: "verify", hecho: "1/3", siguiente: "paso 2", no_intentado: "falla de verify",
    }, "2026-11-27T12:01:00.000Z");
    assert.equal(r.ok, true);
    assert.equal(r.registro.fecha, intento.fecha, "la fecha histórica sigue siendo la de inicio");
    assert.deepEqual(r.registro.terminacion, {
      fecha: "2026-11-27T12:01:00.000Z", resultado: "PAUSED", motivo: "verify",
      hecho: "1/3", siguiente: "paso 2", no_intentado: "falla de verify",
    });
    const contenido = readFileSync(ruta, "utf8");
    const objeto = JSON.parse(contenido.trim());
    assert.equal(leerRegistro(contenido).errores.length, 0, "el informe histórico acepta el intento extendido");
    assert.deepEqual(historial([JSON.stringify(objeto)], intento.plan, intento.tramo).usados, 0);
    assert.throws(() => crearTerminacion(intento, "DESCONOCIDO", {}, "2026-11-27T12:01:00.000Z"), /resultado de término/);
    assert.throws(() => crearTerminacion(intento, "DONE", {}, "fecha mala"), /ISO-8601/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("A1: al fallar la escritura, el aviso identifica el registro", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-await-registro-error-"));
  const errores = [];
  const original = console.error;
  try {
    const ruta = join(dir, "runs.jsonl");
    mkdirSync(ruta);
    console.error = mensaje => errores.push(mensaje);
    const r = registrarTermino(ruta, intento, "DONE", {}, "2026-11-27T12:01:00.000Z");
    assert.equal(r.ok, false);
    assert.match(errores.join("\n"), /kit-run: no se pudo escribir el registro/);
  } finally {
    console.error = original;
    rmSync(dir, { recursive: true, force: true });
  }
});
