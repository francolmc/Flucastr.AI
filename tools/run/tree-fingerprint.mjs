import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSyncSeguro } from "../spawn/sync-seguro.mjs";

// Huella del árbol de trabajo: estado de git, diff contra HEAD y contenido de cada archivo listado.
// null si no hay git. Sirve para detectar que el revisor escribió algo.
function fingerprintTree(raiz) {
  const top = spawnSyncSeguro("git", ["rev-parse", "--show-toplevel"], { cwd: raiz, encoding: "utf8" });
  if (top.status !== 0) return null;
  const base = top.stdout.trim();
  // changes/ queda fuera: editar planes o escribir progress.jsonl no cuenta como cambio del builder (core/contracts/verification.md).
  const fuera = [".", ":(exclude,top)changes/**"];
  const st = spawnSyncSeguro("git", ["status", "--porcelain=v1", "-uall", "--", ...fuera], { cwd: raiz, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const df = spawnSyncSeguro("git", ["diff", "HEAD", "--", ...fuera], { cwd: raiz, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const h = createHash("sha256");
  h.update(st.stdout ?? "");
  h.update(df.stdout ?? "");
  for (const linea of (st.stdout ?? "").split("\n")) {
    const ruta = linea.slice(3).split(" -> ").pop();
    if (!ruta) continue;
    const p = join(base, ruta);
    if (existsSync(p)) h.update(readFileSync(p));
  }
  return h.digest("hex");
}

export { fingerprintTree };
