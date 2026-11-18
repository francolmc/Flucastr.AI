import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fallar } from "../resolver/errors.mjs";
import { esEntero, esObjeto } from "../resolver/object.mjs";

const ESFUERZO_CODEX = { max: "xhigh" };

export function crearResolucionModelos(raiz) {
  function rutaModelos() {
    const forzada = process.env.FLUCASTR_MODELOS;
    return forzada ? forzada : join(raiz, "models.json");
  }

  function leerConfig() {
    try {
      return JSON.parse(readFileSync(rutaModelos(), "utf8"));
    } catch (e) {
      fallar(`no pude leer models.json (${e.message})`);
    }
  }

  // nivel -> perfil -> modelo, con respaldo si el perfil no define ese nivel.
  // `a` es la entrada de models.json (agents[agente] o kit_run.reviewer); `agente` solo sirve para los mensajes.
  function modeloDe(c, a, agente, herramienta) {
    const perfiles = c.profiles ?? {};

    const nivel = a.level ?? c.default_level;
    if (!(c.levels ?? []).includes(nivel)) {
      fallar(`el nivel '${nivel}' del agente '${agente}' no está en 'levels'`);
    }

    // el perfil propio del agente solo vale si es de esta herramienta
    let perfilId = a.profile;
    if (!perfilId || perfiles[perfilId]?.tool !== herramienta) {
      perfilId = (c.default_profile ?? {})[herramienta];
    }
    if (!perfilId) {
      fallar(`no hay perfil para la herramienta '${herramienta}': define 'default_profile.${herramienta}' en models.json (o 'agents.${agente}.profile')`);
    }

    const perfil = perfiles[perfilId];
    if (!perfil) fallar(`el perfil '${perfilId}' no existe en 'profiles'`);
    if (perfil.tool !== herramienta) {
      fallar(`el perfil '${perfilId}' es de '${perfil.tool}', no de '${herramienta}'`);
    }

    for (const n of [nivel, ...((c.fallback ?? {})[nivel] ?? [])]) {
      if (perfil.models?.[n]) return perfil.models[n];
    }
    fallar(`el perfil '${perfilId}' no define un modelo para el nivel '${nivel}' ni sus fallback`);
  }

  function resolverModelo(agente, herramienta) {
    const c = leerConfig();
    return modeloDe(c, (c.agents ?? {})[agente] ?? {}, agente, herramienta);
  }

  // Esfuerzo de una entrada de models.json (agents[agente] o kit_run.reviewer), o "" si no declara ninguno:
  // entonces la herramienta usa el suyo.
  function esfuerzoEn(c, a, agente) {
    const esfuerzo = a.effort;
    if (esfuerzo === undefined) return "";
    if (!(c.efforts ?? []).includes(esfuerzo)) {
      fallar(`el esfuerzo '${esfuerzo}' del agente '${agente}' no está en 'efforts'`);
    }
    return esfuerzo;
  }

  function resolverEsfuerzo(agente) {
    const c = leerConfig();
    return esfuerzoEn(c, (c.agents ?? {})[agente] ?? {}, agente);
  }

  // Revisor de kit run: kit_run.reviewer de models.json, con la misma resolución que un agente.
  // Sin esa clave, el revisor es el agente planner, como antes. Devuelve { modelo, esfuerzo } sin traducir.
  function resolverRevisor(herramienta) {
    const c = leerConfig();
    const propio = c.kit_run?.reviewer;
    if (propio === undefined) {
      const planner = (c.agents ?? {}).planner ?? {};
      return { modelo: modeloDe(c, planner, "planner", herramienta), effort: esfuerzoEn(c, planner, "planner") };
    }
    if (!esObjeto(propio)) fallar("'kit_run.reviewer' no es un objeto");
    return { modelo: modeloDe(c, propio, "kit_run.reviewer", herramienta), effort: esfuerzoEn(c, propio, "kit_run.reviewer") };
  }

  // Umbral de compactación de Codex del agente (agents[agente].compact_at ?? perfil.compact_at ?? compact_at),
  // o "" si no hay uno válido. Lo usa el lanzador codex-<agente> con -c model_auto_compact_token_limit=<valor>.
  function compactarCodex(agente) {
    const c = leerConfig();
    const perfiles = c.profiles ?? {};
    const propio = (c.agents ?? {})[agente] ?? {};
    let perfilId = propio.profile;
    if (!perfilId || perfiles[perfilId]?.tool !== "codex") {
      perfilId = (c.default_profile ?? {}).codex;
    }
    const compactar = propio.compact_at ?? (perfiles[perfilId] ?? {}).compact_at ?? c.compact_at;
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
