import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const resolver = join(root, "scripts/resolver.mjs");
const models = readFileSync(join(root, "modelos.json"), "utf8");
const temp = mkdtempSync(join(tmpdir(), "resolver-json-settings-"));
const settings = join(temp, "settings.json");

function run(...args) {
  return spawnSync(process.execPath, [resolver, ...args], { cwd: temp, encoding: "utf8" });
}

try {
  writeFileSync(join(temp, "modelos.json"), models);

  const absent = run("fijar-compactacion", "pi", settings, "--simular");
  assert.equal(absent.status, 0);
  assert.match(absent.stdout, /:creado/);
  assert.equal(absent.stderr, "");
  assert.equal(existsSync(settings), false);

  writeFileSync(settings, "{");
  const invalid = run("fijar-compactacion", "pi", settings, "--simular");
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, "");
  assert.match(invalid.stderr, /settings\.json no es JSON válido/);
  assert.equal(readFileSync(settings, "utf8"), "{");

  writeFileSync(settings, "[]");
  const array = run("fijar-compactacion", "pi", settings, "--simular");
  assert.equal(array.status, 1);
  assert.equal(array.stdout, "");
  assert.match(array.stderr, /settings\.json no es JSON válido; no lo toco/);
  assert.equal(readFileSync(settings, "utf8"), "[]");

  writeFileSync(settings, "{}\n");
  const object = run("fijar-compactacion", "pi", settings, "--simular");
  assert.equal(object.status, 0);
  assert.equal(object.stdout, "fijado:openai/gpt-6.1-sol=172000\nomitido-ventana:openai/gpt-6.1-terra\nfijado:openai/gpt-6-luna=172000\n");
  assert.equal(object.stderr, "");
  assert.equal(readFileSync(settings, "utf8"), "{}\n");

  process.stdout.write("Lecturas JSON del resolver: archivo ausente, JSON inválido, array y objeto; códigos, salida y escrituras esperados.\n");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
