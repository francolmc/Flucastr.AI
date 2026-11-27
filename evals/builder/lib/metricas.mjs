// Métricas de un tramo y repetición (A7). Función pura: no lee archivos ni llama a nada. Quien llama
// pasa los datos ya filtrados (registros de runs.jsonl del tramo, sesiones y filas de scripts/usage.mjs
// de la carpeta de la copia, cambios y referencia con líneas). Un dato que falta da null, nunca 0.
// Ninguna salida contiene rutas (D-05): solo números, booleanos, nombres de modelo y motivos.

const EXCLUIDO = /^(changes|docs)\/|\.md$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock)$/;
const PRUEBA = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[^/]+$/;

const esEntero = (x) => Number.isInteger(x) && x >= 0;
const suma = (xs) => xs.reduce((a, b) => a + b, 0);
const redondear = (x) => Math.round(x * 10000) / 10000;
const modeloDe = (s) => (typeof s === "string" ? s.split(":")[0] : null);

// Suma en ms de una fase sobre los intentos donde se registró (D-32). Un intento que no llegó a la fase
// (kit run la deja null) no cuenta; null solo si no se registró en ninguno.
function msDe(intentos, campo) {
  const vals = intentos.map((i) => i[campo]).filter(esEntero);
  return vals.length === 0 ? null : suma(vals);
}

function lineasDe(cambios) {
  if (!Array.isArray(cambios)) return null;
  let prueba = 0;
  let producto = 0;
  for (const c of cambios) {
    if (EXCLUIDO.test(c.ruta)) continue;
    if (PRUEBA.test(c.ruta)) prueba += c.lineas;
    else producto += c.lineas;
  }
  return { prueba, producto, razon: producto > 0 ? redondear(prueba / producto) : null };
}

function tokensDe(filas, builderModelo, revisorModelo) {
  if (!Array.isArray(filas) || filas.length === 0) return null;
  const por = {};
  for (const f of filas) {
    const t = por[f.modelo] ?? { entrada: 0, cache_leida: 0, salida: 0 };
    t.entrada += f.entrada;
    t.cache_leida += f.cache_leida;
    t.salida += f.salida;
    por[f.modelo] = t;
  }
  const total = Object.values(por).reduce((a, t) => ({
    entrada: a.entrada + t.entrada, cache_leida: a.cache_leida + t.cache_leida, salida: a.salida + t.salida,
  }), { entrada: 0, cache_leida: 0, salida: 0 });
  // La separación builder/revisor solo existe si son modelos distintos; si comparten modelo, es null.
  const separacion = revisorModelo && builderModelo && modeloDe(revisorModelo) !== modeloDe(builderModelo)
    ? { builder: por[modeloDe(builderModelo)] ?? null, revisor: por[modeloDe(revisorModelo)] ?? null }
    : null;
  return { ...total, por_modelo: por, separacion };
}

function herramientaVerifica(herramienta) {
  if (/^claude/.test(herramienta ?? "")) return true;
  if (herramienta === "codex") return false;
  return null;
}

export function calcularMetricas({
  id = null, rep = null, variante = null, herramienta = null, intentos = [], sesiones = null, filas = null,
  revisorModelo = null, cambios = null, referencia = null, textos = null, rutasFuente = [], rutasCopia = [],
  rutasViva = [], oraculoPasa = null,
} = {}) {
  const ultimo = intentos.at(-1) ?? null;
  const hay = intentos.length > 0;

  const contaminado = Array.isArray(textos) ? textos.some((t) => rutasFuente.some((r) => t.includes(r))) : null;
  const contratoOk = Array.isArray(textos)
    ? textos.some((t) => rutasCopia.some((r) => t.includes(r))) && !textos.some((t) => rutasViva.some((r) => t.includes(r)))
    : null;

  // La señal de la referencia (`oraculo_pasa`) no cambia `resultado` (A16, D-37).
  let resultado = null;
  if (hay) {
    if (contaminado === true || contratoOk === false) resultado = "invalida";
    else if (ultimo.resultado === "DONE") resultado = "DONE";
    else if (ultimo.clase === "entorno" || ultimo.clase === "infra") resultado = "entorno";
    else resultado = "PAUSED";
  }

  const builderMs = msDe(intentos, "builder_ms");
  const verifyMs = msDe(intentos, "verify_ms");
  const revisorMs = msDe(intentos, "revisor_ms");
  const fasesMs = [builderMs, verifyMs, revisorMs].filter((ms) => ms !== null);
  const segundos = hay
    ? {
      total: fasesMs.length === 0 ? null : suma(fasesMs) / 1000,
      builder: builderMs === null ? null : builderMs / 1000,
      verify: verifyMs === null ? null : verifyMs / 1000,
      revisor: revisorMs === null ? null : revisorMs / 1000,
    }
    : null;

  const conTarifa = Array.isArray(sesiones) && sesiones.length > 0;
  const sinTarifa = conTarifa ? sesiones.filter((s) => s.creditos === null || s.creditos === undefined).length : null;
  const creditos = conTarifa && sinTarifa === 0 ? suma(sesiones.map((s) => s.creditos)) : null;
  const compactaciones = conTarifa && sesiones.every((s) => esEntero(s.compactaciones)) ? suma(sesiones.map((s) => s.compactaciones)) : null;

  return {
    id,
    rep,
    variante,
    resultado,
    done_sin_intervencion: hay ? ultimo.resultado === "DONE" : null,
    oraculo_pasa: oraculoPasa,
    relanzamientos: hay ? intentos.length - 1 : null,
    motivos: hay ? intentos.map((i) => i.motivo_relanzamiento).filter((m) => m !== null && m !== undefined) : null,
    muertes_proceso: hay ? intentos.filter((i) => i.clase === "infra").length : null,
    muertes_thrashing: hay ? intentos.filter((i) => i.senal === "thrashing").length : null,
    thrashing_verificable: herramientaVerifica(herramienta),
    compactaciones,
    tokens: tokensDe(filas, hay ? intentos[0].builder_modelo : null, revisorModelo),
    creditos,
    sin_tarifa: sinTarifa,
    segundos,
    lineas: lineasDe(cambios),
    contaminado,
    contrato_ok: contratoOk,
    referencia: Array.isArray(referencia)
      ? { archivos: referencia.length, lineas: suma(referencia.map((r) => r.lineas)) }
      : null,
  };
}
