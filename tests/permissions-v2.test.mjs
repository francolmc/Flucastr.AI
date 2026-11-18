import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const KIT = fileURLToPath(new URL("..", import.meta.url));
const RESOLVER = join(KIT, "scripts/resolver.mjs");
const INSTALL = join(KIT, "install.sh");
const UNINSTALL = join(KIT, "uninstall.sh");
const temporal = mkdtempSync(join(tmpdir(), "permisos-v2-ficticio-"));
const proyecto = join(temporal, "proyecto");
const settings = join(proyecto, ".claude", "settings.json");
const manifest = join(temporal, "flucastr.rules");
const agente = join(proyecto, "AGENTS.md");
mkdirSync(join(proyecto, ".claude"), { recursive: true });
mkdirSync(join(proyecto, ".aws"), { recursive: true });
mkdirSync(join(proyecto, ".ssh"), { recursive: true });
writeFileSync(join(proyecto, ".env"), "FAKE_SECRET=solo-prueba\n");
writeFileSync(join(proyecto, ".env.local"), "FAKE_LOCAL=solo-prueba\n");
writeFileSync(join(proyecto, ".ssh", "id_ed25519"), "FAKE_PRIVATE_KEY=solo-prueba\n");
writeFileSync(join(proyecto, ".aws", "credentials"), "FAKE_AWS=solo-prueba\n");
writeFileSync(agente, "Comprobación rápida: `./verify`\n");
test.after(() => rmSync(temporal, { recursive: true, force: true }));

function resolver(...args) {
  return execFileSync(process.execPath, [RESOLVER, ...args], { encoding: "utf8" }).trim();
}

function evalCodex(args) {
  const r = spawnSync("codex", ["execpolicy", "check", "--rules", manifest, ...args], { encoding: "utf8" });
  if (r.error?.code === "ENOENT") return { decision: "no probado", motivo: "codex no está instalado" };
  if (r.status !== 0) return { decision: "no probado", motivo: `execpolicy check exit ${r.status}: ${(r.stderr || r.stdout).trim()}` };
  let resultado;
  try { resultado = JSON.parse(r.stdout); } catch { return { decision: "no probado", motivo: "salida de execpolicy check no JSON" }; }
  return { decision: String(resultado.decision ?? resultado.status ?? "no probado"), raw: resultado };
}

