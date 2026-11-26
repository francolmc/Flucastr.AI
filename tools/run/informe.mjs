import { readdirSync } from "node:fs";
import { join } from "node:path";

// Agregación del informe de kit run: lee changes/<nombre>/runs.jsonl (una línea por intento) y cuenta las devoluciones manuales «Devuelto:».
// Lectura estricta: cada línea no vacía debe ser un objeto JSON válido con campos de tipo esperado; las corruptas se reportan, no se ignoran.

export const FASES = ["builder_ms", "verify_ms", "revisor_ms"];
export const MOTIVOS = ["verify", "revisor", "puerta", "infra"];
export const CATEGORIAS = ["defecto", "omision", "verify", "otro"];

const LINEA_DEVUELTO = /^- Devuelto: (defecto|omision|verify|otro)\b/;
const CANDIDATA_DEVUELTO = /^- Devuelto:/;

// Lista los archivos cuyo nombre cumple `acepta` bajo `dir`, en orden estable.
export function recorrer(dir, acepta, salida = []) {
  const entradas = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta, acepta, salida);
    else if (e.isFile() && acepta(e.name)) salida.push(ruta);
  }
  return salida;
}

function esNumeroNoNegativo(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

// Devuelve la causa del problema o null si el objeto es un intento válido.
function validarRegistro(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return "la línea no es un objeto JSON";
  for (const f of FASES) {
    if (obj[f] !== null && !esNumeroNoNegativo(obj[f])) return `${f} debe ser un número no negativo o null`;
  }
  if (obj.motivo_relanzamiento !== null && !MOTIVOS.includes(obj.motivo_relanzamiento)) return "motivo_relanzamiento debe ser verify, revisor, puerta, infra o null";
  return null;
}

// Lee el texto de un runs.jsonl: devuelve los intentos válidos y las líneas con su causa (número de línea base 1).
export function leerRegistro(texto) {
  const validos = [];
  const errores = [];
  texto.split("\n").forEach((linea, i) => {
    if (!linea.trim()) return;
    let obj;
    try {
      obj = JSON.parse(linea);
    } catch (e) {
      errores.push({ linea: i + 1, causa: `JSON inválido (${e.message})` });
      return;
    }
    const causa = validarRegistro(obj);
    if (causa) errores.push({ linea: i + 1, causa });
    else validos.push(obj);
  });
  return { validos, errores };
}

// Mediana clásica: el promedio de los dos centrales cuando la cantidad es par. Sin datos, null.
export function mediana(valores) {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const m = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[m] : (orden[m - 1] + orden[m]) / 2;
}

// Percentil por rango más cercano (nearest rank). Sin datos, null.
export function percentil(valores, p) {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const rango = Math.max(1, Math.ceil((p * orden.length) / 100));
  return orden[rango - 1];
}

// Mediana y p90 por fase; solo cuentan los valores no nulos.
export function resumirFases(registros) {
  const resumen = {};
  for (const f of FASES) {
    const valores = registros.map((r) => r[f]).filter((v) => v !== null);
    resumen[f] = { n: valores.length, mediana: mediana(valores), p90: percentil(valores, 90) };
  }
  return resumen;
}

// Tasa de relanzamiento = intentos con motivo / intentos del registro; los motivos se cuentan aparte.
export function resumirRelanzamientos(registros) {
  const relanzados = registros.filter((r) => r.motivo_relanzamiento !== null);
  const motivos = Object.fromEntries(MOTIVOS.map((m) => [m, relanzados.filter((r) => r.motivo_relanzamiento === m).length]));
  return {
    intentos: registros.length,
    relanzados: relanzados.length,
    tasa: registros.length ? relanzados.length / registros.length : null,
    motivos,
  };
}

// Cuenta las líneas «- Devuelto: <categoría> ...» dentro de la sección ## Notes de un plan.
// Las mal formadas no se cuentan y van a avisos con su número de línea.
export function leerDevueltos(texto) {
  const conteos = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
  const avisos = [];
  let enNotes = false;
  texto.split("\n").forEach((linea, i) => {
    if (/^## /.test(linea)) {
      enNotes = linea.trim() === "## Notes";
      return;
    }
    if (!enNotes) return;
    const m = linea.match(LINEA_DEVUELTO);
    if (m) conteos[m[1]]++;
    else if (CANDIDATA_DEVUELTO.test(linea)) avisos.push({ linea: i + 1, causa: `categoría no válida, no se cuenta: ${linea.trim()}` });
  });
  return { conteos, avisos };
}

// Texto del informe. `registros` son los intentos válidos; `devueltos` los conteos manuales ya sumados.
export function formatear({ archivos, registros, devueltos }) {
  const lineas = [];
  if (registros.length === 0) {
    lineas.push("sin registros");
  } else {
    lineas.push(`Corridas de kit run: ${registros.length} intentos en ${archivos} archivo(s) runs.jsonl.`);
    const fases = resumirFases(registros);
    lineas.push("Fase        n    mediana  p90");
    for (const f of FASES) {
      const r = fases[f];
      lineas.push(r.n === 0 ? `${f.padEnd(12)}0    sin datos` : `${f.padEnd(12)}${String(r.n).padEnd(5)}${String(r.mediana).padEnd(9)}${r.p90}`);
    }
    const rel = resumirRelanzamientos(registros);
    const tasa = Math.round(rel.tasa * 1000) / 10;
    lineas.push(`Relanzamiento: ${rel.relanzados} de ${rel.intentos} intentos (${tasa} %); motivos: ${MOTIVOS.map((m) => `${m} ${rel.motivos[m]}`).join(", ")}.`);
  }
  lineas.push(`Devoluciones manuales (origen manual, aparte del registro): ${CATEGORIAS.map((c) => `${c} ${devueltos[c]}`).join(", ")}.`);
  return lineas.join("\n");
}
