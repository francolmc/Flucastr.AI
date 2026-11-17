// Flujo de aceptación «kit-run»: envuelve pruebas/kit-run/probar.mjs.
// Corre la suite existente sin cambiarla y afirma que sale con código 0.
// Filtro por flujo: node --test --test-name-pattern=kit-run pruebas/aceptacion/

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUITE = fileURLToPath(new URL("../../pruebas/kit-run/probar.mjs", import.meta.url));
const RAIZ = fileURLToPath(new URL("../..", import.meta.url));

test("kit-run: la suite de kit run pasa", () => {
  const r = spawnSync(process.execPath, [SUITE], { cwd: RAIZ, encoding: "utf8", timeout: 300000 });
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n");
  const cola = salida.slice(-40).join("\n");
  assert.equal(
    r.status,
    0,
    `flujo kit-run falló (exit ${r.status ?? r.signal}):\n${cola}`,
  );
});
