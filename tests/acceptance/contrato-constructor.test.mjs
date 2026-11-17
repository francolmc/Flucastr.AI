// Flujo de aceptación «contrato-constructor»: envuelve pruebas/contrato-constructor.mjs.
// Corre la suite existente sin cambiarla y afirma que sale con código 0.
// Filtro por flujo: node --test --test-name-pattern=contrato-constructor pruebas/aceptacion/

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUITE = fileURLToPath(new URL("../../pruebas/contrato-constructor.mjs", import.meta.url));
const RAIZ = fileURLToPath(new URL("../..", import.meta.url));

test("contrato-constructor: la suite del contrato del constructor pasa", () => {
  const r = spawnSync(process.execPath, [SUITE], { cwd: RAIZ, encoding: "utf8", timeout: 300000 });
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n");
  const cola = salida.slice(-40).join("\n");
  assert.equal(
    r.status,
    0,
    `flujo contrato-constructor falló (exit ${r.status ?? r.signal}):\n${cola}`,
  );
});
