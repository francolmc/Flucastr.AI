import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const KIT = fileURLToPath(new URL("../..", import.meta.url));
const RESOLVER = join(KIT, "scripts/resolver.mjs");
const MARCA = "# flucastr-ai:generado - no editar; se regenera con install.sh";

function reglas(contenido) {
  return contenido.split(/\n(?=prefix_rule\()/).filter(b => b.startsWith("prefix_rule(")).map(b => ({
    pattern: JSON.parse(b.match(/pattern = (\[[^\n]+\])/)[1]),
    decision: b.match(/decision = "([^"]+)"/)[1],
  }));
}

test("las reglas allow no contienen intérpretes ni comodines ajenos a lo generado", t => {
  const temporal = mkdtempSync(join(tmpdir(), "permisos estructura "));
  t.after(() => rmSync(temporal, { recursive: true, force: true }));
  const agents = join(temporal, "AGENTS.md");
  const archivo = join(temporal, "flucastr.rules");
  writeFileSync(agents, [
    "Comprobación rápida: `./verify`",
    "Servicio: `docker compose up`",
    "Acceptance: `node verificacion/aceptacion.mjs`",
    "Diagnóstico: `bash -c diagnose`",
  ].join("\n") + "\n");
  execFileSync(process.execPath, [RESOLVER, "fijar-deny", "codex", archivo, agents], { encoding: "utf8" });
  const texto = readFileSync(archivo, "utf8");
  assert.ok(texto.startsWith(MARCA));
  const todas = reglas(texto);
  const allow = todas.filter(r => r.decision === "allow");
  const listaGenerada = [["ls"]];
  assert.deepEqual(allow.map(r => r.pattern), listaGenerada);
  for (const regla of allow) {
    assert.equal(regla.pattern.some(token => /^(?:bash|sh|zsh|node|python|python3|npm|npx|pnpm|yarn|bun|docker)$/i.test(token)), false);
    assert.equal(regla.pattern.some(token => /[*?]/.test(token)), false);
    assert.ok(listaGenerada.some(generada => JSON.stringify(generada) === JSON.stringify(regla.pattern)));
  }
  assert.ok(todas.some(r => r.decision === "forbidden" && JSON.stringify(r.pattern) === JSON.stringify(["bash", "-c"])));
  assert.ok(todas.some(r => r.decision === "forbidden" && JSON.stringify(r.pattern) === JSON.stringify(["git", "commit"])));
});