test("sandbox Claude se fusiona, se reinstala y se retira sin tocar valores ajenos", () => {
  writeFileSync(settings, JSON.stringify({ other: "preservar", sandbox: { enabled: true, filesystem: { denyRead: ["/tmp/ajeno"] } } }));
  const primera = resolver("fijar-sandbox", "claude", settings);
  assert.match(primera, /agregado:sandbox\.allowUnsandboxedCommands:false/);
  assert.match(primera, /agregado:sandbox\.filesystem\.denyRead/);
  assert.equal(resolver("fijar-sandbox", "claude", settings), "ya-estaba");
  const config = JSON.parse(readFileSync(settings, "utf8"));
  assert.equal(config.other, "preservar");
  assert.ok(config.sandbox.filesystem.denyRead.includes("/tmp/ajeno"));
  assert.ok(config.sandbox.filesystem.denyRead.includes("./.env"));
  assert.ok(config.sandbox.filesystem.denyRead.includes("./.env.*"));
  for (const patron of ["**/.env", "**/.env.*", "~/.ssh/**", "~/.aws/**", "**/*.pem", "**/*.key", "**/id_ed25519"]) {
    assert.ok(config.sandbox.filesystem.denyRead.includes(patron), `falta patrón de lectura: ${patron}`);
  }
  resolver("fijar-deny", "claude", settings);
  const deny = JSON.parse(readFileSync(settings, "utf8")).permissions.deny;
  for (const regla of [
    "Read(./.env)", "Read(./.env.*)", "Read(./**/.env)", "Read(./**/.env.*)",
    "Read(./.ssh/**)", "Read(./.aws/**)", "Read(./**/.ssh/**)", "Read(./**/.aws/**)", "Read(~/.ssh/**)", "Read(~/.aws/**)",
    "Read(./**/*.pem)", "Read(./**/*.key)", "Read(./**/*.p12)", "Read(./**/*.pfx)",
    "Read(./**/id_rsa)", "Read(./**/id_ed25519)", "Read(./**/id_ecdsa)",
    "Bash(git commit *)", "Bash(git push *)", "Bash(git merge *)",
    "Bash(gh pr create *)", "Bash(gh pr merge *)", "Bash(git * commit *)", "Bash(git * push *)",
    "Bash(bash -c *)", "Bash(sh -c *)", "Bash(zsh -c *)", "Bash(git -c * merge *)",
  ]) assert.ok(deny.includes(regla), `falta deny de Claude: ${regla}`);
  for (const [clave, valor] of [
    ["sandbox.allowUnsandboxedCommands", "false"],
    ...config.sandbox.filesystem.denyRead.filter(p => p !== "/tmp/ajeno").map(p => ["sandbox.filesystem.denyRead", JSON.stringify(p)]),
  ]) resolver("quitar-sandbox", "claude", settings, clave, valor);
  for (const regla of deny) resolver("quitar-deny", "claude", settings, regla);
  const trasQuitar = JSON.parse(readFileSync(settings, "utf8"));
  assert.deepEqual(trasQuitar, { other: "preservar", sandbox: { enabled: true, filesystem: { denyRead: ["/tmp/ajeno"] } } });
  console.log("Matriz sintética: Claude sandbox y 28 deny configurados (lectura de secretos, incluidos anidados, SSH/AWS y llaves, además de bloqueos Bash); lectura real y precedencia frente a allow global requieren prueba de sesión CLI.");
});

test("instalar, reinstalar y desinstalar Claude preserva valores sandbox ajenos", () => {
  const base = join(temporal, "instalacion");
  const home = join(base, "home");
  const raiz = join(base, "proyecto");
  const archivo = join(raiz, ".claude", "settings.json");
  mkdirSync(join(home, ".claude"), { recursive: true });
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  const original = { propia: "conservar", sandbox: { enabled: true, filesystem: { denyRead: ["/tmp/ajeno"] } } };
  writeFileSync(archivo, JSON.stringify(original));
  const env = { ...process.env, HOME: home, PI_CODING_AGENT_DIR: join(home, ".pi", "agent") };
  const instalar = () => {
    const r = spawnSync("bash", [INSTALL, "--only", "claude", "--project", raiz], { encoding: "utf8", env, cwd: KIT, timeout: 30000 });
    assert.equal(r.status, 0, `install.sh falló: ${r.stderr}\n${r.stdout}`);
    assert.match(r.stdout + r.stderr, /reglas deny|sandbox/i);
  };
  instalar();
  const instalado = readFileSync(archivo, "utf8");
  const primero = JSON.parse(instalado);
  assert.deepEqual(primero.propia, "conservar");
  assert.ok(primero.sandbox.filesystem.denyRead.includes("/tmp/ajeno"));
  assert.equal(primero.sandbox.enabled, true);
  assert.equal(primero.sandbox.allowUnsandboxedCommands, false);
  instalar();
  assert.equal(readFileSync(archivo, "utf8"), instalado, "la reinstalación debe ser idempotente");
  const quitar = spawnSync("bash", [UNINSTALL, "--project", raiz], { encoding: "utf8", env, cwd: KIT, timeout: 30000 });
  assert.equal(quitar.status, 0, `uninstall.sh falló: ${quitar.stderr}\n${quitar.stdout}`);
  assert.deepEqual(JSON.parse(readFileSync(archivo, "utf8")), original);
  console.log("Integración instalar/reinstalar/desinstalar en HOME y proyecto ficticios: sandbox y deny del kit retirados; ajustes propios conservados.");
});

