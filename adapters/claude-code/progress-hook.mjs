#!/usr/bin/env node
// Hook de progreso de Claude Code (PreToolUse y PostToolUse). Anexa eventos a
// changes/<plan>/progress.jsonl. Nunca bloquea: sale 0, sin salida por stdout ni
// decisión de permiso. No lee contenido de archivos ni de .env.

import { readFileSync, readdirSync, readSync } from "node:fs";
import { basename, isAbsolute, join, relative } from "node:path";
import { anexar, evento, leerEventos } from "../../tools/progress/eventos.mjs";
import { frontmatter } from "../../tools/run/plan.mjs";

const MAX_ENTRADA = 1_000_000;
// Un plan activo está en `approved` (esperando al builder) o `in progress` (el builder ya lo tomó).
const ACTIVOS = new Set(["approved", "in progress"]);
const ARCHIVO = new Set(["Edit", "Write", "MultiEdit"]);
const AGENTE = "builder";
const SECRETO_RUTA = /(^|[\\/])\.env(\.|$)|\.(pem|key|p12|pfx)$|id_(rsa|ed25519|ecdsa)/i;

// Lee stdin con tope de tamaño. Si supera el tope, lanza y el hook no registra nada.
function leerEntrada() {
  const trozos = [];
  const buf = Buffer.alloc(65536);
  let total = 0;
  for (;;) {
    let n;
    try {
      n = readSync(0, buf, 0, buf.length, null);
    } catch (e) {
      if (e.code === "EOF" || e.code === "EAGAIN") break;
      throw e;
    }
    if (n === 0) break;
    total += n;
    if (total > MAX_ENTRADA) throw new Error("entrada demasiado grande");
    trozos.push(Buffer.from(buf.subarray(0, n)));
  }
  return Buffer.concat(trozos).toString("utf8");
}

// Único plan activo bajo <cwd>/changes/*/plan.md. Con 0 o más de 1 no se escribe nada.
function planActivo(cwd) {
  const raiz = join(cwd, "changes");
  let nombres;
  try {
    nombres = readdirSync(raiz);
  } catch {
    return null;
  }
  const hallados = [];
  for (const nombre of nombres) {
    let texto;
    try {
      texto = readFileSync(join(raiz, nombre, "plan.md"), "utf8");
    } catch {
      continue;
    }
    const meta = frontmatter(texto);
    if (ACTIVOS.has(meta.status)) hallados.push({ dir: join(raiz, nombre), segment: meta.segment });
  }
  return hallados.length === 1 ? hallados[0] : null;
}

// Solo la ruta relativa al proyecto; un .env o una clave registra solo su nombre.
function rutaSegura(ruta, cwd) {
  const s = String(ruta);
  if (SECRETO_RUTA.test(s)) return basename(s);
  if (isAbsolute(s)) {
    const r = relative(cwd, s);
    return r && !r.startsWith("..") ? r : basename(s);
  }
  return s;
}

function codigoSalida(respuesta) {
  if (respuesta && typeof respuesta === "object") {
    for (const k of ["exit_code", "exitCode", "returncode"]) {
      if (typeof respuesta[k] === "number") return respuesta[k];
    }
  }
  return null;
}

function yaRegistrado(ruta, tipo, id) {
  if (id == null) return false;
  return leerEventos(ruta).eventos.some((e) => e.tipo === tipo && e.id === String(id));
}

function principal(entrada) {
  const herramienta = entrada.tool_name;
  if (!ARCHIVO.has(herramienta) && herramienta !== "Bash") return;
  // Si el payload identifica al agente, solo se registra el builder.
  if (typeof entrada.agent_type === "string" && entrada.agent_type !== AGENTE) return;
  const cwd = typeof entrada.cwd === "string" && entrada.cwd ? entrada.cwd : process.cwd();
  const plan = planActivo(cwd);
  if (!plan) return;
  const ruta = join(plan.dir, "progress.jsonl");
  const seg = /^\d+$/.test(plan.segment ?? "") ? Number(plan.segment) : null;
  const id = entrada.tool_use_id ?? null;
  const input = entrada.tool_input ?? {};
  const inicio = entrada.hook_event_name === "PreToolUse";

  if (ARCHIVO.has(herramienta)) {
    if (!inicio || typeof input.file_path !== "string") return;
    if (yaRegistrado(ruta, "archivo_editado", id)) return;
    anexar(ruta, evento("archivo_editado", { seg, id, archivo: rutaSegura(input.file_path, cwd), o: "hook" }));
    return;
  }

  // Bash: inicio y fin se enlazan por tool_use_id.
  if (typeof input.command !== "string") return;
  if (inicio) {
    if (yaRegistrado(ruta, "comando_iniciado", id)) return;
    anexar(ruta, evento("comando_iniciado", { seg, id, cmd: input.command, o: "hook" }));
    return;
  }
  if (yaRegistrado(ruta, "comando_terminado", id)) return;
  let ms = null;
  if (id != null) {
    const previo = leerEventos(ruta).eventos.find((e) => e.tipo === "comando_iniciado" && e.id === String(id));
    if (previo) ms = Date.now() - Date.parse(previo.t);
  }
  anexar(ruta, evento("comando_terminado", { seg, id, exit: codigoSalida(entrada.tool_response), ms, o: "hook" }));
}

try {
  const entrada = JSON.parse(leerEntrada());
  if (entrada && typeof entrada === "object") principal(entrada);
} catch {
  // Un fallo solo deja de registrar; nunca bloquea ni decide por Claude.
}
process.exitCode = 0;
