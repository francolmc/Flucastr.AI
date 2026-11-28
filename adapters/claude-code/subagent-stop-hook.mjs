#!/usr/bin/env node
// Registra el retorno final del builder Claude mediante SubagentStop.

import { existsSync, readFileSync, readdirSync, readSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { registrarTermino, validarRetorno } from "../../tools/run/termination.mjs";
import { frontmatter } from "../../tools/run/plan.mjs";

export const MAX_ENTRADA = 1_000_000;
const ACTIVOS = new Set(["approved", "in progress", "partial"]);

function leerEntrada(max = MAX_ENTRADA) {
  const trozos = [];
  const buf = Buffer.alloc(65536);
  let total = 0;
  for (;;) {
    let n;
    try { n = readSync(0, buf, 0, buf.length, null); }
    catch (error) { if (["EOF", "EAGAIN"].includes(error.code)) break; throw error; }
    if (n === 0) break;
    total += n;
    if (total > max) throw new Error("entrada supera el límite de 1000000 bytes");
    trozos.push(Buffer.from(buf.subarray(0, n)));
  }
  return Buffer.concat(trozos).toString("utf8");
}

function rutaPlan(cwd, declarada) {
  if (typeof declarada !== "string" || !declarada.trim()) return null;
  const absoluta = resolve(cwd, declarada);
  const rel = relative(resolve(cwd), absoluta);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  const normalizada = rel.split(sep).join("/");
  if (!normalizada.startsWith("changes/") || !normalizada.endsWith("/plan.md")) return null;
  return { absoluta, relativa: normalizada };
}

function leerPlan(cwd, declarada) {
  const rutas = rutaPlan(cwd, declarada);
  if (!rutas || !existsSync(rutas.absoluta)) return null;
  try {
    const texto = readFileSync(rutas.absoluta, "utf8");
    return { ...rutas, texto, meta: frontmatter(texto) };
  } catch { return null; }
}

function activoInequivoco(cwd) {
  const cambios = join(cwd, "changes");
  let nombres;
  try { nombres = readdirSync(cambios); } catch { return null; }
  const activos = [];
  for (const nombre of nombres) {
    const plan = leerPlan(cwd, join("changes", nombre, "plan.md"));
    if (plan && ACTIVOS.has(plan.meta.status)) activos.push(plan);
  }
  return activos.length === 1 ? activos[0] : null;
}

function textoDeEntrada(entrada) {
  if (typeof entrada?.last_assistant_message === "string") return entrada.last_assistant_message;
  // Compatibilidad con SubagentHandback: en ese evento el mensaje puede estar en tool_input.message.
  if (typeof entrada?.tool_input?.message === "string") return entrada.tool_input.message;
  return "";
}

function errorClave(mensaje) {
  process.stderr.write(`builder-return-invalid: ${mensaje}\n`);
}

export function procesarSubagentStop(entrada, { cwd = process.cwd(), ahora = new Date().toISOString() } = {}) {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return { status: 0, escrito: false };
  if (entrada.agent_type !== "builder") return { status: 0, escrito: false };
  const retorno = textoDeEntrada(entrada);
  const validado = validarRetorno(retorno);
  const planDeclarado = validado.ok ? validado.plan : null;
  const plan = planDeclarado ? leerPlan(cwd, planDeclarado) : activoInequivoco(cwd);
  if (!plan) {
    if (entrada.stop_hook_active === true) {
      errorClave("no se pudo identificar un plan activo inequívoco; sin registro");
      return { status: 0, escrito: false };
    }
    errorClave("no se pudo identificar un plan activo inequívoco");
    return { status: 2, escrito: false };
  }

  const tramoPlan = /^\d+$/.test(plan.meta.segment ?? "") ? Number(plan.meta.segment) : null;
  const tramoRetorno = validado.ok ? validado.tramo : null;
  if (validado.ok && (tramoRetorno !== tramoPlan || plan.relativa !== validado.plan)) {
    if (entrada.stop_hook_active !== true) {
      errorClave("el retorno no coincide con la ruta y el tramo del plan");
      return { status: 2, escrito: false };
    }
  }

  let resultado;
  let detalles = {};
  if (validado.ok && tramoRetorno === tramoPlan && plan.relativa === validado.plan) {
    resultado = validado.resultado;
    detalles = {
      motivo: validado.motivo, hecho: validado.hecho, siguiente: validado.siguiente,
      no_intentado: validado.no_intentado,
    };
  } else if (entrada.stop_hook_active === true) {
    resultado = "INVALIDO";
    detalles = { retorno: retorno.slice(0, 600), detalle: validado.error ?? "retorno no coincide con el plan activo" };
  } else {
    errorClave(validado.error ?? "retorno no coincide con el plan activo");
    return { status: 2, escrito: false };
  }

  const ruta = join(dirname(plan.absoluta), "runs.jsonl");
  const tramo = resultado === "INVALIDO" ? tramoPlan : validado.tramo;
  const base = {
    plan: plan.relativa, tramo, fecha: ahora, herramienta: "claude-code", builder_ms: null,
    verify_ms: null, revisor_ms: null, motivo_relanzamiento: null, resultado,
  };
  const escrito = registrarTermino(ruta, base, resultado, detalles, ahora);
  if (!escrito.ok) {
    errorClave(`no se pudo registrar el término de ${basename(plan.absoluta)}`);
    return { status: 2, escrito: false };
  }
  return { status: 0, escrito: true, registro: escrito.registro };
}

function main() {
  let entrada;
  try { entrada = JSON.parse(leerEntrada()); }
  catch (error) {
    errorClave(error.message);
    process.exitCode = 2;
    return;
  }
  const resultado = procesarSubagentStop(entrada);
  process.exitCode = resultado.status;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
