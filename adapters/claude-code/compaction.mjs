import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ajustesDeObjeto } from "../../tools/resolver/json-settings.mjs";
import { esEntero, tiene } from "../../tools/resolver/object.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";

// Claude Code compacta a ventana − 33000 (informe 2026-10-31 de verificación de compactación);
// para compactar a compactar_en se escribe compactar_en + 33000.
const COLCHON_CLAUDE_CODE = 33000;
// Claude Code ignora en silencio un autoCompactWindow fuera de este rango.
const VENTANA_MINIMA_CLAUDE_CODE = 100000;
const VENTANA_MAXIMA_CLAUDE_CODE = 1000000;

// Valor de autoCompactWindow que corresponde al perfil por defecto de Claude Code, o la línea de omisión.
function valorClaude(c) {
  const perfil = (c.perfiles ?? {})[(c.perfil_por_defecto ?? {})["claude-code"]] ?? {};
  const compactar = perfil.compactar_en ?? c.compactar_en;
  if (!esEntero(compactar)) return { omision: "omitido-umbral" };
  const valor = compactar + COLCHON_CLAUDE_CODE;
  if (valor < VENTANA_MINIMA_CLAUDE_CODE || valor > VENTANA_MAXIMA_CLAUDE_CODE) {
    return { omision: `omitido-rango:${valor}` };
  }
  return { valor };
}

export function fijarCompactacionClaude(ruta, simular, leerConfig) {
  const { valor, omision } = valorClaude(leerConfig());
  const ajustes = ajustesDeObjeto(ruta);
  let salida;
  if (omision) {
    salida = omision;
  } else if (ajustes.autoCompactWindow === valor) {
    salida = "ya-estaba";
  } else if (tiene(ajustes, "autoCompactWindow")) {
    salida = "omitido-usuario";
  } else {
    salida = `fijado:${valor}`;
  }
  if (salida === `fijado:${valor}` && !simular) {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ ...ajustes, autoCompactWindow: valor }, null, 2) + "\n");
  }
  console.log(salida);
}

export function quitarCompactacionClaude(ruta, valor) {
  if (!existsSync(ruta)) {
    console.log("omitido");
    return;
  }
  const ajustes = ajustesDeObjeto(ruta);
  if (ajustes.autoCompactWindow !== Number(valor)) {
    console.log("omitido");
    return;
  }
  delete ajustes.autoCompactWindow;
  if (Object.keys(ajustes).length === 0) {
    rmSync(ruta);
    console.log("archivo-quitado");
  } else {
    escribirAtomico(ruta, ajustes);
    console.log("quitado");
  }
}
