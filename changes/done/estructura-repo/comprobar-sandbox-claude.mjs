import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const raiz = process.cwd();
const temporal = mkdtempSync(join(tmpdir(), "sandbox-claude-"));
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
  const simular = ejecutar(["fijar-sandbox", "claude", settings, "--simular"]);
  assert.equal(simular.status, 0);
  assert.match(simular.stdout, /^agregado:sandbox\.enabled:true\nagregado:sandbox\.allowUnsandboxedCommands:false\nagregado:sandbox\.filesystem\.denyRead:/);
  assert.equal(simular.stderr, "");
  assert.equal(readFileSync(settings, "utf8"), "{}\n");

  writeFileSync(settings, JSON.stringify({ keep: true, sandbox: {
    enabled: false,
    allowUnsandboxedCommands: true,
    custom: "keep",
    filesystem: { custom: true, denyRead: ["UserRule", "**/*.key", "**/*.key"] },
  } }) + "\n");
  const preservar = ejecutar(["fijar-sandbox", "claude", settings]);
  assert.equal(preservar.status, 0);
  assert.match(preservar.stdout, /^incompatible:sandbox\.enabled\nincompatible:sandbox\.allowUnsandboxedCommands\nagregado:sandbox\.filesystem\.denyRead:/);
  assert.equal(preservar.stderr, "");
  const configuracion = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(configuracion.keep, true);
  assert.equal(configuracion.sandbox.enabled, false);
  assert.equal(configuracion.sandbox.allowUnsandboxedCommands, true);
  assert.equal(configuracion.sandbox.custom, "keep");
  assert.equal(configuracion.sandbox.filesystem.custom, true);
  assert.deepEqual(configuracion.sandbox.filesystem.denyRead.slice(0, 3), ["UserRule", "**/*.key", "**/*.key"]);

  for (const invalid of ["{\n", JSON.stringify({ sandbox: [] }) + "\n", JSON.stringify({ sandbox: { filesystem: [] } }) + "\n", JSON.stringify({ sandbox: { filesystem: { denyRead: "bad" } } }) + "\n"]) {
    writeFileSync(settings, invalid);
    const antes = readFileSync(settings, "utf8");
    const resultado = ejecutar(["fijar-sandbox", "claude", settings]);
    assert.equal(resultado.status, 1);
    assert.equal(resultado.stdout, "");
    assert.match(resultado.stderr, /no lo toco|no es JSON válido/);
    assert.equal(readFileSync(settings, "utf8"), antes);
  }

  writeFileSync(settings, JSON.stringify({ keep: true, sandbox: { custom: 1, filesystem: { custom: 2, denyRead: ["**/*.key", "UserRule", "**/*.key"] } } }) + "\n");
  const quitar = ejecutar(["quitar-sandbox", "claude", settings, "sandbox.filesystem.denyRead", '"**/*.key"']);
  assert.equal(quitar.status, 0);
  assert.equal(quitar.stdout, "quitado\n");
  assert.deepEqual(JSON.parse(readFileSync(settings, "utf8")).sandbox.filesystem.denyRead, ["UserRule", "**/*.key"]);

  mkdirSync(join(home, ".claude"), { recursive: true });
  writeFileSync(globalSettings, "{}\n");
  const global = ejecutar(["fijar-sandbox", "claude", globalSettings]);
  assert.equal(global.status, 1);
  assert.equal(global.stdout, "");
  assert.match(global.stderr, /nunca el de ~/);
  assert.equal(readFileSync(globalSettings, "utf8"), "{}\n");
  console.log("sandbox Claude: simulación, compatibilidad, conservación, tipos/JSON inválidos, remoción selectiva y rechazo global; OK");
} finally {
  rmSync(temporal, { recursive: true, force: true });
}
