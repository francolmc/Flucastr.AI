// Captura síncrona mediada por Python cuando Node pierde los pipes bajo Codex workspace-write.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, openSync, closeSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir, constants as osConstants } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MEDIADOR = fileURLToPath(new URL("./mediador.py", import.meta.url));
const DEFAULT_MAX = 1024 * 1024;

export function prepararStdio(opciones = {}) {
  const { stdio, input, ...resto } = opciones;
  if (stdio !== undefined) return { opciones, limpiar: () => {} };
  if (input === undefined) return { opciones: { ...resto, stdio: ["ignore", "pipe", "pipe"] }, limpiar: () => {} };
  const dir = mkdtempSync(join(tmpdir(), "spawn-seguro-"));
  const archivo = join(dir, "stdin");
  let fd;
  try {
    writeFileSync(archivo, typeof input === "string" ? Buffer.from(input, !resto.encoding || resto.encoding === "buffer" ? "utf8" : resto.encoding) : input);
    fd = openSync(archivo, "r");
    return { opciones: { ...resto, stdio: [fd, "pipe", "pipe"] }, limpiar: () => { try { closeSync(fd); } finally { rmSync(dir, { recursive: true, force: true }); } } };
  } catch (error) { rmSync(dir, { recursive: true, force: true }); throw error; }
}

function codificar(bytes, encoding) {
  if (!encoding || encoding === "buffer") return bytes;
  if (encoding === "utf8" || encoding === "utf-8") return bytes.toString("utf8");
  return bytes.toString(encoding);
}

export function spawnSyncMediado(comando, args = [], opciones = {}) {
  const dir = mkdtempSync(join(tmpdir(), "spawn-seguro-"));
  const inputPath = join(dir, "stdin");
  const outPath = join(dir, "stdout");
  const errPath = join(dir, "stderr");
  const metaPath = join(dir, "resultado.json");
  const pidPath = join(dir, "child.pid");
  try {
  if (opciones.input !== undefined) writeFileSync(inputPath, typeof opciones.input === "string" ? Buffer.from(opciones.input, !opciones.encoding || opciones.encoding === "buffer" ? "utf8" : opciones.encoding) : opciones.input);
  const maxBuffer = opciones.maxBuffer ?? DEFAULT_MAX;
  const valores = ["pipe", "pipe", "pipe"];
  if (opciones.stdio !== undefined) {
    const provistos = Array.isArray(opciones.stdio) ? opciones.stdio : [opciones.stdio, opciones.stdio, opciones.stdio];
    for (let i = 0; i < Math.min(provistos.length, 3); i++) valores[i] = provistos[i] == null ? (i === 0 ? "ignore" : "pipe") : provistos[i];
  } else valores[0] = "ignore";
  const shape = valores;
  for (const valor of shape) if (!["pipe", "ignore", "inherit"].includes(valor) && !(Number.isInteger(valor) && valor >= 0)) {
    const error = new TypeError(`opción stdio inválida: ${String(valor)}`); error.code = "ERR_INVALID_ARG_VALUE"; throw error;
  }
  if (opciones.maxBuffer !== undefined && opciones.maxBuffer !== Infinity && (!Number.isInteger(opciones.maxBuffer) || opciones.maxBuffer < 0)) {
    const error = new RangeError("maxBuffer debe ser un entero no negativo"); error.code = "ERR_OUT_OF_RANGE"; throw error;
  }
  if (opciones.timeout !== undefined && (!Number.isInteger(opciones.timeout) || opciones.timeout < 0)) {
    const error = new RangeError("timeout debe ser un entero no negativo"); error.code = "ERR_OUT_OF_RANGE"; throw error;
  }
  const killSignal = opciones.killSignal ?? "SIGTERM";
  const senalValida = typeof killSignal === "string" ? Object.hasOwn(osConstants.signals, killSignal) : Number.isInteger(killSignal) && Object.values(osConstants.signals).includes(killSignal);
  if (!senalValida) { const error = new TypeError("killSignal inválido"); error.code = "ERR_INVALID_ARG_VALUE"; throw error; }
  const cfg = { argv: [comando, ...args], cwd: opciones.cwd instanceof URL ? fileURLToPath(opciones.cwd) : opciones.cwd, env: opciones.env, shell: opciones.shell, argv0: opciones.argv0, uid: opciones.uid, gid: opciones.gid, umask: opciones.umask,
    input: opciones.input !== undefined ? inputPath : null, stdio: shape, stdout: outPath, stderr: errPath, meta: metaPath, pidfile: pidPath,
    maxBuffer, timeout: Number(opciones.timeout) > 0 ? Number(opciones.timeout) : 0, newSession: false, killSignal };
  const outerStdio = [opciones.input !== undefined ? "ignore" : (typeof shape[0] === "number" ? shape[0] : shape[0] === "inherit" ? "inherit" : "ignore"),
    typeof shape[1] === "number" ? shape[1] : shape[1] === "inherit" ? "inherit" : "ignore",
    typeof shape[2] === "number" ? shape[2] : shape[2] === "inherit" ? "inherit" : "ignore"];
  writeFileSync(join(dir, "config.json"), JSON.stringify(cfg));
  let outer;
  try {
    writeFileSync(outPath, ""); writeFileSync(errPath, "");
    const python = opciones.env?.FLUCASTR_PYTHON ?? process.env.FLUCASTR_PYTHON ?? "python3";
    outer = spawnSync(python, [MEDIADOR, join(dir, "config.json")], {
      cwd: opciones.cwd, env: opciones.env, stdio: outerStdio,
      killSignal: "SIGTERM",
    });
    let meta;
    try { meta = JSON.parse(readFileSync(metaPath, "utf8")); }
    catch { meta = { status: null, signal: outer.signal, error: { code: outer.error?.code || "EIO", message: outer.error?.message || "falló el mediador Python" } }; }
    const stdout = readFileSync(outPath);
    const stderr = readFileSync(errPath);
    const capturarOut = shape[1] === "pipe";
    const capturarErr = shape[2] === "pipe";
    const r = { ...meta, stdout: capturarOut ? codificar(stdout, opciones.encoding) : null, stderr: capturarErr ? codificar(stderr, opciones.encoding) : null };
    r.output = [null, r.stdout, r.stderr];
    if (r.error) r.error = Object.assign(new Error(r.error.message), { code: r.error.code, errno: r.error.errno, syscall: "spawn", path: comando, spawnargs: args });
    else delete r.error;
    return r;
  } finally { rmSync(dir, { recursive: true, force: true }); }
  } catch (error) { rmSync(dir, { recursive: true, force: true }); throw error; }
}

