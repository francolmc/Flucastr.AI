import { mkdirSync, rmdirSync, statSync } from "node:fs";
import { fallar } from "../../tools/resolver/errors.mjs";

const INTENTOS_BLOQUEO = 10;
const ESPERA_BLOQUEO_MS = 20;
const CADUCIDAD_BLOQUEO_MS = 10000;

function antiguo(ruta) {
  try {
    return Date.now() - statSync(ruta).mtimeMs > CADUCIDAD_BLOQUEO_MS;
  } catch {
    return false;
  }
}

// Toma el bloqueo de Pi (<ruta>.lock, un directorio), ejecuta fn y lo suelta siempre.
export function conBloqueo(ruta, fn) {
  const lock = `${ruta}.lock`;
  const espera = new Int32Array(new SharedArrayBuffer(4));
  let tomado = false;
  let huerfanoBorrado = false;
  for (let intento = 0; intento < INTENTOS_BLOQUEO && !tomado; intento++) {
    try {
      mkdirSync(lock);
      tomado = true;
    } catch (e) {
      if (e.code !== "EEXIST") break;
      if (!huerfanoBorrado && antiguo(lock)) {
        huerfanoBorrado = true;
        try {
          rmdirSync(lock);
        } catch {
          // lo borró otro proceso: se reintenta
        }
        continue;
      }
      Atomics.wait(espera, 0, 0, ESPERA_BLOQUEO_MS);
    }
  }
  if (!tomado) fallar(`no pude tomar el bloqueo ${lock}; no toco el archivo`);
  try {
    return fn();
  } finally {
    try {
      rmdirSync(lock);
    } catch {
      // ya no estaba
    }
  }
}
