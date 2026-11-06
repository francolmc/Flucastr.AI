#!/usr/bin/env node
// Mide el crecimiento de definitions/*.md en la pasada actual frente a HEAD y falla si supera el tope.
//
// Uso:
//   node scripts/crecimiento-definiciones.mjs [--raiz <dir>] [--tope <n>]
//
// crecimiento(antes, despues) recibe dos objetos { nombre: bytes } y devuelve la suma de los aumentos:
// un archivo nuevo cuenta entero; uno que encoge cuenta 0.
// La CLI mide definitions/*.md del disco contra `git show HEAD:definitions/<archivo>` (0 si no existe en HEAD).
//
// Salida: 0 si el crecimiento <= tope (por defecto TOPE_PASADA); 1 si lo supera (mensaje FALLA por stderr);
// 2 por error de uso (opción desconocida o valor inválido), con «Uso: ...» por stderr.
// Solo lee: no escribe archivos, no altera el árbol de trabajo ni el índice de git.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TOPE_PASADA = 12288;

const USO = "Uso: node scripts/crecimiento-definiciones.mjs [--raiz <dir>] [--tope <n>]";

// Suma de los aumentos de tamaño de cada archivo de `despues` respecto de `antes` (0 si no estaba o encoge).
export function crecimiento(antes, despues) {
  let total = 0;
  for (const nombre of Object.keys(despues)) {
    const previo = antes[nombre] ?? 0;
    const aumento = despues[nombre] - previo;
    if (aumento > 0) total += aumento;
  }
  return total;
}

// Bytes de definitions/<nombre> en HEAD del repo en `raiz`; 0 si no existe en HEAD.
function bytesEnHead(raiz, nombre) {
  try {
    const contenido = execFileSync("git", ["show", `HEAD:definitions/${nombre}`], {
      cwd: raiz,
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return contenido.length;
  } catch {
    return 0;
  }
}

// Bytes actuales de definitions/*.md en `raiz`, por nombre de archivo.
function medirDisco(raiz) {
  const dir = join(raiz, "definitions");
  const medidas = {};
  let nombres = [];
  try {
    nombres = readdirSync(dir).filter((n) => n.endsWith(".md"));
  } catch {
    return medidas;
  }
  for (const nombre of nombres) {
    medidas[nombre] = readFileSync(join(dir, nombre)).length;
  }
  return medidas;
}

// Mide la pasada: bytes de HEAD y bytes del disco para cada definitions/*.md del disco.
function medirPasada(raiz) {
  const despues = medirDisco(raiz);
  const antes = {};
  for (const nombre of Object.keys(despues)) {
    antes[nombre] = bytesEnHead(raiz, nombre);
  }
  return { antes, despues };
}

// Interpreta los argumentos. Devuelve { raiz, tope } o null si el uso es inválido.
function leerArgumentos(argumentos) {
  let raiz = process.cwd();
  let tope = TOPE_PASADA;
  for (let i = 0; i < argumentos.length; i++) {
    const a = argumentos[i];
    if (a === "--raiz" || a === "--tope") {
      const valor = argumentos[i + 1];
      if (valor === undefined || valor.startsWith("--")) return null;
      i++;
      if (a === "--raiz") {
        raiz = resolve(valor);
      } else {
        if (!/^\d+$/.test(valor)) return null;
        tope = Number(valor);
      }
    } else {
      return null;
    }
  }
  return { raiz, tope };
}

function main(argumentos) {
  const opciones = leerArgumentos(argumentos);
  if (opciones === null) {
    console.error(USO);
    return 2;
  }
  const { antes, despues } = medirPasada(opciones.raiz);
  const total = crecimiento(antes, despues);
  console.log(`Crecimiento: ${total} bytes (tope ${opciones.tope})`);
  if (total <= opciones.tope) return 0;
  console.error(`FALLA: la pasada creció ${total} bytes; el tope es ${opciones.tope}`);
  return 1;
}

const esCli = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (esCli) {
  process.exitCode = main(process.argv.slice(2));
}
