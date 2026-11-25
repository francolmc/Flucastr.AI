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

export { correr, topeMs };
