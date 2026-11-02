#!/usr/bin/env node
// CLI de la puerta previa de tarea (definitions/WORKFLOW.md §6). Delgado sobre scripts/formato-tarea.mjs.
//
// Uso:
//   node scripts/validar-tarea.mjs <ruta-tarea>...
//   node scripts/validar-tarea.mjs --evidencia <ruta-tarea>...
//
// Con --evidencia (debe ser el primer argumento) comprueba la sección «Evidencia» con validarEvidencia
// (scripts/formato-evidencia.mjs) en vez de la puerta previa. Cualquier otra opción «--...» sale con 2.
//
// Salida: 0 si todas las tareas son válidas; 1 si alguna es inválida; 2 por error de uso
// (sin argumentos, una opción desconocida, o una ruta que no se puede leer, aunque otras sean inválidas).
// Por stdout, una línea por rechazo («<ruta>: <motivo>»), o «OK: <n> tarea(s) válida(s)» si todas pasan
// («OK: <n> tarea(s) con evidencia completa» con --evidencia).
// Los errores de uso van a stderr. Solo lee los archivos indicados: no escribe, no usa red ni git.
//
// Se ejecuta al cargarse (lo importa el lanzador fijo de ~/.flucastr-ai); por eso no exporta nada
// y usa process.exitCode, no process.exit, para no cortar la salida pendiente.

import { readFileSync } from "node:fs";
import { validarTarea } from "./formato-tarea.mjs";
import { validarEvidencia } from "./formato-evidencia.mjs";

const argumentos = process.argv.slice(2);
const conEvidencia = argumentos[0] === "--evidencia";
const rutas = conEvidencia ? argumentos.slice(1) : argumentos;
const opcionDesconocida = argumentos.find((a, i) => a.startsWith("--") && !(i === 0 && a === "--evidencia"));

if (opcionDesconocida !== undefined) {
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
