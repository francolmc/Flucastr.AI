#!/usr/bin/env node
// Medición de consumo de F20 (solo lectura sobre logs de sesiones).
//
// Uso:
//   node scripts/consumo.mjs --raiz <dir> [--hasta <ISO>] [--tareas <n>] [--json]
//   --raiz es obligatorio (no hay valor por defecto). Solo lectura: no crea ni modifica archivos.
//   Funciones exportadas: analizarSesionPi, analizarSubagentesPi, unirPi, analizarSesionClaude,
//   analizarSubagentesClaude, descubrirSesiones, formatearInforme, informeJson, leerArgumentos.
//   analizarSesionPi(textoJsonl, { hasta: "2026-10-30T12:00:00Z" })  → agregados del coordinador de Pi
//   analizarSubagentesPi(carpetaSubagentArtifacts, { sesionId, hasta }) → agregados por rol (subagentes)
//   (carpetaSubagentArtifacts = .../subagent-artifacts/)
//
// Solo analizarSubagentesPi lee archivos (los meta y transcripts de una carpeta, sin escribir). No hace red
// ni llama a ningún modelo. Las líneas que no son JSON y los registros que no son turnos del asistente se ignoran.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Tramos de contexto por turno (contexto = input + cacheRead + cacheWrite).
// menos30k: < 30000; de30a60k: 30000–60000 (incluido); mas60k: > 60000.
const TRAMO_30K = 30000;
const TRAMO_60K = 60000;

// Redondeo para evitar ruido de coma flotante en los costos sumados.
const redondear = (x) => Math.round(x * 1e10) / 1e10;

function tramoDeContexto(contexto) {
  if (contexto < TRAMO_30K) return "menos30k";
  if (contexto <= TRAMO_60K) return "de30a60k";
  return "mas60k";
}

function numero(valor) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

// Forma de ruta de una tarea de F20 (features/Fxx-nombre/task-NN-nombre.md).
const FORMA_TAREA = /task-\d{2}-[^/]*\.md$/;

// Tipo de turno (task-02): primera coincidencia en este orden, mirando todas las llamadas del turno.
// llamadas: [{ name, ruta }]; ruta es "" si la llamada no trae `path`.
function clasificarTurno(llamadas) {
  if (llamadas.length === 0) return "texto";
  const alguna = (pred) => llamadas.some(pred);
  if (alguna((l) => l.name === "subagents_enable")) return "subagents_enable";
  if (alguna((l) => l.name === "subagent")) return "delegar";
  if (alguna((l) => (l.name === "write" || l.name === "edit") && l.ruta.endsWith("definitions/STATUS.md"))) {
    return "reescribir_status";
  }
  if (alguna((l) => l.name === "edit" && FORMA_TAREA.test(l.ruta))) return "cambiar_estado";
  if (alguna((l) => l.name === "read" && FORMA_TAREA.test(l.ruta))) return "leer_tarea";
  if (alguna((l) => l.name === "read" && (l.ruta.endsWith("definitions/STATUS.md") || l.ruta.endsWith("definitions/BACKLOG.md")))) {
    return "leer_status_backlog";
  }
  if (alguna((l) => l.name === "read" && l.ruta.includes("definitions/"))) return "leer_definiciones";
  return "otro";
}

// Categoría de una lectura (task-02): definiciones, tareas u otros.
function categoriaDeLectura(ruta) {
  if (ruta.includes("definitions/")) return "definiciones";
  if (FORMA_TAREA.test(ruta)) return "tareas";
  return "otros";
}

// Bytes UTF-8 de los `content[].text` de un resultado de herramienta.
function bytesDeTexto(contenido) {
  return (Array.isArray(contenido) ? contenido : []).reduce(
    (suma, item) => suma + (typeof item?.text === "string" ? Buffer.byteLength(item.text) : 0),
    0,
  );
}

// Bytes a KB con un decimal.
const aKb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

// Devuelve el registro como objeto, o null si la línea no es JSON.
function parsearLinea(linea) {
  try {
    const r = JSON.parse(linea);
    return r && typeof r === "object" ? r : null;
  } catch {
    return null;
  }
}

