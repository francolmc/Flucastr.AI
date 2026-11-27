// Calibración del corpus (A4). Un tramo vale solo si la verificación de la base falla, la de la
// referencia pasa y `kit-check --segment N` no falla (exit 1 o 2). `ejecutarTramo` hace los pasos
// reales en una copia temporal que se borra siempre: copia, preparación, base, Files: de la
// referencia, referencia y kit-check. El resultado guarda solo id, validez y un motivo fijo, y el
// hash del corpus: nunca salida cruda ni rutas de proyectos. Los registros crudos van a <salida>/logs.
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSyncSeguro } from "../../../tools/spawn/sync-seguro.mjs";
import { comandoVerificacion } from "../../../tools/run/plan.mjs";
import { contratoDe, fechaDeCommit, prepararCopia, seleccionarOraculo, ultimoAntesDe } from "./copia.mjs";
import { bloqueDe, escribirPlanEnCopia, leerFuente, reconstruirPlan } from "./plan.mjs";

const LIB = dirname(fileURLToPath(import.meta.url));
const KIT = join(LIB, "..", "..", "..");
const CORPUS = join(LIB, "..", "corpus.json");
const LOCAL_POR_OMISION = join(LIB, "..", "local.json");
const KIT_CHECK = join(KIT, "scripts", "kit-check.mjs");
const TOPE_MS = 10 * 60 * 1000;
const TRAMO_ID = /^[A-Z][A-Z0-9]*-\d{2}$/;
const OPCIONES = { "--salida": "salida", "--output": "salida", "--tramos": "tramos", "--segments": "tramos", "--local": "local" };
const MANIFIESTOS = ["package.json", "pnpm-lock.yaml", "package-lock.json"];

export function hashCorpus(texto) {
  return createHash("sha256").update(texto).digest("hex");
}

export function clasificar({ base, referencia, kitCheck }) {
  if (base.pasa) return { valido: false, motivo: "base-verde" };
  if (!referencia.pasa) return { valido: false, motivo: "referencia-roja" };
  if (kitCheck.falla) return { valido: false, motivo: "kit-check-falla" };
  return { valido: true };
}

// `ejecutar(entrada)` devuelve { base, referencia, kitCheck }; si lanza, el motivo es `e.motivo`.
// `progreso(linea)` recibe dos líneas por tramo: «[n/N] ID» al empezar y el resultado al terminar (A12).
export async function calibrar({ entradas, corpusTexto, ejecutar, progreso = () => {} }) {
  const resultados = [];
  for (const [i, entrada] of entradas.entries()) {
    const etiqueta = `[${i + 1}/${entradas.length}] ${entrada.id}`;
    progreso(etiqueta);
    let clasificado;
    if (entrada.estado === "excluido") {
      // Excluido del corpus (D-36): no se ejecuta, así que no crea copia ni gasta nada.
      clasificado = { valido: false, motivo: "excluido" };
    } else {
      try {
        const r = await ejecutar(entrada);
        clasificado = clasificar({ base: r.base, referencia: r.referencia, kitCheck: r.kitCheck });
      } catch (e) {
        clasificado = { valido: false, motivo: e.motivo ?? "error-ejecucion" };
      }
    }
    resultados.push({ id: entrada.id, ...clasificado });
    progreso(clasificado.valido ? `${etiqueta} válido` : `${etiqueta} descartado: ${clasificado.motivo}`);
  }
  return { corpus_sha256: hashCorpus(corpusTexto), resultados };
}

const avisar = (linea) => process.stderr.write(`${linea}\n`);

export function escribirCalibracion({ salida, resultado }) {
  mkdirSync(salida, { recursive: true });
  const ruta = join(salida, "calibracion.json");
  writeFileSync(ruta, `${JSON.stringify(resultado, null, 2)}\n`);
  return ruta;
}

