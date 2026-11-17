import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fallar } from "../resolver/errors.mjs";
import { esEntero, esObjeto } from "../resolver/object.mjs";

const ESFUERZO_CODEX = { max: "xhigh" };

export function crearResolucionModelos(raiz) {
  function rutaModelos() {
    const forzada = process.env.FLUCASTR_MODELOS;
    return forzada ? forzada : join(raiz, "modelos.json");
  }

  function leerConfig() {
    try {
      return JSON.parse(readFileSync(rutaModelos(), "utf8"));
    } catch (e) {
      fallar(`no pude leer modelos.json (${e.message})`);
    }
  }

  // nivel -> perfil -> modelo, con respaldo si el perfil no define ese nivel.
  // `a` es la entrada de modelos.json (agentes[agente] o kit_run.revisor); `agente` solo sirve para los mensajes.
  function modeloDe(c, a, agente, herramienta) {
    const perfiles = c.perfiles ?? {};

    const nivel = a.nivel ?? c.nivel_por_defecto;
    if (!(c.niveles ?? []).includes(nivel)) {
      fallar(`el nivel '${nivel}' del agente '${agente}' no está en 'niveles'`);
    }

    // el perfil propio del agente solo vale si es de esta herramienta
    let perfilId = a.perfil;
    if (!perfilId || perfiles[perfilId]?.herramienta !== herramienta) {
      perfilId = (c.perfil_por_defecto ?? {})[herramienta];
    }
    if (!perfilId) {
      fallar(`no hay perfil para la herramienta '${herramienta}': define 'perfil_por_defecto.${herramienta}' en modelos.json (o 'agentes.${agente}.perfil')`);
    }

    const perfil = perfiles[perfilId];
    if (!perfil) fallar(`el perfil '${perfilId}' no existe en 'perfiles'`);
    if (perfil.herramienta !== herramienta) {
      fallar(`el perfil '${perfilId}' es de '${perfil.herramienta}', no de '${herramienta}'`);
    }

    for (const n of [nivel, ...((c.respaldo ?? {})[nivel] ?? [])]) {
      if (perfil.modelos?.[n]) return perfil.modelos[n];
    }
    fallar(`el perfil '${perfilId}' no define un modelo para el nivel '${nivel}' ni sus respaldos`);
  }

  function resolverModelo(agente, herramienta) {
    const c = leerConfig();
    return modeloDe(c, (c.agentes ?? {})[agente] ?? {}, agente, herramienta);
  }

  // Esfuerzo de una entrada de modelos.json (agentes[agente] o kit_run.revisor), o "" si no declara ninguno:
  // entonces la herramienta usa el suyo.
  function esfuerzoEn(c, a, agente) {
    const esfuerzo = a.esfuerzo;
    if (esfuerzo === undefined) return "";
    if (!(c.esfuerzos ?? []).includes(esfuerzo)) {
      fallar(`el esfuerzo '${esfuerzo}' del agente '${agente}' no está en 'esfuerzos'`);
    }
    return esfuerzo;
  }

  function resolverEsfuerzo(agente) {
    const c = leerConfig();
    return esfuerzoEn(c, (c.agentes ?? {})[agente] ?? {}, agente);
  }

  // Revisor de kit run: kit_run.revisor de modelos.json, con la misma resolución que un agente.
  // Sin esa clave, el revisor es el agente principal, como antes. Devuelve { modelo, esfuerzo } sin traducir.
  function resolverRevisor(herramienta) {
    const c = leerConfig();
    const propio = c.kit_run?.revisor;
    if (propio === undefined) {
      const principal = (c.agentes ?? {}).principal ?? {};
      return { modelo: modeloDe(c, principal, "principal", herramienta), esfuerzo: esfuerzoEn(c, principal, "principal") };
    }
    if (!esObjeto(propio)) fallar("'kit_run.revisor' no es un objeto");
    return { modelo: modeloDe(c, propio, "kit_run.revisor", herramienta), esfuerzo: esfuerzoEn(c, propio, "kit_run.revisor") };
  }

  // Umbral de compactación de Codex del agente (agentes[agente].compactar_en ?? perfil.compactar_en ?? compactar_en),
  // o "" si no hay uno válido. Lo usa el lanzador codex-<agente> con -c model_auto_compact_token_limit=<valor>.
  function compactarCodex(agente) {
    const c = leerConfig();
    const perfiles = c.perfiles ?? {};
    const propio = (c.agentes ?? {})[agente] ?? {};
    let perfilId = propio.perfil;
    if (!perfilId || perfiles[perfilId]?.herramienta !== "codex") {
      perfilId = (c.perfil_por_defecto ?? {}).codex;
    }
    const compactar = propio.compactar_en ?? (perfiles[perfilId] ?? {}).compactar_en ?? c.compactar_en;
    return esEntero(compactar) ? String(compactar) : "";
  }

  // Codex (model_reasoning_effort) no tiene 'max': ahí se escribe 'xhigh'. Las demás herramientas usan el valor tal cual.
  function esfuerzoDe(herramienta, esfuerzo) {
    return herramienta === "codex" ? (ESFUERZO_CODEX[esfuerzo] ?? esfuerzo) : esfuerzo;
  }

  return {
    rutaModelos,
    leerConfig,
    modeloDe,
    resolverModelo,
    esfuerzoEn,
    resolverEsfuerzo,
    resolverRevisor,
    compactarCodex,
    esfuerzoDe,
  };
}
