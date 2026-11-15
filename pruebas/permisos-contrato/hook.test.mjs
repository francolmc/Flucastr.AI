import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { test } from "node:test";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = fileURLToPath(new URL("../..", import.meta.url));
const HOOK = join(KIT, "scripts/permisos-hook.mjs");
const KIT_RUN = join(KIT, "scripts/kit-run.mjs");

function git(raiz, ...args) {
  return execFileSync("git", args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10000 });
}

function proyecto(t) {
  const raiz = mkdtempSync(join(tmpdir(), "permisos hook "));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  git(raiz, "init", "-q");
  git(raiz, "config", "user.email", "test@example.invalid");
  git(raiz, "config", "user.name", "Test");
  git(raiz, "config", "commit.gpgsign", "false");
  mkdirSync(join(raiz, "verificacion"), { recursive: true });
  writeFileSync(join(raiz, "AGENTS.md"), "- Comprobación rápida: `node verificacion/rapida.mjs`\n");
  writeFileSync(join(raiz, "verify"), "#!/bin/sh\nexit 0\n");
  writeFileSync(join(raiz, "verificacion/rapida.mjs"), "console.log('ok');\n");
  git(raiz, "add", "AGENTS.md", "verify", "verificacion/rapida.mjs");
  git(raiz, "commit", "-qm", "fixture");
  return raiz;
}

function decision(raiz, entrada) {
  const r = spawnSync(process.execPath, [HOOK, "decision", "--project", raiz], {
    cwd: raiz,
    input: JSON.stringify(entrada),
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : "normal";
}

const quick = { tool_name: "Bash", tool_input: { command: "node verificacion/rapida.mjs" } };

test("Claude autoriza solo el comando declarado cuando los scripts siguen limpios en HEAD", t => {
  const raiz = proyecto(t);
  assert.equal(decision(raiz, quick), "allow");
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "node verificacion/rapida.mjs --extra" } }), "ask");
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "node -e 'process.exit(0)'" } }), "ask");
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "npm run test" } }), "ask");
});

test("Claude pide aprobación si verify o el script rápido está modificado, preparado o ausente", t => {
  const raiz = proyecto(t);
  writeFileSync(join(raiz, "verificacion/rapida.mjs"), "console.log('cambio');\n");
  assert.equal(decision(raiz, quick), "ask");
  git(raiz, "add", "verificacion/rapida.mjs");
  assert.equal(decision(raiz, quick), "ask");
  // El árbol vuelve al contenido de HEAD, pero el índice conserva otro contenido.
  writeFileSync(join(raiz, "verificacion/rapida.mjs"), "console.log('ok');\n");
  assert.equal(decision(raiz, quick), "ask");
  git(raiz, "reset", "-q", "HEAD", "--", "verificacion/rapida.mjs");
  git(raiz, "checkout", "--", "verificacion/rapida.mjs");
  writeFileSync(join(raiz, "verify"), "#!/bin/sh\necho changed\n");
  assert.equal(decision(raiz, quick), "ask");
  git(raiz, "checkout", "--", "verify");
  rmSync(join(raiz, "verificacion/rapida.mjs"));
  assert.equal(decision(raiz, quick), "ask");
});

test("un ejecutable local sin extensión queda protegido frente a cambios", t => {
  const raiz = proyecto(t);
  mkdirSync(join(raiz, "scripts"), { recursive: true });
  writeFileSync(join(raiz, "scripts/check"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(raiz, "scripts/check"), 0o755);
  writeFileSync(join(raiz, "AGENTS.md"), "- Comprobación rápida: `./scripts/check`\n");
  git(raiz, "add", "AGENTS.md", "scripts/check");
  git(raiz, "commit", "-qm", "declara comprobación rápida local");
  const comando = { tool_name: "Bash", tool_input: { command: "./scripts/check" } };
  assert.equal(decision(raiz, comando), "allow");
  writeFileSync(join(raiz, "scripts/check"), "#!/bin/sh\necho editado\n");
  assert.equal(decision(raiz, comando), "ask");
});

test("acciones directas protegidas y lecturas que pueden incluir secretos piden aprobación", t => {
  const raiz = proyecto(t);
  for (const command of ["git commit -m test", "git push", "git merge main", "gh pr create", "vercel deploy", "cat .env"]) {
    assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command } }), "ask", command);
  }
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: ".env" } }), "ask");
  assert.equal(decision(raiz, { tool_name: "Grep", tool_input: { pattern: "token", path: "." } }), "ask");
  assert.equal(decision(raiz, { tool_name: "Glob", tool_input: { pattern: "**/*" } }), "ask");
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: "AGENTS.md" } }), "normal");
  writeFileSync(join(raiz, ".env"), "dummy=secret\n");
  symlinkSync(".env", join(raiz, "alias.txt"));
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: "alias.txt" } }), "ask");
});

