#!/usr/bin/env node
// Chequeo de contexto y archivo de lo terminado (definitions/WORKFLOW.md §10). Este modo es solo lectura.
//
// Uso:
//   node scripts/archivar.mjs                  imprime el informe del chequeo
//   node scripts/archivar.mjs --raiz <dir>     igual, sobre otra raíz (lo usan las pruebas)
//
// Siempre termina con código 0: es un aviso, no una puerta. Nunca escribe, mueve ni corrige estados.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Puntos de partida a calibrar (1 KB = 1024 caracteres).
export const UMBRALES = {
  STATUS: 3072,
  BACKLOG: 8192,
  AGENTS: 2048,
  FILA_HECHA: 300,
  DEFINICION_INFORMATIVO: 30720,
};

const RE_FILA = /^\| F\d{2} \|/;
const RE_CARPETA = /^F\d{2}-/;
const RE_TAREA = /^task-(\d{2})-.+\.md$/;
const RE_ESTADO = /^repo: .*estado: (.+?)\s*$/m;

function celdas(linea) {
  return linea.split("|").slice(1, -1).map((c) => c.trim());
}

function estadoTarea(texto) {
  return RE_ESTADO.exec(String(texto))?.[1]?.trim() ?? "";
}

function listarCarpetas(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .sort();
}

function tareasDe(carpeta) {
  return readdirSync(carpeta)
    .filter((n) => RE_TAREA.test(n))
    .sort()
    .map((archivo) => ({
      archivo,
      numero: RE_TAREA.exec(archivo)[1],
      estado: estadoTarea(readFileSync(join(carpeta, archivo), "utf8")),
    }));
}

function medirArchivo(raiz, ruta, umbral) {
  const abs = join(raiz, ruta);
  if (!existsSync(abs)) {
    return { ruta, caracteres: 0, lineas: 0, umbral, excede: false, existe: false };
  }
  const texto = readFileSync(abs, "utf8");
  const partes = texto.split("\n");
  if (partes.at(-1) === "") partes.pop();
  return {
    ruta,
    caracteres: texto.length,
    lineas: partes.length,
    umbral,
    excede: texto.length > umbral,
    existe: true,
  };
}

