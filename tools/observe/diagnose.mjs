import { execFile, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Comando externo sin lanzar excepciones: devuelve su salida (vacía si falla) y deja el error en el log.
export function cmd(bin, args) {
  return new Promise((resolver) => {
    execFile(bin, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err) process.stderr.write(`${new Date().toISOString()} ${bin} ${args[0]}: ${err.message.split("\n")[0]}\n`);
      resolver(stdout ?? "");
    });
  });
}

// Un evento merece diagnóstico si es oom, unhealthy, o un die con código distinto de 0 y 143.
export function debeDiagnosticar(ev) {
  const attrs = ev.Actor?.Attributes ?? {};
  const estadoEv = String(ev.status ?? ev.Action ?? "");
  if (estadoEv === "oom" || estadoEv.startsWith("health_status: unhealthy")) return true;
  if (estadoEv === "die") {
    const code = Number(attrs.exitCode);
    return Number.isInteger(code) && code !== 0 && code !== 143;
  }
  return false;
}

export function diagnosticar(dir, ev, directorioDiagnosticos) {
  const id = ev.Actor?.ID ?? ev.id;
  if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) return;
  const attrs = ev.Actor?.Attributes ?? {};
  const logs = spawnSync("docker", ["logs", "--tail", "80", id], { encoding: "utf8" });
  const insp = spawnSync("docker", ["inspect", id], { encoding: "utf8" });
  const cuerpo = [
    `# ${ev.status ?? ev.Action} ${new Date(Number(ev.time) * 1000).toISOString()} ${attrs.name ?? ""}`,
    "## docker logs --tail 80",
    (logs.stdout ?? "") + (logs.stderr ?? ""),
    "## docker inspect",
    (insp.stdout ?? "") + (insp.stderr ?? ""),
  ];
  writeFileSync(join(dir, directorioDiagnosticos, `${id}.txt`), cuerpo.join("\n") + "\n");
}
