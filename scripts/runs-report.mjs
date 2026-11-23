#!/usr/bin/env node
// Informe de corridas de kit run: mediana y p90 por fase, tasa y motivos de relanzamiento, y devoluciones manuales «Devuelto:».
// Uso: node scripts/runs-report.mjs [--raiz <dir>]   (por defecto, el repo actual)
// Salida: 0 sin errores o sin registros; 1 si alguna línea de runs.jsonl está corrupta (estadísticas de las válidas en stdout, detalle en stderr); 2 si falta changes/ o la opción no es válida.

import { readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { formatear, leerDevueltos, leerRegistro, recorrer, CATEGORIAS } from "../tools/run/informe.mjs";

const raizPorDefecto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let raiz = raizPorDefecto;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--raiz" && argv[i + 1]) raiz = resolve(argv[++i]);
  else {
    console.error(`opción desconocida o sin valor: ${argv[i]}`);
    process.exit(2);
  }
}

const esDirectorio = (ruta) => {
  try {
    return statSync(ruta).isDirectory();
  } catch {
    return false;
  }
};

const changes = join(raiz, "changes");
if (!esDirectorio(changes)) {
  console.error(`no existe ${changes}`);
  process.exit(2);
}

const rel = (ruta) => relative(raiz, ruta).split(sep).join("/");

const rutasRegistro = recorrer(changes, (n) => n === "runs.jsonl");
const registros = [];
const errores = [];
for (const ruta of rutasRegistro) {
  const lectura = leerRegistro(readFileSync(ruta, "utf8"));
  registros.push(...lectura.validos);
  for (const e of lectura.errores) errores.push(`${rel(ruta)}:${e.linea}: ${e.causa}`);
}

const devueltos = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
for (const ruta of recorrer(changes, (n) => n === "plan.md")) {
  const { conteos, avisos } = leerDevueltos(readFileSync(ruta, "utf8"));
  for (const c of CATEGORIAS) devueltos[c] += conteos[c];
  for (const a of avisos) console.error(`aviso: ${rel(ruta)}:${a.linea}: ${a.causa}`);
}

process.stdout.write(`${formatear({ archivos: rutasRegistro.length, registros, devueltos })}\n`);

for (const e of errores) console.error(`corrupta: ${e}`);
if (errores.length) {
  console.error(`${errores.length} línea(s) corrupta(s) no contadas; ver arriba`);
  process.exit(1);
}
