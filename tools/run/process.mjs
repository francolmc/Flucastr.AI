import { spawn } from "node:child_process";
import { mkdtempSync, openSync, closeSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSyncSeguro } from "../spawn/sync-seguro.mjs";

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
export function correrVigilado(cmd, prompt, cwd, { shell = false, tope = undefined, intervaloMs = 30000, vigilar = null } = {}) {
  return new Promise((resolve) => {
    const dir = mkdtempSync(join(tmpdir(), "kit-run-vigilado-"));
    const archivo = join(dir, "stdin");
    writeFileSync(archivo, prompt ?? "");
    const fd = openSync(archivo, "r");
    let stdout = "";
    let stderr = "";
    let error = null;
    let hijo = null;
    let terminado = false;
    let timerTope = null;
    let timerVigila = null;
    let timerMuerte = null;

    const matar = (motivo) => {
      if (error !== null || terminado || hijo === null) return;
      error = motivo;
      try {
        process.kill(-hijo.pid, "SIGTERM");
      } catch {
        // ya terminó
      }
      timerMuerte = setTimeout(() => {
        try {
          process.kill(-hijo.pid, "SIGKILL");
        } catch {
          // ya terminó
        }
      }, 10000);
    };

    const finalizar = (status) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timerTope);
      clearInterval(timerVigila);
      clearTimeout(timerMuerte);
      try {
        closeSync(fd);
      } catch {
        // ya cerrado
      }
      rmSync(dir, { recursive: true, force: true });
      resolve({ status, error, stdout, stderr });
    };

    try {
      hijo = spawn(cmd.exe, cmd.args ?? [], { cwd, stdio: [fd, "pipe", "pipe"], shell, detached: true });
    } catch (e) {
      error = e.message;
      finalizar(null);
      return;
    }
    hijo.stdout.setEncoding("utf8");
    hijo.stderr.setEncoding("utf8");
    hijo.stdout.on("data", (d) => {
      stdout += d;
    });
    hijo.stderr.on("data", (d) => {
      stderr += d;
    });
    hijo.on("error", (e) => {
      if (error === null) error = e.message;
      finalizar(null);
    });
    hijo.on("close", (status) => finalizar(status));

    if (tope !== undefined && tope > 0) {
      timerTope = setTimeout(() => matar(`superó el tope de ${tope} ms`), tope);
    }
    if (typeof vigilar === "function") {
      timerVigila = setInterval(() => {
        if (error !== null || terminado) return;
        let decision = null;
        try {
          decision = vigilar();
        } catch {
          return;
        }
        if (decision && decision.cortar) matar(`cortado: ${decision.motivo}`);
      }, intervaloMs);
    }
  });
}

export { correr, topeMs };
