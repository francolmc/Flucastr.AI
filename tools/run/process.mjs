import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSyncSeguro, capturaNativaDisponible } from "../spawn/sync-seguro.mjs";
import { openSync, closeSync } from "node:fs";

const MEDIADOR = fileURLToPath(new URL("../spawn/mediador.py", import.meta.url));
const PYTHON = process.env.FLUCASTR_PYTHON ?? "python3";

const TOPE_MS = { BUILDER: 45 * 60 * 1000, REVIEWER: 15 * 60 * 1000, VERIFY: 30 * 60 * 1000 };

function topeMs(rol) {
  const fijo = Number(process.env.KIT_RUN_TOPE_MS);
  return Number.isFinite(fijo) && fijo > 0 ? fijo : TOPE_MS[rol];
}

// tope: milisegundos; si se supera, spawnSync mata el proceso y error dice que superó el tope.
function correr(cmd, prompt, cwd, shell = false, tope = undefined) {
  const r = spawnSyncSeguro(cmd.exe,cmd.args ?? [], {
    cwd,
    input: prompt ?? "",
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell,
    timeout: tope,
  });
  const expiro = r.error && r.error.code === "ETIMEDOUT";
  return {
    status: r.status,
    error: r.error ? (expiro ? `superó el tope de ${tope} ms` : r.error.message) : null,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

// Variante asíncrona de `correr` con un temporizador de vigilancia (changes/kit-run-pegado, segmento 2).
// - `vigilar()` se llama cada `intervaloMs`; si devuelve `{cortar: true, motivo}`, se mata el grupo del
//   proceso con SIGTERM y, a los 10 s, SIGKILL. `error` queda como `cortado: <motivo>`.
// - `tope` (ms) igual que en `correr`: `error` queda como `superó el tope de N ms`.
// - El prompt entra por archivo temporal como stdin (sin pipe, como sync-seguro).
// Devuelve la misma forma que `correr`: {status, error, stdout, stderr}. Un error del callback se ignora.
function correrVigiladoNativo(cmd, prompt, cwd, { shell, tope, intervaloMs, vigilar }) {
  return new Promise((resolve) => {
    const dir = mkdtempSync(join(tmpdir(), "kit-run-vigilado-"));
    const archivo = join(dir, "stdin"); writeFileSync(archivo, prompt ?? ""); const fd = openSync(archivo, "r");
    let stdout = "", stderr = "", error = null, hijo = null, terminado = false;
    let timerTope = null, timerVigila = null, timerMuerte = null;
    const matar = (motivo) => { if (error !== null || terminado || !hijo) return; error = motivo; try { process.kill(-hijo.pid, "SIGTERM"); } catch {} timerMuerte = setTimeout(() => { try { process.kill(-hijo.pid, "SIGKILL"); } catch {} }, 10000); };
    const finalizar = (status) => { if (terminado) return; terminado = true; clearTimeout(timerTope); clearInterval(timerVigila); clearTimeout(timerMuerte); try { closeSync(fd); } catch {} rmSync(dir, { recursive: true, force: true }); resolve({ status, error, stdout, stderr }); };
    try { hijo = spawn(cmd.exe, cmd.args ?? [], { cwd, stdio: [fd, "pipe", "pipe"], shell, detached: true }); }
    catch (e) { error = e.message; finalizar(null); return; }
    hijo.stdout.setEncoding("utf8"); hijo.stderr.setEncoding("utf8");
    hijo.stdout.on("data", (d) => { stdout += d; }); hijo.stderr.on("data", (d) => { stderr += d; });
    hijo.on("error", (e) => { if (error === null) error = e.message; finalizar(null); }); hijo.on("close", (status) => finalizar(status));
    if (tope !== undefined && tope > 0) timerTope = setTimeout(() => matar(`superó el tope de ${tope} ms`), tope);
    if (typeof vigilar === "function") timerVigila = setInterval(() => { if (error !== null || terminado) return; try { const d = vigilar(); if (d?.cortar) matar(`cortado: ${d.motivo}`); } catch {} }, intervaloMs);
  });
}

export function correrVigilado(cmd, prompt, cwd, { shell = false, tope = undefined, intervaloMs = 30000, vigilar = null } = {}) {
  const opciones = { shell, tope, intervaloMs, vigilar };
  if (capturaNativaDisponible()) return correrVigiladoNativo(cmd, prompt, cwd, opciones);
  return new Promise((resolve) => {
    let dir, entrada, stdoutPath, stderrPath, metaPath, pidPath, configPath;
    try {
      dir = mkdtempSync(join(tmpdir(), "kit-run-vigilado-"));
      entrada = join(dir, "stdin"); stdoutPath = join(dir, "stdout"); stderrPath = join(dir, "stderr");
      metaPath = join(dir, "resultado.json"); pidPath = join(dir, "child.pid"); configPath = join(dir, "config.json");
      writeFileSync(entrada, prompt ?? ""); writeFileSync(stdoutPath, ""); writeFileSync(stderrPath, "");
      writeFileSync(configPath, JSON.stringify({ argv: [cmd.exe, ...(cmd.args ?? [])], cwd, shell,
        input: entrada, stdout: stdoutPath, stderr: stderrPath, meta: metaPath, pidfile: pidPath,
        timeout: 0, newSession: true, killSignal: "SIGTERM" }));
    } catch (e) {
      if (dir) rmSync(dir, { recursive: true, force: true });
      resolve({ status: null, error: e.message, stdout: "", stderr: "" }); return;
    }
    let error = null;
    let hijo;
    let timerTope = null;
    let timerVigila = null;
    let timerMuerte = null;
    let terminado = false;
    const limpiar = () => rmSync(dir, { recursive: true, force: true });
    const matar = (motivo) => {
      if (error !== null || terminado || !hijo) return;
      error = motivo;
      try { process.kill(-hijo.pid, "SIGTERM"); } catch { /* ya terminó */ }
      timerMuerte = setTimeout(() => {
        try { const pid = Number(readFileSync(pidPath, "utf8")); if (Number.isInteger(pid) && pid > 1) process.kill(-pid, "SIGKILL"); } catch { /* hijo ya terminó */ }
        try { process.kill(-hijo.pid, "SIGKILL"); } catch { /* mediador ya terminó */ }
      }, 10000);
    };
    const finalizar = (status) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timerTope); clearInterval(timerVigila); clearTimeout(timerMuerte);
      let meta = {};
      try { meta = JSON.parse(readFileSync(metaPath, "utf8")); } catch { /* el mediador pudo recibir una señal */ }
      let stdout = ""; let stderr = "";
      try { stdout = readFileSync(stdoutPath, "utf8"); } catch { /* fallo antes de crear salida */ }
      try { stderr = readFileSync(stderrPath, "utf8"); } catch { /* fallo antes de crear salida */ }
      limpiar();
      resolve({ status: Object.hasOwn(meta, "status") ? meta.status : status,
        error: error ?? meta.error?.message ?? null, stdout, stderr });
    };
    try {
      hijo = spawn(PYTHON, [MEDIADOR, configPath], { cwd, stdio: "ignore", detached: true });
    } catch (e) { error = e.message; limpiar(); resolve({ status: null, error, stdout: "", stderr: "" }); return; }
    hijo.on("error", (e) => { if (error === null) error = e.message; finalizar(null); });
    hijo.on("close", (status) => finalizar(status));
    if (tope !== undefined && tope > 0) timerTope = setTimeout(() => matar(`superó el tope de ${tope} ms`), tope);
    if (typeof vigilar === "function") timerVigila = setInterval(() => {
      if (error !== null || terminado) return;
      try { const decision = vigilar(); if (decision?.cortar) matar(`cortado: ${decision.motivo}`); } catch { /* callback observacional */ }
    }, intervaloMs);
  });
}

export { correr, topeMs };
