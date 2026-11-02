#!/usr/bin/env node
// CLI de la puerta previa de tarea (definitions/WORKFLOW.md §6). Delgado sobre scripts/formato-tarea.mjs.
//
// Uso:
//   node scripts/validar-tarea.mjs <ruta-tarea>...
//   node scripts/validar-tarea.mjs --evidencia <ruta-tarea>...
//   node scripts/validar-tarea.mjs --fuente <ruta-tarea>...
//   node scripts/validar-tarea.mjs --presupuesto features/Fxx-nombre
//
// Con --presupuesto (debe ser el primer argumento, con exactamente una carpeta de feature) es solo lectura:
// lee las task-*.md de esa carpeta y definitions/STATUS.md (desde el directorio actual), valida el STATUS.md
// compacto con validarStatusCompacto y, si es válido, imprime la línea de calcularPresupuesto
// (scripts/formato-presupuesto.mjs). Sale 0 con ok o aviso; 1 con excedido o STATUS.md inválido; 2 por uso o lectura.
// Con --evidencia (debe ser el primer argumento) comprueba la sección «Evidencia» con validarEvidencia
// (scripts/formato-evidencia.mjs) en vez de la puerta previa.
// Con --fuente (también primer argumento; no se combina con --evidencia) hace la puerta previa y, además,
// la comprobación de la viñeta «- Fuente:» con validarFuente (scripts/formato-fuente.mjs), leyendo desde el directorio actual.
// Cualquier otra opción «--...» sale con 2.
//
// Salida: 0 si todas las tareas son válidas; 1 si alguna es inválida; 2 por error de uso
// (sin argumentos, una opción desconocida, o una ruta que no se puede leer, aunque otras sean inválidas).
// Por stdout, una línea por rechazo («<ruta>: <motivo>»), o «OK: <n> tarea(s) válida(s)» si todas pasan
// («OK: <n> tarea(s) con evidencia completa» con --evidencia).
// Los errores de uso van a stderr. Solo lee los archivos indicados: no escribe, no usa red ni git.
//
// Se ejecuta al cargarse (lo importa el lanzador fijo de ~/.flucastr-ai); por eso no exporta nada
// y usa process.exitCode, no process.exit, para no cortar la salida pendiente.

import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { validarTarea } from "./formato-tarea.mjs";
import { validarEvidencia } from "./formato-evidencia.mjs";
import { validarFuente } from "./formato-fuente.mjs";
import { calcularPresupuesto, validarStatusCompacto } from "./formato-presupuesto.mjs";

const argumentos = process.argv.slice(2);
const conPresupuesto = argumentos[0] === "--presupuesto";
const conEvidencia = argumentos[0] === "--evidencia";
const conFuente = argumentos[0] === "--fuente";
const rutas = conEvidencia || conFuente ? argumentos.slice(1) : argumentos;
const opcionDesconocida = argumentos.find((a, i) => a.startsWith("--") && !(i === 0 && (a === "--evidencia" || a === "--fuente" || a === "--presupuesto")));
const leerTexto = (ruta) => {
  try {
    return readFileSync(ruta, "utf8");
  } catch {
    return null;
  }
};

// --presupuesto (task-02 de F29): devuelve el código de salida. No escribe nada.
function presupuesto(args) {
  const uso = "Uso: node validar-tarea.mjs --presupuesto features/Fxx-nombre";
  if (args.length !== 1) {
    console.error(uso);
    return 2;
  }
  const carpeta = args[0];
  const feature = /^F\d+/.exec(basename(carpeta))?.[0];
  if (feature === undefined) {
    console.error(`${carpeta}: el nombre de la carpeta debe empezar por Fxx (p. ej. F29-nombre).`);
    return 2;
  }
  let tareas;
  try {
    tareas = readdirSync(carpeta, { withFileTypes: true })
      .filter((e) => e.isFile() && /^task-.*\.md$/.test(e.name))
      .map((e) => e.name)
      .sort()
      .map((nombre) => readFileSync(join(carpeta, nombre), "utf8"));
  } catch {
    console.error(`No se puede leer la carpeta: ${carpeta}`);
    return 2;
  }
  let status;
  try {
    status = readFileSync("definitions/STATUS.md", "utf8");
  } catch {
    console.error("No se puede leer: definitions/STATUS.md");
    return 2;
  }
  const motivos = validarStatusCompacto(status);
  if (motivos.length > 0) {
    for (const motivo of motivos) console.log(`definitions/STATUS.md: ${motivo}`);
    return 1;
  }
  const { linea, estado } = calcularPresupuesto({ feature, tareas, status });
  console.log(linea);
  return estado === "excedido" ? 1 : 0;
}

if (conPresupuesto) {
  process.exitCode = presupuesto(argumentos.slice(1));
} else if (opcionDesconocida !== undefined) {
  console.error(`Opción desconocida: ${opcionDesconocida}`);
  process.exitCode = 2;
} else if (rutas.length === 0) {
  console.error("Uso: node validar-tarea.mjs [--evidencia] <ruta-tarea>...");
  process.exitCode = 2;
} else {
  let errorDeUso = false;
  let invalidas = 0;
  let validas = 0;
  const rechazos = [];

  for (const ruta of rutas) {
    let texto;
    try {
      texto = readFileSync(ruta, "utf8");
    } catch {
      console.error(`No se puede leer: ${ruta}`);
      errorDeUso = true;
      continue;
    }
    const motivos = conEvidencia ? validarEvidencia(texto) : validarTarea(texto);
    if (conFuente) motivos.push(...validarFuente(texto, leerTexto));
    if (motivos.length === 0) {
      validas += 1;
    } else {
      invalidas += 1;
      for (const motivo of motivos) rechazos.push(`${ruta}: ${motivo}`);
    }
  }

  if (rechazos.length > 0) console.log(rechazos.join("\n"));

  if (errorDeUso) {
    process.exitCode = 2;
  } else if (invalidas > 0) {
    process.exitCode = 1;
  } else {
    console.log(conEvidencia ? `OK: ${validas} tarea(s) con evidencia completa` : `OK: ${validas} tarea(s) válida(s)`);
    process.exitCode = 0;
  }
}