// texto: contenido completo de una sesión de Pi (.jsonl).
// opciones.hasta: ISO opcional; descarta los registros con timestamp posterior.
export function analizarSesionPi(texto, { hasta } = {}) {
  const limite = hasta === undefined ? Infinity : Date.parse(hasta);

  const salida = {
    herramienta: "pi",
    turnos: 0,
    costo: 0,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    tramos: {
      menos30k: { turnos: 0, costo: 0 },
      de30a60k: { turnos: 0, costo: 0 },
      mas60k: { turnos: 0, costo: 0 },
    },
    herramientas: {},
    llamadasSubagente: 0,
    subagentsEnable: 0,
    tiposDeTurno: {},
    lecturas: {
      porArchivo: {},
      kbTotal: 0,
      kbPorCategoria: { definiciones: 0, tareas: 0, otros: 0 },
    },
  };

  // Pareo de llamadas `read` con su resultado (task-02): id de llamada → ruta; id de resultado → bytes y error.
  const lecturasPorId = new Map();
  const resultadosPorId = new Map();

  for (const linea of String(texto).split("\n")) {
    if (linea.trim() === "") continue;
    const registro = parsearLinea(linea);
    if (!registro) continue;

    if (limite !== Infinity && registro.timestamp !== undefined) {
      const ts = Date.parse(registro.timestamp);
      if (Number.isFinite(ts) && ts > limite) continue;
    }

    if (registro.type !== "message") continue;
    const mensaje = registro.message;
    if (mensaje?.role === "toolResult") {
      if (typeof mensaje.toolCallId === "string") {
        resultadosPorId.set(mensaje.toolCallId, {
          bytes: bytesDeTexto(mensaje.content),
          error: mensaje.isError === true,
        });
      }
      continue;
    }
    if (!mensaje || mensaje.role !== "assistant") continue;

    const uso = mensaje.usage ?? {};
    const input = numero(uso.input);
    const output = numero(uso.output);
    const cacheRead = numero(uso.cacheRead);
    const cacheWrite = numero(uso.cacheWrite);
    const costo = numero(uso.cost?.total);
    const contexto = input + cacheRead + cacheWrite;
    const tramo = salida.tramos[tramoDeContexto(contexto)];

    salida.turnos += 1;
    salida.costo = redondear(salida.costo + costo);
    salida.tokens.input += input;
    salida.tokens.output += output;
    salida.tokens.cacheRead += cacheRead;
    salida.tokens.cacheWrite += cacheWrite;
    tramo.turnos += 1;
    tramo.costo = redondear(tramo.costo + costo);

    const llamadas = [];
    for (const item of Array.isArray(mensaje.content) ? mensaje.content : []) {
      if (item?.type !== "toolCall" || typeof item.name !== "string") continue;
      salida.herramientas[item.name] = (salida.herramientas[item.name] ?? 0) + 1;
      if (item.name === "subagent") salida.llamadasSubagente += 1;
      if (item.name === "subagents_enable") salida.subagentsEnable += 1;
      const ruta = typeof item.arguments?.path === "string" ? item.arguments.path : "";
      llamadas.push({ name: item.name, ruta });
      if (item.name === "read" && item.id !== undefined) lecturasPorId.set(item.id, ruta);
    }

    const tipo = clasificarTurno(llamadas);
    const sumaTipo = salida.tiposDeTurno[tipo] ?? { turnos: 0, costo: 0 };
    sumaTipo.turnos += 1;
    sumaTipo.costo = redondear(sumaTipo.costo + costo);
    salida.tiposDeTurno[tipo] = sumaTipo;
  }

  // Lecturas (task-02): solo `read` con resultado sin error; se suma en bytes y se pasa a KB al final.
  const bytesPorArchivo = {};
  const bytesPorCategoria = { definiciones: 0, tareas: 0, otros: 0 };
  let bytesTotal = 0;
  for (const [id, ruta] of lecturasPorId) {
    const resultado = resultadosPorId.get(id);
    if (!resultado || resultado.error) continue;
    const entrada = salida.lecturas.porArchivo[ruta] ?? { lecturas: 0, kb: 0 };
    entrada.lecturas += 1;
    salida.lecturas.porArchivo[ruta] = entrada;
    bytesPorArchivo[ruta] = (bytesPorArchivo[ruta] ?? 0) + resultado.bytes;
    bytesPorCategoria[categoriaDeLectura(ruta)] += resultado.bytes;
    bytesTotal += resultado.bytes;
  }
  for (const ruta of Object.keys(salida.lecturas.porArchivo)) {
    salida.lecturas.porArchivo[ruta].kb = aKb(bytesPorArchivo[ruta]);
  }
  for (const categoria of Object.keys(bytesPorCategoria)) {
    salida.lecturas.kbPorCategoria[categoria] = aKb(bytesPorCategoria[categoria]);
  }
  salida.lecturas.kbTotal = aKb(bytesTotal);

  return salida;
}

