#!/usr/bin/env node
// Punteros tras compactar (A7 de changes/piso-planner/tramo-7.md). Hook SessionStart con matcher `compact`:
// imprime hasta 20 líneas en inglés con dónde están las notas, el plan, el tramo y la próxima acción del cambio
// activo. Solo lee; nunca imprime contenido de archivos y siempre sale con 0.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSyncSeguro } from "../tools/spawn/sync-seguro.mjs";

const MAX_LINEAS = 20;
const ESTADOS = new Set(["draft", "approved", "in progress", "partial", "done"]);
const CARPETA = /^[a-z0-9][a-z0-9._-]*$/;
const SEGMENTO = /^\d{1,3}$/;
const ENCABEZADOS = ["## Next action", "## Próxima acción"];

function leerEntrada() {
  try {
    const valor = JSON.parse(readFileSync(0, "utf8"));
    return valor && typeof valor === "object" ? valor : {};
  } catch {
    return {};
  }
}

function esArchivo(ruta) {
  try {
    return statSync(ruta).isFile();
  } catch {
    return false;
  }
}

function esCarpeta(ruta) {
  try {
    return statSync(ruta).isDirectory();
  } catch {
    return false;
  }
}

// Claves simples del bloque inicial `---` (no es un parser YAML completo).
function frontmatter(texto) {
  const coincide = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  const datos = {};
  if (!coincide) return datos;
  for (const linea of coincide[1].split(/\r?\n/)) {
    const par = /^([a-z_]+):\s*(.*)$/.exec(linea.trim());
    if (par) datos[par[1]] = par[2].trim();
  }
  return datos;
}

function ramaActual(cwd) {
  const r = spawnSyncSeguro("git", ["branch", "--show-current"], { cwd, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

// Línea (1-based) de la última cabecera de próxima acción en notes.md, o null: la vigente va al final.
function lineaProximaAccion(rutaNotas) {
  const lineas = readFileSync(rutaNotas, "utf8").split(/\r?\n/);
  let hallada = null;
  for (let i = 0; i < lineas.length; i++) {
    const trimmed = lineas[i].trim();
    if (ENCABEZADOS.includes(trimmed)) hallada = { numero: i + 1, encabezado: trimmed };
  }
  return hallada;
}

function candidatos(dirChanges) {
  const salida = [];
  for (const entrada of readdirSync(dirChanges, { withFileTypes: true })) {
    if (!entrada.isDirectory() || entrada.name === "done" || !CARPETA.test(entrada.name)) continue;
    const plan = join(dirChanges, entrada.name, "plan.md");
    if (!esArchivo(plan)) continue;
    try {
      const fm = frontmatter(readFileSync(plan, "utf8"));
      salida.push({
        carpeta: entrada.name,
        dir: join(dirChanges, entrada.name),
        fm,
        mtime: statSync(plan).mtimeMs,
        tieneNotas: esArchivo(join(dirChanges, entrada.name, "notes.md")),
      });
    } catch {
      // Un plan ilegible no es candidato.
    }
  }
  return salida;
}

// Prefiere la rama actual; luego la carpeta con notes.md; luego la más reciente.
function elegir(lista, rama) {
  const conRama = rama ? lista.filter((c) => c.fm.branch === rama) : [];
  const pool = conRama.length ? conRama : lista;
  return [...pool].sort((a, b) => Number(b.tieneNotas) - Number(a.tieneNotas) || b.mtime - a.mtime)[0];
}

function punteros(cwd) {
  const dirChanges = join(cwd, "changes");
  if (!esCarpeta(dirChanges)) return [];
  const lista = candidatos(dirChanges);
  if (lista.length === 0) return [];

  const elegido = elegir(lista, ramaActual(cwd));
  const base = `changes/${elegido.carpeta}`;
  const lineas = ["After compaction: resume from these pointers instead of rereading the whole change."];

  lineas.push(elegido.tieneNotas ? `Notes: ${base}/notes.md` : "Notes: none");
  if (esArchivo(join(elegido.dir, "decisions.md"))) lineas.push(`Decisions: ${base}/decisions.md`);

  const estado = elegido.fm.status;
  lineas.push(`Plan: ${base}/plan.md${ESTADOS.has(estado) ? ` (status: ${estado})` : ""}`);

  const segmento = elegido.fm.segment;
  if (segmento !== undefined && SEGMENTO.test(segmento)) {
    const tramo = join(elegido.dir, `tramo-${segmento}.md`);
    lineas.push(`Segment: ${segmento}${esArchivo(tramo) ? ` (${base}/tramo-${segmento}.md)` : ""}`);
  }

  const proxima = elegido.tieneNotas ? lineaProximaAccion(join(elegido.dir, "notes.md")) : null;
  lineas.push(
    proxima
      ? `Next action: ${base}/notes.md:${proxima.numero} ("${proxima.encabezado}")`
      : "Next action: not recorded",
  );

  if (lista.length > 1) lineas.push(`Other active changes: ${lista.length - 1}`);
  return lineas;
}

function main() {
  const entrada = leerEntrada();
  if (entrada.source !== undefined && entrada.source !== "compact") return;
  const cwd = typeof entrada.cwd === "string" && entrada.cwd ? entrada.cwd : process.cwd();
  const lineas = punteros(cwd).slice(0, MAX_LINEAS);
  if (lineas.length > 0) process.stdout.write(`${lineas.join("\n")}\n`);
}

try {
  main();
} catch {
  // Un fallo aquí no debe bloquear la sesión: sin salida, exit 0.
}
process.exitCode = 0;
