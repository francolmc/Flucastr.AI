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

  // Un valor de compact_at vale para una herramienta si es un entero (todas) o un objeto con esa herramienta como clave.
  function valorDeHerramienta(v, herramienta) {
    if (esEntero(v)) return v;
    if (esObjeto(v) && esEntero(v[herramienta])) return v[herramienta];
    return undefined;
  }

  // Umbral de compactación de una herramienta para un agente, en este orden: valor propio del agente
  // (agents[agente].compact_at), compact_at del perfil y compact_at general. El revisor de kit run usa
  // kit_run.reviewer y, sin valor, el de planner. Devuelve un entero o undefined.
  function compactarEn(c, agente, herramienta) {
    const perfiles = c.profiles ?? {};
    const reviewer = agente === "reviewer";
    const propio = (reviewer ? c.kit_run?.reviewer : (c.agents ?? {})[agente]) ?? {};
    const planner = reviewer ? ((c.agents ?? {}).planner ?? {}) : {};
    let perfilId = propio.profile;
    if (!perfilId || perfiles[perfilId]?.tool !== herramienta) {
      perfilId = (c.default_profile ?? {})[herramienta];
    }
    return valorDeHerramienta(propio.compact_at, herramienta)
      ?? valorDeHerramienta(planner.compact_at, herramienta)
      ?? valorDeHerramienta((perfiles[perfilId] ?? {}).compact_at, herramienta)
      ?? valorDeHerramienta(c.compact_at, herramienta);
  }

  // Umbral de compactación de Codex del agente, o "" si no hay uno válido. Lo usa el lanzador codex-<agente>
  // con -c model_auto_compact_token_limit=<valor>.
  function compactarCodex(agente) {
    const valor = compactarEn(leerConfig(), agente, "codex");
    return valor === undefined ? "" : String(valor);
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
    compactarEn,
    compactarCodex,
    esfuerzoDe,
  };
}