// Lecturas `read` de un transcript de subagente (task-03): por ruta, { lecturas, bytes }.
// Misma regla que task-02: solo resultados sin error, bytes del texto del resultado, pareo por toolCallId.
function lecturasDeTranscript(texto) {
  const lecturasPorId = new Map();
  const resultadosPorId = new Map();

  for (const linea of String(texto).split("\n")) {
    if (linea.trim() === "") continue;
    const registro = parsearLinea(linea);
    if (registro?.recordType !== "message") continue;
    const mensaje = registro.message;
    if (mensaje?.role === "toolResult") {
      if (typeof mensaje.toolCallId === "string") {
        resultadosPorId.set(mensaje.toolCallId, {
          bytes: bytesDeTexto(mensaje.content),
          error: mensaje.isError === true,
        });
      }
      continue;
    }
    if (mensaje?.role !== "assistant" || !Array.isArray(mensaje.content)) continue;
    for (const item of mensaje.content) {
      if (item?.type === "toolCall" && item.name === "read" && item.id !== undefined) {
        lecturasPorId.set(item.id, typeof item.arguments?.path === "string" ? item.arguments.path : "");
      }
    }
  }

  // Map (no objeto): una ruta como "constructor" caería en Object.prototype con un objeto plano.
  const porRuta = new Map();
  for (const [id, ruta] of lecturasPorId) {
    const resultado = resultadosPorId.get(id);
    if (!resultado || resultado.error) continue;
    if (!porRuta.has(ruta)) porRuta.set(ruta, { lecturas: 0, bytes: 0 });
    const entrada = porRuta.get(ruta);
    entrada.lecturas += 1;
    entrada.bytes += resultado.bytes;
  }
  return porRuta;
}

// dirArtefactos: carpeta subagent-artifacts de una sesión de Pi (solo lectura).
// opciones.sesionId: si se da, solo corridas con parentSessionId igual a ese id.
// opciones.hasta: ISO opcional; descarta las corridas con meta.timestamp (ms) posterior.
// Por corrida: turnos y costo del meta; KB leídos del transcript hermano (<runId>_<agente>_transcript.jsonl).
// Si falta el transcript, la corrida cuenta con KB 0 y sinTranscript:true en su rol.
export function analizarSubagentesPi(dirArtefactos, { sesionId, hasta } = {}) {
  const limite = hasta === undefined ? Infinity : Date.parse(hasta);
  // Maps (no objetos planos) para que un rol como "constructor" no choque con Object.prototype.
  const porRol = new Map();
  const modelos = new Map();
  const bytesPorRol = new Map();

  for (const nombre of readdirSync(dirArtefactos).sort()) {
    if (!nombre.endsWith("_meta.json")) continue;
    let meta;
    try {
      meta = JSON.parse(readFileSync(join(dirArtefactos, nombre), "utf8"));
    } catch {
      continue;
    }
    if (!meta || typeof meta !== "object") continue;
    if (typeof meta.runId !== "string" || typeof meta.agent !== "string") continue;
    if (sesionId !== undefined && meta.parentSessionId !== sesionId) continue;
    if (limite !== Infinity && !(meta.timestamp <= limite)) continue;

    const rol = meta.agent;
    if (!porRol.has(rol)) {
      porRol.set(rol, { corridas: 0, turnos: 0, costo: 0, sinTranscript: false, porArchivo: new Map() });
    }
    if (!bytesPorRol.has(rol)) bytesPorRol.set(rol, { total: 0, porArchivo: new Map() });
    if (!modelos.has(rol)) modelos.set(rol, new Set());
    const r = porRol.get(rol);
    const bytes = bytesPorRol.get(rol);
    const conjuntoModelos = modelos.get(rol);
    if (typeof meta.model === "string") conjuntoModelos.add(meta.model);

    const uso = meta.usage ?? {};
    r.corridas += 1;
    r.turnos += numero(uso.turns);
    r.costo = redondear(r.costo + numero(uso.cost));

    let texto;
    try {
      texto = readFileSync(join(dirArtefactos, `${meta.runId}_${rol}_transcript.jsonl`), "utf8");
    } catch {
      texto = undefined;
    }
    if (texto === undefined) {
      r.sinTranscript = true;
      continue;
    }
    for (const [ruta, lectura] of lecturasDeTranscript(texto)) {
      if (!r.porArchivo.has(ruta)) r.porArchivo.set(ruta, { lecturas: 0 });
      r.porArchivo.get(ruta).lecturas += lectura.lecturas;
      bytes.porArchivo.set(ruta, (bytes.porArchivo.get(ruta) ?? 0) + lectura.bytes);
      bytes.total += lectura.bytes;
    }
  }

  // Salida como objetos planos; los KB se calculan desde los bytes sumados (como en task-02).
  const salidaPorRol = {};
  for (const [rol, r] of porRol) {
    const bytesRol = bytesPorRol.get(rol);
    const porArchivo = {};
    for (const [ruta, archivo] of r.porArchivo) {
      porArchivo[ruta] = { lecturas: archivo.lecturas, kb: aKb(bytesRol.porArchivo.get(ruta)) };
    }
    salidaPorRol[rol] = {
      corridas: r.corridas,
      turnos: r.turnos,
      costo: r.costo,
      kbTotal: aKb(bytesRol.total),
      sinTranscript: r.sinTranscript,
      porArchivo,
    };
  }

  const modelosPorRol = {};
  for (const [rol, conjunto] of modelos) modelosPorRol[rol] = [...conjunto].sort();

  return { porRol: salidaPorRol, modelos: modelosPorRol };
}

