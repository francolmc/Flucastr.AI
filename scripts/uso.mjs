#!/usr/bin/env node
// Medidor de consumo de Claude Code, Codex y Pi: tokens por día, proyecto, modelo y rol.
// Solo lectura, sin dependencias. Día = fecha UTC del primer evento de cada sesión.
// «entrada» excluye lo leído de caché. De la carpeta de Codex solo se recorre sessions/
// (rollout-*.jsonl); ningún otro archivo de esa carpeta se abre.
//
// Uso:
//   node scripts/uso.mjs [--desde AAAA-MM-DD] [--herramienta claude|codex|pi] [--proyecto <subcadena>]
//                        [--json] [--claude-dir <dir>] [--codex-dir <dir>] [--pi-dir <dir>]
//                        [--sesiones] [--umbral <n>] [--tarifas <archivo>]
//
// Carpetas por defecto: ~/.claude/projects, ~/.codex (sessions/ dentro) y ~/.pi/agent/sessions.
// Tarifas por defecto: scripts/tarifas.json (créditos por millón de tokens). Sin tarifa del modelo, creditos es null.
// --desde por defecto: hace 7 días. Sin --json imprime tablas de texto.
// --sesiones: diagnóstico por sesión de Claude Code, Codex y Pi (llamadas, esperas, contexto mediana y máximo, compactaciones,
// créditos y sondeos). Sondeos: llamadas de shell con sleep, tail o watch. Claude Code no mide créditos ni sondeos (null).
// En Claude Code solo cuenta la sesión principal (un .jsonl por sesión); sus subagentes no suman en su fila.
// --umbral (por defecto 70): si la cuota semanal o la ventana de 5 horas de Codex de la última sesión llega a ese %, aparece un aviso.

import { createReadStream, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, sep } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const HERRAMIENTAS = ["claude", "codex", "pi"];
const NOMBRES = { claude: "Claude Code", codex: "Codex", pi: "Pi" };
const COLUMNAS = ["herramienta", "fecha", "proyecto", "modelo", "rol", "sesiones", "llamadas", "entrada", "cache_leida", "cache_escrita", "salida"];

function fallar(mensaje, codigo = 1) {
  console.error(`error: ${mensaje}`);
  process.exit(codigo);
}

function ayuda() {
  console.log(`Uso: node scripts/uso.mjs [opciones]
  --desde AAAA-MM-DD            primer día a contar (por defecto, hace 7 días)
  --herramienta claude|codex|pi solo esa herramienta
  --proyecto <subcadena>        filtra por proyecto (sin distinguir mayúsculas)
  --json                        salida JSON: {filas, cuota, avisos}
  --claude-dir <dir>            carpeta de proyectos de Claude Code (por defecto ~/.claude/projects)
  --codex-dir <dir>             carpeta de Codex (por defecto ~/.codex; se leen sus sessions/)
  --pi-dir <dir>                carpeta de sesiones de Pi (por defecto ~/.pi/agent/sessions)
  --sesiones                    diagnóstico por sesión de Claude Code, Codex y Pi: esperas, contexto y compactaciones (los subagentes de Claude Code no suman en su sesión)
  --umbral <n>                  aviso si la cuota semanal o la ventana de 5 horas de Codex llega a n % (por defecto 70)
  --tarifas <archivo>           tarifas en créditos por millón de tokens (por defecto scripts/tarifas.json)`);
}

