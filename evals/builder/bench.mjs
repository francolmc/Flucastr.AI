#!/usr/bin/env node
// Punto de entrada del banco del builder: `node evals/builder/bench.mjs <orden> [opciones]`.
// Carga `lib/<orden>.mjs` y llama a su `main(argv)`. Orden desconocida o mal escrita: código 2.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "lib");
const orden = process.argv[2] ?? "";

if (!/^[a-z][a-z-]*$/.test(orden) || !existsSync(join(LIB, `${orden}.mjs`))) {
  process.stderr.write(`bench: orden desconocida: ${orden || "(vacía)"}\n`);
  process.exit(2);
}

const modulo = await import(pathToFileURL(join(LIB, `${orden}.mjs`)).href);
if (typeof modulo.main !== "function") {
  process.stderr.write(`bench: lib/${orden}.mjs no exporta main\n`);
  process.exit(2);
}
process.exitCode = (await modulo.main(process.argv.slice(3))) ?? 0;
