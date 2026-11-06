#!/usr/bin/env node
// Medición de contexto por fuente y rol (F43, task-01). Solo lectura: no escribe, no hace red ni llama a modelos.
//
// Uso:
//   node scripts/contexto-fuentes.mjs --raiz <carpeta de logs> [--repo <carpeta>] [--json]
//   --raiz es obligatorio. --repo vale el directorio actual y es donde se miden agentes/<rol>.md.
//   Reutiliza descubrirSesiones de scripts/consumo.mjs (no se modifica).
//   Exporta agregarFuentes(sesiones, { repo }) → filas { fuente, categoria, kbUnico, veces, kbTotales, rol },
//   categoriaDeFuente(ruta) y formatearTabla(filas) (texto ≤ 4096 bytes: el resto de filas se omite, ver --json).
//   Un dato que el log no trae se escribe "n/d"; no se estima.

import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { descubrirSesiones } from "./consumo.mjs";

const LIMITE_TEXTO = 4096;
const CABECERA = "| fuente | KB único | veces leída | KB totales | rol |";
const SEPARADOR = "|---|---:|---:|---:|---|";

const aKb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const redondear1 = (x) => Math.round(x * 10) / 10;

export function categoriaDeFuente(ruta) {
  if (/(^|\/)skills\/[^/]+\/SKILL\.md$/.test(ruta)) return "skill";
  if (/(^|\/)definitions\//.test(ruta)) return "definicion";
  if (/(^|\/)STATUS\.md$/.test(ruta)) return "status";
  if (/(^|\/)features\//.test(ruta)) return "tarea";
  return "otro";
}

// Agrega por (fuente, rol). Las lecturas vienen de sesion.lecturas (coordinador) y de sesion.subagentes.porRol[rol].
// Una fila "prompt" por rol: tamaño de agentes/<rol>.md (fs) y veces = corridas del rol.
export function agregarFuentes(sesiones, { repo = process.cwd() } = {}) {
  const acumulado = new Map(); // clave rol + fuente → { fuente, categoria, rol, veces, kbTotales, sinKb }
  const corridas = new Map(); // rol → nº de corridas

  const sumar = (fuente, rol, lecturas, kb) => {
    const clave = `${rol}\u0000${fuente}`;
    if (!acumulado.has(clave)) {
      acumulado.set(clave, { fuente, categoria: categoriaDeFuente(fuente), rol, veces: 0, kbTotales: 0, sinKb: false });
    }
    const f = acumulado.get(clave);
    f.veces += lecturas;
    if (typeof kb === "number") f.kbTotales += kb;
    else f.sinKb = true;
  };

  for (const s of sesiones) {
    const rolPrincipal = s.rol ?? "desconocido";
    corridas.set(rolPrincipal, (corridas.get(rolPrincipal) ?? 0) + 1);
    for (const [ruta, v] of Object.entries(s.lecturas?.porArchivo ?? {})) {
      sumar(ruta, rolPrincipal, v.lecturas, v.kb);
    }
    for (const [rol, r] of Object.entries(s.subagentes?.porRol ?? {})) {
      corridas.set(rol, (corridas.get(rol) ?? 0) + (r.corridas ?? 0));
      for (const [ruta, v] of Object.entries(r.porArchivo ?? {})) sumar(ruta, rol, v.lecturas, v.kb);
    }
  }

  const filas = [];
  for (const f of acumulado.values()) {
    filas.push(filaFinal(f.fuente, f.categoria, f.rol, f.veces, f.sinKb ? null : redondear1(f.kbTotales)));
  }
  for (const [rol, n] of corridas) {
    if (n === 0) continue;
    const ruta = join(resolve(repo), "agentes", `${rol}.md`);
    const bytes = existsSync(ruta) ? statSync(ruta).size : null;
    const total = bytes === null ? null : redondear1(aKb(bytes * n));
    filas.push(filaFinal(`agentes/${rol}.md`, "prompt", rol, n, total));
  }

  return filas.sort(ordenar);
}

// kbTotales null → "n/d" (y kbUnico también). kbUnico = kbTotales / veces, 1 decimal.
function filaFinal(fuente, categoria, rol, veces, kbTotales) {
  if (kbTotales === null) return { fuente, categoria, kbUnico: "n/d", veces, kbTotales: "n/d", rol };
  return { fuente, categoria, kbUnico: redondear1(kbTotales / veces), veces, kbTotales, rol };
}

// KB totales descendente; "n/d" al final; desempate por fuente y rol.
function ordenar(a, b) {
  const na = typeof a.kbTotales === "number";
  const nb = typeof b.kbTotales === "number";
  if (na !== nb) return na ? -1 : 1;
  if (na && a.kbTotales !== b.kbTotales) return b.kbTotales - a.kbTotales;
  if (a.fuente !== b.fuente) return a.fuente < b.fuente ? -1 : 1;
  return a.rol < b.rol ? -1 : a.rol > b.rol ? 1 : 0;
}

const bytes = (lineas) => Buffer.byteLength(lineas.join("\n") + "\n", "utf8");

// Texto: cabecera exacta una vez, filas, y «Top 10» con las 10 primeras (sin repetir la cabecera).
// Si la tabla no cabe en 4096 bytes, se omiten las últimas filas y se indica cuántas (ver --json).
export function formatearTabla(filas) {
  const fila = (f) => `| ${f.fuente} | ${f.kbUnico} | ${f.veces} | ${f.kbTotales} | ${f.rol} |`;
  const base = [CABECERA, SEPARADOR];
  const top = filas.length === 0 ? [] : ["", "Top 10", ...filas.slice(0, 10).map((f, i) => `${i + 1}. ${f.fuente} (${f.rol}): ${f.kbTotales} KB totales, ${f.veces} veces`)];
  const salida = (n) => {
    const omitidas = filas.length - n;
    return [...base, ...filas.slice(0, n).map(fila), ...(omitidas > 0 ? [`… ${omitidas} filas más (ver --json)`] : []), ...top];
  };
  let n = filas.length;
  while (n > 0 && bytes(salida(n)) > LIMITE_TEXTO) n--;
  return salida(n).join("\n") + "\n";
}

// ---- CLI ----

export function leerArgumentos(args) {
  const opciones = { raiz: null, repo: null, json: false };
  const vistas = new Set();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (vistas.has(a)) return { error: `opción repetida '${a}'` };
    vistas.add(a);
    if (a === "--json") opciones.json = true;
    else if (a === "--raiz" || a === "--repo") {
      const valor = args[i + 1];
      if (valor === undefined || valor.startsWith("--")) return { error: `'${a}' necesita un valor` };
      if (a === "--raiz") opciones.raiz = valor;
      else opciones.repo = valor;
      i++;
    } else return { error: `opción desconocida '${a}'` };
  }
  if (!opciones.raiz) return { error: "--raiz es obligatorio" };
  return { opciones };
}

function main(args) {
  const { error, opciones } = leerArgumentos(args);
  if (error) {
    process.stderr.write(`contexto-fuentes: ${error}\nUso: node scripts/contexto-fuentes.mjs --raiz <carpeta> [--repo <carpeta>] [--json]\n`);
    process.exit(1);
  }
  const raiz = resolve(opciones.raiz);
  if (!existsSync(raiz)) {
    process.stderr.write(`contexto-fuentes: no existe la carpeta ${raiz}\n`);
    process.exit(1);
  }
  const repo = resolve(opciones.repo ?? process.cwd());
  const filas = agregarFuentes(descubrirSesiones(raiz), { repo });
  process.stdout.write(opciones.json ? JSON.stringify(filas, null, 2) + "\n" : formatearTabla(filas));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