function leerOpciones(argv) {
  const o = {
    desde: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    herramienta: null,
    proyecto: null,
    json: false,
    claudeDir: join(homedir(), ".claude", "projects"),
    codexDir: join(homedir(), ".codex"),
    piDir: join(homedir(), ".pi", "agent", "sessions"),
    sesiones: false,
    umbral: 70,
    tarifas: join(dirname(fileURLToPath(import.meta.url)), "tarifas.json"),
  };
  const valor = (i) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) fallar(`falta el valor de ${argv[i]}`, 2);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") o.json = true;
    else if (a === "-h" || a === "--help") { ayuda(); process.exit(0); }
    else if (a === "--desde") { o.desde = valor(i); i++; }
    else if (a === "--herramienta") { o.herramienta = valor(i); i++; }
    else if (a === "--proyecto") { o.proyecto = valor(i).toLowerCase(); i++; }
    else if (a === "--claude-dir") { o.claudeDir = valor(i); i++; }
    else if (a === "--codex-dir") { o.codexDir = valor(i); i++; }
    else if (a === "--pi-dir") { o.piDir = valor(i); i++; }
    else if (a === "--sesiones") o.sesiones = true;
    else if (a === "--umbral") { o.umbral = Number(valor(i)); i++; }
    else if (a === "--tarifas") { o.tarifas = valor(i); i++; }
    else fallar(`opción desconocida: ${a}`, 2);
  }
  if (!Number.isFinite(o.umbral) || o.umbral < 0 || o.umbral > 100) {
    fallar("--umbral debe ser un número entre 0 y 100", 2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.desde) || Number.isNaN(Date.parse(`${o.desde}T00:00:00Z`))) {
    fallar(`--desde debe ser AAAA-MM-DD (recibí ${o.desde})`, 2);
  }
  if (o.herramienta !== null && !HERRAMIENTAS.includes(o.herramienta)) {
    fallar("--herramienta debe ser claude, codex o pi", 2);
  }
  o.inicioMs = Date.parse(`${o.desde}T00:00:00Z`);
  return o;
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function fechaUTC(ts) {
  if (typeof ts !== "string") return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// "-home-franco-Codes-proyecto" (Claude) y "--home-franco-Codes-proyecto--" (Pi) -> "proyecto"
function proyectoDeDir(nombre) {
  const sin = nombre.replace(/^-+|-+$/g, "").replace(/^home-[^-]+-Codes-/, "");
  return sin || nombre;
}

function esDirectorio(ruta) {
  try { return statSync(ruta).isDirectory(); } catch { return false; }
}

function reciente(ruta, inicioMs) {
  try { return statSync(ruta).mtimeMs >= inicioMs; } catch { return false; }
}

function listarJsonl(dir, acepta, salida = []) {
  let entradas;
  try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { return salida; }
  entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) listarJsonl(ruta, acepta, salida);
    else if (e.isFile() && e.name.endsWith(".jsonl") && acepta(e.name)) salida.push(ruta);
  }
  return salida;
}

