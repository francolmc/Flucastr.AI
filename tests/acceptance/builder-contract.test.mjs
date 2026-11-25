// Flujo de aceptación «builder-contract»: envuelve tests/builder-contract.mjs.
// Corre la suite existente sin cambiarla y afirma que sale con código 0.
// Filtro por flujo: node --test --test-name-pattern=builder-contract tests/acceptance/

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { fileURLToPath } from "node:url";

const SUITE = fileURLToPath(new URL("../builder-contract.mjs", import.meta.url));
const RAIZ = fileURLToPath(new URL("../..", import.meta.url));

test("builder-contract: la suite del contrato del builder pasa", () => {
  const r = spawnSyncSeguro(process.execPath, [SUITE], { cwd: RAIZ, encoding: "utf8", timeout: 300000 });
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n");
  const cola = salida.slice(-40).join("\n");
  assert.equal(
    r.status,
    0,
    `flujo builder-contract falló (exit ${r.status ?? r.signal}):\n${cola}`,
  );
});