test("Codex evalúa reglas directas y registra el límite de lectura de archivos", t => {
  const version = spawnSync("codex", ["--version"], { encoding: "utf8" });
  if (version.error?.code === "ENOENT" || version.status !== 0) {
    t.skip("Codex no está disponible");
    return;
  }
  resolver("fijar-deny", "codex", manifest, agente);
  const pruebas = [
    [["git", "commit", "-m", "fake"], "forbidden"],
    [["git", "push", "origin", "rama-falsa"], "forbidden"],
    [["git", "merge", "rama-falsa"], "forbidden"],
    [["gh", "pr", "create"], "forbidden"],
    [["gh", "pr", "merge", "123"], "forbidden"],
    [["bash", "-c", "git commit"], "forbidden"],
    [["sh", "-c", "git commit"], "forbidden"],
    [["zsh", "-c", "git commit"], "forbidden"],
    [["git", "-C", proyecto, "commit", "-m", "fake"], "forbidden"],
    [["git", "-c", "user.name=fake", "commit", "-m", "fake"], "forbidden"],
    [["git", "-c", "user.name=fake", "merge", "rama-falsa"], "forbidden"],
    [["cat", join(proyecto, ".env")], "no probado"],
    [["cat", join(proyecto, ".env.local")], "no probado"],
    [["cat", join(proyecto, ".ssh", "id_ed25519")], "no probado"],
    [["cat", join(proyecto, ".aws", "credentials")], "no probado"],
  ];
  const resultados = pruebas.map(([args, esperado]) => {
    const r = evalCodex(args);
    if (esperado !== "no probado") assert.equal(r.decision, esperado, `${args.join(" ")}: ${JSON.stringify(r.raw)}`);
    return { comando: args.join(" "), resultado: esperado === "no probado" ? "no probado: execpolicy solo evalúa comandos; no evalúa lectura por herramienta de archivos" : r.decision, motivo: r.motivo };
  });
  console.log(`Matriz Codex por execpolicy (${version.stdout.trim()}): ${JSON.stringify(resultados)}`);
});

test("comandos de lanzamiento declaran workspace-write y aprobaciones on-request", () => {
  const launcherCodex = readFileSync(join(KIT, "adapters/codex/install-launcher.sh"), "utf8");
  const kitRunCommands = readFileSync(join(KIT, "tools/run/commands.mjs"), "utf8");
  assert.match(launcherCodex, /exec codex --sandbox workspace-write -c 'approval_policy="on-request"'/);
  assert.match(kitRunCommands, /"-c", 'approval_policy="on-request"'/);
  assert.match(kitRunCommands, /builder \? "workspace-write" : "read-only"/);
  console.log("Matriz de herramienta: Codex CLI argumentos/config = workspace-write + on-request; revisor = read-only; sesión que lea ficheros o ejecute comandos = no probada (sin sesión Codex).");
});

test("instalador y diagnóstico advierten si falta una dependencia del sandbox Linux", () => {
  const instalar = [
    readFileSync(join(KIT, "install.sh"), "utf8"),
    readFileSync(join(KIT, "adapters/claude-code/install-sandbox.sh"), "utf8"),
  ].join("\n");
  const diagnose = readFileSync(join(KIT, "core/skills/diagnose/diagnose.mjs"), "utf8");
  for (const dependencia of ["bwrap", "socat"]) {
    assert.ok(instalar.includes(`command -v ${dependencia}`), `instalador no revisa ${dependencia}`);
    assert.ok(diagnose.includes(`"${dependencia}"`), `diagnose no revisa ${dependencia}`);
  }
  assert.match(instalar, /el CLI puede desactivarlo y ejecutar sin sus restricciones/);
  assert.match(diagnose, /el CLI puede desactivarlo y ejecutar sin sus restricciones/);
  console.log("Aviso sandbox Linux: instalador y diagnose comprueban bwrap/socat y advierten que el CLI puede ejecutar sin restricciones si falta una dependencia.");
});
