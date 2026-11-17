import { createReadStream, readdirSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";

export function esDirectorio(ruta) {
  try { return statSync(ruta).isDirectory(); } catch { return false; }
}

export function reciente(ruta, inicioMs) {
  try { return statSync(ruta).mtimeMs >= inicioMs; } catch { return false; }
}

export function listarJsonl(dir, acepta, salida = []) {
  let entradas;
  try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { return salida; }
  entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) listarJsonl(ruta, acepta, salida);
    else if (e.isFile() && e.name.endsWith(".jsonl") && acepta(e.name)) salida.push(ruta);
  }
  return salida;
}

export async function leerJsonl(ruta, alObjeto) {
  const rl = createInterface({ input: createReadStream(ruta, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const linea of rl) {
    if (!linea.trim()) continue;
    let obj;
    try { obj = JSON.parse(linea); } catch { continue; }
    if (obj && typeof obj === "object") alObjeto(obj);
  }
}