async function leerJsonl(ruta, alObjeto) {
  const rl = createInterface({ input: createReadStream(ruta, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const linea of rl) {
    if (!linea.trim()) continue;
    let obj;
    try { obj = JSON.parse(linea); } catch { continue; }
    if (obj && typeof obj === "object") alObjeto(obj);
  }
}

function coincide(ctx, proyecto) {
  return ctx.o.proyecto === null || proyecto.toLowerCase().includes(ctx.o.proyecto);
}

function agregar(ctx, d) {
  if (d.fecha < ctx.o.desde) return;
  const clave = [d.herramienta, d.fecha, d.proyecto, d.modelo, d.rol].join("\u0001");
  let g = ctx.filas.get(clave);
  if (!g) {
    g = {
      herramienta: d.herramienta, fecha: d.fecha, proyecto: d.proyecto, modelo: d.modelo, rol: d.rol,
      sesiones: new Set(), llamadas: 0, entrada: 0, cache_leida: 0, cache_escrita: 0, salida: 0,
    };
    ctx.filas.set(clave, g);
  }
  g.sesiones.add(d.sesion);
  g.llamadas += d.llamadas;
  g.entrada += d.entrada;
  g.cache_leida += d.cache_leida;
  g.cache_escrita += d.cache_escrita;
  g.salida += d.salida;
}

// Tarifas por modelo (créditos por millón de tokens). Si el archivo no se puede leer, avisa y no hay tarifas.
function cargarTarifas(ruta, avisos) {
  try {
    const modelos = JSON.parse(readFileSync(ruta, "utf8")).modelos;
    return modelos && typeof modelos === "object" ? modelos : {};
  } catch (e) {
    avisos.push(`no pude leer las tarifas ${ruta}: ${e.message}; los créditos quedan sin calcular`);
    return {};
  }
}

// Créditos de una sesión: (entrada + caché escrita) × entrada + caché leída × entrada en caché + salida × salida, por millón.
// Sin tarifa válida para el modelo devuelve null, nunca 0.
function creditosSesion(tarifas, modelo, t) {
  const tar = Object.hasOwn(tarifas, modelo) ? tarifas[modelo] : null;
  if (!t || !tar || !["entrada", "entrada_cache", "salida"].every((k) => typeof tar[k] === "number")) return null;
  const creditos = ((t.entrada + t.cache_escrita) * tar.entrada + t.cache_leida * tar.entrada_cache + t.salida * tar.salida) / 1e6;
  return Math.round(creditos * 10000) / 10000;
}

function sumarTokens(mensajes) {
  return mensajes.reduce((a, x) => ({
    entrada: a.entrada + x.entrada,
    cache_leida: a.cache_leida + x.cache_leida,
    cache_escrita: a.cache_escrita + x.cache_escrita,
    salida: a.salida + x.salida,
  }), { entrada: 0, cache_leida: 0, cache_escrita: 0, salida: 0 });
}

// Sondeos: llamadas de shell que duermen o miran un log (sleep, tail, watch). Cada llamada cuenta una vez.
const NOMBRES_SONDEO = new Set(["sleep", "tail", "watch"]);
const PATRON_SONDEO = /\b(sleep|tail|watch)\b/;

// Texto del comando de una llamada: campo cmd o command (texto o lista). args puede ser JSON en texto (Codex) u objeto (Pi).
function comandoDe(args) {
  let a = args;
  if (typeof a === "string") {
    try { a = JSON.parse(a); } catch { return null; }
  }
  if (!a || typeof a !== "object") return null;
  const c = a.cmd ?? a.command;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter((x) => typeof x === "string").join(" ");
  return null;
}

function esSondeo(nombre, args) {
  if (NOMBRES_SONDEO.has(nombre)) return true;
  const cmd = comandoDe(args);
  return cmd !== null && PATRON_SONDEO.test(cmd);
}

async function procesarClaude(ctx, raiz) {
  for (const ruta of listarJsonl(raiz, () => true)) {
    const partes = relative(raiz, ruta).split(sep);
    const proyecto = partes.length > 1 ? proyectoDeDir(partes[0]) : "desconocido";
    if (!coincide(ctx, proyecto) || !reciente(ruta, ctx.o.inicioMs)) continue;
    const rol = partes.some((p) => p.startsWith("subagent")) ? "sub" : "main";
    const mensajes = [];
    const esperas = new Set();
    let primerTs = null;
    try {
      await leerJsonl(ruta, (obj) => {
        if (primerTs === null && typeof obj.timestamp === "string") primerTs = obj.timestamp;
        const m = obj.message;
        if (!m || typeof m !== "object" || m.role !== "assistant") return;
        // Esperas: bloques tool_use de espera, contados una vez por id (un mensaje se repite en varias líneas).
        if (Array.isArray(m.content)) {
          m.content.forEach((b, i) => {
            if (b && b.type === "tool_use" && ESPERAS_CLAUDE.has(b.name)) esperas.add(typeof b.id === "string" ? b.id : `${m.id}|${i}`);
          });
        }
        if (!m.usage || typeof m.usage !== "object") return;
        mensajes.push({
          clave: typeof m.id === "string" ? `${m.id}|${obj.requestId ?? ""}` : null,
          modelo: typeof m.model === "string" ? m.model : "desconocido",
          entrada: num(m.usage.input_tokens),
          cache_leida: num(m.usage.cache_read_input_tokens),
          cache_escrita: num(m.usage.cache_creation_input_tokens),
          salida: num(m.usage.output_tokens),
          contexto: num(m.usage.input_tokens) + num(m.usage.cache_read_input_tokens) + num(m.usage.cache_creation_input_tokens),
        });
      });
    } catch (e) {
      ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
      continue;
    }
    const fecha = fechaUTC(primerTs);
    if (!fecha) continue;
    if (ctx.o.sesiones && rol === "main" && fecha >= ctx.o.desde) {
      // Una fila por sesión principal: cada llamada cuenta una vez (por id de mensaje) y los subagentes no entran.
      const vistos = new Set();
      const contextos = [];
      for (const x of mensajes) {
        if (x.clave !== null) {
          if (vistos.has(x.clave)) continue;
          vistos.add(x.clave);
        }
        contextos.push(x.contexto);
      }
      ctx.sesiones.push({
        herramienta: "claude", fecha, proyecto, sesion: basename(ruta), modelo: mensajes.at(-1)?.modelo ?? "desconocido",
        llamadas: contextos.length, esperas: esperas.size, creditos: null, sondeos: null, ...estadisticasContexto(contextos),
      });
    }
    for (const x of mensajes) {
      if (x.clave !== null) {
        if (ctx.vistos.has(x.clave)) continue;
        ctx.vistos.add(x.clave);
      }
      agregar(ctx, { herramienta: "claude", fecha, proyecto, modelo: x.modelo, rol, sesion: ruta, llamadas: 1,
        entrada: x.entrada, cache_leida: x.cache_leida, cache_escrita: x.cache_escrita, salida: x.salida });
    }
  }
}

async function procesarPi(ctx, raiz) {
  for (const ruta of listarJsonl(raiz, () => true)) {
    const partes = relative(raiz, ruta).split(sep);
    const proyecto = partes.length > 1 ? proyectoDeDir(partes[0]) : "desconocido";
    if (!coincide(ctx, proyecto) || !reciente(ruta, ctx.o.inicioMs)) continue;
    const rol = partes.some((p) => p.startsWith("subagent")) ? "sub" : "main";
    const mensajes = [];
    const limites = [];
    let esperas = 0;
    let sondeos = 0;
    let primerTs = null;
    try {
      await leerJsonl(ruta, (obj) => {
        if (primerTs === null && typeof obj.timestamp === "string") primerTs = obj.timestamp;
        const m = obj.message;
        if (!m || typeof m !== "object" || m.role !== "assistant") return;
        if (m.stopReason === "error" && /usage limit/i.test(String(m.errorMessage ?? ""))) {
          limites.push(typeof obj.timestamp === "string" ? obj.timestamp : null);
          return;
        }
        // Esperas: llamadas de herramienta cuyo nombre contiene wait, sleep o send.
        if (Array.isArray(m.content)) {
          for (const b of m.content) {
            if (b && b.type === "toolCall" && typeof b.name === "string" && PATRON_ESPERA_PI.test(b.name)) esperas++;
            if (b && b.type === "toolCall" && typeof b.name === "string" && esSondeo(b.name, b.arguments)) sondeos++;
          }
        }
        const u = m.usage;
        if (!u || typeof u !== "object") return;
        mensajes.push({
          modelo: typeof m.model === "string" ? m.model : "desconocido",
          entrada: num(u.input),
          cache_leida: num(u.cacheRead),
          cache_escrita: num(u.cacheWrite),
          salida: num(u.output),
          contexto: num(u.input) + num(u.cacheRead),
        });
      });
    } catch (e) {
      ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
      continue;
    }
    const fecha = fechaUTC(primerTs);
    if (!fecha) continue;
    if (ctx.o.sesiones && rol === "main" && fecha >= ctx.o.desde) {
      const modelo = mensajes.at(-1)?.modelo ?? "desconocido";
      ctx.sesiones.push({
        herramienta: "pi", fecha, proyecto, sesion: basename(ruta), modelo,
        llamadas: mensajes.length, esperas, sondeos,
        creditos: creditosSesion(ctx.tarifas, modelo, sumarTokens(mensajes)),
        ...estadisticasContexto(mensajes.map((x) => x.contexto)),
      });
    }
    for (const ts of limites) {
      const f = fechaUTC(ts);
      if (f === null || f >= ctx.o.desde) ctx.avisos.push(`Pi: límite de uso alcanzado en ${proyecto} (${ts ?? "sin fecha"}); no suma tokens`);
    }
    for (const x of mensajes) {
      agregar(ctx, { herramienta: "pi", fecha, proyecto, modelo: x.modelo, rol, sesion: ruta, llamadas: 1,
        entrada: x.entrada, cache_leida: x.cache_leida, cache_escrita: x.cache_escrita, salida: x.salida });
    }
  }
}

const MUESTRA_MINIMA = 5;

// Llamadas de Codex que esperan a otro agente o al tiempo: cada una es una espera del principal.
const ESPERAS = new Set(["wait_agent", "wait", "sleep", "send_message"]);
// Llamadas de Claude Code que esperan (TaskOutput, Sleep, Monitor, SendMessage) y nombre de herramienta de Pi que espera.
const ESPERAS_CLAUDE = new Set(["TaskOutput", "Sleep", "Monitor", "SendMessage"]);
const PATRON_ESPERA_PI = /wait|sleep|send/i;

// Diagnóstico de una sesión de Codex a partir del contexto (input de la última llamada de cada evento).
// Una compactación es una caída del 40 % o más respecto a la llamada anterior.
function estadisticasContexto(contextos) {
  if (contextos.length === 0) return { contexto_mediana: null, contexto_max: null, compactaciones: 0 };
  const orden = [...contextos].sort((a, b) => a - b);
  const n = orden.length;
  const mediana = n % 2 === 1 ? orden[(n - 1) / 2] : Math.round((orden[n / 2 - 1] + orden[n / 2]) / 2);
  let compactaciones = 0;
  for (let i = 1; i < contextos.length; i++) {
    if (contextos[i] <= contextos[i - 1] * 0.6) compactaciones++;
  }
  return { contexto_mediana: mediana, contexto_max: orden[n - 1], compactaciones };
}

// Milisegundos de un timestamp ISO, o null si no es válido.
function msDeTs(ts) {
  if (typeof ts !== "string") return null;
  const ms = Date.parse(ts);
  return Number.isNaN(ms) ? null : ms;
}

// Lee todas las sesiones de Codex (también las de otros proyectos, porque todas gastan la misma cuota),
// agrega las filas de uso y calcula la calibración de cuota.
async function procesarCodex(ctx, raiz) {
  const sesiones = [];
  for (const ruta of listarJsonl(raiz, (n) => n.startsWith("rollout-"))) {
    if (!reciente(ruta, ctx.o.inicioMs)) continue;
    let primerTs = null;
    let ultimoTs = null;
    let cwd = null;
    let modelo = null;
    let total = null;
    let llamadas = 0;
    let esperas = 0;
    let sondeos = 0;
    const contextos = [];
    let cuotaInicial = null;
    let cuotaFinal = null;
    let primariaFinal = null;
    try {
      await leerJsonl(ruta, (obj) => {
        if (typeof obj.timestamp === "string") {
          if (primerTs === null) primerTs = obj.timestamp;
          ultimoTs = obj.timestamp;
        }
        const p = obj.payload && typeof obj.payload === "object" ? obj.payload : null;
        if (!p) return;
        if (obj.type === "session_meta" && typeof p.cwd === "string") cwd = p.cwd;
        if (obj.type === "turn_context" && typeof p.model === "string") modelo = p.model;
        if (obj.type === "response_item" && p.type === "function_call" && ESPERAS.has(p.name)) esperas++;
        if (obj.type === "response_item" && p.type === "function_call" && esSondeo(p.name, p.arguments)) sondeos++;
        if (p.type !== "token_count") return;
        const usado = p.rate_limits?.secondary?.used_percent;
        if (typeof usado === "number" && Number.isFinite(usado)) {
          if (cuotaInicial === null) cuotaInicial = usado;
          cuotaFinal = usado;
        }
        const ventana = p.rate_limits?.primary?.used_percent;
        if (typeof ventana === "number" && Number.isFinite(ventana)) primariaFinal = ventana;
        if (p.info && typeof p.info === "object") {
          llamadas++;
          if (p.info.total_token_usage && typeof p.info.total_token_usage === "object") total = p.info.total_token_usage;
          const contexto = p.info.last_token_usage?.input_tokens;
          if (typeof contexto === "number" && Number.isFinite(contexto)) contextos.push(contexto);
        }
      });
    } catch (e) {
      ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
      continue;
    }
    sesiones.push({
      ruta,
      fecha: fechaUTC(primerTs),
      inicioMs: msDeTs(primerTs),
      finMs: msDeTs(ultimoTs),
      proyecto: cwd ? (cwd.split(/[\\/]/).filter(Boolean).pop() ?? "desconocido") : "desconocido",
      modelo: modelo ?? "desconocido",
      llamadas,
      esperas,
      sondeos,
      contextos,
      total,
      cuotaInicial,
      cuotaFinal,
      primariaFinal,
    });
  }
  for (const s of sesiones) {
    if (!s.fecha || s.llamadas === 0 || !s.total || !coincide(ctx, s.proyecto)) continue;
    const cacheada = num(s.total.cached_input_tokens);
    agregar(ctx, { herramienta: "codex", fecha: s.fecha, proyecto: s.proyecto, modelo: s.modelo, rol: "main", sesion: s.ruta,
      llamadas: s.llamadas, entrada: Math.max(0, num(s.total.input_tokens) - cacheada), cache_leida: cacheada, cache_escrita: 0,
      salida: num(s.total.output_tokens) });
  }
  ctx.cuota = calcularCuota(ctx, sesiones);
  // Alerta de cuota: la sesión más reciente con dato de cuota semanal; si ya llegó al umbral, avisa.
  const conCuota = sesiones.filter((s) => s.cuotaFinal !== null && s.finMs !== null && s.fecha && s.fecha >= ctx.o.desde && coincide(ctx, s.proyecto));
  if (conCuota.length > 0) {
    const ultima = conCuota.reduce((a, b) => (b.finMs > a.finMs ? b : a));
    if (ultima.cuotaFinal >= ctx.o.umbral) {
      ctx.avisos.push(`Cuota semanal de Codex en ${ultima.cuotaFinal} %: llegó al umbral de ${ctx.o.umbral} %`);
    }
  }
  // Alerta de ventana de 5 horas: rate_limits.primary de la sesión más reciente con ese dato.
  const conVentana = sesiones.filter((s) => s.primariaFinal !== null && s.finMs !== null && s.fecha && s.fecha >= ctx.o.desde && coincide(ctx, s.proyecto));
  if (conVentana.length > 0) {
    const ultima = conVentana.reduce((a, b) => (b.finMs > a.finMs ? b : a));
    if (ultima.primariaFinal >= ctx.o.umbral) ctx.avisos.push(`Ventana de 5 horas de Codex en ${ultima.primariaFinal} %`);
  }
  // Diagnóstico por sesión (--sesiones): sin la ruta completa, solo el nombre del archivo.
  if (ctx.o.sesiones) {
    for (const s of sesiones.filter((x) => x.fecha && x.fecha >= ctx.o.desde && coincide(ctx, x.proyecto))) {
      const t = s.total ? {
        entrada: Math.max(0, num(s.total.input_tokens) - num(s.total.cached_input_tokens)),
        cache_leida: num(s.total.cached_input_tokens),
        cache_escrita: 0,
        salida: num(s.total.output_tokens),
      } : null;
      ctx.sesiones.push({
        herramienta: "codex", fecha: s.fecha, proyecto: s.proyecto, sesion: basename(s.ruta), modelo: s.modelo,
        llamadas: s.llamadas, esperas: s.esperas, sondeos: s.sondeos, creditos: creditosSesion(ctx.tarifas, s.modelo, t),
        ...estadisticasContexto(s.contextos),
      });
    }
  }
}

// Puntos de cuota semanal por modelo. Solo cuentan sesiones exclusivas (su intervalo primer-último evento
// no se cruza con ninguna otra sesión de Codex) y sin bajada de cuota (una bajada es un reinicio).
// puntos = used_percent final - inicial; tokens = total_tokens final de la sesión.
function calcularCuota(ctx, sesiones) {
  const grupos = new Map();
  for (const s of sesiones) {
    if (!s.fecha || s.fecha < ctx.o.desde || s.llamadas === 0 || !s.total || !coincide(ctx, s.proyecto)) continue;
    if (s.inicioMs === null || s.finMs === null || s.cuotaInicial === null || s.cuotaFinal === null) continue;
    if (s.cuotaFinal < s.cuotaInicial) continue;
    const cruza = sesiones.some((o) => o !== s && o.inicioMs !== null && o.finMs !== null
      && o.inicioMs < s.finMs && s.inicioMs < o.finMs);
    if (cruza) continue;
    const g = grupos.get(s.modelo) ?? { modelo: s.modelo, puntos: 0, tokens: 0, sesiones: 0 };
    g.puntos += s.cuotaFinal - s.cuotaInicial;
    g.tokens += num(s.total.total_tokens);
    g.sesiones++;
    grupos.set(s.modelo, g);
  }
  const cuota = [...grupos.values()]
    .sort((a, b) => (a.modelo < b.modelo ? -1 : a.modelo > b.modelo ? 1 : 0))
    .map((g) => ({ ...g, puntos: Math.round(g.puntos * 100) / 100 }));
  for (const g of cuota) {
    if (g.sesiones < MUESTRA_MINIMA) {
      ctx.avisos.push(`Codex: muestra pequeña para ${g.modelo} (${g.sesiones} sesiones; se recomiendan ${MUESTRA_MINIMA} o más)`);
    }
  }
  return cuota;
}

// Tabla de texto alineada: primera fila = encabezados.
function tabla(columnas, filas) {
  const celdas = [columnas, ...filas.map((f) => columnas.map((c) => String(f[c])))];
  const anchos = columnas.map((_, i) => Math.max(...celdas.map((r) => r[i].length)));
  return celdas.map((r) => r.map((v, i) => v.padEnd(anchos[i])).join("  ").trimEnd());
}

const COLUMNAS_SESIONES = ["herramienta", "fecha", "proyecto", "sesion", "modelo", "llamadas", "esperas", "contexto_mediana", "contexto_max", "compactaciones", "creditos", "sondeos"];

function imprimirSesiones(sesiones, avisos, desde) {
  if (sesiones.length === 0) {
    console.log(`sin sesiones desde ${desde}`);
  } else {
    const celdas = sesiones.map((s) => ({
      ...s, contexto_mediana: s.contexto_mediana ?? "-", contexto_max: s.contexto_max ?? "-",
      creditos: s.creditos ?? "-", sondeos: s.sondeos ?? "-",
    }));
    for (const linea of tabla(COLUMNAS_SESIONES, celdas)) console.log(linea);
  }
  for (const a of avisos) console.log(`aviso: ${a}`);
}

function imprimirTexto(filas, cuota, avisos, desde) {
  if (filas.length === 0) {
    console.log(`sin sesiones desde ${desde}`);
  } else {
    for (const linea of tabla(COLUMNAS, filas)) console.log(linea);
  }
  if (cuota.length > 0) {
    console.log("");
    console.log("cuota semanal de Codex (puntos = % de la cuota secundaria; solo sesiones exclusivas)");
    for (const linea of tabla(["modelo", "puntos", "tokens", "sesiones"], cuota)) console.log(linea);
  }
  for (const a of avisos) console.log(`aviso: ${a}`);
}

async function main() {
  const o = leerOpciones(process.argv.slice(2));
  const ctx = { o, filas: new Map(), avisos: [], vistos: new Set(), cuota: [], sesiones: [] };
  ctx.tarifas = cargarTarifas(o.tarifas, ctx.avisos);
  const raices = { claude: o.claudeDir, codex: join(o.codexDir, "sessions"), pi: o.piDir };
  const herramientas = o.herramienta ? [o.herramienta] : HERRAMIENTAS;
  const presentes = [];
  for (const h of herramientas) {
    if (esDirectorio(raices[h])) presentes.push(h);
    else ctx.avisos.push(`no existe la carpeta de ${NOMBRES[h]}: ${raices[h]}`);
  }
  if (presentes.length === 0) {
    fallar(`ninguna carpeta de sesiones existe: ${herramientas.map((h) => raices[h]).join(", ")}`);
  }
  for (const h of presentes) {
    if (h === "claude") await procesarClaude(ctx, raices.claude);
    else if (h === "codex") await procesarCodex(ctx, raices.codex);
    else await procesarPi(ctx, raices.pi);
  }
  const orden = ["fecha", "herramienta", "proyecto", "modelo", "rol"];
  const filas = [...ctx.filas.values()]
    .map((g) => ({ ...g, sesiones: g.sesiones.size }))
    .sort((a, b) => {
      for (const k of orden) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1;
      return 0;
    });
  if (o.sesiones) {
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    ctx.sesiones.sort((a, b) => cmp(a.fecha, b.fecha) || cmp(a.herramienta, b.herramienta) || cmp(a.sesion, b.sesion));
    if (o.json) console.log(JSON.stringify({ filas, cuota: ctx.cuota, avisos: ctx.avisos, sesiones: ctx.sesiones }, null, 2));
    else imprimirSesiones(ctx.sesiones, ctx.avisos, o.desde);
  } else if (o.json) console.log(JSON.stringify({ filas, cuota: ctx.cuota, avisos: ctx.avisos }, null, 2));
  else imprimirTexto(filas, ctx.cuota, ctx.avisos, o.desde);
}

main().catch((e) => fallar(e.message));
