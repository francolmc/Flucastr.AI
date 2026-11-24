// Extrae los criterios A# de un plan: tabla global, historias (`check with`) y listas antiguas.
// Solo lee: no escribe en el plan. Reutiliza `frontmatter` de tools/run/plan.mjs.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { frontmatter } from "../run/plan.mjs";

// Ejecutables que el parser acepta al inicio de la comprobación; la política se aplica después.
const EJECUTABLES = ["node", "npm", "npx", "pnpm", "yarn", "grep", "ls", "cat", "wc", "diff", "cmp", "test", "git", "bash"];

const RE_HISTORIA = /^- (A\d+):\s*(.*?);\s*check with\s+(.*?);\s*expect\s+(.*?)\.?\s*$/;
const RE_A = /^- (A\d+):\s*(.*)$/;
const RE_TABLA_TITULO = /^## (Aceptación|Acceptance)\s*$/;
const CABECERA_ID = /^id$/i;

// Un único span entre acentos graves que empieza por un ejecutable conocido o por ./.
function comandoDe(texto) {
  if (!texto) return { comando: null, motivo: "sin comprobación" };
  const spans = [...texto.matchAll(/`([^`]+)`/g)].map(m => m[1].trim());
  if (spans.length === 0) return { comando: null, motivo: "sin comando entre acentos graves" };
  if (spans.length > 1) return { comando: null, motivo: `${spans.length} comandos; no es inequívoco` };
  const [comando] = spans;
  const primera = comando.split(/\s+/)[0];
  if (!EJECUTABLES.includes(primera) && !primera.startsWith("./")) {
    return { comando: null, motivo: "ejecutable no reconocido" };
  }
  return { comando, motivo: null };
}

function fila(datos, cwd) {
  const { comando, motivo } = datos.lista
    ? { comando: null, motivo: "lista antigua: sin comprobación separada" }
    : comandoDe(datos.comprobacion);
  return {
    id: datos.id,
    resultado: datos.resultado,
    comprobacion: datos.comprobacion ?? null,
    esperado: datos.esperado ?? null,
    comando,
    motivo,
    formato: datos.formato,
    segmento: datos.segmento,
    cwd,
  };
}

// Carpeta de trabajo: raíz del proyecto (antes de `changes/`); con una sola carpeta de repos:
// distinta de `.`, esa carpeta; con varias, la raíz.
function carpetaDeTrabajo(ruta, reposTexto = "") {
  const partes = ruta.split(sep);
  const idx = partes.lastIndexOf("changes");
  const raiz = idx > 0 ? partes.slice(0, idx).join(sep) || sep : dirname(ruta);
  const repos = reposTexto
    .replace(/[[\]]/g, "")
    .split(",")
    .map(s => s.trim().replace(/^["']|["']$/g, ""))
    .filter(s => s && s !== ".");
  return repos.length === 1 ? join(raiz, repos[0]) : raiz;
}

// Lee la primera tabla bajo `## Aceptación` / `## Acceptance`. Devuelve filas crudas o error.
function leerTabla(lineas) {
  const inicio = lineas.findIndex(l => RE_TABLA_TITULO.test(l));
  if (inicio < 0) return { existe: false, filas: [], error: null };
  const bloque = [];
  for (let i = inicio + 1; i < lineas.length; i++) {
    const l = lineas[i].trim();
    if (/^## /.test(l)) break;
    if (l.startsWith("|")) bloque.push(l);
    else if (bloque.length > 0) break;
  }
  if (bloque.length === 0) return { existe: false, filas: [], error: null };
  const celdas = l => l.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const [cabecera, , ...cuerpo] = bloque;
  const cab = celdas(cabecera);
  if (cab.length !== 4 || !CABECERA_ID.test(cab[0])) {
    return { existe: true, filas: [], error: "cabecera de tabla no reconocida (se esperan 4 columnas: ID, Resultado observable, Comprobación, Resultado esperado)" };
  }
  if (cuerpo.length === 0) return { existe: true, filas: [], error: "tabla de aceptación sin filas" };
  const vistos = new Set();
  const filas = [];
  for (const linea of cuerpo) {
    const c = celdas(linea);
    if (c.length !== 4) {
      return { existe: true, filas: [], error: `fila con ${c.length} columnas (se esperan 4): ${linea}` };
    }
    if (!/^A\d+$/.test(c[0])) return { existe: true, filas: [], error: `identificador no válido: ${c[0]}` };
    if (vistos.has(c[0])) return { existe: true, filas: [], error: `${c[0]} repetido en la tabla` };
    vistos.add(c[0]);
    filas.push({ id: c[0], resultado: c[1], comprobacion: c[2], esperado: c[3], formato: "tabla", segmento: null });
  }
  return { existe: true, filas, error: null };
}

// Criterios A# en líneas `- A#:`; el segmento es el de su `### Segment N` más cercano.
function criteriosHistoria(lineas) {
  const filas = [];
  let segmento = null;
  for (const linea of lineas) {
    if (/^## /.test(linea)) segmento = null;
    const seg = linea.match(/^### Segment (\d+)\b/);
    if (seg) {
      segmento = Number(seg[1]);
      continue;
    }
    const a = linea.match(RE_A);
    if (a && linea.includes("check with")) {
      const m = linea.match(RE_HISTORIA);
      if (m) {
        filas.push({ id: m[1], resultado: m[2], comprobacion: m[3], esperado: m[4], formato: "historia", segmento });
      } else {
        filas.push({
          id: a[1],
          resultado: a[2].split(";")[0].trim(),
          comprobacion: linea.split("check with")[1]?.trim() ?? null,
          esperado: null,
          formato: "historia",
          segmento,
        });
      }
      continue;
    }
    if (a) filas.push({ id: a[1], resultado: a[2], comprobacion: null, esperado: null, formato: "lista", segmento, lista: true });
  }
  return filas;
}

// Enlaces `tramo-N.md` del plan índice, sin repetir.
function tramosEnlazados(texto) {
  return [...new Set([...texto.matchAll(/`(tramo-\d+\.md)`/g)].map(m => m[1]))];
}

export function parsearPlan(rutaPlan, { segmento } = {}) {
  const ruta = resolve(rutaPlan);
  const texto = readFileSync(ruta, "utf8");
  const meta = frontmatter(texto);
  const cwd = carpetaDeTrabajo(ruta, meta.repos);

  if (segmento !== undefined && !(Number.isInteger(segmento) && segmento > 0)) {
    return { filas: [], error: `segmento no válido: ${segmento}` };
  }

  const fuentes = [{ nombre: ruta, lineas: texto.split("\n") }];
  for (const tramo of tramosEnlazados(texto)) {
    const rutaTramo = join(dirname(ruta), tramo);
    if (!existsSync(rutaTramo)) return { filas: [], error: `tramo enlazado no existe: ${tramo}` };
    fuentes.push({ nombre: rutaTramo, lineas: readFileSync(rutaTramo, "utf8").split("\n") });
  }

  const tablas = [];
  const historias = [];
  for (const fuente of fuentes) {
    const t = leerTabla(fuente.lineas);
    if (t.error) return { filas: [], error: `${fuente.nombre}: ${t.error}` };
    if (t.existe) tablas.push(...t.filas);
    historias.push(...criteriosHistoria(fuente.lineas));
  }

  if (segmento !== undefined && tablas.length > 0) {
    return { filas: [], error: "tabla global, no filtrable por tramo; use un plan con historias por segmento" };
  }

  const todas = [...tablas, ...historias].map(d => fila(d, cwd));
  const filas = segmento === undefined ? todas : todas.filter(f => f.segmento === segmento);
  if (filas.length === 0) {
    return { filas: [], error: segmento === undefined ? "sin criterios A# en el plan" : `sin criterios A# para el segmento ${segmento}` };
  }
  return { filas, error: null };
}
