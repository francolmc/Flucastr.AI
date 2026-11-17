import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { huellaActual } from "./fingerprint.mjs";

const NIVELES = ["rapida", "servicio", "aceptacion"];
const FALLOS = ["ninguno", "entorno", "dependencia", "prueba", "tiempo"];

export function validarResultado(obj) {
  const motivos = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return ["no es un objeto JSON"];
  if (typeof obj.huella !== "string" || !/^[0-9a-f]{12}$/.test(obj.huella)) motivos.push("huella debe ser 12 hex en minúsculas");
  if (!NIVELES.includes(obj.nivel)) motivos.push(`nivel "${obj.nivel}" no es rapida|servicio|aceptacion`);
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
  const actual = huellaActual(carpeta);
  let huella;
  if (actual === null) huella = "no disponible";
  else huella = obj.huella === actual ? "vigente" : "obsoleta";
  return { ...base, estado: "valido", huella, huellaValor: obj.huella, nivel: obj.nivel, fase: obj.fase, ok: obj.ok, fallo: obj.fallo };
}
