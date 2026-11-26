import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { execFileSyncSeguro, spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = fileURLToPath(new URL("../..", import.meta.url));
const HOOK = join(KIT, "scripts/permissions-hook.mjs");
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
  const r = spawnSyncSeguro(process.execPath, [HOOK, "decision", "--project", raiz], {
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
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "node verificacion/rapida.mjs --extra" } }), "normal");
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "node -e 'process.exit(0)'" } }), "normal");
  assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command: "npm run test" } }), "normal");
  for (const command of ["grep -n x AGENTS.md | head -5", "git branch", "wc -l AGENTS.md"]) {
    assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command } }), "normal", command);
  }
});

test("Claude no autoriza el comando declarado si verify o el script rápido está modificado, preparado o ausente", t => {
  const raiz = proyecto(t);
  writeFileSync(join(raiz, "verificacion/rapida.mjs"), "console.log('cambio');\n");
  assert.equal(decision(raiz, quick), "normal");
  git(raiz, "add", "verificacion/rapida.mjs");
  assert.equal(decision(raiz, quick), "normal");
  // El árbol vuelve al contenido de HEAD, pero el índice conserva otro contenido.
  writeFileSync(join(raiz, "verificacion/rapida.mjs"), "console.log('ok');\n");
  assert.equal(decision(raiz, quick), "normal");
  git(raiz, "reset", "-q", "HEAD", "--", "verificacion/rapida.mjs");
  git(raiz, "checkout", "--", "verificacion/rapida.mjs");
  writeFileSync(join(raiz, "verify"), "#!/bin/sh\necho changed\n");
  assert.equal(decision(raiz, quick), "normal");
  git(raiz, "checkout", "--", "verify");
  rmSync(join(raiz, "verificacion/rapida.mjs"));
  assert.equal(decision(raiz, quick), "normal");
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
  assert.equal(decision(raiz, comando), "normal");
});

test("acciones protegidas de Bash se deniegan; Read, Grep y Glob no pasan por el hook", t => {
  const raiz = proyecto(t);
  for (const command of ["git commit -m test", "git push", "git merge main", "gh pr create", "vercel deploy", "cat .env", "git status && git commit -m x"]) {
    assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command } }), "deny", command);
  }
  // `.env` lo protegen las reglas deny y el sandbox, no este hook.
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: ".env" } }), "normal");
  assert.equal(decision(raiz, { tool_name: "Grep", tool_input: { pattern: "token", path: "." } }), "normal");
  assert.equal(decision(raiz, { tool_name: "Glob", tool_input: { pattern: "**/*" } }), "normal");
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: "AGENTS.md" } }), "normal");
  writeFileSync(join(raiz, ".env"), "dummy=secret\n");
  symlinkSync(".env", join(raiz, "alias.txt"));
  assert.equal(decision(raiz, { tool_name: "Read", tool_input: { file_path: "alias.txt" } }), "normal");
});

