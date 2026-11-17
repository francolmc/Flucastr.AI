import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const resolver = join(root, "scripts/resolver.mjs");
const sourceConfig = JSON.parse(readFileSync(join(root, "modelos.json"), "utf8"));
const temp = mkdtempSync(join(tmpdir(), "resolver-object-cases-"));

function run(config, ...args) {
  const configPath = join(temp, "modelos.json");
  writeFileSync(configPath, JSON.stringify(config));
  return spawnSync(process.execPath, [resolver, ...args], {
    cwd: temp,
    env: { ...process.env, FLUCASTR_MODELOS: configPath },
    encoding: "utf8",
  });
}

try {
  for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "12", [], {}]) {
    const config = structuredClone(sourceConfig);
    config.agentes.principal.compactar_en = value;
    const result = run(config, "compactar-codex", "principal");
    assert.equal(result.status, 0, `compactar_en=${JSON.stringify(value)}: exit`);
    assert.equal(result.stdout, "\n", `compactar_en=${JSON.stringify(value)}: stdout`);
    assert.equal(result.stderr, "", `compactar_en=${JSON.stringify(value)}: stderr`);
  }

  const nullConfig = structuredClone(sourceConfig);
  delete nullConfig.agentes.principal.compactar_en;
  nullConfig.compactar_en = null;
  const nullResult = run(nullConfig, "compactar-codex", "principal");
  assert.equal(nullResult.status, 0);
  assert.equal(nullResult.stdout, "\n");
  assert.equal(nullResult.stderr, "");

  for (const value of [null, []]) {
    const config = structuredClone(sourceConfig);
    config.kit_run.revisor = value;
    const result = run(config, "revisor", "codex");
    assert.equal(result.status, 1, `kit_run.revisor=${JSON.stringify(value)}: exit`);
    assert.equal(result.stdout, "", `kit_run.revisor=${JSON.stringify(value)}: stdout`);
    assert.equal(result.stderr, "error: 'kit_run.revisor' no es un objeto\n", `kit_run.revisor=${JSON.stringify(value)}: stderr`);
  }

  const objectConfig = structuredClone(sourceConfig);
  objectConfig.kit_run.revisor = { nivel: "medio", esfuerzo: "low" };
  const objectResult = run(objectConfig, "revisor", "codex");
  assert.equal(objectResult.status, 0);
  assert.equal(objectResult.stdout, "gpt-6.1-terra\nlow\n");
  assert.equal(objectResult.stderr, "");
  process.stdout.write("Predicados del resolver: objetos, arrays, null y enteros inválidos coinciden con los resultados esperados.\n");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
