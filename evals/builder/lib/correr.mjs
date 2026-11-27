// Corrida de una variante sobre el corpus calibrado (A8, A9). Por cada par (tramo, repetición), en el
// orden que fija la semilla: copia con `prepararTramo`, `kit run` (builder y revisor), oráculo medido
// y reaplicado, métricas (A7) y una línea en resultados.jsonl. Las copias se borran siempre. Cortes:
// contrato_ok falso, límite de uso (sin línea: se reintenta al reanudar) y --tope-tokens. Al repetir
// se saltan los terminados (DONE, PAUSED) y se reintentan entorno e invalida. Sin --tramos hacen falta
// al menos diez tramos válidos en la calibración, y sin ellos no se lanza nada.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crearResolucionModelos } from "../../../tools/model-resolution/models.mjs";
import { spawnSyncSeguro } from "../../../tools/spawn/sync-seguro.mjs";
import { calcularMetricas } from "./metricas.mjs";
import { hashCorpus, prepararTramo } from "./calibrar.mjs";
import { contratoDe } from "./copia.mjs";
import { ErrorVariante, prepararVariante } from "./variante.mjs";

// Ruta relativa del contrato de execute-plan: en copias K el builder la lee así (A15, D-35).
const SKILL_RELATIVA = "core/skills/execute-plan/SKILL.md";