// Une el análisis de la sesión principal con el de sus subagentes (task-03).
// turnosPorLlamada: turnos del coordinador por llamada a subagente (1 decimal); null sin llamadas.
export function unirPi(principal, subagentes) {
  const llamadas = principal.llamadasSubagente;
  const turnosPorLlamada = llamadas > 0 ? Math.round((principal.turnos / llamadas) * 10) / 10 : null;
  return { ...principal, subagentes, turnosPorLlamada };
}

// ---- task-04: Claude Code (logs en ~/.claude/projects/<proyecto>/) ----

// Nombres de Claude Code → nombres comunes con Pi (Agent es la delegación, subagent).
const NOMBRES_CLAUDE = { Read: "read", Edit: "edit", Write: "write", Agent: "subagent" };
const normalizarNombre = (nombre) => NOMBRES_CLAUDE[nombre] ?? nombre.toLowerCase();

// Lee un .jsonl de Claude Code (sesión o subagente). Un turno es un message.id, aunque aparezca en varios
// registros (uno por bloque de contenido); se omite model "<synthetic>" y los registros posteriores a `limite` (ms).
// Devuelve { rol, turnos: Map<id, {model, usage, llamadas}>, lecturasPorId, bytesPorId }.
function agruparClaude(texto, limite) {
  let rol;
  let sinId = 0;
  const turnos = new Map();
  const lecturasPorId = new Map();
  const bytesPorId = new Map();
  const llamadasVistas = new Set();

  for (const linea of String(texto).split("\n")) {
    if (linea.trim() === "") continue;
    const registro = parsearLinea(linea);
    if (!registro) continue;
    if (rol === undefined && registro.type === "agent-setting" && typeof registro.agentSetting === "string") {
      rol = registro.agentSetting;
    }
    if (limite !== Infinity && registro.timestamp !== undefined) {
      const ts = Date.parse(registro.timestamp);
      if (Number.isFinite(ts) && ts > limite) continue;
    }
    const mensaje = registro.message;
    if (!mensaje || typeof mensaje !== "object") continue;

    if (registro.type === "assistant") {
      if (mensaje.model === "<synthetic>") continue;
      const id = typeof mensaje.id === "string" ? mensaje.id : `sin-id-${sinId++}`;
      if (!turnos.has(id)) turnos.set(id, { model: undefined, usage: {}, llamadas: [] });
      const turno = turnos.get(id);
      if (typeof mensaje.model === "string") turno.model = mensaje.model;
      if (mensaje.usage && typeof mensaje.usage === "object") turno.usage = mensaje.usage;
      for (const item of Array.isArray(mensaje.content) ? mensaje.content : []) {
        if (item?.type !== "tool_use" || typeof item.name !== "string") continue;
        if (typeof item.id === "string") {
          if (llamadasVistas.has(item.id)) continue;
          llamadasVistas.add(item.id);
        }
        const nombre = normalizarNombre(item.name);
        const ruta = typeof item.input?.file_path === "string" ? item.input.file_path : "";
        turno.llamadas.push({ name: nombre, ruta });
        if (nombre === "read" && typeof item.id === "string") lecturasPorId.set(item.id, ruta);
      }
    } else if (registro.type === "user" && Array.isArray(mensaje.content)) {
      const contenido = registro.toolUseResult?.file?.content;
      if (typeof contenido !== "string") continue;
      for (const item of mensaje.content) {
        if (item?.type !== "tool_result" || typeof item.tool_use_id !== "string" || item.is_error === true) continue;
        bytesPorId.set(item.tool_use_id, Buffer.byteLength(contenido));
      }
    }
  }
  return { rol, turnos, lecturasPorId, bytesPorId };
}