// Filas «| Fxx |» del backlog: ID (c[0]), «Por qué en esta posición» (c[5]), Estado (c[6]).
function filasDelBacklog(backlog) {
  const filas = [];
  for (const linea of String(backlog ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    if (!RE_FILA.test(linea)) continue;
    const c = celdas(linea);
    if (c.length < 7) continue;
    filas.push({ id: c[0], porQue: c[5] ?? "", estado: c[6] });
  }
  return filas;
}

function medirArchivos(raiz) {
  const medidos = [
    medirArchivo(raiz, "AGENTS.md", UMBRALES.AGENTS),
    medirArchivo(raiz, "definitions/STATUS.md", UMBRALES.STATUS),
    medirArchivo(raiz, "definitions/BACKLOG.md", UMBRALES.BACKLOG),
  ];
  const dirDefiniciones = join(raiz, "definitions");
  const resto = existsSync(dirDefiniciones)
    ? readdirSync(dirDefiniciones)
        .filter((n) => n.endsWith(".md") && !["STATUS.md", "BACKLOG.md"].includes(n))
        .sort()
    : [];
  for (const n of resto) {
    medidos.push(medirArchivo(raiz, `definitions/${n}`, UMBRALES.DEFINICION_INFORMATIVO));
  }
  return medidos;
}

export function chequear(raiz) {
  const archivos = medirArchivos(raiz);

  let backlog = null;
  const rutaBacklog = join(raiz, "definitions", "BACKLOG.md");
  if (existsSync(rutaBacklog)) backlog = readFileSync(rutaBacklog, "utf8");
  const filas = filasDelBacklog(backlog);

  const estados = new Map(filas.map((f) => [f.id, f.estado]));
  const filasHecha = filas
    .filter((f) => f.estado === "hecha")
    .map((f) => ({ id: f.id, largo: f.porQue.length, excede: f.porQue.length > UMBRALES.FILA_HECHA }));

  const dirFeatures = join(raiz, "features");
  const dirCompleted = join(dirFeatures, "completed");
  const carpetas = listarCarpetas(dirFeatures).filter((n) => RE_CARPETA.test(n));
  const archivadas = listarCarpetas(dirCompleted).filter((n) => RE_CARPETA.test(n));

  const candidatas = [];
  const inconsistentes = [];
  const carpetasSinFilaHecha = [];

  // Carpetas con todas sus tareas hechas, pero cuya fila no está «hecha» (solo informa).
  for (const carpeta of carpetas) {
    const id = carpeta.slice(0, 3);
    if (estados.get(id) === "hecha") continue;
    const tareas = tareasDe(join(dirFeatures, carpeta));
    if (tareas.length > 0 && tareas.every((t) => t.estado === "hecha")) {
      carpetasSinFilaHecha.push(carpeta);
    }
  }

  // Features con fila «hecha»: candidata o inconsistente (definitions/WORKFLOW.md §10.2).
  const hechas = [...new Set(filas.filter((f) => f.estado === "hecha").map((f) => f.id))];
  for (const id of hechas) {
    const enFeatures = carpetas.filter((c) => c.startsWith(`${id}-`));
    const enCompleted = archivadas.filter((c) => c.startsWith(`${id}-`));

    if (enFeatures.length === 0 && enCompleted.length > 0) continue; // ya archivada
    if (enFeatures.length === 0) {
      inconsistentes.push({ id, motivo: "fila hecha sin carpeta en features/ ni en features/completed/" });
      continue;
    }
    if (enFeatures.length > 1) {
      inconsistentes.push({ id, motivo: `más de una carpeta ${id}-* en features/` });
      continue;
    }

    const carpeta = enFeatures[0];
    const motivos = [];
    if (enCompleted.length > 0) {
      motivos.push(`el destino features/completed/${enCompleted[0]} ya existe`);
    }
    const tareas = tareasDe(join(dirFeatures, carpeta));
    if (tareas.length === 0) {
      motivos.push("carpeta sin tareas");
    }
    for (const t of tareas) {
      if (t.estado !== "hecha") {
        const estado = t.estado || "sin estado";
        motivos.push(`fila hecha, pero task-${t.numero} está ${estado}`);
      }
    }

    if (motivos.length > 0) {
      for (const motivo of motivos) inconsistentes.push({ id, motivo });
    } else {
      candidatas.push(id);
    }
  }

  return { archivos, filasHecha, candidatas, inconsistentes, carpetasSinFilaHecha };
}

const aviso = (excede) => (excede ? " AVISO" : "");

export function formatearInforme(r) {
  const lineas = ["Chequeo de contexto y archivo (solo lectura; definitions/WORKFLOW.md §10)", ""];

  lineas.push("## Tamaño de lo que se lee");
  for (const a of r.archivos) {
    if (!a.existe) {
      lineas.push(`- ${a.ruta}: no existe`);
    } else {
      lineas.push(
        `- ${a.ruta}: ${a.caracteres} caracteres, ${a.lineas} líneas (umbral ${a.umbral})${aviso(a.excede)}`
      );
    }
  }
  lineas.push("");

  lineas.push("## Filas hechas del backlog");
  if (r.filasHecha.length === 0) lineas.push("- ninguna");
  for (const f of r.filasHecha) {
    lineas.push(`- ${f.id}: ${f.largo} caracteres (umbral ${UMBRALES.FILA_HECHA})${aviso(f.excede)}`);
  }
  lineas.push("");

  lineas.push("## Candidatas a archivar");
  if (r.candidatas.length === 0) lineas.push("- ninguna");
  for (const id of r.candidatas) lineas.push(`- ${id}`);
  lineas.push("");

  lineas.push("## Inconsistentes");
  if (r.inconsistentes.length === 0) lineas.push("- ninguna");
  for (const i of r.inconsistentes) lineas.push(`- ${i.id}: ${i.motivo}`);
  lineas.push("");

  lineas.push("## Features con tareas hechas y fila no hecha");
  if (r.carpetasSinFilaHecha.length === 0) lineas.push("- ninguna");
  for (const c of r.carpetasSinFilaHecha) lineas.push(`- ${c}`);

  return lineas.join("\n") + "\n";
}

const RUTA_ESTE = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE) {
  const args = process.argv.slice(2);
  let raiz = join(dirname(RUTA_ESTE), "..");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--raiz" && args[i + 1]) {
      raiz = resolve(args[i + 1]);
      i++;
    } else {
      console.error(`argumento no reconocido: ${args[i]}`);
    }
  }
  process.stdout.write(formatearInforme(chequear(raiz)));
  process.exit(0);
}
