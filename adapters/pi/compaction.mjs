import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { fallar } from "../../tools/resolver/errors.mjs";
import { ajustesDeObjeto, leerAjustesOpcional } from "../../tools/resolver/json-settings.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";
import { conBloqueo } from "./file-lock.mjs";
import { aplicarFijarPi, candidatosPi, planFijarPi, quitarOverridePi } from "./compaction-plan.mjs";

export function fijarCompactacionPi(ruta, simular, leerConfig) {
  const c = leerConfig();
  const candidatos = candidatosPi(c);
  if (simular) {
    const plan = planFijarPi(ajustesDeObjeto(ruta), candidatos, c, !existsSync(ruta));
    for (const linea of plan.lineas) console.log(linea);
    return;
  }
  const previo = planFijarPi(ajustesDeObjeto(ruta), candidatos, c, !existsSync(ruta));
  if (previo.cambios.length === 0) {
    for (const linea of previo.lineas) console.log(linea);
    return;
  }

  mkdirSync(dirname(ruta), { recursive: true });
  let plan = null;
  let invalido = false;
  conBloqueo(ruta, () => {
    const creado = !existsSync(ruta);
    const ajustes = leerAjustesOpcional(ruta);
    if (ajustes === null) {
      invalido = true;
      return;
    }
    plan = planFijarPi(ajustes, candidatos, c, creado);
    if (plan.cambios.length > 0) {
      aplicarFijarPi(ajustes, plan.cambios);
      escribirAtomico(ruta, ajustes);
    }
  });
  if (invalido) fallar(`${ruta} no es JSON válido; no lo toco`);
  for (const linea of plan.lineas) console.log(linea);
}

export function quitarCompactacionPi(ruta, modelo, reserve, creado) {
  if (!existsSync(ruta) || !quitarOverridePi(ajustesDeObjeto(ruta), modelo, reserve)) {
    console.log("omitido");
    return;
  }
  let salida = "omitido";
  let invalido = false;
  conBloqueo(ruta, () => {
    if (!existsSync(ruta)) return;
    const ajustes = leerAjustesOpcional(ruta);
    if (ajustes === null) {
      invalido = true;
      return;
    }
    if (!quitarOverridePi(ajustes, modelo, reserve)) return;
    if (creado && Object.keys(ajustes).length === 0) {
      rmSync(ruta);
      salida = "archivo-quitado";
    } else {
      escribirAtomico(ruta, ajustes);
      salida = "quitado";
    }
  });
  if (invalido) fallar(`${ruta} no es JSON válido; no lo toco`);
  console.log(salida);
}