// Lecturas `read` con resultado (pareo por tool_use id): ruta → { lecturas, bytes }.
function lecturasDeClaude(lecturasPorId, bytesPorId) {
  const porRuta = new Map();
  for (const [id, ruta] of lecturasPorId) {
    if (!bytesPorId.has(id)) continue;
    if (!porRuta.has(ruta)) porRuta.set(ruta, { lecturas: 0, bytes: 0 });
    const entrada = porRuta.get(ruta);
    entrada.lecturas += 1;
    entrada.bytes += bytesPorId.get(id);
  }
  return porRuta;
}

// Tokens de un turno de Claude Code (usage del mensaje).
function tokensDeTurnoClaude(usage) {
  return {
    input: numero(usage.input_tokens),
    output: numero(usage.output_tokens),
    cacheRead: numero(usage.cache_read_input_tokens),
    cacheWrite: numero(usage.cache_creation_input_tokens),
  };
}

// texto: contenido de una sesión de Claude Code (.jsonl). opciones.hasta: ISO opcional.
// costo es null: Claude Code no registra costo por mensaje (no se estima con precios).
export function analizarSesionClaude(texto, { hasta } = {}) {
  const limite = hasta === undefined ? Infinity : Date.parse(hasta);
  const { rol, turnos, lecturasPorId, bytesPorId } = agruparClaude(texto, limite);

  const salida = {
    herramienta: "claude-code",
    rol: rol ?? "desconocido",
    turnos: 0,
    costo: null,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    tramos: {
      menos30k: { turnos: 0, costo: null },
      de30a60k: { turnos: 0, costo: null },
      mas60k: { turnos: 0, costo: null },
    },
    herramientas: {},
    llamadasSubagente: 0,
    subagentsEnable: 0,
    tiposDeTurno: {},
    lecturas: { porArchivo: {}, kbTotal: 0, kbPorCategoria: { definiciones: 0, tareas: 0, otros: 0 } },
  };

  for (const turno of turnos.values()) {
    const tokens = tokensDeTurnoClaude(turno.usage);
    const contexto = tokens.input + tokens.cacheRead + tokens.cacheWrite;
    salida.turnos += 1;
    salida.tokens.input += tokens.input;
    salida.tokens.output += tokens.output;
    salida.tokens.cacheRead += tokens.cacheRead;
    salida.tokens.cacheWrite += tokens.cacheWrite;
    salida.tramos[tramoDeContexto(contexto)].turnos += 1;

    for (const llamada of turno.llamadas) {
      salida.herramientas[llamada.name] = (salida.herramientas[llamada.name] ?? 0) + 1;
      if (llamada.name === "subagent") salida.llamadasSubagente += 1;
    }
    const tipo = clasificarTurno(turno.llamadas);
    salida.tiposDeTurno[tipo] = { turnos: (salida.tiposDeTurno[tipo]?.turnos ?? 0) + 1, costo: null };
  }

  const bytesPorCategoria = { definiciones: 0, tareas: 0, otros: 0 };
  let bytesTotal = 0;
  for (const [ruta, lectura] of lecturasDeClaude(lecturasPorId, bytesPorId)) {
    salida.lecturas.porArchivo[ruta] = { lecturas: lectura.lecturas, kb: aKb(lectura.bytes) };
    bytesPorCategoria[categoriaDeLectura(ruta)] += lectura.bytes;
    bytesTotal += lectura.bytes;
  }
  for (const categoria of Object.keys(bytesPorCategoria)) {
    salida.lecturas.kbPorCategoria[categoria] = aKb(bytesPorCategoria[categoria]);
  }
  salida.lecturas.kbTotal = aKb(bytesTotal);

  return salida;
}