test("instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política", t => {
  const raiz = proyecto(t);
  const settings = join(raiz, ".claude/settings.local.json");
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  writeFileSync(settings, JSON.stringify({ theme: "dark", permissions: { allow: ["Bash(*)"] }, hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo ajeno" }] }] } }));
  const instalar = () => execFileSync(process.execPath, [HOOK, "instalar", raiz], { encoding: "utf8", timeout: 10000 }).trim();
  const firstInstall = instalar();
  assert.equal(firstInstall, "fijado");
  assert.equal(instalar(), "ya-estaba");
  const config = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(config.theme, "dark");
  assert.deepEqual(config.permissions.allow, ["Bash(*)"]);
  assert.equal(config.hooks.PreToolUse.length, 3);
  assert.equal(config.hooks.PreToolUse[0].hooks[0].command, "echo ajeno");
  assert.ok(config.hooks.PreToolUse.slice(1).every(e => e.hooks[0].onFailure === "block"));
  const falloHook = spawnSync(process.execPath, [HOOK, "decision", "--project", raiz], { input: "{", encoding: "utf8" });
  assert.equal(falloHook.status, 1);

  // Un solo matcher del kit no cuenta como instalado: se completa con la pareja exacta.
  config.hooks.PreToolUse = [config.hooks.PreToolUse[0], {
    ...config.hooks.PreToolUse[1],
    hooks: [...config.hooks.PreToolUse[1].hooks, { type: "command", command: "echo vecino" }],
  }];
  writeFileSync(settings, JSON.stringify(config));
  assert.equal(execFileSync(process.execPath, [HOOK, "comprobar", raiz], { encoding: "utf8" }).trim(), "ausente");
  assert.equal(instalar(), "fijado");
  const reparado = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(reparado.hooks.PreToolUse.length, 4);
  assert.equal(reparado.hooks.PreToolUse[0].hooks[0].command, "echo ajeno");
  assert.equal(reparado.hooks.PreToolUse[1].hooks[0].command, "echo vecino");
  assert.equal(reparado.hooks.PreToolUse[2].matcher, "Bash");
  assert.equal(reparado.hooks.PreToolUse[3].matcher, "Read|Grep|Glob");

  const env = { ...process.env, KIT_RUN_CONSTRUCTOR: "/bin/true", KIT_RUN_REVISOR: "/bin/true" };
  rmSync(settings);
  const ausente = spawnSync(process.execPath, [KIT_RUN, "no-existe.md", "--herramienta", "claude", "--raiz", raiz], { encoding: "utf8", env, timeout: 10000 });
  assert.equal(ausente.status, 2);
  assert.match(ausente.stderr, /no tiene instalada la política conservadora/);
  instalar();
  const presente = spawnSync(process.execPath, [KIT_RUN, "no-existe.md", "--herramienta", "claude", "--raiz", raiz], { encoding: "utf8", env, timeout: 10000 });
  assert.equal(presente.status, 2);
  assert.match(presente.stderr, /no existe el plan/);
  assert.doesNotMatch(presente.stderr, /política conservadora/);

  const plan = join(raiz, "plan.md");
  writeFileSync(plan, "---\nestado: aprobado\ntramo: 1\n---\n\n## Verificación\n`./verify`\n\n## Notas\n");
  const constructor = join(raiz, "constructor.sh");
  const revisor = join(raiz, "revisor.sh");
  const log = join(tmpdir(), `permisos-roles-${Date.now()}.log`);
  t.after(() => rmSync(log, { force: true }));
  writeFileSync(constructor, "#!/bin/sh\nprintf 'constructor:%s\\n' \"$PWD\" >> \"$POLITICA_LOG\"\nprintf 'COMPLETADO: plan=plan.md; tramo=1; verify=pasa\\n'\n");
  writeFileSync(revisor, "#!/bin/sh\nprintf 'revisor:%s\\n' \"$PWD\" >> \"$POLITICA_LOG\"\nprintf '{\"veredicto\":\"APROBADO\",\"defectos\":[]}\\n'\n");
  chmodSync(constructor, 0o755);
  chmodSync(revisor, 0o755);
  const ejecucion = spawnSync(process.execPath, [KIT_RUN, "plan.md", "--herramienta", "claude", "--raiz", raiz], {
    encoding: "utf8",
    env: { ...env, KIT_RUN_CONSTRUCTOR: constructor, KIT_RUN_REVISOR: revisor, KIT_RUN_VERIFY: "/bin/true", POLITICA_LOG: log },
    timeout: 10000,
  });
  assert.equal(ejecucion.status, 0, ejecucion.stdout + ejecucion.stderr);
  assert.match(ejecucion.stdout, /COMPLETADO: plan=plan.md/);
  assert.deepEqual(readFileSync(log, "utf8").trim().split("\n"), [`constructor:${raiz}`, `revisor:${raiz}`]);
});

test("auditar enumera reglas allow amplias previas por archivo y avisa si no hay hook", t => {
  const raiz = proyecto(t);
  const home = mkdtempSync(join(tmpdir(), "permisos home "));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const global = join(home, ".claude/settings.json");
  const proyectoConfig = join(raiz, ".claude/settings.json");
  const local = join(raiz, ".claude/settings.local.json");
  mkdirSync(join(home, ".claude"), { recursive: true });
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  const configs = [
    [global, { permissions: { allow: ["Bash(*)", "npm *"] } }],
    [proyectoConfig, { permissions: { allow: ["docker *"] } }],
    [local, { permissions: { allow: ["bash -c"] } }],
  ];
  for (const [ruta, contenido] of configs) writeFileSync(ruta, JSON.stringify(contenido, null, 2) + "\n");
  const originales = configs.map(([ruta]) => readFileSync(ruta, "utf8"));
  const resultado = JSON.parse(execFileSync(process.execPath, [HOOK, "auditar", raiz], {
    encoding: "utf8",
    env: { ...process.env, HOME: home },
    timeout: 10000,
  }));
  const amplias = resultado.hallazgos.filter(h => h.tipo === "allow-amplia");
  assert.equal(resultado.hookInstalado, false);
  assert.equal(amplias.length, 4);
  assert.deepEqual(amplias.map(h => [h.alcance, h.regla]), [
    ["global", "Bash(*)"], ["global", "npm *"], ["proyecto", "docker *"], ["proyecto-local", "bash -c"],
  ]);
  assert.ok(resultado.hallazgos.some(h => h.tipo === "hook-ausente"));
  assert.ok(resultado.hallazgos.some(h => h.tipo === "allow-sin-hook"));
  assert.deepEqual(configs.map(([ruta]) => readFileSync(ruta, "utf8")), originales);
});
