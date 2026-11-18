import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

export const PID = "observador.pid";
const LOG = "observador.log";
const DIAGNOSTICOS = "diagnosticos";

export function pidDe(dir) {
  const ruta = join(dir, PID);
  if (!existsSync(ruta)) return null;
  const pid = Number(readFileSync(ruta, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export function vivo(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

export function arrancar(dir, entrypoint) {
  mkdirSync(join(dir, DIAGNOSTICOS), { recursive: true });
  const previo = pidDe(dir);
  if (previo && vivo(previo)) {
    console.log(`ya corre (pid ${previo}); datos en ${dir}`);
    return 0;
  }
  const log = openSync(join(dir, LOG), "a");
  const hijo = spawn(process.execPath, [entrypoint, "--run", dir], { detached: true, stdio: ["ignore", log, log], env: process.env });
  hijo.unref();
  writeFileSync(join(dir, PID), `${hijo.pid}\n`);
  console.log(`arrancado (pid ${hijo.pid}); datos en ${dir}`);
  return 0;
}

export async function parar(dir) {
  const pid = pidDe(dir);
  if (!pid || !vivo(pid)) {
    rmSync(join(dir, PID), { force: true });
    console.log(`no corre; datos en ${dir}`);
    return 0;
  }
  process.kill(pid, "SIGTERM");
  for (let i = 0; i < 50 && vivo(pid); i++) await new Promise((r) => setTimeout(r, 100));
  if (vivo(pid)) process.kill(pid, "SIGKILL");
  const sigue = vivo(pid);
  if (!sigue) rmSync(join(dir, PID), { force: true });
  console.log(sigue ? `no pudo parar (pid ${pid})` : `parado (pid ${pid})`);
  return sigue ? 1 : 0;
}

export function estado(dir) {
  const pid = pidDe(dir);
  console.log(pid && vivo(pid) ? `corriendo (pid ${pid}); datos en ${dir}` : `parado; datos en ${dir}`);
  return 0;
}