// dirSubagentes: carpeta subagents/ de una sesión de Claude Code (solo lectura). Por corrida:
// agent-<id>.meta.json (agentType; el campo description se ignora) y su transcript agent-<id>.jsonl.
// Devuelve { porRol: { <agentType>: { corridas, turnos, tokens, kbTotal, porArchivo } }, modelos }.
// Si la carpeta no existe, porRol es {}.
export function analizarSubagentesClaude(dirSubagentes) {
  if (!existsSync(dirSubagentes)) return { porRol: {}, modelos: {} };

  // Maps (no objetos planos) para que un rol como "constructor" no choque con Object.prototype.
  const porRol = new Map();
  const modelos = new Map();

  for (const nombre of readdirSync(dirSubagentes).sort()) {
    if (!nombre.startsWith("agent-") || !nombre.endsWith(".meta.json")) continue;
    const agentId = nombre.slice("agent-".length, -".meta.json".length);
    let meta;
    try {
      meta = JSON.parse(readFileSync(join(dirSubagentes, nombre), "utf8"));
    } catch {
      continue;
    }
    if (!meta || typeof meta.agentType !== "string") continue;
    const rol = meta.agentType;
    if (!porRol.has(rol)) {
      porRol.set(rol, {
        corridas: 0,
        turnos: 0,
        tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        lecturas: new Map(),
      });
      modelos.set(rol, new Set());
    }
    const r = porRol.get(rol);

    let texto;
    try {
      texto = readFileSync(join(dirSubagentes, `agent-${agentId}.jsonl`), "utf8");
    } catch {
      texto = "";
    }
    const { turnos, lecturasPorId, bytesPorId } = agruparClaude(texto, Infinity);

    r.corridas += 1;
    for (const turno of turnos.values()) {
      r.turnos += 1;
      const tokens = tokensDeTurnoClaude(turno.usage);
      for (const clave of Object.keys(r.tokens)) r.tokens[clave] += tokens[clave];
      if (turno.model !== undefined) modelos.get(rol).add(turno.model);
    }
    for (const [ruta, lectura] of lecturasDeClaude(lecturasPorId, bytesPorId)) {
      const acumulado = r.lecturas.get(ruta) ?? { lecturas: 0, bytes: 0 };
      acumulado.lecturas += lectura.lecturas;
      acumulado.bytes += lectura.bytes;
      r.lecturas.set(ruta, acumulado);
    }
  }

  const salidaPorRol = {};
  for (const [rol, r] of porRol) {
    const porArchivo = {};
    let bytesTotal = 0;
    for (const [ruta, lectura] of r.lecturas) {
      porArchivo[ruta] = { lecturas: lectura.lecturas, kb: aKb(lectura.bytes) };
      bytesTotal += lectura.bytes;
    }
    salidaPorRol[rol] = { corridas: r.corridas, turnos: r.turnos, tokens: r.tokens, kbTotal: aKb(bytesTotal), porArchivo };
  }

  const modelosPorRol = {};
  for (const [rol, conjunto] of modelos) modelosPorRol[rol] = [...conjunto].sort();

  return { porRol: salidaPorRol, modelos: modelosPorRol };
}

// ---- task-05: CLI, descubrimiento e informe (sin texto de mensajes) ----

const CARPETAS_SUBAGENTES = new Set(["subagent-artifacts", "subagents"]);
const SIN_SUBAGENTES = { porRol: {}, modelos: {} };
const TRAMOS = ["menos30k", "de30a60k", "mas60k"];

const compararTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const compararPorNombre = (a, b) => compararTexto(basename(a), basename(b)) || compararTexto(a, b);

// Todos los .jsonl bajo dir, sin entrar en subagent-artifacts/ ni subagents/.
function listarJsonl(dir) {
  const rutas = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (!CARPETAS_SUBAGENTES.has(entrada.name)) rutas.push(...listarJsonl(ruta));
    } else if (entrada.isFile() && entrada.name.endsWith(".jsonl")) {
      rutas.push(ruta);
    }
  }
  return rutas;
}

