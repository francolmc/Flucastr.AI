#!/usr/bin/env node
// Cierre mecánico de un plan antes de la revisión: casillas, evidencia, A# y status. Solo lectura; no usa modelo.
// Uso: node scripts/kit-close.mjs <plan> [--resultado DONE|PAUSED] [--json] [--help]
//   --resultado   resultado que devolvió el builder (DONE o PAUSED); sin él, la coherencia del status es no verificable
//   --json        salida JSON (mismo contenido que la tabla)
//   --help        imprime este uso y sale con 0
// Tabla en stdout: nivel | elemento | detalle. Códigos de salida:
//   0  sin errores ni «no verificable» (los avisos no cuentan)
//   1  hay errores (casillas pendientes, paso sin evidencia, A# sin corrida, status incoherente)
//   3  no verificable: sin casillas, sin Evidence parseable o sin --resultado
//   2  uso o plan inexistente (no ejecuta nada)

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { revisarCierre } from "../tools/check/cierre.mjs";
import { tabla } from "../tools/check/informe.mjs";

const USO = "Uso: node scripts/kit-close.mjs <plan> [--resultado DONE|PAUSED] [--json] [--help]\n";
const RESULTADOS = ["DONE", "PAUSED"];

function uso(msg) {
  process.stderr.write(`kit-close: ${msg}\n${USO}`);
  process.exit(2);
}

function leerArgs(argv) {
  const opts = { plan: null, resultado: undefined, json: false, ayuda: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.ayuda = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--resultado") {
      const valor = argv[i + 1];
      if (valor === undefined || valor.startsWith("--")) uso("--resultado necesita un valor (DONE o PAUSED)");
      if (!RESULTADOS.includes(valor)) uso(`--resultado no válido: ${valor} (DONE o PAUSED)`);
      opts.resultado = valor;
      i++;
    } else if (a.startsWith("--")) uso(`opción desconocida: ${a}`);
    else {
      if (opts.plan !== null) uso(`un solo plan; sobra «${a}»`);
      opts.plan = a;
    }
  }
  return opts;
}

// Tramos tramo-N.md junto al plan; la revisión toma solo los N ≤ segment:.
function tramosDe(dir) {
  return readdirSync(dir)
    .map(f => f.match(/^tramo-(\d+)\.md$/))
    .filter(Boolean)
    .map(m => ({ n: Number(m[1]), texto: readFileSync(resolve(dir, m[0]), "utf8") }));
}

export function analizar({ planAbs, resultado }) {
  const texto = readFileSync(planAbs, "utf8");
  return revisarCierre(texto, tramosDe(dirname(planAbs)), { resultado });
}

function principal(argv) {
  const opts = leerArgs(argv);
  if (opts.ayuda) {
    process.stdout.write(USO);
    return 0;
  }
  if (opts.plan === null) uso("falta el plan");
  const planAbs = resolve(process.cwd(), opts.plan);
  if (!existsSync(planAbs) || !statSync(planAbs).isFile()) uso(`no existe el plan: ${opts.plan}`);

  const informe = analizar({ planAbs, resultado: opts.resultado });
  if (opts.json) process.stdout.write(JSON.stringify(informe, null, 2) + "\n");
  else process.stdout.write(tabla(informe) + "\n");
  return informe.codigo;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = principal(process.argv.slice(2));
}