const LIB = dirname(fileURLToPath(import.meta.url));
const EVALS = join(LIB, "..");
const CORPUS = join(EVALS, "corpus.json");
const LOCAL_POR_OMISION = join(EVALS, "local.json");
const VARIANTES = join(EVALS, "variantes");
const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MINIMO_VALIDOS = 10;
const TERMINADOS = new Set(["DONE", "PAUSED"]);
const CLAVES_CABECERA = ["nombre", "semilla", "repeticiones", "corpus_sha256", "huellas", "orden"];
const OPCIONES = {
  "--variante": "variante", "--variant": "variante",
  "--semilla": "semilla", "--seed": "semilla",
  "--repeticiones": "repeticiones", "--repeats": "repeticiones",
  "--tramos": "tramos", "--segments": "tramos",
  "--tope-tokens": "topeTokens", "--token-cap": "topeTokens",
  "--salida": "salida", "--output": "salida",
  "--local": "local", "--calibracion": "calibracion",
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const clave = (id, rep) => `${id}|${rep}`;
const avisar = (linea) => process.stderr.write(`${linea}\n`);

// Orden determinado por la semilla (mulberry32 y Fisher-Yates). Misma semilla, mismo orden.
export function permutar(lista, semilla) {
  let estado = semilla >>> 0;
  const aleatorio = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function seleccionar({ entradas, tramos, calibracion, corpusTexto }) {
  if (tramos) {
    const desconocidos = tramos.filter((id) => !entradas.some((e) => e.id === id));
    if (desconocidos.length) return { codigo: 2, motivo: `ID desconocido en --tramos: ${desconocidos.join(",")}` };
    return { entradas: entradas.filter((e) => tramos.includes(e.id)) };
  }
  if (!calibracion) return { codigo: 1, motivo: "sin calibración (--calibracion); no se lanza nada" };
  if (calibracion.corpus_sha256 !== hashCorpus(corpusTexto)) return { codigo: 1, motivo: "la calibración es de otro corpus" };
  const validos = new Set(calibracion.resultados.filter((r) => r.valido).map((r) => r.id));
  if (validos.size < MINIMO_VALIDOS) {
    return { codigo: 1, motivo: `solo ${validos.size} tramos válidos; hacen falta ${MINIMO_VALIDOS}` };
  }
  return { entradas: entradas.filter((e) => validos.has(e.id)) };
}

function leerLineas(ruta) {
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

// Tras medir (A16, D-37): reescribe las pruebas de referencia, corre la verificación del tramo y devuelve si
// pasa. null si el hash del oráculo no coincide o no se pudo correr (su salida va a <salida>/logs).
function oraculoPasa(copia) {
  try {
    if (!copia.reaplicarOraculo()) return null;
    return copia.verificar("oraculo") === true;
  } catch {
    return null;
  }
}

const tokensTotales = (filas) => filas.reduce((a, f) => a + (f.tokens ? (f.tokens.entrada ?? 0) + (f.tokens.salida ?? 0) : 0), 0);

// `ejecutor.preparar({ entrada, carpeta, destinoBase })` devuelve una copia; `ejecutor.kit({ copia, entrada,
// carpeta, rep, variante })` devuelve lo que `kit run` deja en el tramo. Un lanzamiento que falla da `entorno`.
export async function correr({
  salida, nombre, semilla, repeticiones = 1, entradas, corpusTexto, calibracion = null, tramos = null,
  topeTokens = null, variante, destinoBase, ejecutor, progreso = () => {},
}) {
  const sel = seleccionar({ entradas, tramos, calibracion, corpusTexto });
  if (sel.codigo) return sel;

  const corrida = `${nombre}-s${semilla}`;
  const pares = [];
  for (let rep = 1; rep <= repeticiones; rep++) {
    for (const entrada of sel.entradas) pares.push({ entrada, rep, carpeta: `bench-${corrida}-${entrada.id}-r${rep}` });
  }
  const orden = permutar(pares, semilla);
  const cabecera = {
    corrida, nombre, semilla, repeticiones, corpus_sha256: hashCorpus(corpusTexto),
    huellas: variante.huellas, modelos: variante.modelos, version: variante.version ?? null,
    orden: orden.map((p) => `${p.entrada.id}-r${p.rep}`),
  };

  mkdirSync(salida, { recursive: true });
  const rutaCabecera = join(salida, "corrida.json");
  if (existsSync(rutaCabecera)) {
    const previa = JSON.parse(readFileSync(rutaCabecera, "utf8"));
    const iguales = CLAVES_CABECERA.every((k) => JSON.stringify(previa[k]) === JSON.stringify(cabecera[k]));
    if (!iguales) return { codigo: 2, motivo: "la cabecera no coincide con la corrida guardada; use otra salida" };
  } else {
    writeFileSync(rutaCabecera, `${JSON.stringify(cabecera, null, 2)}\n`);
  }

  const ruta = join(salida, "resultados.jsonl");
  const lineas = leerLineas(ruta).filter((f) => TERMINADOS.has(f.resultado));
  const hechos = new Set(lineas.map((f) => clave(f.id, f.rep)));
  writeFileSync(ruta, lineas.map((f) => `${JSON.stringify(f)}\n`).join(""));
  const anadir = (f) => {
    lineas.push(f);
    appendFileSync(ruta, `${JSON.stringify(f)}\n`);
  };

  // Un aviso por par al empezar («[k/N] ID rR») y otro al terminar con su resultado (A12).
  let posicion = 0;
  for (const p of orden) {
    const { entrada, rep, carpeta } = p;
    posicion++;
    const etiqueta = `[${posicion}/${orden.length}] ${entrada.id} r${rep}`;
    if (hechos.has(clave(entrada.id, rep))) {
      progreso(`${etiqueta} saltado (ya terminado)`);
      continue;
    }
    progreso(etiqueta);
    const registrar = (f) => {
      anadir(f);
      progreso(`${etiqueta} ${f.resultado === "entorno" && f.motivo ? `entorno: ${f.motivo}` : f.resultado}`);
    };

    let copia;
    try {
      copia = await ejecutor.preparar({ entrada, carpeta, destinoBase });
    } catch (e) {
      registrar({ id: entrada.id, rep, variante: nombre, resultado: "entorno", motivo: e.motivo ?? "error-copia" });
      continue;
    }

    let datos = null;
    let oraculo = null;
    let motivo = null;
    try {
      datos = await ejecutor.kit({ copia, entrada, carpeta, rep, variante });
      if (datos.intentos.length > 0) oraculo = oraculoPasa(copia);
    } catch (e) {
      motivo = e.motivo ?? "error-ejecucion";
    } finally {
      copia.limpiar();
    }

    if (datos === null) {
      registrar({ id: entrada.id, rep, variante: nombre, resultado: "entorno", motivo });
      continue;
    }
    if (datos.intentos.length === 0) {
      registrar({ id: entrada.id, rep, variante: nombre, resultado: "entorno", motivo: "sin-intentos" });
      continue;
    }
    const ultimo = datos.intentos.at(-1);
    if (ultimo && ultimo.senal === "limite_uso" && ultimo.resultado !== "DONE") {
      progreso(`${etiqueta} límite de uso; la corrida se detiene`);
      return { codigo: 3, motivo: "límite de uso; al reanudar se relanza este tramo", corte: { id: entrada.id, rep } };
    }

    const metricas = calcularMetricas({
      id: entrada.id, rep, variante: nombre, herramienta: "codex",
      intentos: datos.intentos, sesiones: datos.sesiones, filas: datos.filas, revisorModelo: datos.revisorModelo,
      cambios: datos.cambios, referencia: datos.referencia, textos: datos.textos, rutasFuente: datos.rutasFuente,
      rutasCopia: datos.rutasCopia, rutasViva: datos.rutasViva, oraculoPasa: oraculo,
    });
    registrar(metricas);

    if (metricas.contrato_ok === false) return { codigo: 3, motivo: "contrato_ok falso; la corrida se detiene" };
    if (topeTokens !== null && tokensTotales(lineas) > topeTokens) {
      return { codigo: 3, motivo: `se superó --tope-tokens (${topeTokens})` };
    }
  }
  return { codigo: 0 };
}

// Líneas crudas de las sesiones de Codex (sessions/**/rollout-*.jsonl) cuyo cwd es una carpeta de la copia.
// Sirven para buscar rutas de contrato y de fuente; no se escriben en la salida (D-05).
function sesionesDeCarpetas(codexReal, carpetas) {
  const textos = [];
  const recorrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (/^rollout-.*\.jsonl$/.test(entrada.name)) {
        const lineas = readFileSync(ruta, "utf8").split("\n").filter(Boolean);
        const meta = lineas.map(aObjeto).find((o) => o?.type === "session_meta");
        if (meta && carpetas.includes(meta.payload?.cwd)) textos.push(...lineas);
      }
    }
  };
  const raiz = join(codexReal, "sessions");
  if (existsSync(raiz)) recorrer(raiz);
  return textos;
}

function aObjeto(linea) {
  try {
    return JSON.parse(linea);
  } catch {
    return null;
  }
}

// Versión del binario codex que lanza `kit run` (con el entorno de la variante); null si no responde (A8).
export function versionCodex(env) {
  const r = spawnSyncSeguro("codex", ["--version"], { env, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

// Modelo de cada agente de models.json de la copia, resuelto con la misma función que `kit run` (A8).
function modelosResueltos(kitDestino) {
  const previo = process.env.FLUCASTR_MODELOS;
  process.env.FLUCASTR_MODELOS = join(kitDestino, "models.json");
  try {
    const res = crearResolucionModelos(kitDestino);
    const agentes = Object.keys(JSON.parse(readFileSync(join(kitDestino, "models.json"), "utf8")).agents ?? {});
    return Object.fromEntries(agentes.map((a) => [a, res.resolverModelo(a, "codex")]));
  } finally {
    if (previo === undefined) delete process.env.FLUCASTR_MODELOS;
    else process.env.FLUCASTR_MODELOS = previo;
  }
}

// Registros de `kit run` de un par, antes de borrar la copia (A13, D-33): el runs.jsonl de la copia y la
// salida cruda de kit run. Se guardan también si kit run falla o no deja intentos. Van a <salida>/logs, no
// a resultados.jsonl.
function guardarRegistros({ salida, id, rep, copia, kitRun }) {
  const dir = join(salida, "logs");
  mkdirSync(dir, { recursive: true });
  const base = `${id}-r${rep}`;
  const registro = join(copia.destino, "changes", id, "runs.jsonl");
  writeFileSync(join(dir, `${base}-runs.jsonl`), existsSync(registro) ? readFileSync(registro, "utf8") : "");
  const error = kitRun.error ? `${kitRun.error.message}\n` : "";
  writeFileSync(join(dir, `${base}-kit-run.log`),
    `${kitRun.stdout ?? ""}${kitRun.stderr ?? ""}${error}exit ${kitRun.status ?? kitRun.signal}\n`);
}

// Ejecutor real: `kit run` sobre la copia del tramo con la variante, y las sesiones de Codex de la copia
// (scripts/usage.mjs para tokens y filas; la lectura directa de las sesiones para contrato y contaminación).
// Lo que no se puede leer queda null o vacío y las métricas lo marcan como null.
function ejecutorReal({ salida, kitDestino, env, codexReal, home, local }) {
  const git = (cwd, args) => {
    const r = spawnSyncSeguro("git", args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    return r.status === 0 ? r.stdout : "";
  };
  const rutasCopiaBase = [join(home, ".agents", "skills", "execute-plan", "SKILL.md"), join(kitDestino, "core", "skills", "execute-plan", "SKILL.md")];
  const rutasCopiaDe = (entrada) => (entrada.alias === "K" ? [...rutasCopiaBase, SKILL_RELATIVA] : rutasCopiaBase);
  const rutasViva = [join(homedir(), ".agents", "skills", "execute-plan", "SKILL.md"), join(RAIZ_KIT, "core", "skills", "execute-plan", "SKILL.md")];
  const fuenteDe = (entrada) => {
    const rutas = Object.values(local.repos ?? {});
    if (entrada.alias === "K") rutas.push(RAIZ_KIT);
    return rutas;
  };
  return {
    kit: async ({ copia, entrada, rep }) => {
      // Cada repo de la copia (la raíz y, si hay, el hijo) tiene su base sintética.
      const bases = copia.carpetas.map((carpeta) => git(carpeta, ["rev-parse", "HEAD"]).trim());
      const kitRun = spawnSyncSeguro(process.execPath, [join(kitDestino, "scripts", "kit-run.mjs"), `changes/${entrada.id}/plan.md`, "--tool", "codex", "--root", copia.destino],
        { cwd: copia.destino, env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
      guardarRegistros({ salida, id: entrada.id, rep, copia, kitRun });
      const intentos = leerLineas(join(copia.destino, "changes", entrada.id, "runs.jsonl"));
      const desde = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      // El filtro de usage.mjs es una subcadena del nombre de carpeta del proyecto (basename del cwd de la sesión).
      const u = spawnSyncSeguro(process.execPath, [join(kitDestino, "scripts", "usage.mjs"), "--json", "--sessions", "--since", desde,
        "--tool", "codex", "--project", basename(copia.destino), "--codex-dir", codexReal], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
      const uso = u.status === 0 ? JSON.parse(u.stdout) : { filas: null, sesiones: null };
      const cambios = [];
      copia.carpetas.forEach((carpeta, i) => {
        const relativa = (ruta) => relative(copia.destino, join(carpeta, ruta));
        for (const linea of git(carpeta, ["diff", "--numstat", bases[i]]).split("\n").filter(Boolean)) {
          const [añadidas, borradas, ruta] = linea.split("\t");
          if (añadidas !== "-") cambios.push({ ruta: relativa(ruta), lineas: Number(añadidas) + Number(borradas) });
        }
        for (const ruta of git(carpeta, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean)) {
          const texto = readFileSync(join(carpeta, ruta), "utf8");
          cambios.push({ ruta: relativa(ruta), lineas: texto.split("\n").length - 1 });
        }
      });
      const revisor = (uso.filas ?? []).find((f) => f.rol === "revisor")?.modelo ?? null;
      return {
        intentos, sesiones: uso.sesiones, filas: uso.filas, revisorModelo: revisor, cambios,
        textos: sesionesDeCarpetas(codexReal, copia.carpetas), rutasFuente: fuenteDe(entrada), rutasCopia: rutasCopiaDe(entrada), rutasViva,
        referencia: copia.referencia,
      };
    },
  };
}

function parsearArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const clave = OPCIONES[argv[i]];
    if (!clave || i + 1 >= argv.length) throw new Error(`opción desconocida o sin valor: ${argv[i]}`);
    opts[clave] = argv[++i];
  }
  const entero = (valor, nombre, minimo) => {
    const n = Number(valor);
    if (!Number.isInteger(n) || n < minimo) throw new Error(`${nombre} debe ser un entero >= ${minimo}`);
    return n;
  };
  if (opts.semilla !== undefined) opts.semilla = entero(opts.semilla, "--semilla", 0);
  if (opts.repeticiones !== undefined) opts.repeticiones = entero(opts.repeticiones, "--repeticiones", 1);
  if (opts.topeTokens !== undefined) opts.topeTokens = entero(opts.topeTokens, "--tope-tokens", 1);
  if (opts.tramos !== undefined) opts.tramos = opts.tramos.split(",").map((t) => t.trim());
  return opts;
}

// Punto de entrada de `bench.mjs correr`. `--variante` admite un nombre de evals/builder/variantes o una ruta.
export async function main(argv, { corpus = CORPUS } = {}) {
  let opts;
  try {
    opts = parsearArgs(argv);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return 2;
  }
  for (const [falta, nombre] of [[!opts.salida, "--salida (o --output)"], [!opts.variante, "--variante"], [opts.semilla === undefined, "--semilla"]]) {
    if (falta) {
      process.stderr.write(`correr: falta ${nombre}\n`);
      return 2;
    }
  }
  const rutaVariante = existsSync(opts.variante) ? opts.variante : join(VARIANTES, `${opts.variante}.json`);
  const nombre = basename(rutaVariante, ".json");
  const corpusTexto = readFileSync(corpus, "utf8");
  const entradas = JSON.parse(corpusTexto);
  let calibracion = null;
  if (opts.calibracion) {
    try {
      calibracion = JSON.parse(readFileSync(opts.calibracion, "utf8"));
    } catch {
      process.stderr.write("correr: no se lee la calibración (--calibracion)\n");
      return 1;
    }
  }
  let local;
  try {
    local = JSON.parse(readFileSync(opts.local ?? LOCAL_POR_OMISION, "utf8"));
  } catch {
    process.stderr.write("correr: no se lee el mapa local (--local)\n");
    return 1;
  }

  const temporal = mkdtempSync(join(tmpdir(), "correr-"));
  try {
    const kitDestino = join(temporal, "kit");
    const codexReal = process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : join(homedir(), ".codex");
    let variante;
    try {
      variante = prepararVariante({ variante: rutaVariante, destino: kitDestino, codexReal });
    } catch (e) {
      if (e instanceof ErrorVariante) {
        process.stderr.write(`${e.message}\n`);
        return e.codigo;
      }
      throw e;
    }
    const env = { ...process.env, ...variante.env };
    let r;
    try {
      let modelos;
      try {
        modelos = modelosResueltos(kitDestino);
      } catch (e) {
        process.stderr.write(`correr: ${e.message}\n`);
        return 1;
      }
      r = await correr({
        salida: opts.salida,
        nombre,
        semilla: opts.semilla,
        repeticiones: opts.repeticiones ?? 1,
        entradas,
        corpusTexto,
        calibracion,
        tramos: opts.tramos ?? null,
        topeTokens: opts.topeTokens ?? null,
        variante: { huellas: variante.huellas, modelos, version: versionCodex(env) },
        destinoBase: join(temporal, "copias"),
        progreso: avisar,
        ejecutor: {
          // A17: el builder no ve las pruebas de referencia que el tramo nombra; A16 las reaplica al medir.
          preparar: ({ entrada, carpeta, destinoBase }) => prepararTramo({
            entrada, local, salida: opts.salida, destinoBase, carpeta, contrato: contratoDe(kitDestino), ocultarOraculo: true,
          }),
          ...ejecutorReal({ salida: opts.salida, kitDestino, env, codexReal, home: variante.home, local }),
        },
      });
    } finally {
      variante.limpiar();
    }
    if (r.motivo) process.stderr.write(`correr: ${r.motivo}\n`);
    return r.codigo;
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
}
