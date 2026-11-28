import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { procesarSubagentStop } from "../../adapters/claude-code/subagent-stop-hook.mjs";
import { administrarHook } from "../../adapters/claude-code/subagent-stop-install.mjs";

const HOOK = "/kit/adapters/claude-code/subagent-stop-hook.mjs";
const FECHA = "2026-11-27T12:01:00.000Z";
function proyecto(status = "approved") {
  const raiz = mkdtempSync(join(tmpdir(), "subagent-stop-test-"));
  const carpeta = join(raiz, "changes/demo");
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, "plan.md"), `---\nstatus: ${status}\nsegment: 2\n---\n# Demo\n`);
  return raiz;
}
function capturarError(fn) {
  const mensajes = [];
  const original = console.error;
  const originalStderr = process.stderr.write;
  try {
    console.error = (m) => mensajes.push(String(m));
    process.stderr.write = (m) => { mensajes.push(String(m)); return true; };
    return { resultado: fn(), mensajes };
  } finally {
    console.error = original;
    process.stderr.write = originalStderr;
  }
}

test("A3: registra retorno válido del builder con ruta y tramo verificados", () => {
  const raiz = proyecto();
  try {
    const resultado = procesarSubagentStop({
      agent_type: "builder", stop_hook_active: false,
      last_assistant_message: "DONE: plan=changes/demo/plan.md; segment=2; verify=pasa",
    }, { cwd: raiz, ahora: FECHA });
    assert.equal(resultado.status, 0);
    assert.equal(resultado.escrito, true);
    const registro = JSON.parse(readFileSync(join(raiz, "changes/demo/runs.jsonl"), "utf8").trim());
    assert.equal(registro.plan, "changes/demo/plan.md");
    assert.equal(registro.tramo, 2);
    assert.deepEqual(registro.terminacion, { fecha: FECHA, resultado: "DONE" });
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test("A3: retorno inválido inicial pide corrección con clave y no escribe", () => {
  const raiz = proyecto();
  try {
    const { resultado, mensajes } = capturarError(() => procesarSubagentStop({
      agent_type: "builder", stop_hook_active: false, last_assistant_message: "DONE: plan=changes/demo/plan.md; segment=2",
    }, { cwd: raiz, ahora: FECHA }));
    assert.equal(resultado.status, 2);
    assert.match(mensajes.join("\n"), /builder-return-invalid: falta la clave verify/);
    assert.equal(existsSync(join(raiz, "changes/demo/runs.jsonl")), false);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test("A3: segundo retorno inválido registra INVALIDO y deja terminar", () => {
  const raiz = proyecto();
  try {
    const { resultado } = capturarError(() => procesarSubagentStop({
      agent_type: "builder", stop_hook_active: true, last_assistant_message: "todavía inválido",
    }, { cwd: raiz, ahora: FECHA }));
    assert.equal(resultado.status, 0);
    const registro = JSON.parse(readFileSync(join(raiz, "changes/demo/runs.jsonl"), "utf8").trim());
    assert.equal(registro.terminacion.resultado, "INVALIDO");
    assert.equal(registro.terminacion.retorno, "todavía inválido");
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test("A3: ignora otros agent_type y rutas fuera de changes", () => {
  const raiz = proyecto();
  try {
    assert.equal(procesarSubagentStop({ agent_type: "Explore" }, { cwd: raiz }).escrito, false);
    const { resultado } = capturarError(() => procesarSubagentStop({
      agent_type: "builder", stop_hook_active: false,
      last_assistant_message: "DONE: plan=../../outside/plan.md; segment=2; verify=pasa",
    }, { cwd: raiz, ahora: FECHA }));
    assert.equal(resultado.status, 2);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});

test("A3: la instalación es idempotente y el retiro preserva hooks ajenos", () => {
  const raiz = proyecto();
  const ajustes = join(raiz, ".claude/settings.local.json");
  try {
    mkdirSync(join(raiz, ".claude"), { recursive: true });
    writeFileSync(ajustes, JSON.stringify({ hooks: { SubagentStop: [
      { matcher: "Explore", hooks: [{ type: "command", command: "echo keep" }] },
    ] }, other: true }));
    assert.equal(administrarHook("instalar", raiz, HOOK), "fijado");
    assert.equal(administrarHook("instalar", raiz, HOOK), "ya-estaba");
    assert.equal(administrarHook("comprobar", raiz, HOOK), "instalado");
    const config = JSON.parse(readFileSync(ajustes, "utf8"));
    assert.equal(config.other, true);
    assert.ok(config.hooks.SubagentStop.some((e) => e.matcher === "Explore"));
    assert.ok(config.hooks.SubagentStop.some((e) => e.matcher === "builder"));
    assert.equal(administrarHook("quitar", raiz, HOOK), "quitado");
    assert.equal(administrarHook("quitar", raiz, HOOK), "omitido");
    const final = JSON.parse(readFileSync(ajustes, "utf8"));
    assert.deepEqual(final.hooks.SubagentStop, [{ matcher: "Explore", hooks: [{ type: "command", command: "echo keep" }] }]);
  } finally { rmSync(raiz, { recursive: true, force: true }); }
});