let nativoDisponible;
export function capturaNativaDisponible() {
  if (nativoDisponible !== undefined) return nativoDisponible;
  // estatico: control-crudo — comprueba el transporte real, no el comando de usuario.
  const prueba = spawnSync(process.execPath, ["-e", "process.stdout.write('flucastr-out');process.stderr.write('flucastr-err')"], { stdio: ["ignore", "pipe", "pipe"], timeout: 5000 });
  nativoDisponible = !prueba.error && prueba.status === 0 && String(prueba.stdout) === "flucastr-out" && String(prueba.stderr) === "flucastr-err";
  return nativoDisponible;
}

export function spawnSyncSeguro(comando, args = [], opciones = {}) {
  if (capturaNativaDisponible()) {
    const { opciones: listas, limpiar } = prepararStdio(opciones);
    try { return spawnSync(comando, args, listas); } finally { limpiar(); }
  }
  return spawnSyncMediado(comando, args, opciones);
}

export function execFileSyncSeguro(archivo, args = [], opciones = {}) {
  if (capturaNativaDisponible()) {
    const { opciones: listas, limpiar } = prepararStdio(opciones);
    try { return execFileSync(archivo, args, listas); } finally { limpiar(); }
  }
  const r = spawnSyncMediado(archivo, args, opciones);
  if (r.error || r.status !== 0) {
    const error = new Error(r.error?.message || `Command failed: ${archivo}`);
    Object.assign(error, { errno: r.error?.errno, syscall: r.error ? "spawn" : undefined, path: archivo, spawnargs: args, status: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr, output: r.output });
    if (r.error) error.code = r.error.code;
    throw error;
  }
  return r.stdout;
}
