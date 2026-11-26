// Pi no recibe `disallowedTools` en la cabecera del agente (es una clave de Claude Code); Claude Code la conserva.
// Copia el planner real a un directorio temporal, inserta la clave tras `name:` y compara la salida de
// `resolver.mjs agente-pi` y `agente-claude`. No instala nada ni toca el HOME.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const plannerOriginal = join(raiz, "core", "agents", "planner.md");
const resolverJs = join(raiz, "scripts", "resolver.mjs");

// Devuelve el directorio temporal y la ruta de una copia de planner.md con `disallowedTools: Artifact` tras `name:`.
function copiaConClave() {
  const dir = mkdtempSync(join(tmpdir(), "piso-frontmatter-"));
  const archivo = join(dir, "planner.md");
  const original = readFileSync(plannerOriginal, "utf8");
  const conClave = original.replace(/^name:.*$/m, (linea) => `${linea}\ndisallowedTools: Artifact`);
  assert.notEqual(conClave, original, "no se encontró la línea name: en planner.md");
  writeFileSync(archivo, conClave);
  return { dir, archivo };
}

function resolver(orden, archivo) {
  const r = spawnSyncSeguro(process.execPath, [resolverJs, orden, archivo], { cwd: raiz, encoding: "utf8" });
  assert.equal(r.status, 0, `resolver ${orden} sale ${r.status}: ${r.stderr}`);
  return r.stdout;
}

describe("cabecera de planner por herramienta", () => {
  test("Pi: la cabecera no contiene disallowedTools", () => {
    const { dir, archivo } = copiaConClave();
    try {
      const salida = resolver("agente-pi", archivo);
      assert.doesNotMatch(salida, /^disallowedTools:/m, "agente-pi conserva disallowedTools");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("Claude Code: la cabecera conserva disallowedTools", () => {
    const { dir, archivo } = copiaConClave();
    try {
      const salida = resolver("agente-claude", archivo);
      assert.match(salida, /^disallowedTools: Artifact$/m, "agente-claude no conserva disallowedTools");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
