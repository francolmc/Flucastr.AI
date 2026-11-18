import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const raiz = process.cwd();
const temporal = mkdtempSync(join(tmpdir(), "deny-claude-"));
const home = join(temporal, "home");
const proyecto = join(temporal, "proyecto");
mkdirSync(join(proyecto, ".claude"), { recursive: true });
const settings = join(proyecto, ".claude", "settings.json");
const globalSettings = join(home, ".claude", "settings.json");

function ejecutar(args) {
  return spawnSync(process.execPath, [join(raiz, "scripts/resolver.mjs"), ...args], {
    cwd: temporal,
    env: { PATH: process.env.PATH, HOME: home, LANG: "C.UTF-8", TZ: "UTC" },
    encoding: "utf8",
  });
}

try {
  writeFileSync(settings, "{}\n");
  const vacio = ejecutar(["fijar-deny", "claude", settings, "--simular"]);
  assert.equal(vacio.status, 0);
  assert.match(vacio.stdout, /^agregada:Read\(\.\/\.env\)\n/);
  assert.equal(vacio.stderr, "");
  assert.equal(readFileSync(settings, "utf8"), "{}\n");

  writeFileSync(settings, JSON.stringify({ keep: true, permissions: { deny: ["UserRule"] } }) + "\n");
  const ajeno = ejecutar(["fijar-deny", "claude", settings]);
  assert.equal(ajeno.status, 0);
  assert.equal(ajeno.stderr, "");
  const actualizado = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(actualizado.keep, true);
  assert.equal(actualizado.permissions.deny[0], "UserRule");
  assert.ok(actualizado.permissions.deny.includes("Read(./.env)"));

  for (const invalid of [{ permissions: [] }, { permissions: { deny: "Read(./.env)" } }]) {
    writeFileSync(settings, JSON.stringify(invalid) + "\n");
    const antes = readFileSync(settings, "utf8");
    const resultado = ejecutar(["fijar-deny", "claude", settings]);
    assert.equal(resultado.status, 1);
    assert.equal(resultado.stdout, "");
    assert.match(resultado.stderr, /no lo toco/);
    assert.equal(readFileSync(settings, "utf8"), antes);
  }

  writeFileSync(settings, JSON.stringify({ keep: true, permissions: { deny: ["Read(./.env)", "UserRule", "Read(./.env)"] } }) + "\n");
  const revertir = ejecutar(["quitar-deny", "claude", settings, "Read(./.env)"]);
  assert.equal(revertir.status, 0);
  assert.equal(revertir.stdout, "quitado\n");
  assert.deepEqual(JSON.parse(readFileSync(settings, "utf8")).permissions.deny, ["UserRule", "Read(./.env)"]);

  mkdirSync(join(home, ".claude"), { recursive: true });
  writeFileSync(globalSettings, "{}\n");
  const global = ejecutar(["fijar-deny", "claude", globalSettings]);
  assert.equal(global.status, 1);
  assert.equal(global.stdout, "");
  assert.match(global.stderr, /nunca el de ~/);
  assert.equal(readFileSync(globalSettings, "utf8"), "{}\n");
  assert.equal(existsSync(join(home, ".claude", "settings.local.json")), false);
  console.log("deny Claude: simulación, preservación ajena, tipos inválidos, reversión selectiva y rechazo global; OK");
} finally {
  rmSync(temporal, { recursive: true, force: true });
}
