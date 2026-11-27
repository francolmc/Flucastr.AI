// Comparación pareada de corridas del banco (A10). `bench.mjs comparar <carpeta> [<carpeta>]`: con dos,
// compara par a par (tramo y repetición); con una, resume esa corrida. Solo se comparan corridas pareables:
// misma semilla, orden, repeticiones, corpus, huella kit y versión de Codex (exit 2 si no). Las huellas
// contrato y modelos pueden diferir (es la variante) y se informan. Se excluyen los pares entorno,
// invalida y contaminado, y los que no tienen pareja. La salida solo lleva IDs, números y motivos fijos (D-05).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TAMANOS = ["hasta-60", "61-150", "mas-de-150", "sin-referencia"];

export class ErrorComparar extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorComparar";
    this.codigo = 2;
  }
}

const redondear = (x) => Math.round(x * 10000) / 10000;
const v = (x) => (x === null || x === undefined ? "-" : String(x));
const numeros = (xs) => xs.filter((x) => typeof x === "number" && Number.isFinite(x));

// Suma de un conjunto completo de números; null si está vacío o si falta algún dato (no se suma parcial).
function total(xs) {
  if (xs.length === 0 || !xs.every((x) => typeof x === "number" && Number.isFinite(x))) return null;
  return xs.reduce((a, b) => a + b, 0);
}

// true o false si todas las líneas dicen lo mismo; null si hay mezcla o no hay dato.
function verificable(xs) {
  if (xs.length > 0 && xs.every((x) => x === true)) return true;
  if (xs.length > 0 && xs.every((x) => x === false)) return false;
  return null;
}

function mediana(xs) {
  const ns = numeros(xs).sort((a, b) => a - b);
  if (ns.length === 0) return null;
  const medio = Math.floor(ns.length / 2);
  return redondear(ns.length % 2 ? ns[medio] : (ns[medio - 1] + ns[medio]) / 2);
}

// Carpeta de corrida: corrida.json (cabecera) y resultados.jsonl (una línea por par terminado).
export function leerCorrida(dir) {
  const rutaCabecera = join(dir, "corrida.json");
  const rutaFilas = join(dir, "resultados.jsonl");
  if (!existsSync(rutaCabecera) || !existsSync(rutaFilas)) {
    throw new ErrorComparar("falta corrida.json o resultados.jsonl en la carpeta");
  }
  let cabecera;
  try {
    cabecera = JSON.parse(readFileSync(rutaCabecera, "utf8"));
  } catch {
    throw new ErrorComparar("corrida.json no es JSON");
  }
  if (!Array.isArray(cabecera.orden) || !cabecera.huellas) throw new ErrorComparar("corrida.json incompleto");
  const filas = new Map();
  for (const linea of readFileSync(rutaFilas, "utf8").split("\n").filter(Boolean)) {
    let fila;
    try {
      fila = JSON.parse(linea);
    } catch {
      throw new ErrorComparar("resultados.jsonl tiene una línea que no es JSON");
    }
    filas.set(`${fila.id}-r${fila.rep}`, fila);
  }
  return { cabecera, filas };
}

// Motivos por los que no son pareables; vacío si lo son.
export function noPareables(a, b) {
  const motivos = [];
  if (a.semilla !== b.semilla) motivos.push("semilla");
  if (JSON.stringify(a.orden) !== JSON.stringify(b.orden)) motivos.push("orden");
  if (a.repeticiones !== b.repeticiones) motivos.push("repeticiones");
  if (a.corpus_sha256 !== b.corpus_sha256) motivos.push("corpus");
  if (a.huellas.kit !== b.huellas.kit) motivos.push("huella kit");
  if (a.version === null || a.version === undefined || b.version === null || b.version === undefined) {
    motivos.push("versión de Codex sin dato");
  } else if (a.version !== b.version) {
    motivos.push("versión de Codex");
  }
  return motivos;
}

// Motivo fijo por el que una línea no entra en la comparación; null si entra.
function motivoDeExclusion(fila) {
  if (fila.resultado === "entorno") return "entorno";
  if (fila.contaminado === true) return "contaminado";
  if (fila.resultado === "invalida") return "invalida";
  return null;
}

function tamanoDe(fila) {
  const lineas = fila.referencia?.lineas;
  if (!Number.isInteger(lineas)) return "sin-referencia";
  if (lineas <= 60) return "hasta-60";
  return lineas <= 150 ? "61-150" : "mas-de-150";
}