// Primer registro JSON válido del texto, o null.
function primerRegistro(texto) {
  for (const linea of String(texto).split("\n")) {
    if (linea.trim() === "") continue;
    const registro = parsearLinea(linea);
    if (registro) return registro;
  }
  return null;
}

// Busca las sesiones bajo raiz (solo lectura). Formato por la primera línea JSON válida:
// type:"session" → Pi (rol coordinador); si no, Claude Code. Un .jsonl sin líneas JSON se omite.
// Pi: subagentes = subagent-artifacts/ de la misma carpeta, filtrados por el id de la sesión.
// Claude Code: subagentes = <nombre sin extensión>/subagents/ (analizarSubagentesClaude no admite hasta).
export function descubrirSesiones(raiz, { hasta } = {}) {
  const sesiones = [];
  for (const ruta of listarJsonl(raiz).sort(compararPorNombre)) {
    const texto = readFileSync(ruta, "utf8");
    const primero = primerRegistro(texto);
    if (!primero) continue;
    const archivo = basename(ruta);
    if (primero.type === "session") {
      const subDir = join(dirname(ruta), "subagent-artifacts");
      const subagentes =
        existsSync(subDir) && typeof primero.id === "string"
          ? analizarSubagentesPi(subDir, { sesionId: primero.id, hasta })
          : SIN_SUBAGENTES;
      sesiones.push(unirPi({ archivo, rol: "coordinador", ...analizarSesionPi(texto, { hasta }) }, subagentes));
    } else {
      const subDir = join(dirname(ruta), basename(ruta, ".jsonl"), "subagents");
      sesiones.push(unirPi({ archivo, ...analizarSesionClaude(texto, { hasta }) }, analizarSubagentesClaude(subDir)));
    }
  }
  return sesiones;
}

const dinero = (valor) => (typeof valor === "number" ? `US$${valor.toFixed(3)}` : "n/d");

// Por tarea: costo (null sin costo) y turnos, divididos por n y redondeados a 2 decimales.
function porTareaDe(sesion, tareas) {
  return {
    costo: typeof sesion.costo === "number" ? Math.round((sesion.costo / tareas) * 100) / 100 : null,
    turnos: Math.round((sesion.turnos / tareas) * 100) / 100,
  };
}

// Líneas de una sesión. Solo números, nombres de rol/agente/modelo/herramienta y rutas leídas.
function lineasDeSesion(s, tareas) {
  const lineas = [];
  lineas.push(`${s.herramienta} | ${s.rol} | ${s.archivo}`);
  lineas.push(`turnos: ${s.turnos}`);
  lineas.push(`costo: ${dinero(s.costo)}`);
  lineas.push(
    `tokens: entrada ${s.tokens.input}, salida ${s.tokens.output}, cache lectura ${s.tokens.cacheRead}, cache escritura ${s.tokens.cacheWrite}`,
  );
  lineas.push(`tramos de contexto: ${TRAMOS.map((t) => `${t} ${s.tramos[t].turnos} (${dinero(s.tramos[t].costo)})`).join(", ")}`);
  const tipos = Object.entries(s.tiposDeTurno).map(([tipo, v]) => `${tipo} ${v.turnos}`);
  lineas.push(`tipos de turno: ${tipos.length > 0 ? tipos.join(", ") : "ninguno"}`);
  lineas.push(`llamadas a subagentes: ${s.llamadasSubagente}`);
  lineas.push(`subagents_enable: ${s.subagentsEnable}`);
  lineas.push(`turnos por llamada: ${s.turnosPorLlamada ?? "n/d"}`);

  const roles = Object.entries(s.subagentes.porRol);
  if (roles.length === 0) {
    lineas.push("subagentes por rol: ninguno");
  } else {
    lineas.push("subagentes por rol (rol | corridas | turnos | costo | KB leídos):");
    for (const [rol, r] of roles) {
      const sinTranscript = r.sinTranscript ? " | sin transcript" : "";
      lineas.push(`  ${rol} | ${r.corridas} | ${r.turnos} | ${dinero(r.costo)} | ${r.kbTotal} KB${sinTranscript}`);
    }
  }

  const categorias = s.lecturas.kbPorCategoria;
  lineas.push(`KB leídos por categoría: definiciones ${categorias.definiciones}, tareas ${categorias.tareas}, otros ${categorias.otros}`);
  lineas.push(`KB de definitions/ leídos por el coordinador: ${categorias.definiciones}`);
  const masLeidos = Object.entries(s.lecturas.porArchivo)
    .sort(([ra, a], [rb, b]) => b.kb - a.kb || b.lecturas - a.lecturas || compararTexto(ra, rb))
    .slice(0, 5);
  if (masLeidos.length === 0) {
    lineas.push("archivos más leídos por el coordinador: ninguno");
  } else {
    lineas.push("archivos más leídos por el coordinador (KB | lecturas | ruta):");
    for (const [ruta, v] of masLeidos) lineas.push(`  ${v.kb} KB | ${v.lecturas} | ${ruta}`);
  }

  if (tareas !== undefined) {
    const porTarea = porTareaDe(s, tareas);
    lineas.push(`costo por tarea: ${porTarea.costo === null ? "n/d" : `US$${porTarea.costo.toFixed(2)}`}`);
    lineas.push(`turnos por tarea: ${porTarea.turnos.toFixed(2)}`);
  }
  return lineas;
}

