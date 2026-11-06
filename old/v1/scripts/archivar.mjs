#!/usr/bin/env node
// Chequeo de contexto y archivo de lo terminado (definitions/WORKFLOW.md §10).
//
// Uso:
//   node scripts/archivar.mjs                  imprime el informe del chequeo (solo lectura; código 0)
//   node scripts/archivar.mjs --raiz <dir>     igual, sobre otra raíz (lo usan las pruebas)
//   node scripts/archivar.mjs --aplicar F03    mueve a features/completed/ solo F03 (Fxx obligatorio;
//                                             código 1 si F03 no se movió)
//
// El chequeo nunca escribe, mueve ni corrige estados. --aplicar solo renombra carpetas: no sobrescribe,
// no borra y no toca BACKLOG.md, STATUS.md, ramas ni git. Lo ejecuta Franco o, a su pedido explícito,
// el coordinador (definitions/WORKFLOW.md §3.1); el commit es siempre de Franco.

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Puntos de partida a calibrar (1 KB = 1024 caracteres).
export const UMBRALES = {
  STATUS: 1536,
  TAREA: 6144,
  BACKLOG: 8192,
  AGENTS: 2048,
  FILA_HECHA: 300,
  DEFINICION_INFORMATIVO: 30720,
};

const RE_FILA = /^\| F\d{2} \|/;
const RE_CARPETA = /^F\d{2}-/;
const RE_ID = /^F\d{2}$/;
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

  // Tareas sobre el umbral (solo aviso): features/Fxx-* sin completed/, ruta relativa con «/».
  const tareasGrandes = [];
  for (const carpeta of carpetas) {
    for (const archivo of readdirSync(join(dirFeatures, carpeta)).sort()) {
      if (!RE_TAREA.test(archivo)) continue;
      const caracteres = readFileSync(join(dirFeatures, carpeta, archivo), "utf8").length;
      if (caracteres > UMBRALES.TAREA) {
        tareasGrandes.push({ ruta: `features/${carpeta}/${archivo}`, caracteres, umbral: UMBRALES.TAREA });
      }
    }
  }
  tareasGrandes.sort((a, b) => (a.ruta < b.ruta ? -1 : a.ruta > b.ruta ? 1 : 0));

  return { archivos, filasHecha, candidatas, inconsistentes, carpetasSinFilaHecha, tareasGrandes };
}

// Mueve a features/completed/ las features candidatas (ids = arreglo de IDs, o null para todas).
// Vuelve a calcular el chequeo, no sobrescribe, no borra y no toca BACKLOG.md ni STATUS.md.
export function aplicar(raiz, ids = null) {
  const r = chequear(raiz);
  const dirFeatures = join(raiz, "features");
  const dirCompleted = join(dirFeatures, "completed");
  const movidas = [];
  const omitidas = [];

  const pedidas = ids === null ? null : [...new Set(ids)];
  const aMover = [];

  if (pedidas === null) {
    for (const id of [...new Set(r.inconsistentes.map((i) => i.id))]) {
      omitidas.push({ id, motivo: motivoSinCandidata(raiz, r, id) });
    }
    aMover.push(...r.candidatas);
  } else {
    for (const id of pedidas) {
      if (r.candidatas.includes(id)) aMover.push(id);
      else omitidas.push({ id, motivo: motivoSinCandidata(raiz, r, id) });
    }
  }

  for (const id of aMover) {
    const carpeta = listarCarpetas(dirFeatures).find((c) => RE_CARPETA.test(c) && c.startsWith(`${id}-`));
    const destino = join(dirCompleted, carpeta);
    if (existsSync(destino)) {
      omitidas.push({ id, motivo: `el destino features/completed/${carpeta} ya existe` });
      continue;
    }
    mkdirSync(dirCompleted, { recursive: true });
    renameSync(join(dirFeatures, carpeta), destino);
    movidas.push({ id, desde: `features/${carpeta}`, hasta: `features/completed/${carpeta}` });
  }

  return { movidas, omitidas };
}

function motivoSinCandidata(raiz, r, id) {
  const motivos = r.inconsistentes.filter((i) => i.id === id).map((i) => i.motivo);
  if (motivos.length > 0) return motivos.join("; ");
  const rutaBacklog = join(raiz, "definitions", "BACKLOG.md");
  const backlog = existsSync(rutaBacklog) ? readFileSync(rutaBacklog, "utf8") : null;
  const fila = filasDelBacklog(backlog).find((f) => f.id === id);
  if (!fila) return "no existe la fila";
  if (fila.estado !== "hecha") return `no tiene fila hecha (está ${fila.estado || "sin estado"})`;
  const archivada = listarCarpetas(join(raiz, "features", "completed")).some((c) => c.startsWith(`${id}-`));
  if (archivada) return "ya está en features/completed/";
  return "no es candidata";
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

  lineas.push("## Tareas sobre el umbral");
  if (r.tareasGrandes.length === 0) lineas.push("- ninguna");
  for (const t of r.tareasGrandes) {
    lineas.push(`- ${t.ruta}: ${t.caracteres} caracteres (umbral ${t.umbral})${aviso(true)}`);
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

// Lee los argumentos. Cualquier cosa desconocida o ambigua es error (sin mover nada).
function leerArgumentos(args) {
  const opciones = { raiz: null, aplicar: false, ids: [] };
  const vistas = new Set();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--raiz" || a === "--aplicar") {
      if (vistas.has(a)) return { error: `opción repetida '${a}'` };
      vistas.add(a);
    }
    if (a === "--raiz") {
      const valor = args[i + 1];
      if (valor === undefined || valor.startsWith("--")) return { error: "falta el valor de --raiz" };
      opciones.raiz = resolve(valor);
      i++;
    } else if (a === "--aplicar") {
      opciones.aplicar = true;
    } else if (RE_ID.test(a)) {
      opciones.ids.push(a);
    } else {
      return { error: `argumento desconocido '${a}'` };
    }
  }
  if (opciones.ids.length > 0 && !opciones.aplicar) {
    return { error: `argumento desconocido '${opciones.ids[0]}' (los IDs solo van con --aplicar)` };
  }
  if (opciones.aplicar && opciones.ids.length === 0) return { error: "--aplicar exige un Fxx explícito" };
  if (opciones.ids.length > 1) return { error: "--aplicar acepta un solo Fxx" };
  return { opciones };
}

if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE) {
  const { error, opciones } = leerArgumentos(process.argv.slice(2));
  if (error) {
    console.error(`error: ${error}`);
    process.exit(1);
  }
  const raiz = opciones.raiz ?? join(dirname(RUTA_ESTE), "..");

  if (!opciones.aplicar) {
    process.stdout.write(formatearInforme(chequear(raiz)));
    process.exit(0);
  }

  const [id] = opciones.ids;
  const { movidas, omitidas } = aplicar(raiz, [id]);
  for (const m of movidas) console.log(`movida: ${m.desde} -> ${m.hasta}`);
  for (const o of omitidas) console.log(`omitida: ${o.id}: ${o.motivo}`);
  if (movidas.length > 0) {
    console.log(
      "Cambios sin commit. Revisa con `git status` y commitéalos en su propio commit chore/ (después del PR de la feature)."
    );
  }
  process.exit(movidas.length > 0 ? 0 : 1);
}
