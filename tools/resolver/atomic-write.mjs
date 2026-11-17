import { renameSync, writeFileSync } from "node:fs";

export function escribirAtomico(ruta, objeto) {
  const tmp = `${ruta}.flucastr-${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(objeto, null, 2) + "\n");
  renameSync(tmp, ruta);
}
