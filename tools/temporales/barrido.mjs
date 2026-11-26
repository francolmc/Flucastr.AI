// Barrido de temporales huérfanos del kit (caso A1 de changes/higiene-verify/tramo-1.md).
// Borra en la base dada los directorios propios `flucastr-verify.*` cuya mtime supera `minutos`.
// Nunca lanza: si algo falla, sigue con la siguiente entrada. Deja intactos archivos, enlaces
// simbólicos (y su destino), cualquier nombre que no empiece por el prefijo y lo que sea de otro
// dueño (uid distinto del de quien ejecuta; `uid` se puede inyectar; sin getuid, no filtra).
//
// Uso: node tools/temporales/barrido.mjs <base>

import { lstatSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PREFIJO = "flucastr-verify.";
const MINUTOS_POR_DEFECTO = 120;

export function barrer(base, { minutos = MINUTOS_POR_DEFECTO, uid = process.getuid?.() } = {}) {
  const borrados = [];
  let nombres;
  try {
    nombres = readdirSync(base);
  } catch {
    return borrados;
  }
  const limite = minutos * 60 * 1000;
  for (const nombre of nombres) {
    if (!nombre.startsWith(PREFIJO)) continue;
    const ruta = join(base, nombre);
    try {
      const st = lstatSync(ruta);
      if (!st.isDirectory() || st.isSymbolicLink()) continue;
      if (uid !== undefined && st.uid !== uid) continue;
      if (Date.now() - st.mtimeMs <= limite) continue;
      rmSync(ruta, { recursive: true, force: true });
      borrados.push(nombre);
    } catch {
      // Una entrada que no se puede borrar no detiene el barrido.
    }
  }
  return borrados;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const base = process.argv[2];
  if (!base) {
    console.error("uso: node tools/temporales/barrido.mjs <base>");
    process.exit(2);
  }
  barrer(base);
  process.exit(0);
}
