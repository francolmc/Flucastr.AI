import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fingerprintCurrent } from "./fingerprint.mjs";

const NIVELES = ["rapida", "servicio", "aceptacion"];
const FALLOS = ["ninguno", "entorno", "dependencia", "prueba", "tiempo"];

// The kit writes `fingerprint`. Older files used `huella`; it is still read as a legacy key.
export function fingerprintOf(obj) {
  return typeof obj.fingerprint === "string" ? obj.fingerprint : obj.huella;
}

export function validarResultado(obj) {
  const motivos = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return ["no es un objeto JSON"];
  const value = fingerprintOf(obj);
  if (typeof value !== "string" || !/^[0-9a-f]{12}$/.test(value)) motivos.push("fingerprint debe ser 12 hex en minúsculas");
  if (!NIVELES.includes(obj.level)) motivos.push(`nivel "${obj.level}" no es rapida|servicio|aceptacion`);
  if (typeof obj.fase !== "string") motivos.push("fase debe ser texto");
  if (typeof obj.ok !== "boolean") motivos.push("ok debe ser booleano");
  if (!FALLOS.includes(obj.fallo)) motivos.push(`fallo "${obj.fallo}" no es ninguno|entorno|dependencia|prueba|tiempo`);
  return motivos;
}

export function leerResultado(carpeta, rutaRel) {
  const ruta = join(carpeta, rutaRel);
  const base = { tipo: "resultado", ruta: rutaRel };
  if (!existsSync(ruta)) return { ...base, estado: "no existe" };
  let obj;
  try {
    obj = JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    return { ...base, estado: "invalido", motivos: [`no es JSON válido: ${e.message}`] };
  }
  const motivos = validarResultado(obj);
  if (motivos.length) return { ...base, estado: "invalido", motivos };
  const actual = fingerprintCurrent(carpeta);
  const value = fingerprintOf(obj);
  let status;
  if (actual === null) status = "no disponible";
  else status = value === actual ? "vigente" : "obsoleta";
  return { ...base, estado: "valido", fingerprintStatus: status, fingerprintValue: value, level: obj.level, fase: obj.fase, ok: obj.ok, fallo: obj.fallo };
}
