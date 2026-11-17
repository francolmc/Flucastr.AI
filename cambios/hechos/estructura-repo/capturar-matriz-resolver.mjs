import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const work = "/work";
const resolver = join(work, "scripts/resolver.mjs");
const temp = "/tmp/resolver-matrix";
rmSync(temp, { recursive: true, force: true });
mkdirSync(temp, { recursive: true });
const config = readFileSync(join(work, "modelos.json"), "utf8");
const agent = "---\nname: principal\ndescription: Synthetic agent\n---\nSynthetic instructions.\n";
const cases = [];
function add(id, init, calls, configPath) { cases.push({ id, init, calls, configPath }); }
const base = (files = {}) => ({
  "modelos.json": config,
  "agents.md": agent,
  ...files,
});
const file = (...path) => join(...path);

for (const tool of ["claude-code", "pi", "codex"]) {
  add(`modelo-${tool}-principal`, base(), [["modelo", "principal", tool]]);
  add(`modelo-${tool}-constructor`, base(), [["modelo", "constructor", tool]]);
  add(`modelo-${tool}-agente-ausente`, base(), [["modelo", "missing-agent", tool]]);
}
add("modelo-herramienta-ausente", base(), [["modelo", "principal", "missing-tool"]]);
add("modelo-config-ausente", base(), [["modelo", "principal", "codex"]], "missing");
add("modelo-config-invalida", base(), [["modelo", "principal", "codex"]], "invalid");
for (const tool of ["claude-code", "pi", "codex"]) {
  for (const agentName of ["principal", "constructor"]) {
    add(`modelo-esfuerzo-${tool}-${agentName}`, base(), [["modelo-esfuerzo", agentName, tool]]);
  }
  add(`revisor-${tool}`, base(), [["revisor", tool]]);
}
for (const tool of ["", "codex"]) for (const agentName of ["principal", "constructor"]) {
  add(`esfuerzo-${tool || "nativo"}-${agentName}`, base(), [["esfuerzo", agentName, ...(tool ? [tool] : [])]]);
}
add("esfuerzo-agente-ausente", base(), [["esfuerzo", "missing-agent"]]);
const configData = JSON.parse(config);
const maxEffortConfig = structuredClone(configData);
maxEffortConfig.agentes.constructor.esfuerzo = "max";
add("esfuerzo-max-codex", base({ "alternate.json": JSON.stringify(maxEffortConfig) }), [["esfuerzo", "constructor", "codex"]], "alternate.json");
const noEffortConfig = structuredClone(configData);
delete noEffortConfig.agentes.constructor.esfuerzo;
add("esfuerzo-ausente", base({ "alternate.json": JSON.stringify(noEffortConfig) }), [["esfuerzo", "constructor"]], "alternate.json");
const invalidEffortConfig = structuredClone(configData);
invalidEffortConfig.agentes.constructor.esfuerzo = "invalid";
add("esfuerzo-invalido", base({ "alternate.json": JSON.stringify(invalidEffortConfig) }), [["esfuerzo", "constructor"]], "alternate.json");
add("esfuerzo-config-ausente", base(), [["esfuerzo", "principal"]], "missing");
add("esfuerzo-config-invalida", base(), [["esfuerzo", "principal"]], "invalid");
add("compactar-codex", base(), [["compactar-codex", "principal"]]);
add("compactar-codex-sin-umbral", base({ "config/modelos.json": JSON.stringify({ ...JSON.parse(config), compactar_en: null }) }), [["compactar-codex", "principal"]], "config/modelos.json");
add("compactar-codex-config-ausente", base(), [["compactar-codex", "principal"]], "missing");
add("compactar-codex-config-invalida", base(), [["compactar-codex", "principal"]], "invalid");
for (const command of ["agente-claude", "agente-pi", "agente-codex", "instrucciones-codex", "cuerpo"]) {
  add(`${command}-valido`, base({ "principal.md": agent }), [[command, file("${CASE}", "principal.md")] ]);
  add(`${command}-ausente`, base(), [[command, file("${CASE}", "missing.md")] ]);
  add(`${command}-nombre-distinto`, base({ "other.md": agent }), [[command, file("${CASE}", "other.md")] ]);
  add(`${command}-encabezado-invalido`, base({ "principal.md": "not-frontmatter\nbody\n" }), [[command, file("${CASE}", "principal.md")] ]);
  add(`${command}-campo-reservado`, base({ "principal.md": agent.replace("description: Synthetic agent", "description: Synthetic agent\nmodel: reserved") }), [[command, file("${CASE}", "principal.md")] ]);
}
add("fijar-agente-vacio-repetido", base({ "settings.json": "{}\n" }), [["fijar-agente", file("${CASE}", "settings.json"), "principal"], ["fijar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("fijar-agente-ausente", base(), [["fijar-agente", file("${CASE}", "settings.json"), "principal"], ["fijar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("fijar-agente-ajeno", base({ "settings.json": '{"agent":"other"}\n' }), [["fijar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("fijar-agente-sobrescribir", base({ "settings.json": '{"agent":"other","keep":true}\n' }), [["fijar-agente", file("${CASE}", "settings.json"), "principal", "--sobrescribir"]]);
add("fijar-agente-json-invalido", base({ "settings.json": "{" }), [["fijar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("quitar-agente-propio-selectivo", base({ "settings.json": '{"agent":"principal","keep":true}\n' }), [["quitar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("quitar-agente-ajeno", base({ "settings.json": '{"agent":"other"}\n' }), [["quitar-agente", file("${CASE}", "settings.json"), "principal"]]);
add("comparar-modelos-cambios", base({ "published.json": JSON.stringify({ version: 3, agentes: { principal: { nivel: "medio", esfuerzo: "low" }, extra: { esfuerzo: "high" } }, perfiles: { "pi-openai": { ventanas: {} }, extra: {} }, compactar_en: 5 }) }), [["comparar-modelos", file("${CASE}", "modelos.json"), file("${CASE}", "published.json")]]);
add("comparar-modelos-identicos", base({ "published.json": config }), [["comparar-modelos", file("${CASE}", "modelos.json"), file("${CASE}", "published.json")]]);
add("comparar-modelos-invalido", base({ "published.json": "{" }), [["comparar-modelos", file("${CASE}", "modelos.json"), file("${CASE}", "published.json")]]);

for (const tool of ["claude", "pi"]) {
  const p = file("${CASE}", `${tool}.json`);
  add(`compactacion-${tool}-simular-repetir-quitar`, base({ [`${tool}.json`]: "{}\n" }), [
    ["fijar-compactacion", tool, p, "--simular"], ["fijar-compactacion", tool, p], ["fijar-compactacion", tool, p],
    ["quitar-compactacion", tool, p, ...(tool === "pi" ? ["openai/gpt-6-luna", "172000", "creado"] : ["133000"])],
  ]);
  const foreign = tool === "pi"
    ? { compaction: { modelOverrides: { "openai/gpt-6-luna": { reserveTokens: 12345 }, keep: true } }, keep: true }
    : { autoCompactWindow: 1, keep: true };
  add(`compactacion-${tool}-ajeno`, base({ [`${tool}.json`]: JSON.stringify(foreign) + "\n" }), [["fijar-compactacion", tool, p]]);
  add(`compactacion-${tool}-json-invalido`, base({ [`${tool}.json`]: "{" }), [["fijar-compactacion", tool, p]]);
  add(`compactacion-${tool}-quitar-invalido`, base({ [`${tool}.json`]: "{}\n" }), [["quitar-compactacion", tool, p, ...(tool === "pi" ? ["openai/gpt-6-luna", "invalid"] : ["invalid"])]]);
}
for (const command of ["fijar-hook", "fijar-deny", "fijar-sandbox"]) {
  const name = command === "fijar-hook" ? "settings.local.json" : "settings.json";
  const p = file("${CASE}", name);
  const remove = command === "fijar-hook"
    ? ["quitar-hook", "claude", p]
    : command === "fijar-deny"
      ? ["quitar-deny", "claude", p, "Read(./.env)"]
      : ["quitar-sandbox", "claude", p, "sandbox.enabled", "true"];
  add(`${command}-claude-ausente-simular-repetir-quitar`, base(), [[command, "claude", p, "--simular"], [command, "claude", p], [command, "claude", p], remove]);
  add(`${command}-claude-ajeno`, base({ [name]: '{"keep":true}\n' }), [[command, "claude", p]]);
  add(`${command}-claude-invalido`, base({ [name]: "{" }), [[command, "claude", p]]);
}
for (const command of ["quitar-hook", "quitar-deny"]) {
  const arg = command === "quitar-deny" ? "rule" : undefined;
  const name = command === "quitar-hook" ? "settings.local.json" : "settings.json";
  add(`${command}-claude-ausente`, base(), [[command, "claude", file("${CASE}", name), ...(arg ? [arg] : [])]]);
}
add("quitar-sandbox-selectivo", base({ "settings.json": '{"sandbox":{"enabled":true,"allowUnsandboxedCommands":false},"keep":true}\n' }), [["quitar-sandbox", "claude", file("${CASE}", "settings.json"), "sandbox.enabled", "true"]]);
add("quitar-sandbox-invalido", base({ "settings.json": "{}\n" }), [["quitar-sandbox", "claude", file("${CASE}", "settings.json"), "sandbox.enabled", "{"]]);
add("fijar-deny-codex-simular-repetir", base(), [["fijar-deny", "codex", file("${CASE}", "rules"), "--simular"], ["fijar-deny", "codex", file("${CASE}", "rules")], ["fijar-deny", "codex", file("${CASE}", "rules")], ["quitar-deny", "codex", file("${CASE}", "rules")] ]);
add("fijar-deny-codex-con-agents", base({ "AGENTS.md": "- Comprobación rápida: `ls`\n" }), [["fijar-deny", "codex", file("${CASE}", "rules"), file("${CASE}", "AGENTS.md")] ]);
add("fijar-deny-codex-ajeno", base({ "rules": "user rules\n" }), [["fijar-deny", "codex", file("${CASE}", "rules")] ]);
add("quitar-deny-codex-ajeno", base({ "rules": "user rules\n" }), [["quitar-deny", "codex", file("${CASE}", "rules")] ]);
add("fijar-deny-codex-ausente", base(), [["fijar-deny", "codex", file("${CASE}", "rules"), "--simular"], ["fijar-deny", "codex", file("${CASE}", "rules")], ["fijar-deny", "codex", file("${CASE}", "rules")], ["quitar-deny", "codex", file("${CASE}", "rules")] ]);

for (const [id, args] of [["sin-argumentos", []], ["orden-desconocida", ["future-command"]], ["opcion-invalida", ["fijar-agente", "file", "principal", "--unknown"]], ["aridad-modelo", ["modelo", "principal"]], ["aridad-mutador", ["fijar-hook", "claude"]]]) {
  add(`despacho-${id}`, base(), [args]);
}

function writeFixture(dir, files) {
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
}
function manifest(dir) {
  const out = [];
  function visit(path) {
    for (const name of readdirSync(path).sort()) {
      const full = join(path, name), rel = relative(dir, full), st = lstatSync(full);
      if (st.isSymbolicLink()) out.push({ path: rel, type: "link", mode: (st.mode & 0o777).toString(8), target: readFileSync(full, "utf8") });
      else if (st.isDirectory()) { out.push({ path: rel, type: "dir", mode: (st.mode & 0o777).toString(8) }); visit(full); }
      else out.push({ path: rel, type: "file", mode: (st.mode & 0o777).toString(8), sha256: createHash("sha256").update(readFileSync(full)).digest("hex") });
    }
  }
  visit(dir);
  return out;
}
function sanitize(value, dir) { return value.split(dir).join("<TEMP>").split(temp).join("<TEMP>"); }
for (const test of cases) {
  const dir = join(temp, test.id); mkdirSync(dir, { recursive: true });
  let files = { ...test.init };
  if (test.configPath === "invalid") files["invalid.json"] = "{";
  for (const [name, content] of Object.entries(files)) if (name.includes("${CASE}")) { delete files[name]; files[name.replace("${CASE}/", "")] = content; }
  writeFixture(dir, files);
  const before = manifest(dir);
  const results = [];
  let previousTree = before;
  for (const template of test.calls) {
    const args = template.map((arg) => typeof arg === "string" ? arg.replaceAll("${CASE}", dir) : arg);
    const env = { ...process.env };
    env.FLUCASTR_MODELOS = test.configPath === "missing" ? join(dir, "missing.json") : test.configPath === "invalid" ? join(dir, "invalid.json") : test.configPath ? join(dir, test.configPath) : join(dir, "modelos.json");
    const run = spawnSync(process.execPath, [resolver, ...args], { cwd: dir, env, encoding: "utf8" });
    const tree = manifest(dir);
    if (run.status !== 0 && JSON.stringify(tree) !== JSON.stringify(previousTree)) throw new Error(`${test.id}: un error modificó el fixture`);
    if (args.includes("--simular") && JSON.stringify(tree) !== JSON.stringify(previousTree)) throw new Error(`${test.id}: la simulación modificó el fixture`);
    results.push({ args: args.map((x) => sanitize(x, dir)), code: run.status, signal: run.signal, stdout: sanitize(run.stdout ?? "", dir), stderr: sanitize(run.stderr ?? "", dir), tree });
    previousTree = tree;
  }
  process.stdout.write(JSON.stringify({ id: test.id, before, results }) + "\n");
}
