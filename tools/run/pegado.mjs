// Detector de builder pegado para kit run. Función pura: no lee archivos, no toca procesos.
// Usa solo la señal de progress.jsonl (tools/progress/eventos.mjs). «Avance» = fingerprint_cambió,
// casilla_marcada, archivo_editado o paso_iniciado. Un comando está abierto si hay comando_iniciado
// sin comando_terminado con el mismo id (o el último abierto si no hay id).
// Patrones: sin_avance, comando_repetido, sondeos. Estados: ok, pegado, no_verificable.

export const MINUTO = 60 * 1000;
export const UMBRALES = {
  sinAvanceMs: 20 * MINUTO,
  repetidos: 6,
  sondeos: 10,
  intervaloMs: 30 * 1000,
  arranqueMs: 5 * MINUTO,
  minRepMs: 5 * MINUTO,
  topeLargoMs: 30 * MINUTO,
};

const AVANCE = new Set(["fingerprint_cambió", "casilla_marcada", "archivo_editado", "paso_iniciado"]);
const MODOS = ["apagado", "observar", "cortar"];

function entero(valor, defecto) {
  const n = Number(valor);
  return valor !== undefined && valor !== "" && Number.isFinite(n) && n > 0 ? Math.round(n) : defecto;
}

// Lee KIT_RUN_PEGADO (0 apaga, observar, cortar; cualquier otro valor cuenta como observar)
// y los umbrales KIT_RUN_PEGADO_*. KIT_PROGRESO=0 deja la señal no verificable.
export function configuracion(env = {}) {
  const crudo = String(env.KIT_RUN_PEGADO ?? "").trim().toLowerCase();
  const modo = crudo === "0" ? "apagado" : crudo === "cortar" ? "cortar" : "observar";
  const largos = String(env.KIT_RUN_PEGADO_LARGOS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    modo: MODOS.includes(modo) ? modo : "observar",
    progreso: env.KIT_PROGRESO !== "0",
    sinAvanceMs: entero(env.KIT_RUN_PEGADO_SIN_AVANCE_MS, UMBRALES.sinAvanceMs),
    repetidos: entero(env.KIT_RUN_PEGADO_REPETIDOS, UMBRALES.repetidos),
    sondeos: entero(env.KIT_RUN_PEGADO_SONDEOS, UMBRALES.sondeos),
    intervaloMs: entero(env.KIT_RUN_PEGADO_INTERVALO_MS, UMBRALES.intervaloMs),
    arranqueMs: UMBRALES.arranqueMs,
    minRepMs: UMBRALES.minRepMs,
    topeLargoMs: UMBRALES.topeLargoMs,
    largos,
  };
}

function ms(t) {
  const n = Date.parse(t);
  return Number.isNaN(n) ? null : n;
}

// Quita espacios sobrantes y números (tiempos, conteos) para comparar comandos repetidos.
export function normalizarComando(cmd) {
  return String(cmd ?? "").trim().replace(/\s+/g, " ").replace(/\b\d+(\.\d+)?(ms|s|m|h)?\b/g, "N");
}

// Sondeo: esperar, mirar un log o consultar un proceso en lugar de trabajar.
export function esSondeo(cmd) {
  const c = String(cmd ?? "").trim();
  return /^(sleep|tail|watch|write_stdin)\b/.test(c) || /^cat\b.*\.log\b/.test(c);
}

function esLargoDeclarado(cmd, declarados) {
  const c = String(cmd ?? "");
  if (c.includes("verify")) return true;
  return declarados.some((d) => d && c.includes(d));
}

// Cuenta cuántos comandos seguidos (desde el final) cumplen el predicado.
function corrida(lista, predicado) {
  let n = 0;
  for (let i = lista.length - 1; i >= 0; i--) {
    if (!predicado(lista[i])) break;
    n++;
  }
  return n;
}

// eventos: lista de eventos de progress.jsonl. Devuelve {estado, patron, detalle, sinAvanceMs}.
// estado: ok | pegado | no_verificable. patron: sin_avance | comando_repetido | sondeos | null.
export function evaluarPegado(eventos, { ahora = Date.now(), inicioMs = null, config = configuracion({}), declarados = [], topeLargoMs = config.topeLargoMs } = {}) {
  const sinSeñal = (detalle) => ({ estado: "no_verificable", patron: null, detalle, sinAvanceMs: null });
  if (config.progreso === false) return sinSeñal("progreso desactivado (KIT_PROGRESO=0)");

  const lista = Array.isArray(eventos) ? eventos : [];
  const comandos = [];
  const abiertos = [];
  let ultimoAvance = null;
  for (const e of lista) {
    const tiempo = ms(e.t);
    if (AVANCE.has(e.tipo) && tiempo !== null && (ultimoAvance === null || tiempo > ultimoAvance)) ultimoAvance = tiempo;
    if (e.tipo === "comando_iniciado") {
      const c = { cmd: e.cmd ?? "", id: e.id ?? null, inicio: tiempo, t: tiempo };
      comandos.push(c);
      abiertos.push(c);
    } else if (e.tipo === "comando_terminado") {
      let idx = -1;
      if (e.id != null) idx = abiertos.findIndex((c) => c.id === e.id);
      else if (abiertos.length) idx = abiertos.length - 1;
      if (idx >= 0) abiertos.splice(idx, 1);
    }
  }

  if (comandos.length === 0) return sinSeñal("sin comandos en el log: no verificable");

  const inicioCorrida = inicioMs ?? comandos[0].t ?? ahora;
  if (ahora - inicioCorrida < config.arranqueMs) {
    return { estado: "ok", patron: null, detalle: "primeros minutos: no se evalúa", sinAvanceMs: 0 };
  }

  const exento = abiertos.find(
    (c) => esLargoDeclarado(c.cmd, declarados) && (c.inicio === null || ahora - c.inicio <= topeLargoMs),
  );
  if (exento) {
    return { estado: "ok", patron: null, detalle: `comando declarado largo en curso: ${normalizarComando(exento.cmd)}`, sinAvanceMs: null };
  }

  const base = ultimoAvance ?? inicioCorrida;
  const sinAvanceMs = Math.max(0, ahora - base);
  const desdeAvance = comandos.filter((c) => c.t === null || c.t > base);
  const minutos = Math.round(sinAvanceMs / MINUTO);

  if (sinAvanceMs >= config.minRepMs) {
    const sondeosSeguidos = corrida(desdeAvance, (c) => esSondeo(c.cmd));
    if (sondeosSeguidos >= config.sondeos) {
      return { estado: "pegado", patron: "sondeos", detalle: `${sondeosSeguidos} sondeos seguidos sin avance (${minutos} min)`, sinAvanceMs };
    }
    const ultimo = desdeAvance.length ? normalizarComando(desdeAvance[desdeAvance.length - 1].cmd) : null;
    const repetidos = corrida(desdeAvance, (c) => normalizarComando(c.cmd) === ultimo);
    if (ultimo !== null && repetidos >= config.repetidos) {
      return { estado: "pegado", patron: "comando_repetido", detalle: `«${ultimo}» ${repetidos} veces seguidas sin avance (${minutos} min)`, sinAvanceMs };
    }
  }

  if (sinAvanceMs >= config.sinAvanceMs) {
    return { estado: "pegado", patron: "sin_avance", detalle: `${minutos} min sin avance`, sinAvanceMs };
  }
  return { estado: "ok", patron: null, detalle: `último avance hace ${minutos} min`, sinAvanceMs };
}