// Informe de texto por sesión, con la nota final de alcance.
export function formatearInforme(sesiones, { tareas } = {}) {
  const bloques = sesiones.map((s) => lineasDeSesion(s, tareas).join("\n"));
  const cuerpo = bloques.length > 0 ? bloques.join("\n\n") : "No hay sesiones (*.jsonl) bajo la raíz.";
  return `${cuerpo}\n\nSolo se cuentan lecturas con la herramienta read; lo leído por bash no se mide.\n`;
}

// Mismo contenido que el informe de texto, como { sesiones: [...] }; con tareas, cada sesión lleva porTarea.
export function informeJson(sesiones, { tareas } = {}) {
  const salida = sesiones.map((s) => (tareas === undefined ? s : { ...s, porTarea: porTareaDe(s, tareas) }));
  return `${JSON.stringify({ sesiones: salida }, null, 2)}\n`;
}

// Lee los argumentos. Cualquier cosa desconocida, repetida o inválida es error (sin tocar nada).
export function leerArgumentos(args) {
  const opciones = { raiz: null, hasta: undefined, tareas: undefined, json: false };
  const vistas = new Set();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") {
      if (vistas.has(a)) return { error: `opción repetida '${a}'` };
      vistas.add(a);
      opciones.json = true;
    } else if (a === "--raiz" || a === "--hasta" || a === "--tareas") {
      if (vistas.has(a)) return { error: `opción repetida '${a}'` };
      vistas.add(a);
      const valor = args[i + 1];
      if (valor === undefined || valor.startsWith("--")) return { error: `falta el valor de ${a}` };
      i++;
      if (a === "--raiz") {
        opciones.raiz = resolve(valor);
      } else if (a === "--hasta") {
        if (Number.isNaN(Date.parse(valor))) return { error: `--hasta no es una fecha ISO válida: '${valor}'` };
        opciones.hasta = valor;
      } else {
        if (!/^\d+$/.test(valor) || Number(valor) < 1) return { error: "--tareas exige un entero ≥ 1" };
        opciones.tareas = Number(valor);
      }
    } else {
      return { error: `argumento desconocido '${a}'` };
    }
  }
  if (opciones.raiz === null) return { error: "falta --raiz <dir>" };
  return { opciones };
}

// Ejecuta la CLI y devuelve el código de salida.
function ejecutarCli(args) {
  const { error, opciones } = leerArgumentos(args);
  if (error) {
    process.stderr.write(`error: ${error}\n`);
    return 1;
  }
  if (!existsSync(opciones.raiz) || !statSync(opciones.raiz).isDirectory()) {
    process.stderr.write(`error: --raiz no es una carpeta: ${opciones.raiz}\n`);
    return 1;
  }
  const sesiones = descubrirSesiones(opciones.raiz, { hasta: opciones.hasta });
  const tareas = opciones.tareas;
  const salida = opciones.json ? informeJson(sesiones, { tareas }) : formatearInforme(sesiones, { tareas });
  process.stdout.write(salida);
  return 0;
}

const RUTA_ESTE = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE) {
  process.exitCode = ejecutarCli(process.argv.slice(2));
}
