#!/usr/bin/env node
// Captura reproducible de contratos de kit run en repositorios sintéticos.
// Todos los ejecutables de roles son locales y falsos; cada JSONL queda fuera del repo observado.
import assert from "node:assert/strict";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootKit = fileURLToPath(new URL("../../", import.meta.url));
const kitRun = join(rootKit, "scripts/kit-run.mjs");
const base = mkdtempSync(join(tmpdir(), "kit-run-matriz-"));
const bin = join(base, "bin");
mkdirSync(bin);
const output = join(rootKit, "cambios/estructura-repo/kit-run-matriz.jsonl");
const planRel = "cambios/prueba/plan.md";
const planBase = `---\nestado: aprobado\nrama: feature/prueba\nbase: main\nrepos: [.]\nejecutor: constructor\ntramo: 1\n---\n# Fixture kit run\n\n## Aceptación\n| ID | Resultado |\n| --- | --- |\n| A1 | creado.txt existe |\n\n## Verificación\n\`./verify\`\n\n## Pasos\n### Tramo 1 — Prueba\n- [x] fixture\n`;
const script = (body) => `#!${process.execPath}\nimport { appendFileSync, readFileSync, writeFileSync } from "node:fs";\nimport { join } from "node:path";\nconst args=process.argv.slice(2), stdin=readFileSync(0,"utf8");\nappendFileSync(process.env.KR_LOG,JSON.stringify({role:process.argv[1].split("/").pop().replace(".mjs",""),args,cwd:process.cwd(),stdin})+"\\n");\n${body}\n`;
const fake = {
  constructor: script(`const plan=join(process.cwd(),"${planRel}");
if(process.env.KR_MODE==="timeout") setTimeout(()=>{},60000);
else if(process.env.KR_MODE==="constructor-fails"){console.error("constructor fixture failure");process.exit(7)}
else {writeFileSync(join(process.cwd(),"creado.txt"),"fixture\\n");console.log("COMPLETADO: plan=${planRel}; tramo=1; verify=pasa")}`),
  verify: script(`if(process.env.KR_MODE==="verify-fails"){console.error("verify fixture failure");process.exit(1)} console.log("verify fixture ok")`),
  reviewer: script(`if(process.env.KR_MODE==="review-write") writeFileSync(join(process.cwd(),"revision.txt"),"write\\n");
const count=readFileSync(process.env.KR_LOG,"utf8").split("\\n").filter(x=>x.includes('"role":"reviewer"')).length;
console.log(JSON.stringify({veredicto:process.env.KR_MODE==="review-retry"&&count===1?"DEVUELTO":"APROBADO",defectos:process.env.KR_MODE==="review-retry"&&count===1?[{archivo:"creado.txt",linea:1,criterio:"A1",descripcion:"reintentar"}]:[]}))`),
};
for (const [name, body] of Object.entries(fake)) {
  const path = join(bin, `${name}.mjs`);
  writeFileSync(path, body);
  chmodSync(path, 0o755);
}
const cases = [
  { name: "approval", mode: "approval", plan: planBase },
  { name: "constructor_failure", mode: "constructor-fails", plan: planBase },
  { name: "verify_failure_retries", mode: "verify-fails", plan: planBase },
  { name: "reviewer_reject_retry", mode: "review-retry", plan: planBase },
  { name: "timeout", mode: "timeout", plan: planBase, timeout: "120" },
  { name: "reviewer_write_rejected", mode: "review-write", plan: planBase },
  { name: "invalid_plan", mode: "approval", plan: planBase.replace("estado: aprobado", "estado: en curso") },
  { name: "invalid_option", mode: "approval", plan: planBase, invalidOption: true },
];
function git(cwd, ...args) {
  const r = spawnSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
}
function clean(text) { return (text ?? "").replaceAll(base, "<TEMP>").replaceAll(rootKit, "<KIT>").replace(/\/tmp\/kit-run-[^/]+/g, "<TEMP_SCHEMA>"); }
function tree(repo) {
  const result = [];
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      if (name === ".git") continue;
      const path = join(dir, name), rel = relative(repo, path);
      if (existsSync(path) && readFileSyncSafe(path) !== null) result.push({ path: rel, content: clean(readFileSync(path, "utf8")) });
      else visit(path);
    }
  }
  visit(repo);
  return result;
}
function readFileSyncSafe(path) { try { return readFileSync(path); } catch { return null; } }
const records = [];
try {
  for (const c of cases) {
    const repo = join(base, c.name), log = join(base, `${c.name}.jsonl`);
    mkdirSync(join(repo, "cambios/prueba"), { recursive: true });
    writeFileSync(join(repo, planRel), c.plan);
    writeFileSync(log, "");
    git(repo, "init", "-q"); git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "fixture");
    const env = { PATH: process.env.PATH, HOME: base, LANG: "C.UTF-8", TZ: "UTC", KIT_RUN_CONSTRUCTOR: join(bin, "constructor.mjs"), KIT_RUN_REVISOR: join(bin, "reviewer.mjs"), KIT_RUN_VERIFY: join(bin, "verify.mjs"), KIT_RUN_TOPE_MS: c.timeout ?? "500", KR_LOG: log, KR_MODE: c.mode };
    const args = c.invalidOption ? [kitRun, planRel, "--opcion-invalida", "--raiz", repo] : [kitRun, planRel, "--raiz", repo];
    const run = spawnSync(process.execPath, args, { cwd: repo, env, encoding: "utf8", input: "" });
    const invocations = readFileSync(log, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line)).map(x => ({ ...x, args: x.args.map(clean), cwd: clean(x.cwd), stdin: clean(x.stdin) }));
    const record = { scenario: c.name, process: { executable: "node", args: args.map(clean), cwd: "<TEMP>/" + c.name, stdin: "", status: run.status, stdout: clean(run.stdout), stderr: clean(run.stderr) }, invocations, finalTree: tree(repo) };
    if (c.name === "approval") assert.equal(run.status, 0, run.stderr + run.stdout);
    if (c.name === "invalid_option" || c.name === "invalid_plan") assert.equal(run.status, 2, run.stderr + run.stdout);
    if (c.name === "constructor_failure") assert.equal(run.status, 1, run.stderr + run.stdout);
    if (c.name === "verify_failure_retries") assert.equal(invocations.filter(x => x.role === "constructor").length, 3);
    if (c.name === "reviewer_reject_retry") assert.equal(invocations.filter(x => x.role === "reviewer").length, 2);
    if (c.name === "timeout") assert.equal(run.status, 1, run.stderr + run.stdout);
    if (c.name === "reviewer_write_rejected") assert.equal(run.status, 1, run.stderr + run.stdout);
    records.push(record);
  }
  const serialized = records.map(x => JSON.stringify(x)).join("\n") + "\n";
  writeFileSync(output, serialized);
  process.stdout.write(`captured ${records.length} synthetic scenarios; ${output}\n`);
} finally {
  rmSync(base, { recursive: true, force: true });
}
