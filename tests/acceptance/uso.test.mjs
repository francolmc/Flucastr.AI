// Flujo de aceptación «uso»: envuelve pruebas/uso/probar.mjs.
// Corre la suite existente sin cambiarla y afirma que sale con código 0.
// Filtro por flujo: node --test --test-name-pattern=uso pruebas/aceptacion/

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUITE = fileURLToPath(new URL("../../pruebas/uso/probar.mjs", import.meta.url));
const RAIZ = fileURLToPath(new URL("../..", import.meta.url));

test("uso: la suite del medidor de costos pasa", () => {
  const r = spawnSync(process.execPath, [SUITE], { cwd: RAIZ, encoding: "utf8", timeout: 300000 });
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n");
  const cola = salida.slice(-40).join("\n");
  assert.equal(
    r.status,
    0,
    `flujo uso falló (exit ${r.status ?? r.signal}):\n${cola}`,
  );
});
