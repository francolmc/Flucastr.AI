import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registrarTermino, validarRetorno } from "../../tools/run/termination.mjs";

const MARCADOR = /^(?:Task: )?FLUCASTR-LAUNCH: plan=([^;\r\n]+); segment=(\d+); desde=(\d+)$/m;

export function extraerTexto(mensaje) {
  const contenido = mensaje?.content;
  if (typeof contenido === "string") return contenido;
  if (!Array.isArray(contenido)) return "";
  return contenido.map((bloque) => bloque?.type === "text" ? bloque.text : "").join("\n");
}

export function leerMarcador(entradas) {
  for (const entrada of entradas ?? []) {
    if (entrada?.type !== "message" || entrada.message?.role !== "user") continue;
    const coincidencia = extraerTexto(entrada.message).match(MARCADOR);
    if (coincidencia) return { plan: coincidencia[1], tramo: Number(coincidencia[2]), desde: Number(coincidencia[3]) };
  }
  return null;
}

function resolverPlan(cwd, plan) {
  const absoluto = resolve(cwd, plan);
  const relativo = relative(resolve(cwd), absoluto);
  if (!relativo || relativo === ".." || relativo.startsWith(`..${sep}`)) return null;
  const normalizado = relativo.split(sep).join("/");
  return existsSync(absoluto) ? { absoluto, relativo: normalizado } : null;
}

export function registrarCierre({ cwd, entradas, aborted, fecha }) {
  const marca = leerMarcador(entradas);
  if (!marca) return { ok: false, motivo: "sin marcador" };
  const plan = resolverPlan(cwd, marca.plan);
  if (!plan || !Number.isSafeInteger(marca.desde)) return { ok: false, motivo: "marcador no válido" };
  const intento = { plan: plan.relativo, tramo: marca.tramo };
  const destino = resolve(dirname(plan.absoluto), "runs.jsonl");
  if (aborted) return registrarTermino(destino, intento, "INTERRUMPIDO", { detalle: "Pi observó la interrupción del builder" }, fecha);

  const final = [...(entradas ?? [])].reverse().find((entrada) => entrada?.type === "message" && entrada.message?.role === "assistant");
  const retorno = extraerTexto(final?.message);
  const validado = validarRetorno(retorno);
  if (!validado.ok || validado.plan !== plan.relativo || validado.tramo !== marca.tramo) {
    return registrarTermino(destino, intento, "INVALIDO", { detalle: validado.ok ? "el retorno no coincide con el marcador de lanzamiento" : validado.error, retorno }, fecha);
  }
  const detalles = validado.resultado === "PAUSED"
    ? { motivo: validado.motivo, hecho: validado.hecho, siguiente: validado.siguiente, no_intentado: validado.no_intentado, retorno }
    : { retorno };
  return registrarTermino(destino, intento, validado.resultado, detalles, fecha);
}

export default function (pi) {
  const mensajes = [];
  let registroHijos;
  pi.on("session_start", async (_event, ctx) => {
    const sessionId = ctx.sessionManager.getSessionId();
    if (!sessionId) return;
    const agentDir = process.env.PI_MANAGED_INSTALL_ROOT
      ? dirname(process.env.PI_MANAGED_INSTALL_ROOT)
      : process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi/agent");
    const api = pathToFileURL(join(agentDir, "npm/node_modules/pi-subagents/bundle/required-child-extensions.js")).href;
    try {
      const { registerRequiredChildExtensions } = await import(api);
      registroHijos?.dispose();
      registroHijos = registerRequiredChildExtensions({
        sessionId,
        extensions: [{ id: "flucastr-termination", path: fileURLToPath(import.meta.url) }],
        requireForAllRunners: true,
      });
    } catch (error) {
      console.error(`pi-termination: no se pudo exigir el observador a los hijos de Pi: ${error.message}`);
    }
  });
  pi.on("session_shutdown", () => {
    registroHijos?.dispose();
    registroHijos = undefined;
  });
  pi.on("message_end", (event) => {
    mensajes.push(event.message);
  });
  pi.on("agent_settled", (event, ctx) => {
    try {
      const rama = ctx.sessionManager.getBranch();
      const resultado = registrarCierre({
        cwd: ctx.cwd,
        entradas: rama.length ? rama : mensajes.map((message) => ({ type: "message", message })),
        aborted: event.aborted,
      });
    } catch (error) {
      console.error(`pi-termination: no se pudo registrar el cierre: ${error.message}`);
    } finally {
      mensajes.length = 0;
    }
  });
}