// Tasas, medianas y desglose por tamaño de un conjunto de líneas ya incluidas.
export function resumirCorrida(filas) {
  const n = filas.length;
  const tasa = (cumplen) => (n === 0 ? null : redondear(cumplen / n));
  const por_tamano = {};
  for (const tamano of TAMANOS) {
    const del = filas.filter((f) => tamanoDe(f) === tamano);
    por_tamano[tamano] = { n: del.length, done: del.length === 0 ? null : redondear(del.filter((f) => f.resultado === "DONE").length / del.length) };
  }
  // La tasa de oraculo_pasa cuenta solo los pares con dato (true o false); sin ninguno, null (A16, D-37).
  const conOraculo = filas.filter((f) => typeof f.oraculo_pasa === "boolean");
  return {
    n,
    tasas: {
      done: tasa(filas.filter((f) => f.resultado === "DONE").length),
      done_sin_intervencion: tasa(filas.filter((f) => f.done_sin_intervencion === true).length),
      oraculo_pasa: conOraculo.length === 0 ? null : redondear(conOraculo.filter((f) => f.oraculo_pasa).length / conOraculo.length),
    },
    con_oraculo: conOraculo.length,
    medianas: {
      relanzamientos: mediana(filas.map((f) => f.relanzamientos)),
      segundos: mediana(filas.map((f) => f.segundos?.total ?? null)),
      tokens: mediana(filas.map((f) => (f.tokens ? f.tokens.entrada + f.tokens.salida : null))),
      creditos: mediana(filas.map((f) => f.creditos ?? null)),
      compactaciones: mediana(filas.map((f) => f.compactaciones ?? null)),
      razon_prueba_producto: mediana(filas.map((f) => f.lineas?.razon ?? null)),
    },
    totales: {
      muertes_proceso: total(filas.map((f) => f.muertes_proceso ?? null)),
      // La firma de thrashing solo es verificable en Claude Code: si alguna línea no lo es, se marca.
      muertes_thrashing: {
        total: total(filas.map((f) => f.muertes_thrashing ?? null)),
        verificable: verificable(filas.map((f) => f.thrashing_verificable)),
      },
    },
    por_tamano,
  };
}

// Dos corridas pareables: filas por par, excluidos con su lado y resúmenes de ambas.
export function compararCorridas(ca, cb) {
  const motivos = noPareables(ca.cabecera, cb.cabecera);
  if (motivos.length > 0) return { codigo: 2, motivos };
  const pares = [];
  const excluidos = [];
  for (const par of ca.cabecera.orden) {
    const fa = ca.filas.get(par);
    const fb = cb.filas.get(par);
    if (!fa || !fb) {
      excluidos.push({ par, lado: !fa && !fb ? "ambos" : (!fa ? "A" : "B"), motivo: "sin-pareja" });
      continue;
    }
    const ma = motivoDeExclusion(fa);
    const mb = motivoDeExclusion(fb);
    if (ma || mb) {
      excluidos.push({ par, lado: ma && mb ? "ambos" : (ma ? "A" : "B"), motivo: ma ?? mb });
      continue;
    }
    pares.push({ par, a: fa, b: fb });
  }
  const huellas = ca.cabecera.huellas;
  const difieren = ["contrato", "modelos"].filter((k) => huellas[k] !== cb.cabecera.huellas[k]);
  return {
    codigo: 0,
    difieren,
    n: pares.length,
    a: resumirCorrida(pares.map((p) => p.a)),
    b: resumirCorrida(pares.map((p) => p.b)),
    pares,
    excluidos,
  };
}

// Una sola corrida: resumen de sus líneas incluidas; pares sin línea y líneas excluidas se listan.
export function resumirUna(corrida) {
  const incluidas = [];
  const excluidos = [];
  for (const par of corrida.cabecera.orden) {
    const fila = corrida.filas.get(par);
    if (!fila) excluidos.push({ par, motivo: "sin-resultado" });
    else if (motivoDeExclusion(fila)) excluidos.push({ par, motivo: motivoDeExclusion(fila) });
    else incluidas.push(fila);
  }
  return { codigo: 0, n: incluidas.length, a: resumirCorrida(incluidas), excluidos };
}