export function parsearArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const clave = OPCIONES[argv[i]];
    if (!clave || i + 1 >= argv.length) throw new Error(`opción desconocida o sin valor: ${argv[i]}`);
    opts[clave] = argv[++i];
  }
  if (opts.tramos !== undefined) {
    opts.tramos = opts.tramos.split(",").map((t) => t.trim());
    if (opts.tramos.some((t) => !TRAMO_ID.test(t))) throw new Error("--tramos admite IDs separados por comas, p. ej. K-02,P1-01");
  }
  return opts;
}

class FalloTramo extends Error {
  constructor(motivo, causa = "") {
    super(causa || motivo);
    this.motivo = motivo;
  }
}

function git(cwd, args, { binario = false } = {}) {
  const r = spawnSyncSeguro("git", args, { cwd, encoding: binario ? "buffer" : "utf8", maxBuffer: 512 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`git ${args[0]} falló`);
  return r.stdout;
}

function existeEn(fuente, rev, ruta) {
  try {
    git(fuente, ["show", `${rev}:${ruta}`], { binario: true });
    return true;
  } catch {
    return false;
  }
}

// Plan y decisiones desde HEAD de la raíz: primero changes/done/<cambio>, luego changes/<cambio>.
function leerDelHead(raiz, cambio, archivo) {
  for (const dir of [`changes/done/${cambio}`, `changes/${cambio}`]) {
    try {
      return { ruta: `${dir}/${archivo}`, texto: leerFuente({ raiz, ruta: `${dir}/${archivo}` }) };
    } catch {
      // no está en esta carpeta
    }
  }
  return null;
}

function sinPrefijo(ruta, codigo) {
  const r = codigo !== "." && ruta.startsWith(`${codigo}/`) ? ruta.slice(codigo.length + 1) : ruta;
  if (r.startsWith("/") || r.split("/").includes("..")) throw new FalloTramo("error-preparacion", "ruta fuera del repo");
  return r;
}

function filesDe(bloque) {
  const m = (bloque ?? "").match(/^Files:[ \t]*(.*)$/m);
  return m ? m[1].split(",").map((s) => s.trim().replace(/`/g, "").replace(/\.$/, "").trim()).filter(Boolean) : [];
}

// Archivos del tramo N (propios) y de los tramos anteriores (previos), sin el prefijo del repo del código.
export function archivosDelTramo({ texto, n, codigo }) {
  const bloques = new Map();
  for (const trozo of texto.split(/^(?=### Segment )/m)) {
    const m = trozo.match(/^### Segment (\d+)\b/);
    if (m) bloques.set(Number(m[1]), trozo);
  }
  const propios = [...new Set(filesDe(bloques.get(n)).map((r) => sinPrefijo(r, codigo)))];
  const previos = [...bloques.entries()]
    .filter(([k]) => k < n)
    .flatMap(([, b]) => filesDe(b).map((r) => sinPrefijo(r, codigo)))
    .filter((r) => !propios.includes(r));
  return { propios, previos: [...new Set(previos)] };
}

// Líneas (añadidas más borradas) que la referencia cambia en los archivos propios, de base a referencia (A8).
// Un archivo binario (numstat «-») no cuenta. Sin archivos propios, la lista queda vacía.
function lineasDeReferencia({ fuente, base, referencia, rutas }) {
  if (rutas.length === 0) return [];
  return git(fuente, ["diff", "--numstat", base, referencia, "--", ...rutas])
    .split("\n")
    .filter(Boolean)
    .map((linea) => linea.split("\t"))
    .filter(([añadidas]) => añadidas !== "-")
    .map(([añadidas, borradas, ruta]) => ({ ruta, lineas: Number(añadidas) + Number(borradas) }));
}

// Pruebas del oráculo que el bloque del tramo nombra (A17): por ruta, o por nombre de archivo si es la única
// del oráculo con ese nombre. `correr` las oculta al builder; `calibrar` no las oculta (D-34).
export function oraculoOcultas({ bloque, oraculoRutas }) {
  // Token completo (o sufijo de ruta con «/»): `a.mjs` no casa con `data.mjs`.
  const tokens = bloque.split(/[\s`,;()]+/).map((t) => t.replace(/[.:]+$/, ""));
  const nombra = (x) => tokens.some((t) => t === x || t.endsWith(`/${x}`));
  return oraculoRutas.filter((ruta) => {
    if (nombra(ruta)) return true;
    const nombre = basename(ruta);
    return oraculoRutas.filter((r) => basename(r) === nombre).length === 1 && nombra(nombre);
  });
}

// Comando entre comillas invertidas de ## Verification, leído como lo hace tools/run (D-18).
function comandoDeVerificacion(plan) {
  const seccion = plan.match(/^## Verification\n([^\n]*)/m);
  if (!seccion || !/`[^`]+`/.test(seccion[1])) throw new FalloTramo("error-preparacion", "plan sin Verification");
  return comandoVerificacion(plan);
}

// Ejecuta un comando y guarda su salida cruda en `log`; devuelve el código de salida (null si expira).
function correr({ cmd, args = [], shell = false, cwd, env = process.env, topeMs, log }) {
  const r = spawnSyncSeguro(cmd, args, { cwd, env, shell, timeout: topeMs, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  mkdirSync(dirname(log), { recursive: true });
  const error = r.error ? `${r.error.code}\n` : "";
  writeFileSync(log, `$ ${[cmd, ...args].join(" ")}\n${r.stdout ?? ""}${r.stderr ?? ""}${error}exit ${r.status}\n`);
  return r.status;
}

// Deja en `dir` la versión de la referencia de cada ruta; si no existe allí, la borra. Una ruta que
// no está ni en la base ni en la referencia es un error de preparación (A4).
function aplicarReferencia({ fuente, referencia, dir, rutas }) {
  for (const ruta of rutas) {
    const destino = join(dir, ruta);
    if (existeEn(fuente, referencia, ruta)) {
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, git(fuente, ["show", `${referencia}:${ruta}`], { binario: true }));
    } else if (existsSync(destino)) {
      rmSync(destino, { force: true });
    } else {
      throw new FalloTramo("error-preparacion", "ruta propia sin base ni referencia");
    }
  }
}

// Prepara la copia temporal de un tramo: lee --local, copia, superpone, corre la preparación de la
// base y escribe el plan. Un fallo lanza FalloTramo con motivo fijo y borra la copia. Devuelve
// funciones para `ejecutarTramo` y el `limpiar` que borra la copia.
// `carpeta` nombra la copia y sus registros (por defecto, el ID del tramo); la corrida usa `bench-<corrida>-<ID>-r<k>`.
// `contrato` (por omisión, el del kit actual) solo reemplaza el contrato en copias del alias K (A15, D-35).
// `ocultarOraculo` (A17, lo activa `correr`) oculta al builder las pruebas del oráculo que el bloque nombra.
export function prepararTramo({ entrada, local, salida, destinoBase, topeMs = TOPE_MS, carpeta = null, contrato = contratoDe(KIT), ocultarOraculo = false }) {
  const { id, alias, tramo, base: baseCommit, referencia } = entrada;
  const asignacion = local.tramos?.[id];
  const raiz = local.repos?.[alias];
  if (!asignacion || !raiz || !existsSync(raiz)) throw new FalloTramo("error-copia", "sin repo o asignación en local.json");

  const codigo = asignacion.repo_codigo ?? ".";
  const conHijo = codigo !== ".";
  const codigoFuente = conHijo ? join(raiz, codigo) : raiz;
  const plan = leerDelHead(raiz, asignacion.cambio, "plan.md");
  if (!plan) throw new FalloTramo("error-copia", "sin plan.md en HEAD de la raíz");
  const decisiones = leerDelHead(raiz, asignacion.cambio, "decisions.md")?.texto ?? null;

  const subcarpetaVerif = entrada.verificacion_en === "codigo" && conHijo ? codigo : "";
  const oraculoRutas = seleccionarOraculo({ fuente: codigoFuente, base: baseCommit, referencia });
  const ocultas = ocultarOraculo ? oraculoOcultas({ bloque: bloqueDe(plan.texto, tramo), oraculoRutas }) : [];
  // Las ocultas entran en Scope con la convención de Files: (con el prefijo del repo hijo).
  const texto = reconstruirPlan({
    texto: plan.texto, n: tramo, subcarpeta: subcarpetaVerif, extra: ocultas.map((r) => (conHijo ? `${codigo}/${r}` : r)),
  });
  const comando = comandoDeVerificacion(texto);
  const archivos = archivosDelTramo({ texto: plan.texto, n: tramo, codigo });

  const repos = conHijo
    ? [
        { fuente: raiz, commit: ultimoAntesDe({ fuente: raiz, fecha: fechaDeCommit({ fuente: codigoFuente, commit: referencia }) }) },
        { fuente: codigoFuente, commit: baseCommit, subcarpeta: codigo },
      ]
    : [{ fuente: raiz, commit: baseCommit }];

  const enReferencia = (ruta, oraculo = false) => ({
    fuente: codigoFuente,
    rev: referencia,
    ruta,
    ...(conHijo ? { subcarpeta: codigo } : {}),
    ...(oraculo ? { oraculo: true } : {}),
  });
  const citadas =[...comando.matchAll(/[\w./-]+\.(?:test|spec)\.[cm]?[jt]s\b/g)].map((m) => m[0]);
  // Las ocultas no se superponen ni al inicio (ni como citadas): quedan ausentes o de la base (A17).
  const ocultasEntradas = ocultas.map((r) => enReferencia(r, true));
  const superposicion = [
    ...archivos.previos.filter((r) => existeEn(codigoFuente, referencia, r)).map((r) => enReferencia(r)),
    ...oraculoRutas.filter((r) => !ocultas.includes(r)).map((r) => enReferencia(r, true)),
    // Una prueba citada que existe en la referencia se toma de ahí; de HEAD solo la ausente (D-30, A4).
    ...citadas
      .filter((r) => !oraculoRutas.includes(r))
      .flatMap((r) => {
        if (existeEn(codigoFuente, referencia, r)) return [enReferencia(r, true)];
        return existeEn(codigoFuente, "HEAD", r) ? [{ ...enReferencia(r, true), rev: "HEAD" }] : [];
      }),
  ];
  if (entrada.manifiestos_referencia) {
    superposicion.push(...MANIFIESTOS.filter((r) => existeEn(codigoFuente, referencia, r)).map((r) => enReferencia(r)));
  }

  const nombreCopia = carpeta ?? id;
  const destino = join(destinoBase, nombreCopia);
  const dirCodigo = conHijo ? join(destino, codigo) : destino;
  const referenciaLineas = lineasDeReferencia({ fuente: codigoFuente, base: baseCommit, referencia, rutas: archivos.propios });
  const carpetas = conHijo ? [destino, dirCodigo] : [destino];
  const env = { ...process.env, ...(entrada.env ?? {}) };
  const log = (paso) => join(salida, "logs", `${nombreCopia}-${paso}.log`);
  const preparar = (paso) =>
    (entrada.preparacion ?? []).forEach((cmd, k) => {
      if (correr({ cmd, shell: true, cwd: dirCodigo, env, topeMs, log: log(`${paso}-${k + 1}`) }) !== 0) {
        throw new FalloTramo("error-preparacion", `preparación ${k + 1} falló`);
      }
    });
  const verificar = (paso) => correr({ cmd: comando, shell: true, cwd: destino, env, topeMs, log: log(paso) }) === 0;
  const limpiar = () => rmSync(destino, { recursive: true, force: true });

  try {
    let oraculo;
    try {
      ({ oraculo } = prepararCopia({ destino, cambio: asignacion.cambio, repos, superposicion, contrato: alias === "K" ? contrato : [] }));
    } catch (e) {
      throw new FalloTramo("error-copia", e.message);
    }
    // El registro de hashes incluye las ocultas con el hash de la referencia, aunque no se escriban aquí (A16, A17).
    const registro = [...oraculo, ...ocultasEntradas.map((s) => ({
      ruta: s.ruta,
      subcarpeta: s.subcarpeta ?? "",
      sha256: createHash("sha256").update(git(s.fuente, ["show", `${s.rev}:${s.ruta}`], { binario: true })).digest("hex"),
    }))];
    const planPath = escribirPlanEnCopia({ copia: destino, cambio: id, plan: texto, decisiones });
    preparar("preparacion-base");
    // Vuelve a escribir cada archivo de oráculo desde la referencia y dice si su hash coincide con el registrado.
    const reaplicarOraculo = () => {
      let coincide = true;
      for (const s of [...superposicion.filter((x) => x.oraculo), ...ocultasEntradas]) {
        const dir = s.subcarpeta ? join(destino, s.subcarpeta) : destino;
        const bytes = git(s.fuente, ["show", `${s.rev}:${s.ruta}`], { binario: true });
        mkdirSync(dirname(join(dir, s.ruta)), { recursive: true });
        writeFileSync(join(dir, s.ruta), bytes);
        const registrado = registro.find((o) => o.ruta === s.ruta && o.subcarpeta === (s.subcarpeta ?? ""));
        coincide = coincide && registrado?.sha256 === createHash("sha256").update(bytes).digest("hex");
      }
      return coincide;
    };
    return {
      destino,
      carpetas,
      referencia: referenciaLineas,
      planPath,
      oraculo: registro,
      reaplicarOraculo,
      verificar,
      preparar,
      limpiar,
      aplicarReferencia: () => aplicarReferencia({ fuente: codigoFuente, referencia, dir: dirCodigo, rutas: archivos.propios }),
      kitCheck: () =>
        correr({ cmd: process.execPath, args: [KIT_CHECK, planPath, "--segment", String(tramo)], cwd: destino, env, topeMs, log: log("kit-check") }),
    };
  } catch (e) {
    limpiar();
    throw e;
  }
}

// Corre un tramo sobre la copia preparada: base, Files: de la referencia, referencia y kit-check.
// Devuelve { base, referencia, kitCheck }; la copia se borra siempre.
export async function ejecutarTramo(opciones) {
  const copia = prepararTramo(opciones);
  try {
    const base = copia.verificar("verificacion-base");
    copia.aplicarReferencia();
    copia.preparar("preparacion-referencia");
    const referencia = copia.verificar("verificacion-referencia");
    const estado = copia.kitCheck();
    return {
      base: { pasa: base },
      referencia: { pasa: referencia },
      kitCheck: { falla: !(estado === 0 || estado === 3) },
    };
  } finally {
    copia.limpiar();
  }
}

// Punto de entrada de `bench.mjs calibrar`. Sin `ejecutar` usa el ejecutor real con el mapa de --local.
export async function main(argv, { ejecutar = null } = {}) {
  let opts;
  try {
    opts = parsearArgs(argv);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return 2;
  }
  if (!opts.salida) {
    process.stderr.write("calibrar: falta --salida (o --output)\n");
    return 2;
  }
  const corpusTexto = readFileSync(CORPUS, "utf8");
  let entradas = JSON.parse(corpusTexto);
  if (opts.tramos) {
    const desconocidos = opts.tramos.filter((id) => !entradas.some((e) => e.id === id));
    if (desconocidos.length) {
      process.stderr.write(`calibrar: ID desconocido en --tramos: ${desconocidos.join(",")}\n`);
      return 2;
    }
    entradas = entradas.filter((e) => opts.tramos.includes(e.id));
  }
  if (ejecutar) {
    const resultado = await calibrar({ entradas, corpusTexto, ejecutar, progreso: avisar });
    escribirCalibracion({ salida: opts.salida, resultado });
    return 0;
  }
  let local;
  try {
    local = JSON.parse(readFileSync(opts.local ?? LOCAL_POR_OMISION, "utf8"));
  } catch {
    process.stderr.write("calibrar: no se lee el mapa local (--local)\n");
    return 1;
  }
  const temporal = mkdtempSync(join(tmpdir(), "calibrar-"));
  try {
    const resultado = await calibrar({
      entradas,
      corpusTexto,
      ejecutar: (entrada) => ejecutarTramo({ entrada, local, salida: opts.salida, destinoBase: temporal }),
      progreso: avisar,
    });
    escribirCalibracion({ salida: opts.salida, resultado });
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
  return 0;
}