test("instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política", t => {
  const raiz = proyecto(t);
  const settings = join(raiz, ".claude/settings.local.json");
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  writeFileSync(settings, JSON.stringify({ theme: "dark", permissions: { allow: ["Bash(*)"] }, hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo ajeno" }] }] } }));
  const instalar = () => execFileSyncSeguro(process.execPath, [HOOK, "instalar", raiz], { encoding: "utf8", timeout: 10000 }).trim();
  const firstInstall = instalar();
  assert.equal(firstInstall, "fijado");
  assert.equal(instalar(), "ya-estaba");
  const config = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(config.theme, "dark");
  assert.deepEqual(config.permissions.allow, ["Bash(*)"]);
  assert.equal(config.hooks.PreToolUse.length, 2);
  assert.equal(config.hooks.PreToolUse[0].hooks[0].command, "echo ajeno");
  assert.equal(config.hooks.PreToolUse[1].matcher, "Bash");
  assert.equal(config.hooks.PreToolUse[1].hooks[0].onFailure, "block");
  const falloHook = spawnSyncSeguro(process.execPath, [HOOK, "decision", "--project", raiz], { input: "{", encoding: "utf8" });
  assert.equal(falloHook.status, 1);

  // Una instalación antigua con dos matchers del kit (Bash y Read|Grep|Glob) no cuenta como instalada:
  // se repara a un solo matcher Bash y conserva las entradas ajenas.
  const kitBash = config.hooks.PreToolUse[1];
  const kitLectura = { matcher: "Read|Grep|Glob", hooks: [kitBash.hooks[0]] };
  config.hooks.PreToolUse = [config.hooks.PreToolUse[0], {
    ...kitBash,
    hooks: [...kitBash.hooks, { type: "command", command: "echo vecino" }],
  }, kitLectura];
  writeFileSync(settings, JSON.stringify(config));
  assert.equal(execFileSyncSeguro(process.execPath, [HOOK, "comprobar", raiz], { encoding: "utf8" }).trim(), "ausente");
  assert.equal(instalar(), "fijado");
  const reparado = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(reparado.hooks.PreToolUse.length, 3);
  assert.equal(reparado.hooks.PreToolUse[0].hooks[0].command, "echo ajeno");
  assert.equal(reparado.hooks.PreToolUse[1].hooks[0].command, "echo vecino");
  assert.equal(reparado.hooks.PreToolUse[2].matcher, "Bash");
  assert.ok(!reparado.hooks.PreToolUse.some(e => e.matcher === "Read|Grep|Glob"));

  const env = { ...process.env, KIT_RUN_BUILDER: "/bin/true", KIT_RUN_REVIEWER: "/bin/true" };
  rmSync(settings);
  const ausente = spawnSyncSeguro(process.execPath, [KIT_RUN, "no-existe.md", "--tool", "claude", "--root", raiz], { encoding: "utf8", env, timeout: 10000 });
  assert.equal(ausente.status, 2);
  assert.match(ausente.stderr, /no tiene instalada la política conservadora/);
  instalar();
  const presente = spawnSyncSeguro(process.execPath, [KIT_RUN, "no-existe.md", "--tool", "claude", "--root", raiz], { encoding: "utf8", env, timeout: 10000 });
  assert.equal(presente.status, 2);
  assert.match(presente.stderr, /no existe el plan/);
  assert.doesNotMatch(presente.stderr, /política conservadora/);

  const plan = join(raiz, "plan.md");
  writeFileSync(plan, "---\nstatus: approved\nsegment: 1\n---\n\n## Verification\n`./verify`\n\n## Notes\n");
  const builder = join(raiz, "builder.sh");
  const revisor = join(raiz, "revisor.sh");
  const log = join(tmpdir(), `permisos-roles-${Date.now()}.log`);
  t.after(() => rmSync(log, { force: true }));
  writeFileSync(builder, "#!/bin/sh\ncat >/dev/null\nprintf 'builder:%s\\n' \"$PWD\" >> \"$POLITICA_LOG\"\nprintf 'DONE: plan=plan.md; segment=1; verify=pasa\\n'\n");
  writeFileSync(revisor, "#!/bin/sh\ncat >/dev/null\nprintf 'revisor:%s\\n' \"$PWD\" >> \"$POLITICA_LOG\"\nprintf '{\"veredicto\":\"APPROVED\",\"defectos\":[]}\\n'\n");
  chmodSync(builder, 0o755);
  chmodSync(revisor, 0o755);
  const ejecucion = spawnSyncSeguro(process.execPath, [KIT_RUN, "plan.md", "--tool", "claude", "--root", raiz], {
    encoding: "utf8",
    env: { ...env, KIT_RUN_BUILDER: builder, KIT_RUN_REVIEWER: revisor, KIT_RUN_VERIFY: "/bin/true", POLITICA_LOG: log },
    timeout: 10000,
  });
  assert.equal(ejecucion.status, 0, ejecucion.stdout + ejecucion.stderr);
  assert.match(ejecucion.stdout, /DONE: plan=plan.md/);
  assert.deepEqual(readFileSync(log, "utf8").trim().split("\n"), [`builder:${raiz}`, `revisor:${raiz}`]);
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
  const resultado = JSON.parse(execFileSyncSeguro(process.execPath, [HOOK, "auditar", raiz], {
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

test("el hook real aplica el analizador: texto inerte pasa, sustitución se deniega, comilla sin cerrar pide confirmación", t => {
  const raiz = proyecto(t);
  const casos = [
    ["cat > notas.md <<'EOF'\ngit push\nEOF", "normal"],
    ["echo \"$(git push)\"", "deny"],
    ["echo \"sin cerrar", "ask"],
    ["node verificacion/rapida.mjs", "allow"],
  ];
  for (const [command, esperada] of casos) {
    assert.equal(decision(raiz, { tool_name: "Bash", tool_input: { command } }), esperada, command);
  }
});
