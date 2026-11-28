#!/usr/bin/env node
// Espera un término de kit run sin controlar ni interrumpir el proceso que lo produce.

import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { leerEventos } from "../tools/progress/eventos.mjs";
import { configuracion, evaluarPegado } from "../tools/run/pegado.mjs";
import { frontmatter } from "../tools/run/plan.mjs";

export const INTERVALO_MS = 5000;
export const LIMITE_POR_DEFECTO_MS = 570_000;
const RESULTADOS = new Set(["DONE", "PAUSED", "INVALIDO", "INTERRUMPIDO"]);
const ISO_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;

function uso(mensaje) {
  process.stderr.write(`kit-await: ${mensaje}\nUso: node scripts/kit-await.mjs <plan.md> [--desde <epoch-ms>] [--tramo <n>] [--hasta <segundos>] [--raiz <dir>]\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  const op = { plan: null, desde: null, tramo: undefined, limite: LIMITE_POR_DEFECTO_MS, raiz: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--desde") op.desde = argv[++i];
    else if (a === "--tramo") op.tramo = argv[++i];
    else if (a === "--limite" || a === "--hasta") op.limite = Number(argv[++i]) * 1000;
    else if (a === "--raiz") op.raiz = argv[++i];
    else if (a.startsWith("--")) uso(`opción desconocida ${a}`);
    else if (op.plan === null) op.plan = a;
    else uso(`solo un plan: ${a}`);
  }
  if (!op.plan) uso("falta el plan");
  if (op.desde === null) op.desde = Date.now();
  if (!/^\d+$/.test(String(op.desde))) uso("--desde debe ser milisegundos epoch no negativos");
  op.desde = Number(op.desde);
  if (!Number.isSafeInteger(op.desde)) uso("--desde fuera de rango");
  if (op.tramo !== undefined && !/^\d+$/.test(op.tramo)) uso("--tramo debe ser un entero no negativo");
  if (op.tramo !== undefined) op.tramo = Number(op.tramo);
  if (!Number.isFinite(op.limite) || op.limite <= 0) uso("--limite debe ser segundos mayores que 0");
  op.raiz = resolve(op.raiz);
  return op;
}

function rutaPlan(raiz, plan) {
  const absoluta = resolve(raiz, plan);
  const relativa = relative(raiz, absoluta);
  if (!relativa || relativa === ".." || relativa.startsWith(`..${sep}`) || isAbsolute(relativa)) {
    throw new Error("el plan debe estar dentro de --raiz");
  }
  return { absoluta, relativa: relativa.split(sep).join("/") };
}

function leerRuns(ruta) {
  try {
    return readFileSync(ruta, "utf8").split(/\r?\n/).flatMap((linea) => {
      if (!linea.trim()) return [];
      try {
        const registro = JSON.parse(linea);
        return registro && typeof registro === "object" && !Array.isArray(registro) ? [registro] : [];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function esTerminal(registro, plan, tramo, desde) {
  const t = registro?.terminacion;
  if (registro?.plan !== plan || registro?.tramo !== tramo || !t || !RESULTADOS.has(t.resultado)) return false;
  if (typeof t.fecha !== "string" || !ISO_UTC.test(t.fecha)) return false;
  const fecha = Date.parse(t.fecha);
  return Number.isFinite(fecha) && fecha > desde;
}

function unaLinea(valor) {
  return String(valor ?? "").replace(/[\r\n]+/g, " ").trim();
}

export function textoTerminal(registro, plan, tramo) {
  const t = registro.terminacion;
  const pieza = tramo === null ? "" : `segment=${tramo}; `;
  if (t.resultado === "DONE") return `DONE: plan=${plan}; ${pieza}verify=pasa`;
  if (t.resultado === "PAUSED") {
    return `PAUSED: plan=${plan}; ${pieza}motivo=${unaLinea(t.motivo)}; hecho=${unaLinea(t.hecho)}; siguiente=${unaLinea(t.siguiente)}; no_intentado=${unaLinea(t.no_intentado)}`;
  }
  const detalle = unaLinea(t.detalle ?? t.retorno ?? "sin detalle");
  return `${t.resultado}: plan=${plan}; ${pieza}detalle=${detalle}`;
}

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export async function esperar(op) {
  const { absoluta, relativa } = rutaPlan(op.raiz, op.plan);
  if (!existsSync(absoluta)) uso(`no existe el plan ${op.plan}`);
  const meta = frontmatter(readFileSync(absoluta, "utf8"));
  const tramo = op.tramo === undefined ? (meta.segment == null ? null : Number(meta.segment)) : op.tramo;
  const runs = resolve(op.raiz, dirname(relativa), "runs.jsonl");
  const progreso = resolve(op.raiz, dirname(relativa), "progress.jsonl");
  const config = configuracion(process.env);
  const inicio = Date.now();

  for (;;) {
    const coinciden = leerRuns(runs).filter((r) => esTerminal(r, relativa, tramo, op.desde));
    if (coinciden.length > 1) {
      console.log(`INVALIDO: plan=${relativa}; ${tramo === null ? "" : `segment=${tramo}; `}detalle=más de un término coincide con --desde`);
      return 1;
    }
    if (coinciden.length === 1) {
      const registro = coinciden[0];
      console.log(textoTerminal(registro, relativa, tramo));
      if (registro.terminacion.resultado === "DONE") return 0;
      if (registro.terminacion.resultado === "INTERRUMPIDO") return 1;
      if (registro.terminacion.resultado === "INVALIDO") return 1;
      return 1;
    }

    const pegado = evaluarPegado(leerEventos(progreso).eventos, {
      ahora: Date.now(), inicioMs: op.desde, config, declarados: config.largos,
    });
    if (config.modo !== "apagado" && pegado.estado === "pegado") {
      console.log(`PEGADO: plan=${relativa}; ${tramo === null ? "" : `segment=${tramo}; `}patron=${pegado.patron}; detalle=${unaLinea(pegado.detalle)}`);
      return 4;
    }
    if (Date.now() - inicio >= op.limite) {
      console.log(`EN_CURSO: plan=${relativa}; ${tramo === null ? "" : `segment=${tramo}; `}sin término tras ${Math.ceil(op.limite / 1000)} s`);
      return 3;
    }
    await dormir(Math.min(INTERVALO_MS, op.limite - (Date.now() - inicio)));
  }
}

async function main(argv) {
  try {
    return await esperar(parseArgs(argv));
  } catch (error) {
    uso(error.message);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2));
}
