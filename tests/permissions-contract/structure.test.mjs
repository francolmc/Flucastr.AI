import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

// Una instrucción que use git -C o git -c (con espacio o ruta después) está prohibida en core/;
// solo la advertencia del skill puede nombrarlos, porque ahí no van seguidos de espacio ni de ruta.
const INSTRUCCION_GIT_OPCION = /git -[Cc](\s|<)/;
const instruccionesGitOpcion = (texto) => texto.split("\n").filter(linea => INSTRUCCION_GIT_OPCION.test(linea));
function markdownBajo(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entrada => {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) return markdownBajo(ruta);
    return entrada.name.endsWith(".md") ? [ruta] : [];
  });
}

test("ningún Markdown de core/ instruye git -C ni git -c; solo la advertencia del skill los nombra", () => {
  assert.deepEqual(instruccionesGitOpcion("Ejecuta `git -C <folder> status`\nnada\n"), ["Ejecuta `git -C <folder> status`"]);
  assert.deepEqual(instruccionesGitOpcion("never use `git -C` or `git -c`, which are blocked:"), []);
  const infractores = markdownBajo(join(KIT, "core")).flatMap(archivo =>
    instruccionesGitOpcion(readFileSync(archivo, "utf8")).map(linea => `${archivo}: ${linea}`));
  assert.deepEqual(infractores, []);
  assert.match(readFileSync(join(KIT, "core/skills/execute-plan/SKILL.md"), "utf8"), /never use `git -C` or `git -c`, which are blocked/);
});
