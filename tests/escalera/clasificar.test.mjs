// Pruebas del clasificador de fallas (tools/run/clasificar.mjs). Casos A1 de changes/escalera-recuperacion/plan.md.
// Sin red ni procesos: solo datos de tests/escalera/fixtures/clases.json.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { clasificar } from "../../tools/run/clasificar.mjs";

const casos = JSON.parse(readFileSync(new URL("./fixtures/clases.json", import.meta.url), "utf8"));

describe("clasificar", () => {
  for (const caso of casos) {
    test(caso.nombre, () => {
      assert.deepEqual(clasificar(caso.entrada), caso.esperado);
    });
  }
});

describe("cobertura de fixtures (A1)", () => {
  const clases = new Set(casos.map((c) => c.esperado.clase));
  const senales = new Set(casos.map((c) => c.esperado.senal));

  test("hay al menos un fixture por clase", () => {
    assert.deepEqual([...clases].sort(), ["decision", "entorno", "infra", "plan", "tarea"]);
  });

  test("hay un fixture por cada señal de las Assumptions", () => {
    const requeridas = [
      "thrashing", "invalid_request", "tope",
      "limite_uso", "red", "desconocida",
      "ENOSPC", "docker", "EPERM", "imagen", "navegador", "status 137", "status 143",
      "motivo=access", "motivo=scope", "motivo=ambiguous", "motivo=design", "motivo=verify",
      "RETURNED", "verify",
    ];
    for (const senal of requeridas) {
      assert.ok(senales.has(senal), `falta un fixture con la señal ${senal}`);
    }
  });
});
