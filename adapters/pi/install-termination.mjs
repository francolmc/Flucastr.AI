import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARCA = "# flucastr-ai:termination-extension";

export function incluirExtension(archivo, extension) {
  const contenido = readFileSync(archivo, "utf8");
  const coincidencia = contenido.match(/^(---\r?\n)([\s\S]*?)(^---\s*\r?\n)/m);
  if (!coincidencia) throw new Error("el agente Pi no tiene frontmatter válido");
  if (coincidencia[2].includes(MARCA)) return contenido;
  if (/^extensions:/m.test(coincidencia[2])) throw new Error("el agente Pi ya declara extensions; no se pueden fusionar automáticamente");
  const lista = `extensions:\n  - '${extension.replaceAll("'", "''")}'\n${MARCA}\n`;
  let cabecera = coincidencia[2];
  cabecera += `${cabecera.endsWith("\n") || !cabecera ? "" : "\n"}${lista}`;
  const salida = `${coincidencia[1]}${cabecera}${coincidencia[3]}${contenido.slice(coincidencia[0].length)}`;
  writeFileSync(archivo, salida);
  return salida;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [, , archivo, extension] = process.argv;
  if (!archivo || !extension || !resolve(extension)) throw new Error("uso: install-termination.mjs <agente-pi.md> <ruta-extensión>");
  incluirExtension(archivo, resolve(extension));
}
