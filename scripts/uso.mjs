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
// créditos, sondeos, ediciones_fuera y corridas_verify). Sondeos: llamadas de shell con sleep, tail o watch. Claude Code no mide créditos ni sondeos (null).
// ediciones_fuera: escrituras del principal a rutas que no son cambios/, AGENTS.md ni docs/proyecto.md. corridas_verify: llamadas a ./verify o npm run verify.
// En Claude Code solo cuenta la sesión principal (un .jsonl por sesión); sus subagentes no suman en su fila.
// --umbral (por defecto 70): si la cuota semanal o la ventana de 5 horas de Codex de la última sesión llega a ese %, aparece un aviso.

import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { esDirectorio } from "../tools/usage/jsonl.mjs";
import { cargarTarifas, creditosSesion } from "../tools/usage/rates.mjs";
import { crearProcesadorClaude } from "../tools/usage/claude.mjs";
import { crearProcesadorPi } from "../tools/usage/pi.mjs";
import { crearProcesadorCodex } from "../tools/usage/codex.mjs";
import { crearFormateadores } from "../tools/usage/report.mjs";

const HERRAMIENTAS = ["claude", "codex", "pi"];
const NOMBRES = { claude: "Claude Code", codex: "Codex", pi: "Pi" };
const COLUMNAS = ["herramienta", "fecha", "proyecto", "modelo", "rol", "sesiones", "llamadas", "entrada", "cache_leida", "cache_escrita", "salida"];
const COLUMNAS_SESIONES = ["herramienta", "fecha", "proyecto", "sesion", "modelo", "llamadas", "esperas", "contexto_mediana", "contexto_max", "compactaciones", "creditos", "sondeos", "ediciones_fuera", "corridas_verify"];
const { imprimirSesiones, imprimirTexto } = crearFormateadores({ columnas: COLUMNAS, columnasSesiones: COLUMNAS_SESIONES });

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
  const alias = { "--since": "--desde", "--tool": "--herramienta", "--project": "--proyecto", "--sessions": "--sesiones", "--threshold": "--umbral", "--rates": "--tarifas" };
  const valor = (i) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) fallar(`falta el valor de ${alias[argv[i]] || argv[i]}`, 2);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = alias[argv[i]] || argv[i];
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

// "-home-ana-Codes-proyecto" (Claude) y "--home-ana-Codes-proyecto--" (Pi) -> "proyecto"
function proyectoDeDir(nombre) {
  const sin = nombre.replace(/^-+|-+$/g, "").replace(/^home-[^-]+-Codes-/, "");
  return sin || nombre;
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

// Invasión del principal (--sesiones): una escritura fuera de cambios/, AGENTS.md y docs/proyecto.md es una edición fuera de lo permitido.
// Ruta permitida: cualquiera bajo una carpeta cambios/, o el AGENTS.md o docs/proyecto.md del proyecto.
function esPermitida(ruta) {
  const r = String(ruta).replace(/\\/g, "/");
  return /(^|\/)cambios\//.test(r) || /(^|\/)AGENTS\.md$/.test(r) || /(^|\/)docs\/proyecto\.md$/.test(r);
}

// Rutas que escribe un parche de apply_patch (Add, Update, Delete y Move to).
function rutasDeParche(texto) {
  const s = String(texto);
  const rutas = [...s.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm)].map((m) => m[1].trim());
  return rutas.concat([...s.matchAll(/^\*\*\* Move to: (.+)$/gm)].map((m) => m[1].trim()));
}

// Rutas que escribe un comando de shell: cat > y tee, y open(…, "w") o Path(…).write_text de un script de Python.
function rutasDeShell(cmd) {
  const s = String(cmd ?? "");
  const rutas = [
    ...[...s.matchAll(/\bcat\s*>>?\s*["']?([^\s"'<>|;&]+)/g)].map((m) => m[1]),
    ...[...s.matchAll(/\btee\s+(?:-a\s+)?["']?([^\s"'<>|;&]+)/g)].map((m) => m[1]),
    ...[...s.matchAll(/open\(\s*["']([^"']+)["']\s*,\s*["'][wax]/g)].map((m) => m[1]),
    ...[...s.matchAll(/Path\(\s*["']([^"']+)["']\s*\)\.write_(?:text|bytes)/g)].map((m) => m[1]),
  ];
  return rutas.filter((r) => r !== "/dev/null");
}

// Llamada a ./verify o npm run verify, como comando completo o encadenado con ; && || o |.
const PATRON_VERIFY = /(^|[\s;&|(])(\.\/verify|npm run verify)(?=$|[\s;&|)])/;
function esVerify(cmd) {
  return typeof cmd === "string" && PATRON_VERIFY.test(cmd);
}

// Argumentos de una llamada como objeto: Pi los trae como objeto; Codex, como texto JSON. Sin objeto válido, null.
function argumentosDe(args) {
  if (typeof args !== "string") return args && typeof args === "object" ? args : null;
  try {
    const o = JSON.parse(args);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

// Texto del parche de apply_patch: campo input (Codex) o arguments, que puede venir como JSON con input.
function textoDePatch(p) {
  const raw = p.input ?? p.arguments;
  if (typeof raw !== "string") return "";
  try {
    const o = JSON.parse(raw);
    if (o && typeof o.input === "string") return o.input;
  } catch { /* texto plano */ }
  return raw;
}

// Nombre de herramienta de Pi que espera.
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

const procesarClaude = crearProcesadorClaude({
  agregar,
  coincide,
  fechaUTC,
  esPermitida,
  esVerify,
  estadisticasContexto,
  num,
  proyectoDeDir,
});

const procesarPi = crearProcesadorPi({
  agregar,
  argumentosDe,
  coincide,
  comandoDe,
  creditosSesion,
  esPermitida,
  esSondeo,
  esVerify,
  estadisticasContexto,
  fechaUTC,
  num,
  proyectoDeDir,
  sumarTokens,
});

const procesarCodex = crearProcesadorCodex({
  agregar,
  coincide,
  comandoDe,
  creditosSesion,
  esPermitida,
  esSondeo,
  esVerify,
  estadisticasContexto,
  fechaUTC,
  num,
  rutasDeParche,
  rutasDeShell,
  textoDePatch,
});

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
