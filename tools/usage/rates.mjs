import { readFileSync } from "node:fs";

// Tarifas por modelo (créditos por millón de tokens). Si el archivo no se puede leer, avisa y no hay tarifas.
export function cargarTarifas(ruta, avisos) {
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
export function creditosSesion(tarifas, modelo, t) {
  const tar = Object.hasOwn(tarifas, modelo) ? tarifas[modelo] : null;
  if (!t || !tar || !["entrada", "entrada_cache", "salida"].every((k) => typeof tar[k] === "number")) return null;
  const creditos = ((t.entrada + t.cache_escrita) * tar.entrada + t.cache_leida * tar.entrada_cache + t.salida * tar.salida) / 1e6;
  return Math.round(creditos * 10000) / 10000;
}
