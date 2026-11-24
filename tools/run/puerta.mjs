// Puerta mecánica de kit run: corre kit-check, kit-scope y kit-close como procesos (sin shell),
// con cwd = raíz del proyecto, y devuelve una lista exacta de lo que falta. Solo lectura.
// Salida 1 de una herramienta bloquea (relanza al builder). Salida 3 o 2, o no terminar, pasa al revisor
// como «no automatizable» sin bloquear. Avisos (p. ej. posible omisión) nunca bloquean.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { correr, topeMs } from "./process.mjs";

export const HERRAMIENTAS = ["kit-check.mjs", "kit-scope.mjs", "kit-close.mjs"];
const DIR_POR_OMISION = fileURLToPath(new URL("../../scripts/", import.meta.url));

// Nombres de las herramientas que no están en `dir` (por omisión, scripts/ del kit).
export function herramientasFaltantes(dir = DIR_POR_OMISION) {
  return HERRAMIENTAS.filter(h => !existsSync(join(dir, h)));
}

// Filas de la tabla de kit-check: `A# | estado | comando ejecutado | motivo/cola`. El detalle va tras el último « | ».
export function filasCheck(stdout) {
  const filas = [];
  for (const linea of stdout.split("\n")) {
    const m = linea.match(/^(A\d+) \| ([^|]+?) \| /);
    if (!m) continue;
    filas.push({ id: m[1], estado: m[2].trim(), detalle: linea.slice(linea.lastIndexOf(" | ") + 3).trim() });
  }
  return filas;
}

// Filas de kit-scope o kit-close con --json; null si la salida no es el JSON esperado.
function filasJson(stdout) {
  try {
    const j = JSON.parse(stdout);
    return Array.isArray(j.filas) ? j.filas : null;
  } catch {
    return null;
  }
}

function colaCorta(t) {
  const lineas = (t ?? "").split("\n").filter(l => l.trim() !== "");
  return lineas.length ? lineas[lineas.length - 1].slice(0, 200) : "";
}

// Convierte la salida de una herramienta en listas: lista (bloquea), noAuto (no bloquea) y avisos.
function analizarSalida(nombre, r) {
  const out = { nombre, codigo: r.status, lista: [], noAuto: [], avisos: [], alcance: false };
  if (r.error || r.status === null) {
    out.noAuto.push(`${nombre}: no terminó (${r.error ?? "sin código de salida"})`);
    return out;
  }
  if (r.status === 2) {
    out.noAuto.push(`${nombre}: salió con 2 (${colaCorta(r.stderr || r.stdout) || "uso o plan mal formado"})`);
    return out;
  }

  if (nombre === "kit-check.mjs") {
    for (const f of filasCheck(r.stdout)) {
      if (f.estado === "falla") out.lista.push(`${f.id}: ${f.detalle}`);
      else if (f.estado === "bloqueado" || f.estado === "no-automatizable") out.noAuto.push(`${f.id}: ${f.estado}`);
    }
  } else {
    const filas = filasJson(r.stdout);
    if (filas === null) {
      out.noAuto.push(`${nombre}: salida sin JSON`);
    } else {
      for (const f of filas) {
        const el = f.elemento ?? nombre;
        if (f.nivel === "error") {
          if (nombre === "kit-scope.mjs" && /fuera de Scope/.test(f.mensaje)) {
            out.alcance = true;
            out.lista.push(`fuera de alcance: ${el}`);
          } else {
            if (nombre === "kit-scope.mjs") out.alcance = true;
            out.lista.push(`${el}: ${f.mensaje}`);
          }
        } else if (f.nivel === "no_verificable") out.noAuto.push(`${el}: ${f.mensaje}`);
        else if (f.nivel === "aviso") out.avisos.push(`${el}: ${f.mensaje}`);
      }
    }
  }
  // Salida 1 sin ninguna fila que lo explique: sigue bloqueando, pero se dice que no hay detalle.
  if (r.status === 1 && out.lista.length === 0) out.lista.push(`${nombre}: salió con 1 sin detalle`);
  return out;
}

// Corre las tres herramientas (siempre las tres) y devuelve el resultado de la puerta.
// estado: "pasa" | "falla" | "no_verificable" (valores del campo `puerta` del registro).
export function ejecutarPuerta({ planPath, raiz, tramo, dirHerramientas = DIR_POR_OMISION }) {
  const faltan = herramientasFaltantes(dirHerramientas);
  if (faltan.length) {
    return { estado: "no_verificable", bloquea: false, motivo: null, lista: [], noAutomatizables: [`faltan: ${faltan.join(", ")}`], avisos: [], codigos: {} };
  }
  const argumentos = {
    "kit-check.mjs": [planPath, ...(tramo ? ["--segment", String(tramo)] : [])],
    "kit-scope.mjs": [planPath, "--json"],
    "kit-close.mjs": [planPath, "--resultado", "DONE", "--json"],
  };
  const resultados = HERRAMIENTAS.map(nombre => {
    const r = correr(
      { exe: process.execPath, args: [join(dirHerramientas, nombre), ...argumentos[nombre]] },
      undefined,
      raiz,
      false,
      topeMs("VERIFY"),
    );
    return analizarSalida(nombre, r);
  });

  const lista = resultados.flatMap(r => r.lista);
  const noAutomatizables = resultados.flatMap(r => r.noAuto);
  const avisos = resultados.flatMap(r => r.avisos);
  const bloquea = lista.length > 0;
  const motivo = bloquea ? (resultados.some(r => r.alcance) ? "scope" : "verify") : null;
  const estado = bloquea ? "falla" : noAutomatizables.length ? "no_verificable" : "pasa";
  const codigos = Object.fromEntries(resultados.map(r => [r.nombre, r.codigo]));
  return { estado, bloquea, motivo, lista, noAutomatizables, avisos, codigos };
}

// Texto que recibe el builder al relanzar por la puerta: la lista exacta de lo que falta.
export function textoParaBuilder(puerta) {
  const lineas = [
    "La puerta mecánica (kit-check, kit-scope, kit-close) no pasó. Corrige solo lo siguiente, dentro de Scope, y marca cada casilla solo con evidencia real:",
    ...puerta.lista.map(l => `- ${l}`),
  ];
  if (puerta.avisos.length) lineas.push("Avisos (no bloquean):", ...puerta.avisos.map(a => `- ${a}`));
  return lineas.join("\n");
}

// Texto que recibe el revisor: qué ya comprobó la puerta y qué quedó sin automatizar.
export function textoParaRevisor(puerta) {
  const lineas = [
    `Puerta mecánica: ${puerta.estado}. Lo que la puerta sí comprobó (alcance, casillas con evidencia, A# con corrida) no hace falta repetirlo.`,
  ];
  if (puerta.noAutomatizables.length) lineas.push("No automatizable (revísalo tú):", ...puerta.noAutomatizables.map(n => `- ${n}`));
  if (puerta.avisos.length) lineas.push("Avisos:", ...puerta.avisos.map(a => `- ${a}`));
  lineas.push("Enfócate en diseño, riesgos y lo no automatizable.");
  return lineas.join("\n");
}
