// Reconstrucción del plan de un tramo para la copia (A3). Lee el plan fuente con `git show HEAD:<ruta>`
// en el repo raíz y deja solo la historia N: Scope = Files:, Verification = Segment verification:
// (con `cd` si corre en el repo hijo), Evidence y Notes vacías, y sin líneas Resuelto:, Devuelto:
// ni Consejo. No lleva `continuity`. Nada se escribe en el kit: el plan va a la copia.
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSyncSeguro } from "../../../tools/spawn/sync-seguro.mjs";

const LINEA_DEVOLUCION = /^(Resuelto:|Devuelto:|Consejo)/;

function git(cwd, args) {
  const r = spawnSyncSeguro("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`git ${args[0]} falló en ${cwd}: ${String(r.stderr).trim()}`);
  return r.stdout;
}

export function leerFuente({ raiz, ruta }) {
  return git(raiz, ["show", `HEAD:${ruta}`]);
}

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  const campos = {};
  if (m) {
    for (const linea of m[1].split("\n")) {
      const k = linea.match(/^([a-z_]+):\s*(.*)$/);
      if (k) campos[k[1]] = k[2].trim();
    }
  }
  return campos;
}

// Bloque «### Segment N» hasta el siguiente encabezado de nivel 1 a 3.
export function bloqueDe(texto, n) {
  const lineas = texto.split("\n");
  const re = new RegExp(`^### Segment ${n}\\b`);
  const inicio = lineas.findIndex((l) => re.test(l));
  if (inicio < 0) throw new Error(`no hay Segment ${n} en la fuente`);
  let fin = lineas.length;
  for (let i = inicio + 1; i < lineas.length; i++) {
    if (/^#{1,3} /.test(lineas[i])) {
      fin = i;
      break;
    }
  }
  return lineas.slice(inicio, fin).filter((l) => !LINEA_DEVOLUCION.test(l.trim())).join("\n").trim();
}

function valorDe(bloque, clave) {
  const m = bloque.match(new RegExp(`^${clave}:\\s*(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

// Casillas siempre vacías en la copia (A3): el tramo se vuelve a ejecutar desde cero.
function casillasVacias(bloque) {
  return bloque.replace(/^(\s*-\s*)\[[xX]\]/gm, "$1[ ]");
}

// `extra` añade rutas al Scope sin tocar Files: (A17: pruebas ocultas que el builder puede escribir).
export function reconstruirPlan({ texto, n, subcarpeta = "", rama = "feature/bench", base = "main", extra = [] }) {
  const bloque = casillasVacias(bloqueDe(texto, n));
  const archivos = valorDe(bloque, "Files").split(",").map((s) => s.trim().replace(/`/g, "").replace(/\.$/, "").trim()).filter(Boolean);
  const comando = (valorDe(bloque, "Segment verification").match(/`([^`]+)`/) ?? [])[1];
  if (archivos.length === 0 || !comando) throw new Error(`Segment ${n} sin Files: o sin Segment verification:`);
  const verificacion = subcarpeta ? `cd ${subcarpeta} && ${comando}` : comando;
  const tipo = frontmatter(texto).type ?? "code";
  return [
    "---",
    "status: approved",
    `branch: ${rama}`,
    `base: ${base}`,
    "repos: [.]",
    "executor: builder",
    `segment: ${n}`,
    `type: ${tipo}`,
    "---",
    `# Tramo ${n} reconstruido`,
    "",
    "## Scope",
    [...archivos, ...extra.filter((r) => !archivos.includes(r))].map((a) => `\`${a}\``).join(", "),
    "",
    "## Verification",
    `\`${verificacion}\``,
    "",
    "## Steps",
    "",
    bloque,
    "",
    "## Evidence",
    "",
    "## Notes",
    "",
  ].join("\n");
}

// Escribe el plan en `changes/<cambio>/plan.md` de la copia; `decisiones` (texto) se copia solo si no es null.
export function escribirPlanEnCopia({ copia, cambio, plan, decisiones = null }) {
  const dir = join(copia, "changes", cambio);
  mkdirSync(dir, { recursive: true });
  const ruta = join(dir, "plan.md");
  writeFileSync(ruta, plan);
  if (decisiones !== null) writeFileSync(join(dir, "decisions.md"), decisiones);
  return ruta;
}
