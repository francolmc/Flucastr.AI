#!/usr/bin/env node
// CLI de la puerta previa de tarea (definitions/WORKFLOW.md §6). Delgado sobre scripts/formato-tarea.mjs.
//
// Uso:
//   node scripts/validar-tarea.mjs <ruta-tarea>...
//
// Salida: 0 si todas las tareas son válidas; 1 si alguna es inválida; 2 por error de uso
// (sin argumentos, o una ruta que no se puede leer, aunque otras sean inválidas).
// Por stdout, una línea por rechazo («<ruta>: <motivo>»), o «OK: <n> tarea(s) válida(s)» si todas pasan.
// Los errores de uso van a stderr. Solo lee los archivos indicados: no escribe, no usa red ni git.
//
// Se ejecuta al cargarse (lo importa el lanzador fijo de ~/.flucastr-ai); por eso no exporta nada
// y usa process.exitCode, no process.exit, para no cortar la salida pendiente.

import { readFileSync } from "node:fs";
import { validarTarea } from "./formato-tarea.mjs";

const rutas = process.argv.slice(2);

if (rutas.length === 0) {
  console.error("Uso: node validar-tarea.mjs <ruta-tarea>...");
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
    const motivos = validarTarea(texto);
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
    console.log(`OK: ${validas} tarea(s) válida(s)`);
    process.exitCode = 0;
  }
}