function tabla(cabecera, filas) {
  const todas = [cabecera, ...filas];
  const anchos = cabecera.map((_, i) => Math.max(...todas.map((f) => v(f[i]).length)));
  return todas.map((f) => f.map((c, i) => v(c).padEnd(anchos[i])).join("  ").trimEnd()).join("\n") + "\n";
}

const resumenTexto = (etiqueta, r) => `${etiqueta}: n=${r.n} done=${v(r.tasas.done)} sin_intervencion=${v(r.tasas.done_sin_intervencion)} `
  + `oraculo_pasa=${v(r.tasas.oraculo_pasa)} (con_dato=${r.con_oraculo}) `
  + `mediana_relanzamientos=${v(r.medianas.relanzamientos)} mediana_segundos=${v(r.medianas.segundos)} `
  + `mediana_tokens=${v(r.medianas.tokens)} mediana_creditos=${v(r.medianas.creditos)} `
  + `mediana_compactaciones=${v(r.medianas.compactaciones)} mediana_razon_prueba_producto=${v(r.medianas.razon_prueba_producto)} `
  + `muertes_proceso=${v(r.totales.muertes_proceso)} muertes_thrashing=${v(r.totales.muertes_thrashing.total)}`
  + `${r.totales.muertes_thrashing.verificable === false ? " (no verificable)" : ""}\n`;

function formatearPares(r) {
  let salida = `comparar: pareadas n=${r.n}, excluidas=${r.excluidos.length}\n`;
  salida += `difieren: ${r.difieren.length ? r.difieren.join(", ") : "ninguna"}\n`;
  const resta = (x, y) => (typeof x === "number" && typeof y === "number" ? y - x : null);
  // oraculo_A y oraculo_B: true, false o - si el par no tiene dato de la referencia (A16, D-37).
  salida += tabla(["par", "A", "B", "dif_relanzamientos", "dif_segundos", "oraculo_A", "oraculo_B"], r.pares.map(({ par, a, b }) => [
    par, a.resultado, b.resultado, v(resta(a.relanzamientos, b.relanzamientos)), v(resta(a.segundos?.total ?? null, b.segundos?.total ?? null)),
    v(a.oraculo_pasa), v(b.oraculo_pasa),
  ]));
  if (r.excluidos.length) {
    salida += "excluidos:\n";
    salida += r.excluidos.map((x) => `${x.par} ${x.lado} ${x.motivo}\n`).join("");
  }
  salida += resumenTexto("A", r.a) + resumenTexto("B", r.b);
  salida += "por tamaño:\n";
  salida += tabla(["tamaño", "A_n", "A_done", "B_n", "B_done"], TAMANOS.map((t) => [
    t, r.a.por_tamano[t].n, v(r.a.por_tamano[t].done), r.b.por_tamano[t].n, v(r.b.por_tamano[t].done),
  ]));
  return salida;
}

function formatearUna(r) {
  let salida = `corrida: n=${r.n} excluidas=${r.excluidos.length}\n`;
  if (r.excluidos.length) {
    salida += "excluidos:\n";
    salida += r.excluidos.map((x) => `${x.par} ${x.motivo}\n`).join("");
  }
  salida += resumenTexto("resumen", r.a);
  salida += "por tamaño:\n";
  salida += tabla(["tamaño", "n", "done"], TAMANOS.map((t) => [t, r.a.por_tamano[t].n, v(r.a.por_tamano[t].done)]));
  return salida;
}

// Punto de entrada de `bench.mjs comparar`. Devuelve el código de salida.
export function main(argv, { escribir = (t) => process.stdout.write(t), error = (t) => process.stderr.write(t) } = {}) {
  if (argv.length < 1 || argv.length > 2) {
    error("comparar: se pasan una o dos carpetas de corrida\n");
    return 2;
  }
  try {
    const corridas = argv.map((dir) => leerCorrida(dir));
    if (corridas.length === 1) {
      escribir(formatearUna(resumirUna(corridas[0])));
      return 0;
    }
    const r = compararCorridas(corridas[0], corridas[1]);
    if (r.codigo) {
      error(`comparar: corridas no pareables (${r.motivos.join(", ")})\n`);
      return 2;
    }
    escribir(formatearPares(r));
    return 0;
  } catch (e) {
    if (e instanceof ErrorComparar) {
      error(`comparar: ${e.message}\n`);
      return e.codigo;
    }
    throw e;
  }
}
