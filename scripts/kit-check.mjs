#!/usr/bin/env node
// Informe de criterios A# de un plan: ejecuta cada comprobación automatizable bajo la política del hook y muestra una tabla.
// Solo lee el plan y ejecuta comprobaciones; no escribe en el plan ni en el proyecto. No usa modelo.
// Uso: node scripts/kit-check.mjs <plan> [--segment N] [--timeout <seg>] [--revisado A3,A5] [--help]
//   --segment N      solo los criterios del segmento N (plan con historias por segmento)
//   --timeout <seg>  tiempo máximo por comprobación en segundos (por defecto 120)
//   --revisado IDS   marca esos A# no automatizables como «no-automatizable (revisado)»; no cuentan.
//                    Nunca excusan bloqueado ni falla.
//   --help           imprime este uso y sale con 0
// Tabla en stdout: A# | estado | comando ejecutado | motivo/cola
// Estados: pasa | falla | bloqueado | no-automatizable (y no-automatizable (revisado)).
// Códigos de salida:
//   0  todo pasa (o no-automatizable revisado)
//   1  algún criterio falla (aunque haya bloqueados)
//   3  sin fallas, pero hay bloqueado o no-automatizable sin revisar
//   2  uso o plan mal formado (no ejecuta nada)

import { existsSync } from "node:fs";
import { ejecutarFila } from "../tools/check/ejecutar.mjs";
import { parsearPlan } from "../tools/check/parse.mjs";

const USO = "Uso: node scripts/kit-check.mjs <plan> [--segment N] [--timeout <seg>] [--revisado A3,A5] [--help]\n";
const TIMEOUT_POR_OMISION_SEG = 120;

function uso(msg) {
  process.stderr.write(`kit-check: ${msg}\n${USO}`);
  process.exit(2);
}

function leerArgs(argv) {
  const opts = { plan: null, segmento: undefined, timeoutMs: TIMEOUT_POR_OMISION_SEG * 1000, revisado: new Set(), ayuda: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const valor = () => {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith("--")) uso(`${a} necesita un valor`);
      return argv[++i];
    };
    if (a === "--help" || a === "-h") opts.ayuda = true;
    else if (a === "--segment") {
      const n = Number(valor());
      if (!Number.isInteger(n) || n <= 0) uso("--segment debe ser un entero mayor que 0");
      opts.segmento = n;
    } else if (a === "--timeout") {
      const seg = Number(valor());
      if (!Number.isFinite(seg) || seg <= 0) uso("--timeout debe ser un número de segundos mayor que 0");
      opts.timeoutMs = seg * 1000;
    } else if (a === "--revisado") {
      for (const id of valor().split(",").map(s => s.trim()).filter(Boolean)) {
        if (!/^A\d+$/.test(id)) uso(`--revisado: identificador no válido «${id}»`);
        opts.revisado.add(id);
      }
    } else if (a.startsWith("--")) {
      uso(`opción desconocida: ${a}`);
    } else {
      if (opts.plan !== null) uso(`un solo plan; sobra «${a}»`);
      opts.plan = a;
    }
  }
  return opts;
}

// Última línea no vacía de la salida, para la columna motivo/cola.
function colaCorta(salida) {
  const lineas = salida.split("\n").filter(l => l.trim() !== "");
  return lineas.length ? lineas[lineas.length - 1].slice(0, 200) : "";
}

function main() {
  const opts = leerArgs(process.argv.slice(2));
  if (opts.ayuda) {
    process.stdout.write(USO);
    process.exitCode = 0;
    return;
  }
  if (!opts.plan) uso("falta el plan");
  if (!existsSync(opts.plan)) uso(`plan no encontrado: ${opts.plan}`);

  const { filas, error } = parsearPlan(opts.plan, { segmento: opts.segmento });
  if (error) {
    process.stderr.write(`kit-check: ${error}\n`);
    process.exit(2);
  }

  const resultados = filas.map(fila => {
    const r = ejecutarFila(fila, { timeoutMs: opts.timeoutMs });
    // --revisado solo marca lo no automatizable; bloqueado y falla nunca se excusan.
    const estado = r.estado === "no-automatizable" && opts.revisado.has(fila.id)
      ? "no-automatizable (revisado)"
      : r.estado;
    const detalle = [r.motivo, r.estado === "falla" ? colaCorta(r.salida) : ""].filter(Boolean).join("; ");
    return { id: fila.id, estado, comando: r.comando ?? "(sin comando)", detalle: detalle || "-" };
  });

  process.stdout.write("A# | estado | comando ejecutado | motivo/cola\n");
  for (const r of resultados) {
    process.stdout.write(`${r.id} | ${r.estado} | ${r.comando} | ${r.detalle}\n`);
  }

  const cuenta = estado => resultados.filter(r => r.estado === estado).length;
  const fallas = cuenta("falla");
  const pendientes = cuenta("bloqueado") + cuenta("no-automatizable");
  process.stdout.write(`kit-check: pasa=${cuenta("pasa")} falla=${fallas} bloqueado=${cuenta("bloqueado")} no-automatizable=${cuenta("no-automatizable")} revisado=${cuenta("no-automatizable (revisado)")}\n`);
  process.exitCode = fallas > 0 ? 1 : pendientes > 0 ? 3 : 0;
}

main();
