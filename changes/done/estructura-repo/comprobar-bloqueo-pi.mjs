import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { conBloqueo } from "../../adapters/pi/file-lock.mjs";

const root = "/tmp/pi-lock-fixtures";
const resolver = "/work/scripts/resolver.mjs";
const models = join(root, "models.json");
const env = { ...process.env, FLUCASTR_MODELOS: models, HOME: join(root, "home") };
mkdirSync(root, { recursive: true });
mkdirSync(env.HOME, { recursive: true });
writeFileSync(models, JSON.stringify({
  compactar_en: 100000,
  perfiles: { fixture: { herramienta: "pi", modelos: { medio: "fixture/model" }, ventanas: { "fixture/model": 200000 } } },
}));

function settings(name, contents = "{}\n") {
  const path = join(root, name);
  writeFileSync(path, contents);
  return path;
}

function run(path) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [resolver, "fijar-compactacion", "pi", path], { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolve({ code, stdout, stderr: stderr.replaceAll(root, "<FIXTURE>") }));
  });
}

function tree() {
  const found = [];
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      const relative = path.slice(root.length + 1);
      const info = statSync(path);
      if (info.isDirectory()) {
        found.push({ path: relative, type: "directory" });
        visit(path);
      } else {
        const bytes = readFileSync(path);
        found.push({ path: relative, type: "file", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length });
      }
    }
  }
  visit(root);
  return found;
}

function record(id, results) {
  return { id, results, tree: tree() };
}

const output = [];
if (process.env.PI_LOCK_MUTATION === "1") {
  const changed = join(root, "changed-during-lock.json");
  writeFileSync(changed, "{}\n");
  mkdirSync(`${changed}.lock`);
  const pending = run(changed);
  await new Promise((resolve) => setTimeout(resolve, 40));
  writeFileSync(changed, JSON.stringify({ preserved: "concurrent", compaction: { modelOverrides: { "fixture/model": { reserveTokens: 12000 } } } }) + "\n");
  rmdirSync(`${changed}.lock`);
  const result = await pending;
  const finalSettings = JSON.parse(readFileSync(changed, "utf8"));
  if (result.code !== 0 || result.stderr !== "" || result.stdout !== "omitido-usuario:fixture/model\n" || finalSettings.preserved !== "concurrent" || finalSettings.compaction.modelOverrides["fixture/model"].reserveTokens !== 12000) {
    throw new Error(`la compactación no preservó el archivo modificado durante el bloqueo: ${JSON.stringify({ result, finalSettings })}`);
  }
  writeFileSync("/work/changed-during-lock-result.json", JSON.stringify({ result, finalSettings }) + "\n");
  process.stdout.write("Archivo modificado mientras se esperaba el bloqueo Pi: código, salida y campos ajenos conservados.\n");
  rmSync(root, { recursive: true, force: true });
  process.exit(0);
}
const concurrent = join(root, "concurrent.json");
writeFileSync(concurrent, "{}\n");
const parallel = await Promise.all([run(concurrent), run(concurrent)]);
output.push(record("concurrent-fix", parallel.sort((a, b) => a.stdout.localeCompare(b.stdout))));

const occupied = settings("occupied.json");
mkdirSync(`${occupied}.lock`);
output.push(record("occupied-lock", [await run(occupied)]));

const orphan = settings("orphan.json");
mkdirSync(`${orphan}.lock`);
const old = new Date(Date.now() - 30000);
utimesSync(`${orphan}.lock`, old, old);
output.push(record("orphan-lock", [await run(orphan)]));

const failedOperation = "/tmp/pi-lock-exception/settings.json";
mkdirSync("/tmp/pi-lock-exception", { recursive: true });
let errorMessage = "";
try {
  conBloqueo(failedOperation, () => { throw new Error("fixture operation failed"); });
} catch (error) {
  errorMessage = error.message;
}
writeFileSync("/work/lock-exception-result.json", JSON.stringify({
  caught: errorMessage,
  lockReleased: !existsSync(`${failedOperation}.lock`),
}) + "\n");
rmSync("/tmp/pi-lock-exception", { recursive: true, force: true });

rmSync(root, { recursive: true, force: true });
process.stdout.write(output.map((item) => JSON.stringify(item)).join("\n") + "\n");
