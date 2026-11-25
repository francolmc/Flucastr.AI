// Reproductor mínimo de `spawnSync bash EPERM`. Solo lectura, sin red, sin secretos.
// Uso (desde tu terminal, FUERA de otro sandbox):
//   node changes/fix-verify-sandbox-eperm/fixture/repro.mjs                                   # control
//   REPS=200 codex exec --sandbox workspace-write -c approval_policy="never" "ejecuta REPS=200 node changes/fix-verify-sandbox-eperm/fixture/repro.mjs"
// Pega la salida completa (JSON de una línea por caso) más `codex --version` y `node -v`.
import { spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";

const casos = [
  ["bash -c", "bash", ["-c", "echo hola"]],
  ["/usr/bin/bash -c", "/usr/bin/bash", ["-c", "echo hola"]],
  ["sh -c", "sh", ["-c", "echo hola"]],
  ["/bin/true", "/bin/true", []],
  ["node -v", process.execPath, ["-v"]],
];
const ejecutable = (r) => { try { accessSync(r, constants.X_OK); return true; } catch (e) { return e.code; } };

console.log(JSON.stringify({ node: process.version, uid: process.getuid?.(), cwd: process.cwd(), bashX: ejecutable("/usr/bin/bash"), PATH: process.env.PATH }));
// El fallo es intermitente en los logs: REPS=200 repite cada caso y resume (ok/fallos y códigos).
const REPS = Number(process.env.REPS || 1);
for (const [nombre, exe, args] of casos) {
  const cuenta = { ok: 0, fallo: 0, codigos: {} };
  let ultimo;
  for (let i = 0; i < REPS; i++) {
    const r = spawnSync(exe, args, { encoding: "utf8" });
    ultimo = r;
    if (r.error) { cuenta.fallo++; cuenta.codigos[r.error.code] = (cuenta.codigos[r.error.code] || 0) + 1; }
    else cuenta.ok++;
  }
  console.log(JSON.stringify({ caso: nombre, reps: REPS, ...cuenta, status: ultimo.status, code: ultimo.error?.code, syscall: ultimo.error?.syscall, path: ultimo.error?.path, stdout: ultimo.stdout?.trim(), stderr: ultimo.stderr?.trim() }));
}

// Variantes (qué opción de Node dispara el EPERM aunque el hijo corra). Solo `bash -c`.
const variantes = [
  ["pipe (encoding utf8)", { encoding: "utf8" }],
  ["stdio inherit", { stdio: "inherit" }],
  ["stdio ignore", { stdio: "ignore" }],
  ["stdio pipe sin encoding", { stdio: "pipe" }],
  ["detached false + windowsHide", { encoding: "utf8", windowsHide: true }],
  // Aislar qué extremo de pipe dispara el EPERM (stdin, stdout o stderr):
  ["stdin ignore, stdout+stderr pipe", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }],
  ["stdin pipe, stdout+stderr ignore", { stdio: ["pipe", "ignore", "ignore"] }],
  ["stdin ignore, stdout pipe, stderr inherit", { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }],
  ["stdin ignore, stdout inherit, stderr pipe", { encoding: "utf8", stdio: ["ignore", "inherit", "pipe"] }],
  ["stdin inherit, stdout+stderr pipe", { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] }],
  ["pipe + input", { encoding: "utf8", input: "x" }],
];
for (const [nombre, opts] of variantes) {
  const r = spawnSync("bash", ["-c", "echo variante"], opts);
  console.log(JSON.stringify({ variante: nombre, error: r.error?.code, status: r.status, signal: r.signal, pid: r.pid }));
}
import { execFileSync, spawn } from "node:child_process";
try { execFileSync("bash", ["-c", "echo x"], { encoding: "utf8" }); console.log(JSON.stringify({ variante: "execFileSync", ok: true })); }
catch (e) { console.log(JSON.stringify({ variante: "execFileSync", error: e.code, status: e.status })); }
const hijo = spawn("bash", ["-c", "echo async"]);
let out = "";
hijo.stdout.on("data", (d) => { out += d; });
hijo.on("error", (e) => console.log(JSON.stringify({ variante: "spawn async", error: e.code })));
hijo.on("close", (c) => console.log(JSON.stringify({ variante: "spawn async", close: c, stdout: out.trim() })));
