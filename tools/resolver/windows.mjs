// Ventanas de compactación efectivas por proyecto, herramienta y agente (solo lectura).
//
// Imprime únicamente claves de compactación (autoCompactWindow, env CLAUDE_CODE_AUTO_COMPACT_WINDOW,
// --autocompact, -c model_auto_compact_token_limit, compaction.modelOverrides y reserveTokens). Nunca otros valores de ajustes.
// Codex y Pi: solo se leen sus ajustes globales (CODEX_HOME/config.toml, PI_CODING_AGENT_DIR/settings.json);
// sus ajustes de proyecto no se leen.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Claude Code dispara la compactación 33000 tokens antes de la ventana.
export const DESCUENTO_CLAUDE = 33000;

function leerTexto(ruta) {
  try {
    return existsSync(ruta) ? readFileSync(ruta, "utf8") : undefined;
  } catch {
    return undefined;
  }
}

// Objeto JSON: undefined si no existe, null si no es un objeto JSON válido.
function leerJson(ruta) {
  const texto = leerTexto(ruta);
  if (texto === undefined) return undefined;
  try {
    const v = JSON.parse(texto);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// Entero positivo, como número o como texto de dígitos (los valores de Claude Code en env son texto).
function entero(v) {
  if (typeof v === "string" && /^\d+$/.test(v)) v = Number(v);
  return Number.isSafeInteger(v) && v > 0 ? v : undefined;
}

// Ajustes de Claude Code que pueden fijar la ventana, de más a menos específico.
function ajustesClaude({ home, proyecto }) {
  const rutas = [];
  if (proyecto) {
    rutas.push({ ruta: join(proyecto, ".claude", "settings.local.json"), nivel: "local" });
    rutas.push({ ruta: join(proyecto, ".claude", "settings.json"), nivel: "proyecto" });
  }
  rutas.push({ ruta: join(home, ".claude", "settings.json"), nivel: "usuario" });
  return rutas
    .map((f) => ({ ...f, obj: leerJson(f.ruta) }))
    .filter((f) => f.obj !== undefined);
}

// Modelo del agente en Claude Code: la clave de modelSettings.<modelo>.
function modeloClaude(deps, agente) {
  return deps.modeloDe(deps.config, deps.config.agents?.[agente] ?? {}, agente, "claude-code");
}

// Autocompact del lanzador claude-<agente>, o undefined si no fija --autocompact.
function lanzadorClaude(home, agente) {
  return entero(leerTexto(join(home, ".local", "bin", `claude-${agente}`))?.match(/--autocompact\s+(\d+)/)?.[1]);
}

// Niveles de la sesión de Claude Code de un agente, de más a menos específico (con --autocompact si conLanzador).
// Orden: entorno, bloque env, --autocompact del lanzador y, después, por archivo (local > proyecto > usuario),
// con modelSettings.<modelo>.autoCompactWindow antes que autoCompactWindow.
function nivelesClaude({ home, env, fuentes, agente, modelo, conLanzador }) {
  const niveles = [];
  const deEntorno = entero(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW);
  if (deEntorno !== undefined) niveles.push({ valor: deEntorno, via: "entorno", origen: "variable de entorno" });
  for (const f of fuentes) {
    const bloque = entero(f.obj?.env?.CLAUDE_CODE_AUTO_COMPACT_WINDOW);
    if (bloque !== undefined) niveles.push({ valor: bloque, via: "bloque env", origen: f.ruta });
  }
  const autocompact = conLanzador ? lanzadorClaude(home, agente) : undefined;
  if (autocompact !== undefined) niveles.push({ valor: autocompact, via: `claude-${agente}`, origen: "lanzador" });
  for (const f of fuentes) {
    const porModelo = entero(f.obj?.modelSettings?.[modelo]?.autoCompactWindow);
    if (porModelo !== undefined) niveles.push({ valor: porModelo, via: `modelSettings.${modelo}`, origen: f.ruta });
    const general = entero(f.obj?.autoCompactWindow);
    if (general !== undefined) niveles.push({ valor: general, via: "autoCompactWindow", origen: f.ruta });
  }
  return niveles;
}

// Avisos de variables que anulan o cambian el disparo: entorno y bloque env de cada archivo.
function avisosEntorno({ env, fuentes }) {
  const avisos = [];
  if (env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE !== undefined) avisos.push("AVISO: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE en el entorno cambia el disparo");
  if (entero(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW) !== undefined) avisos.push("AVISO: CLAUDE_CODE_AUTO_COMPACT_WINDOW en el entorno anula los demás ajustes");
  for (const f of fuentes) {
    if (entero(f.obj?.env?.CLAUDE_CODE_AUTO_COMPACT_WINDOW) !== undefined) avisos.push(`AVISO: CLAUDE_CODE_AUTO_COMPACT_WINDOW en el bloque env de ${f.ruta} anula los demás ajustes`);
  }
  return avisos;
}

// Avisos de los ajustes de Claude Code de un proyecto: JSON inválido, disparo por variable en el bloque env
// y ventana por modelo en modelSettings (solo si la entrada tiene autoCompactWindow).
function avisosClaude({ fuentes }) {
  const avisos = [];
  for (const f of fuentes) {
    if (f.obj === null) avisos.push(`AVISO: ${f.ruta} no es JSON válido; se ignora`);
    if (f.obj?.env?.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE !== undefined) avisos.push(`AVISO: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE en ${f.ruta} cambia el disparo`);
    for (const [modelo, entrada] of Object.entries(f.obj?.modelSettings ?? {})) {
      if (entrada?.autoCompactWindow !== undefined) avisos.push(`AVISO: modelSettings.${modelo}.autoCompactWindow en ${f.ruta} puede cambiar la ventana de Claude Code`);
    }
  }
  return avisos;
}

// Builder como subagente de Claude Code: la menor entre su frontmatter y la ventana heredada del planner.
function subagenteClaude({ home, heredada }) {
  const rutaAgente = join(home, ".claude", "agents", "builder.md");
  const fm = entero(leerTexto(rutaAgente)?.match(/^autoCompactWindow:\s*(\d+)\s*$/m)?.[1]);
  if (fm === undefined && heredada === undefined) return undefined;
  if (heredada === undefined || (fm !== undefined && fm <= heredada.valor)) return { valor: fm, via: "subagente", origen: rutaAgente };
  return { valor: heredada.valor, via: "subagente", origen: heredada.origen };
}

// Codex: -c del lanzador codex-<agente>, o model_auto_compact_token_limit global de config.toml.
// El revisor de kit run sale de compactarEn (kit_run.reviewer).
function ventanaCodex({ deps, home, env, agente }) {
  if (agente === "revisor") {
    const valor = entero(deps.compactarEn(deps.config, "reviewer", "codex"));
    return valor === undefined ? undefined : { valor, via: "kit_run.reviewer", origen: "models.json" };
  }
  const lanzador = leerTexto(join(home, ".local", "bin", `codex-${agente}`));
  const porLanzador = entero(lanzador?.match(/model_auto_compact_token_limit=(\d+)/)?.[1]);
  if (porLanzador !== undefined) return { valor: porLanzador, via: `codex-${agente}`, origen: "lanzador" };
  const codexHome = env.CODEX_HOME || join(home, ".codex");
  const ruta = join(codexHome, "config.toml");
  const antesDeTablas = (leerTexto(ruta) ?? "").split(/^\s*\[/m)[0];
  const global = entero(antesDeTablas.match(/^\s*model_auto_compact_token_limit\s*=\s*(\d+)/m)?.[1]);
  return global === undefined ? undefined : { valor: global, via: "config.toml", origen: ruta };
}

// Pi: ventana del perfil del modelo menos la reserva (override del modelo, o compactación global).
// Sin override ni global, el disparo no está fijado.
function ventanaPi({ deps, home, env, agente }) {
  const { config, modeloDe } = deps;
  const ruta = join(env.PI_CODING_AGENT_DIR || join(home, ".pi", "agent"), "settings.json");
  const ajustes = leerJson(ruta);
  const cfg = agente === "revisor" ? (config.kit_run?.reviewer ?? config.agents?.planner ?? {}) : (config.agents?.[agente] ?? {});
  const modelo = modeloDe(config, cfg, agente === "revisor" ? "kit_run.reviewer" : agente, "pi");
  const perfilId = cfg.profile && config.profiles?.[cfg.profile]?.tool === "pi" ? cfg.profile : config.default_profile?.pi;
  const perfil = config.profiles?.[perfilId] ?? {};
  const ventana = entero(perfil.windows?.[modelo]);
  const override = entero(ajustes?.compaction?.modelOverrides?.[modelo]?.reserveTokens);
  const global = entero(ajustes?.compaction?.reserveTokens);
  const reserva = override ?? global;
  return {
    ventana,
    reserva,
    via: override !== undefined ? "override" : global !== undefined ? "compactación global" : "perfil",
    origen: ruta,
  };
}

// Piso medido: propio de la herramienta o, si no, el de otra herramienta («prestado»). El revisor usa el de planner.
function pisoDe(config, herramienta, agente) {
  const clave = agente === "revisor" ? "planner" : agente;
  const floors = config.compaction?.floors ?? {};
  const propio = entero(floors[herramienta]?.[clave]);
  if (propio !== undefined) return { valor: propio, prestado: false };
  for (const otra of Object.keys(floors)) {
    const valor = entero(floors[otra]?.[clave]);
    if (valor !== undefined) return { valor, prestado: true };
  }
  return undefined;
}

// Una fila: estado OK, AVISO (disparo − piso < work_margin), piso sin medir, o sin fijar (planner y revisor avisan).
function filaDe({ config, proyecto, herramienta, agente, ventana, disparo, via, origen, avisarSinFijar = false }) {
  const piso = pisoDe(config, herramienta, agente);
  const margen = config.compaction?.work_margin ?? 0;
  let estado = "OK";
  let aviso;
  if (disparo === undefined) {
    estado = "sin fijar";
    if (avisarSinFijar) aviso = `AVISO: ${proyecto}: ${herramienta} ${agente} sin fijar`;
  } else if (piso === undefined) {
    estado = "piso sin medir";
  } else if (disparo - piso.valor < margen) {
    estado = "AVISO";
    aviso = `AVISO: ${proyecto} ${herramienta} ${agente}: disparo ${disparo} − piso ${piso.valor} = ${disparo - piso.valor} < work_margin ${margen}`;
  }
  const pisoTexto = piso === undefined ? "sin medir" : piso.prestado ? `${piso.valor} (prestado)` : String(piso.valor);
  return {
    fila: {
      proyecto,
      herramienta,
      agente,
      via: via ?? "-",
      ventana: ventana ?? "-",
      disparo: disparo ?? "-",
      origen: origen ?? "-",
      piso: pisoTexto,
      estado,
    },
    aviso,
  };
}

// Filas y avisos. `proyectos` son rutas absolutas; sin ninguna, Claude Code usa solo los ajustes de usuario.
// Codex y Pi no tienen ajustes de proyecto leídos: sus filas van una vez, bajo «(global)».
// deps: { config, modeloDe, compactarEn } (de tools/model-resolution/models.mjs).
export function calcularVentanas({ deps, home, env, proyectos }) {
  const { config } = deps;
  const filas = [];
  const avisos = [];
  const etiquetasClaude = proyectos.length > 0 ? proyectos : ["(global)"];
  for (const etiqueta of etiquetasClaude) {
    const proyecto = proyectos.length > 0 ? etiqueta : undefined;
    const fuentes = ajustesClaude({ home, proyecto });
    avisos.push(...avisosEntorno({ env, fuentes }), ...avisosClaude({ fuentes }));
    const nivelesDe = (agente, conLanzador) => nivelesClaude({ home, env, fuentes, agente, modelo: modeloClaude(deps, agente), conLanzador });
    const anadirFila = (agente, via, nivel, avisarSinFijar) => {
      const ventana = nivel?.valor;
      const disparo = ventana === undefined ? undefined : ventana - DESCUENTO_CLAUDE;
      const { fila, aviso } = filaDe({ config, proyecto: etiqueta, herramienta: "claude-code", agente, ventana, disparo, via, origen: nivel?.origen, avisarSinFijar });
      filas.push(fila);
      if (aviso) avisos.push(aviso);
    };
    // Efectiva del planner: entorno, bloque env, lanzador, luego ajustes. Sin valor, sin fijar (con aviso).
    const plannerEfectiva = nivelesDe("planner", true)[0];
    if (lanzadorClaude(home, "planner") !== undefined) anadirFila("planner", "claude-planner", plannerEfectiva, false);
    anadirFila("planner", "sesión", nivelesDe("planner", false)[0], plannerEfectiva === undefined);

    if (lanzadorClaude(home, "builder") !== undefined) anadirFila("builder", "claude-builder", nivelesDe("builder", true)[0], false);
    anadirFila("builder", "sesión", nivelesDe("builder", false)[0], false);
    // El subagente builder toma la menor entre su frontmatter y la efectiva del planner.
    anadirFila("builder", "subagente", subagenteClaude({ home, heredada: plannerEfectiva }), false);
    // El revisor de Claude Code hereda la efectiva del planner.
    anadirFila("revisor", "heredada", plannerEfectiva, plannerEfectiva === undefined);
  }

  for (const agente of ["planner", "builder", "revisor"]) {
    const c = ventanaCodex({ deps, home, env, agente });
    const { fila, aviso } = filaDe({ config, proyecto: "(global)", herramienta: "codex", agente, ventana: c?.valor, disparo: c?.valor, via: c?.via, origen: c?.origen, avisarSinFijar: agente !== "builder" });
    filas.push(fila);
    if (aviso) avisos.push(aviso);
  }
  for (const agente of ["planner", "builder", "revisor"]) {
    const p = ventanaPi({ deps, home, env, agente });
    const disparo = p.ventana !== undefined && p.reserva !== undefined ? p.ventana - p.reserva : undefined;
    const { fila, aviso } = filaDe({ config, proyecto: "(global)", herramienta: "pi", agente, ventana: p.ventana, disparo, via: p.via, origen: p.origen, avisarSinFijar: agente !== "builder" });
    filas.push(fila);
    if (aviso) avisos.push(aviso);
  }
  return { filas, avisos: [...new Set(avisos)] };
}

// Texto de la tabla (columnas alineadas) y de los avisos, uno por línea.
export function formatearVentanas({ filas, avisos }) {
  const columnas = ["proyecto", "herramienta", "agente", "via", "ventana", "disparo", "origen", "piso", "estado"];
  const celdas = [columnas, ...filas.map((f) => columnas.map((k) => String(f[k])))];
  const anchos = columnas.map((_, i) => Math.max(...celdas.map((r) => r[i].length)));
  const lineas = celdas.map((r) => r.map((c, i) => c.padEnd(anchos[i])).join("  ").trimEnd());
  return [...lineas, ...avisos].join("\n") + "\n";
}

// Proyectos del manifiesto: las carpetas de skills-proyecto y las de compactacion de Claude Code.
export function proyectosDelManifiesto(texto) {
  const proyectos = new Set();
  for (const linea of (texto ?? "").split("\n")) {
    const [tipo, ruta] = linea.split("\t");
    if (tipo === "skills-proyecto" && ruta) proyectos.add(ruta);
    if (tipo === "compactacion" && ruta?.endsWith("/.claude/settings.local.json")) proyectos.add(ruta.slice(0, -"/.claude/settings.local.json".length));
  }
  return [...proyectos];
}
