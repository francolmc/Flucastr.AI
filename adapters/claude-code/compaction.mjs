import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ajustesDeObjeto } from "../../tools/resolver/json-settings.mjs";
import { esEntero, tiene } from "../../tools/resolver/object.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";

// Claude Code compacta a ventana − 33000 (informe 2026-10-31 de verificación de compactación);
// para compactar a compact_at se escribe compact_at + 33000.
const COLCHON_CLAUDE_CODE = 33000;
// Claude Code ignora en silencio un autoCompactWindow fuera de este rango.
const VENTANA_MINIMA_CLAUDE_CODE = 100000;
const VENTANA_MAXIMA_CLAUDE_CODE = 1000000;
// Valor que escribían versiones anteriores del kit sin registro: se trata como del kit (caso A5).
const VALOR_HEREDADO_CLAUDE_CODE = 133000;

// Valor de autoCompactWindow que corresponde al agente planner en Claude Code, o la línea de omisión.
function valorClaude(c, compactarEn) {
  const compactar = compactarEn(c, "planner", "claude-code");
  if (!esEntero(compactar)) return { omision: "omitido-umbral" };
  const valor = compactar + COLCHON_CLAUDE_CODE;
  if (valor < VENTANA_MINIMA_CLAUDE_CODE || valor > VENTANA_MAXIMA_CLAUDE_CODE) {
    return { omision: `omitido-rango:${valor}` };
  }
  return { valor };
}

// Banderas de fijar-compactacion claude: --registrado <v> (repetible), --solo-actualizar y --dry-run.
// Devuelve undefined si alguna no se reconoce.
export function analizarFijarClaude(resto) {
  const opciones = { registrados: [], soloActualizar: false, simular: false };
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    if (a === "--registrado" && /^\d+$/.test(resto[i + 1] ?? "")) {
      opciones.registrados.push(Number(resto[++i]));
    } else if (a === "--solo-actualizar") {
      opciones.soloActualizar = true;
    } else if (a === "--dry-run") {
      opciones.simular = true;
    } else {
      return undefined;
    }
  }
  return opciones;
}

// Solo toca autoCompactWindow: lo fija si falta, lo actualiza si lo escribió el kit y respeta cualquier otro valor.
export function fijarCompactacionClaude(ruta, resto, leerConfig, compactarEn) {
  const opciones = analizarFijarClaude(resto);
  const { valor, omision } = valorClaude(leerConfig(), compactarEn);
  const ajustes = ajustesDeObjeto(ruta);
  const actual = ajustes.autoCompactWindow;
  let salida;
  let escribir = false;
  if (omision) {
    salida = omision;
  } else if (!tiene(ajustes, "autoCompactWindow")) {
    salida = opciones.soloActualizar ? "sin-campo" : `fijado:${valor}`;
    escribir = !opciones.soloActualizar;
  } else if (actual === valor) {
    salida = "ya-estaba";
  } else if (opciones.registrados.includes(actual) || actual === VALOR_HEREDADO_CLAUDE_CODE) {
    salida = `actualizado:${valor}:${actual}`;
    escribir = true;
  } else {
    salida = "omitido-usuario";
  }
  if (escribir && !opciones.simular) {
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
