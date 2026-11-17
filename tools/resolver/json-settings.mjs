import { existsSync, readFileSync } from "node:fs";
import { fallar } from "./errors.mjs";
import { esObjeto } from "./object.mjs";

export function leerJson(ruta) {
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    fallar(`no pude leer ${ruta} (${e.message})`);
  }
}

export function leerAjustes(ruta) {
  if (!existsSync(ruta)) return {};
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    fallar(`${ruta} no es JSON válido (${e.message}); no lo toco`);
  }
}

// Ajustes de Pi como objeto; si no es JSON válido, falla sin tocar nada.
export function ajustesDeObjeto(ruta) {
  const ajustes = leerAjustes(ruta);
  if (!esObjeto(ajustes)) fallar(`${ruta} no es JSON válido; no lo toco`);
  return ajustes;
}

// Como ajustesDeObjeto, pero sin salir (para releer bajo el bloqueo). null si no es un objeto JSON.
export function leerAjustesOpcional(ruta) {
  if (!existsSync(ruta)) return {};
  try {
    const ajustes = JSON.parse(readFileSync(ruta, "utf8"));
    return esObjeto(ajustes) ? ajustes : null;
  } catch {
    return null;
  }
}
