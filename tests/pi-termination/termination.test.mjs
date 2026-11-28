import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { registrarCierre, leerMarcador } from "../../adapters/pi/termination.mjs";
import { incluirExtension } from "../../adapters/pi/install-termination.mjs";

const raiz = resolve(new URL("../..", import.meta.url).pathname);
const adaptador = join(raiz, "adapters/pi/termination.mjs");
const faux = join(raiz, "tests/pi-termination/faux-provider.mjs");

function entradas(plan, resultado, extras = "") {
  return [
    { type: "message", message: { role: "user", content: [{ type: "text", text: `FLUCASTR-LAUNCH: plan=${plan}; segment=4; desde=1\n${extras}` }] } },
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: resultado }] } },
  ];
}

test("Pi observer correlates final return and observed abort", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "flucastr-pi-termination-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "changes/prueba"), { recursive: true });
  writeFileSync(join(dir, "changes/prueba/plan.md"), "---\nsegment: 4\n---\n");
  const marker = leerMarcador(entradas("changes/prueba/plan.md", "DONE: plan=changes/prueba/plan.md; segment=4; verify=pasa"));
  assert.deepEqual(marker, { plan: "changes/prueba/plan.md", tramo: 4, desde: 1 });

  registrarCierre({
    cwd: dir,
    entradas: entradas("changes/prueba/plan.md", "DONE: plan=changes/prueba/plan.md; segment=4; verify=pasa"),
    aborted: false,
  });
  registrarCierre({
    cwd: dir,
    entradas: entradas("changes/prueba/plan.md", "", "FLUCASTR-TEST-ABORT"),
    aborted: true,
  });
  const registros = readFileSync(join(dir, "changes/prueba/runs.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  assert.deepEqual(registros.map((registro) => registro.terminacion.resultado), ["DONE", "INTERRUMPIDO"]);
  assert.ok(registros.every((registro) => registro.plan === "changes/prueba/plan.md" && registro.tramo === 4));
});

test("Pi installer adds only its marked builder extension and is idempotent", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "flucastr-pi-agent-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const agent = join(dir, "builder.md");
  writeFileSync(agent, "---\nname: builder\nskills: execute-plan\ninheritProjectContext: true\n---\nBuilder prompt.\n");
  incluirExtension(agent, adaptador);
  const once = readFileSync(agent, "utf8");
  incluirExtension(agent, adaptador);
  const twice = readFileSync(agent, "utf8");
  assert.equal(twice, once);
  assert.match(twice, /skills: execute-plan/);
  assert.match(twice, /inheritProjectContext: true/);
  assert.match(twice, /# flucastr-ai:termination-extension/);
  assert.match(twice, new RegExp(adaptador.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("actual Pi subagent records DONE and interruption without external providers", { timeout: 60_000 }, (t) => {
  const pi = process.env.PI_BIN || ["/home/franco/.local/bin/pi", "/usr/local/bin/pi", "/usr/bin/pi"].find(existsSync);
  const piAgent = process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi/agent");
  const subagents = join(piAgent, "npm/node_modules/pi-subagents/bundle/index.js");
  if (!pi || !existsSync(subagents)) return t.skip("Pi o pi-subagents no está instalado");

  const dir = mkdtempSync(join(tmpdir(), "flucastr-pi-e2e-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const agentDir = join(dir, "agent");
  mkdirSync(join(agentDir, "agents"), { recursive: true });

  const profile = join(agentDir, "agents/builder.md");
  writeFileSync(profile, "---\nname: builder\ndescription: test builder\n---\nReturn the task exactly.\n");
  incluirExtension(profile, adaptador);
  let profileText = readFileSync(profile, "utf8");
  profileText = profileText.replace("extensions:\n", `extensions:\n  - '${faux}'\n`);
  writeFileSync(profile, profileText);

  function run(abort) {
    const cwd = join(dir, abort ? "abort-project" : "done-project");
    mkdirSync(join(cwd, "changes/prueba"), { recursive: true });
    writeFileSync(join(cwd, "changes/prueba/plan.md"), "---\nstatus: approved\nsegment: 4\n---\n");
    const env = {
      PATH: process.env.PATH,
      HOME: dir,
      XDG_DATA_HOME: dir,
      PI_CODING_AGENT_DIR: agentDir,
      PI_OFFLINE: "1",
      FLUCASTR_PI_E2E_ABORT: abort ? "1" : "0",
    };
    const result = spawnSync(pi, [
      "--offline", "--no-context-files", "--no-skills",
      "--extension", subagents, "--extension", faux,
      "--model", "faux/test", "--print",
      "Delegate to builder with the launch marker and report the result.",
    ], { cwd, env, encoding: "utf8", timeout: 45_000, stdio: ["ignore", "pipe", "pipe"] });
    if (result.error?.code === "EPERM") return t.skip("sandbox bloquea ejecutar Pi desde node --test; E2E se ejecuta directamente");
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const runs = readFileSync(join(cwd, "changes/prueba/runs.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
    return runs.map((item) => item.terminacion.resultado);
  }

  const terminado = run(false);
  if (!terminado) return;
  assert.deepEqual(terminado, ["DONE"]);
  assert.deepEqual(run(true), ["INTERRUMPIDO"]);
});
