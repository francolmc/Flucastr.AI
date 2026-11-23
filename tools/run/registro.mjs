import { appendFileSync } from "node:fs";

// Mide una función síncrona (los pasos de kit run son spawnSync): devuelve su valor y los milisegundos enteros que tardó.
function medir(fn) {
  const inicio = process.hrtime.bigint();
  const valor = fn();
  const ms = Number((process.hrtime.bigint() - inicio) / 1000000n);
  return { valor, ms };
}

// Agrega una línea JSON al registro. Nunca lanza: si no puede escribir, avisa por stderr y devuelve false.
function registrar(ruta, registro) {
  try {
    appendFileSync(ruta, `${JSON.stringify(registro)}\n`);
    return true;
  } catch (e) {
    console.error(`kit-run: no se pudo escribir el registro ${ruta}: ${e.message}`);
    return false;
  }
}

export { medir, registrar };
