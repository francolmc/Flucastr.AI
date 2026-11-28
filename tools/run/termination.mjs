import { appendFileSync } from "node:fs";

const ISO_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const ESTADOS = new Set(["DONE", "PAUSED", "INVALIDO", "INTERRUMPIDO"]);

export function validarRetorno(texto) {
  const linea = String(texto ?? "").split(/\r?\n/, 1)[0];
  const done = linea.match(/^DONE: plan=(.+?); (?:segment=(\d+); )?verify=pasa$/);
  if (done) return { ok: true, resultado: "DONE", plan: done[1], tramo: done[2] === undefined ? null : Number(done[2]) };
  const paused = linea.match(/^PAUSED: plan=(.+?); (?:segment=(\d+); )?motivo=(ambiguous|design|scope|access|verify); hecho=(\d+)\/(\d+); siguiente=(.+?); no_intentado=(.*)$/);
  if (paused) return { ok: true, resultado: "PAUSED", plan: paused[1], tramo: paused[2] === undefined ? null : Number(paused[2]), motivo: paused[3], hecho: `${paused[4]}/${paused[5]}`, siguiente: paused[6], no_intentado: paused[7] };
  const tipo = linea.match(/^(DONE|PAUSED):/);
  if (tipo) {
    const claves = tipo[1] === "DONE" ? ["plan", "verify"] : ["plan", "motivo", "hecho", "siguiente", "no_intentado"];
    const presentes = new Set([...linea.matchAll(/(?:^|; )([a-z_]+)=/g)].map((m) => m[1]));
    // La primera clave sigue al marcador, no a un separador de campos.
    const primera = linea.match(/^(?:DONE|PAUSED): ([a-z_]+)=/);
    if (primera) presentes.add(primera[1]);
    const faltante = claves.find((clave) => !presentes.has(clave));
    if (faltante) return { ok: false, error: `falta la clave ${faltante}` };
  }
  return { ok: false, error: "retorno de builder no cumple el contrato" };
}

export function crearTerminacion(registro, resultado, detalles = {}, fecha = new Date().toISOString()) {
  if (!registro || typeof registro.plan !== "string" || !(registro.tramo === null || Number.isInteger(registro.tramo))) throw new TypeError("intento requiere plan y tramo válido");
  if (!ESTADOS.has(resultado)) throw new TypeError("resultado de término inválido");
  if (!ISO_UTC.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new TypeError("fecha de término debe ser ISO-8601 UTC");
  const { motivo, hecho, siguiente, no_intentado, retorno, detalle } = detalles;
  const terminacion = { fecha, resultado };
  for (const [clave, valor] of Object.entries({ motivo, hecho, siguiente, no_intentado, retorno, detalle })) {
    if (valor !== undefined) terminacion[clave] = String(valor).slice(0, 600);
  }
  return { ...registro, terminacion };
}

export function registrarTermino(ruta, registro, resultado, detalles = {}, fecha) {
  const terminado = crearTerminacion(registro, resultado, detalles, fecha);
  try {
    appendFileSync(ruta, `${JSON.stringify(terminado)}\n`);
    return { ok: true, registro: terminado };
  } catch (error) {
    console.error(`kit-run: no se pudo escribir el registro ${ruta}: ${error.message}`);
    return { ok: false, error };
  }
}
