#!/usr/bin/env node
// Medición de consumo de F20 (solo lectura sobre logs de sesiones).
//
// Uso:
//   Esta versión solo exporta funciones puras; todavía no tiene CLI (llega en una tarea posterior).
//   import { analizarSesionPi } from "./scripts/consumo.mjs";
//   analizarSesionPi(textoJsonl, { hasta: "2026-10-30T12:00:00Z" })  → agregados del coordinador de Pi
//
// No lee archivos, no hace red ni llama a ningún modelo. Las líneas que no son JSON y los registros
// que no son turnos del asistente se ignoran.

// Tramos de contexto por turno (contexto = input + cacheRead + cacheWrite).
// menos30k: < 30000; de30a60k: 30000–60000 (incluido); mas60k: > 60000.
const TRAMO_30K = 30000;
const TRAMO_60K = 60000;

// Redondeo para evitar ruido de coma flotante en los costos sumados.
const redondear = (x) => Math.round(x * 1e10) / 1e10;

function tramoDe(contexto) {
  if (contexto < TRAMO_30K) return "menos30k";
  if (contexto <= TRAMO_60K) return "de30a60k";
  return "mas60k";
}

function numero(valor) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

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
  };

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
    if (!mensaje || mensaje.role !== "assistant") continue;

    const uso = mensaje.usage ?? {};
    const input = numero(uso.input);
    const output = numero(uso.output);
    const cacheRead = numero(uso.cacheRead);
    const cacheWrite = numero(uso.cacheWrite);
    const costo = numero(uso.cost?.total);
    const contexto = input + cacheRead + cacheWrite;
    const tramo = salida.tramos[tramoDe(contexto)];

    salida.turnos += 1;
    salida.costo = redondear(salida.costo + costo);
    salida.tokens.input += input;
    salida.tokens.output += output;
    salida.tokens.cacheRead += cacheRead;
    salida.tokens.cacheWrite += cacheWrite;
    tramo.turnos += 1;
    tramo.costo = redondear(tramo.costo + costo);

    for (const item of Array.isArray(mensaje.content) ? mensaje.content : []) {
      if (item?.type !== "toolCall" || typeof item.name !== "string") continue;
      salida.herramientas[item.name] = (salida.herramientas[item.name] ?? 0) + 1;
      if (item.name === "subagent") salida.llamadasSubagente += 1;
      if (item.name === "subagents_enable") salida.subagentsEnable += 1;
    }
  }

  return salida;
}
