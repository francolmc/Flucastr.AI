#!/usr/bin/env node
// Resuelve el modelo de cada agente según modelos.json y genera los archivos por herramienta.
//
// Uso:
//   node scripts/resolver.mjs modelo <agente> <herramienta>   imprime el modelo (herramienta: claude-code | pi)
//   node scripts/resolver.mjs esfuerzo <agente>               imprime el esfuerzo del agente (vacío si no declara)
//   node scripts/resolver.mjs modelo-esfuerzo <agente> <herramienta>  imprime modelo:esfuerzo (solo el modelo si no hay esfuerzo)
//   node scripts/resolver.mjs agente-claude <archivo.md>      imprime el agente con el campo `model` ya resuelto (Claude Code)
//   node scripts/resolver.mjs agente-pi <archivo.md>          igual, con el modelo de Pi (para el paquete de subagentes)
//   node scripts/resolver.mjs cuerpo <archivo.md>             imprime el agente sin encabezado, con la línea de identidad de Pi (para Pi)
//   node scripts/resolver.mjs fijar-agente <ajustes.json> <agente> [--sobrescribir]   deja `agent` en los ajustes de un proyecto (no pisa otro valor, salvo con --sobrescribir)
//   node scripts/resolver.mjs quitar-agente <ajustes.json> <agente>  deshace lo anterior, solo si el valor es ese agente
//   node scripts/resolver.mjs comparar-modelos <personal.json> <publicado.json>  imprime las diferencias que merecen aviso (nada si no hay)
//   node scripts/resolver.mjs fijar-compactacion pi <settings.json> [--simular]  pone compaction.modelOverrides de Pi (no pisa lo del usuario)
//   node scripts/resolver.mjs quitar-compactacion pi <settings.json> <modelo> <reserve> [creado]  deshace lo anterior, solo si el valor es ese
//   node scripts/resolver.mjs fijar-compactacion claude <settings.json> [--simular]  pone autoCompactWindow (Claude Code) en los ajustes del proyecto
//   node scripts/resolver.mjs quitar-compactacion claude <settings.json> <valor>  deshace lo anterior, solo si el valor es ese
//   node scripts/resolver.mjs fijar-hook claude <settings.local.json> [--simular]  agrega el hook PostToolUse del validador (no pisa lo ajeno)
//   node scripts/resolver.mjs quitar-hook claude <settings.local.json>  deshace lo anterior, solo la entrada exacta del validador
//   node scripts/resolver.mjs fijar-deny claude <proyecto/.claude/settings.json> [--simular]  agrega las reglas deny del kit que falten (una línea agregada:<regla> por cada una)
//   node scripts/resolver.mjs quitar-deny claude <proyecto/.claude/settings.json> <regla>  quita esa regla exacta; borra lo que quede vacío
//   node scripts/resolver.mjs agente-codex <archivo.md>      imprime el TOML del agente para Codex (~/.codex/agents/<nombre>.toml), modelo y esfuerzo resueltos
//   node scripts/resolver.mjs fijar-deny codex <proyecto/.codex/rules/flucastr.rules> [--simular]  escribe las reglas prefix_rule del kit (no pisa un archivo ajeno)
//   node scripts/resolver.mjs quitar-deny codex <proyecto/.codex/rules/flucastr.rules>  borra ese archivo solo si lleva la marca del kit
//   modelo-esfuerzo <agente> codex: el esfuerzo sale traducido (max -> xhigh), como lo pide Codex
//   esfuerzo <agente> codex: igual, solo el esfuerzo traducido para Codex
//   instrucciones-codex <archivo.md>: imprime las instrucciones del agente como cadena JSON (válida como valor TOML en codex -c)
//
// Archivo de modelos: la variable FLUCASTR_MODELOS (si existe y no está vacía) indica el modelos.json a leer;
// si no, se lee el modelos.json del repo. Lo usa instalar.sh --copiar con el modelos.json personal.

import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function fallar(mensaje) {
  console.error(`error: ${mensaje}`);
  process.exit(1);
}

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

// nivel -> perfil -> modelo, con respaldo si el perfil no define ese nivel
function resolverModelo(agente, herramienta) {
  const c = leerConfig();
  const a = (c.agentes ?? {})[agente] ?? {};
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

// Esfuerzo del agente (agentes[agente].esfuerzo), o "" si no declara ninguno: entonces la herramienta usa el suyo.
function resolverEsfuerzo(agente) {
  const c = leerConfig();
  const esfuerzo = ((c.agentes ?? {})[agente] ?? {}).esfuerzo;
  if (esfuerzo === undefined) return "";
  if (!(c.esfuerzos ?? []).includes(esfuerzo)) {
    fallar(`el esfuerzo '${esfuerzo}' del agente '${agente}' no está en 'esfuerzos'`);
  }
  return esfuerzo;
}

// Codex (model_reasoning_effort) no tiene 'max': ahí se escribe 'xhigh'. Las demás herramientas usan el valor tal cual.
const ESFUERZO_CODEX = { max: "xhigh" };
function esfuerzoDe(herramienta, esfuerzo) {
  return herramienta === "codex" ? (ESFUERZO_CODEX[esfuerzo] ?? esfuerzo) : esfuerzo;
}

// Valor de una clave de la cabecera YAML (sin comillas exteriores), o undefined si no está.
function valorCabecera(cabecera, campo) {
  const m = cabecera.match(new RegExp(`^${campo}:\\s*(.+?)\\s*$`, "m"));
  if (!m) return undefined;
  const comillas = m[1].match(/^"(.*)"$/) ?? m[1].match(/^'(.*)'$/);
  return comillas ? comillas[1] : m[1];
}

function partir(archivo) {
  const texto = readFileSync(archivo, "utf8");
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fallar(`${archivo} no tiene encabezado entre líneas '---'`);
  return { cabecera: m[1], cuerpo: m[2] };
}

// Línea fija que dice al agente en qué herramienta corre, con qué modelo y como qué agente.
function lineaIdentidad(herramienta, agente) {
  const nombre = herramienta === "pi" ? "Pi" : herramienta === "codex" ? "Codex" : "Claude Code";
  return `Herramienta: ${nombre} | Modelo: ${resolverModelo(agente, herramienta)} | Agente: ${agente}`;
}

// Pi no puede hacer cumplir patrones de Bash: en `tools:` cada `Bash(...)` pasa a `Bash`, una sola vez.
// Solo toca la línea `tools:`; el resto de la cabecera queda igual.
function bashPlano(cabecera) {
  return cabecera.replace(/^tools:[ \t]*(.*)$/m, (_linea, valor) => {
    const partes = [];
    let prof = 0;
    let actual = "";
    for (const ch of valor) {
      if (ch === "(") prof++;
      if (ch === ")") prof--;
      if (ch === "," && prof === 0) {
        partes.push(actual.trim());
        actual = "";
      } else {
        actual += ch;
      }
    }
    if (actual.trim()) partes.push(actual.trim());

    const salida = [];
    let hayBash = false;
    for (const p of partes) {
      if (/^Bash(\(.*\))?$/.test(p)) {
        if (hayBash) continue;
        hayBash = true;
        salida.push("Bash");
      } else {
        salida.push(p);
      }
    }
    return `tools: ${salida.join(", ")}`;
  });
}

function leerJson(ruta) {
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    fallar(`no pude leer ${ruta} (${e.message})`);
  }
}

function leerAjustes(ruta) {
  if (!existsSync(ruta)) return {};
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    fallar(`${ruta} no es JSON válido (${e.message}); no lo toco`);
  }
}

// --- Compactación automática de Pi (fijar-compactacion / quitar-compactacion) ---

// Defecto de reserveTokens en Pi: un umbral que dé menos que esto es peor que el defecto.
const RESERVA_MINIMA_PI = 16384;
const INTENTOS_BLOQUEO = 10;
const ESPERA_BLOQUEO_MS = 20;
const CADUCIDAD_BLOQUEO_MS = 10000;

function esObjeto(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function tiene(obj, clave) {
  return Object.prototype.hasOwnProperty.call(obj, clave);
}

function esEntero(v) {
  return Number.isSafeInteger(v) && v > 0;
}

// Ajustes de Pi como objeto; si no es JSON válido, falla sin tocar nada.
function ajustesDeObjeto(ruta) {
  const ajustes = leerAjustes(ruta);
  if (!esObjeto(ajustes)) fallar(`${ruta} no es JSON válido; no lo toco`);
  return ajustes;
}

// Como ajustesDeObjeto, pero sin salir (para releer bajo el bloqueo). null si no es un objeto JSON.
function leerAjustesOpcional(ruta) {
  if (!existsSync(ruta)) return {};
  try {
    const ajustes = JSON.parse(readFileSync(ruta, "utf8"));
    return esObjeto(ajustes) ? ajustes : null;
  } catch {
    return null;
  }
}

// Modelos de Pi de todos los perfiles con herramienta "pi", sin repetidos, en orden del archivo. Valor: su perfil.
function candidatosPi(c) {
  const vistos = new Map();
  for (const perfil of Object.values(c.perfiles ?? {})) {
    if (perfil.herramienta !== "pi") continue;
    for (const modelo of Object.values(perfil.modelos ?? {})) {
      if (!vistos.has(modelo)) vistos.set(modelo, perfil);
    }
  }
  return vistos;
}

// Decide, sin escribir, qué pasa con cada modelo. Devuelve las líneas de salida y los pares [modelo, reserve] a fijar.
function planFijarPi(ajustes, candidatos, c, creado) {
  const sufijo = creado ? ":creado" : "";
  const comp = ajustes.compaction;
  const usuarioGlobal =
    comp !== undefined &&
    (!esObjeto(comp) ||
      tiene(comp, "enabled") ||
      tiene(comp, "reserveTokens") ||
      (tiene(comp, "modelOverrides") && !esObjeto(comp.modelOverrides)));
  if (usuarioGlobal) return { lineas: ["omitido-usuario:*"], cambios: [] };

  const overrides = comp?.modelOverrides ?? {};
  const lineas = [];
  const cambios = [];
  for (const [modelo, perfil] of candidatos) {
    if (tiene(overrides, modelo)) {
      lineas.push(`omitido-usuario:${modelo}`);
      continue;
    }
    if (!esEntero(perfil.ventanas?.[modelo])) {
      lineas.push(`omitido-ventana:${modelo}`);
      continue;
    }
    const compactar = perfil.compactar_en ?? c.compactar_en;
    if (!esEntero(compactar)) {
      lineas.push(`omitido-umbral:${modelo}`);
      continue;
    }
    const reserve = perfil.ventanas[modelo] - compactar;
    if (reserve < RESERVA_MINIMA_PI) {
      lineas.push(`omitido-umbral:${modelo}`);
      continue;
    }
    lineas.push(`fijado:${modelo}=${reserve}${sufijo}`);
    cambios.push([modelo, reserve]);
  }
  return { lineas, cambios };
}

function aplicarFijarPi(ajustes, cambios) {
  ajustes.compaction ??= {};
  ajustes.compaction.modelOverrides ??= {};
  for (const [modelo, reserve] of cambios) {
    ajustes.compaction.modelOverrides[modelo] = { reserveTokens: reserve };
  }
}

// Quita el override solo si es exactamente { reserveTokens: reserve }; poda lo que quede vacío.
function quitarOverridePi(ajustes, modelo, reserve) {
  const comp = ajustes.compaction;
  if (!esObjeto(comp) || !esObjeto(comp.modelOverrides) || !tiene(comp.modelOverrides, modelo)) return false;
  const valor = comp.modelOverrides[modelo];
  const claves = esObjeto(valor) ? Object.keys(valor) : [];
  if (claves.length !== 1 || claves[0] !== "reserveTokens" || valor.reserveTokens !== reserve) return false;
  delete comp.modelOverrides[modelo];
  if (Object.keys(comp.modelOverrides).length === 0) delete comp.modelOverrides;
  if (Object.keys(comp).length === 0) delete ajustes.compaction;
  return true;
}

function escribirAtomico(ruta, objeto) {
  const tmp = `${ruta}.flucastr-${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(objeto, null, 2) + "\n");
  renameSync(tmp, ruta);
}

function antiguo(ruta) {
  try {
    return Date.now() - statSync(ruta).mtimeMs > CADUCIDAD_BLOQUEO_MS;
  } catch {
    return false;
  }
}

// Toma el bloqueo de Pi (<ruta>.lock, un directorio), ejecuta fn y lo suelta siempre.
function conBloqueo(ruta, fn) {
  const lock = `${ruta}.lock`;
  const espera = new Int32Array(new SharedArrayBuffer(4));
  let tomado = false;
  let huerfanoBorrado = false;
  for (let intento = 0; intento < INTENTOS_BLOQUEO && !tomado; intento++) {
    try {
      mkdirSync(lock);
      tomado = true;
    } catch (e) {
      if (e.code !== "EEXIST") break;
      if (!huerfanoBorrado && antiguo(lock)) {
        huerfanoBorrado = true;
        try {
          rmdirSync(lock);
        } catch {
          // lo borró otro proceso: se reintenta
        }
        continue;
      }
      Atomics.wait(espera, 0, 0, ESPERA_BLOQUEO_MS);
    }
  }
  if (!tomado) fallar(`no pude tomar el bloqueo ${lock}; no toco el archivo`);
  try {
    return fn();
  } finally {
    try {
      rmdirSync(lock);
    } catch {
      // ya no estaba
    }
  }
}

function fijarCompactacionPi(ruta, simular) {
  const c = leerConfig();
  const candidatos = candidatosPi(c);
  if (simular) {
    const plan = planFijarPi(ajustesDeObjeto(ruta), candidatos, c, !existsSync(ruta));
    for (const linea of plan.lineas) console.log(linea);
    return;
  }
  const previo = planFijarPi(ajustesDeObjeto(ruta), candidatos, c, !existsSync(ruta));
  if (previo.cambios.length === 0) {
    for (const linea of previo.lineas) console.log(linea);
    return;
  }

  mkdirSync(dirname(ruta), { recursive: true });
  let plan = null;
  let invalido = false;
  conBloqueo(ruta, () => {
    const creado = !existsSync(ruta);
    const ajustes = leerAjustesOpcional(ruta);
    if (ajustes === null) {
      invalido = true;
      return;
    }
    plan = planFijarPi(ajustes, candidatos, c, creado);
    if (plan.cambios.length > 0) {
      aplicarFijarPi(ajustes, plan.cambios);
      escribirAtomico(ruta, ajustes);
    }
  });
  if (invalido) fallar(`${ruta} no es JSON válido; no lo toco`);
  for (const linea of plan.lineas) console.log(linea);
}

function quitarCompactacionPi(ruta, modelo, reserve, creado) {
  if (!existsSync(ruta) || !quitarOverridePi(ajustesDeObjeto(ruta), modelo, reserve)) {
    console.log("omitido");
    return;
  }
  let salida = "omitido";
  let invalido = false;
  conBloqueo(ruta, () => {
    if (!existsSync(ruta)) return;
    const ajustes = leerAjustesOpcional(ruta);
    if (ajustes === null) {
      invalido = true;
      return;
    }
    if (!quitarOverridePi(ajustes, modelo, reserve)) return;
    if (creado && Object.keys(ajustes).length === 0) {
      rmSync(ruta);
      salida = "archivo-quitado";
    } else {
      escribirAtomico(ruta, ajustes);
      salida = "quitado";
    }
  });
  if (invalido) fallar(`${ruta} no es JSON válido; no lo toco`);
  console.log(salida);
}

// --- Compactación automática de Claude Code (fijar-compactacion claude / quitar-compactacion claude) ---

// Claude Code compacta a ventana − 33000 (informe 2026-10-31 de verificación de compactación);
// para compactar a compactar_en se escribe compactar_en + 33000.
const COLCHON_CLAUDE_CODE = 33000;
// Claude Code ignora en silencio un autoCompactWindow fuera de este rango.
const VENTANA_MINIMA_CLAUDE_CODE = 100000;
const VENTANA_MAXIMA_CLAUDE_CODE = 1000000;

// Valor de autoCompactWindow que corresponde al perfil por defecto de Claude Code, o la línea de omisión.
function valorClaude(c) {
  const perfil = (c.perfiles ?? {})[(c.perfil_por_defecto ?? {})["claude-code"]] ?? {};
  const compactar = perfil.compactar_en ?? c.compactar_en;
  if (!esEntero(compactar)) return { omision: "omitido-umbral" };
  const valor = compactar + COLCHON_CLAUDE_CODE;
  if (valor < VENTANA_MINIMA_CLAUDE_CODE || valor > VENTANA_MAXIMA_CLAUDE_CODE) {
    return { omision: `omitido-rango:${valor}` };
  }
  return { valor };
}

function fijarCompactacionClaude(ruta, simular) {
  const { valor, omision } = valorClaude(leerConfig());
  const ajustes = ajustesDeObjeto(ruta);
  let salida;
  if (omision) {
    salida = omision;
  } else if (ajustes.autoCompactWindow === valor) {
    salida = "ya-estaba";
  } else if (tiene(ajustes, "autoCompactWindow")) {
    salida = "omitido-usuario";
  } else {
    salida = `fijado:${valor}`;
  }
  if (salida === `fijado:${valor}` && !simular) {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ ...ajustes, autoCompactWindow: valor }, null, 2) + "\n");
  }
  console.log(salida);
}

function quitarCompactacionClaude(ruta, valor) {
  if (!existsSync(ruta)) {
    console.log("omitido");
    return;
  }
  const ajustes = ajustesDeObjeto(ruta);
  if (ajustes.autoCompactWindow !== Number(valor)) {
    console.log("omitido");
    return;
  }
  delete ajustes.autoCompactWindow;
  if (Object.keys(ajustes).length === 0) {
    rmSync(ruta);
    console.log("archivo-quitado");
  } else {
    escribirAtomico(ruta, ajustes);
    console.log("quitado");
  }
}

// --- Hook del validador en Claude Code (fijar-hook / quitar-hook, F38) ---

const COMANDO_HOOK_CLAUDE = "node ~/.flucastr-ai/validar-tarea.mjs --hook";
const ENTRADA_HOOK_CLAUDE = { matcher: "Write|Edit|MultiEdit", hooks: [{ type: "command", command: COMANDO_HOOK_CLAUDE }] };

// Solo settings.local.json: nunca se toca ~/.claude/settings.json.
function comprobarNombreHookClaude(ruta) {
  if (basename(ruta) !== "settings.local.json") {
    fallar(`${ruta}: solo se toca settings.local.json (nunca ~/.claude/settings.json)`);
  }
}

// Entrada que contiene nuestro command exacto (entre sus hooks).
function tieneNuestroHook(entrada) {
  return esObjeto(entrada) && Array.isArray(entrada.hooks) && entrada.hooks.some((h) => esObjeto(h) && h.command === COMANDO_HOOK_CLAUDE);
}

// Entrada cuyo único hook es nuestro command exacto: es la que quitar-hook borra.
function esSoloNuestraHookClaude(entrada) {
  return tieneNuestroHook(entrada) && entrada.hooks.length === 1;
}

function fijarHookClaude(ruta, simular) {
  comprobarNombreHookClaude(ruta);
  const ajustes = ajustesDeObjeto(ruta);
  const hooks = tiene(ajustes, "hooks") ? ajustes.hooks : {};
  if (!esObjeto(hooks)) fallar(`${ruta}: 'hooks' no es un objeto; no lo toco`);
  const postToolUse = tiene(hooks, "PostToolUse") ? hooks.PostToolUse : [];
  if (!Array.isArray(postToolUse)) fallar(`${ruta}: 'hooks.PostToolUse' no es un arreglo; no lo toco`);
  if (postToolUse.some(tieneNuestroHook)) {
    console.log("ya-estaba");
    return;
  }
  if (!simular) {
    mkdirSync(dirname(ruta), { recursive: true });
    escribirAtomico(ruta, { ...ajustes, hooks: { ...hooks, PostToolUse: [...postToolUse, ENTRADA_HOOK_CLAUDE] } });
  }
  console.log("fijado");
}

function quitarHookClaude(ruta) {
  comprobarNombreHookClaude(ruta);
  if (!existsSync(ruta)) {
    console.log("omitido");
    return;
  }
  const ajustes = ajustesDeObjeto(ruta);
  const hooks = tiene(ajustes, "hooks") ? ajustes.hooks : undefined;
  if (!esObjeto(hooks) || !Array.isArray(hooks.PostToolUse)) {
    console.log("omitido");
    return;
  }
  const restantes = hooks.PostToolUse.filter((e) => !esSoloNuestraHookClaude(e));
  if (restantes.length === hooks.PostToolUse.length) {
    console.log("omitido");
    return;
  }
  const nuevosHooks = { ...hooks };
  if (restantes.length) nuevosHooks.PostToolUse = restantes;
  else delete nuevosHooks.PostToolUse;
  const nuevos = { ...ajustes };
  if (Object.keys(nuevosHooks).length) nuevos.hooks = nuevosHooks;
  else delete nuevos.hooks;
  if (Object.keys(nuevos).length === 0) {
    rmSync(ruta);
    console.log("archivo-quitado");
  } else {
    escribirAtomico(ruta, nuevos);
    console.log("quitado");
  }
}

// --- Reglas deny del proyecto en Claude Code (fijar-deny / quitar-deny) ---

// Reglas que el kit pone en <proyecto>/.claude/settings.json (compartido, va a git). El espacio antes de * es parte de la regla.
const REGLAS_DENY_CLAUDE = [
  "Read(./.env)",
  "Read(./.env.*)",
  "Bash(git commit *)",
  "Bash(git push *)",
  "Bash(git merge *)",
  "Bash(gh pr create *)",
  "Bash(gh pr merge *)",
  "Bash(git * commit *)",
  "Bash(git * push *)",
  "Bash(bash -c *)",
  "Bash(sh -c *)",
  "Bash(zsh -c *)",
];

// Solo el settings.json de un proyecto: nunca ~/.claude/settings.json ni settings.local.json.
function comprobarNombreDenyClaude(ruta) {
  if (basename(ruta) !== "settings.json" || resolve(ruta) === join(homedir(), ".claude", "settings.json")) {
    fallar(`${ruta}: solo se toca el .claude/settings.json de un proyecto (nunca el de ~/.claude)`);
  }
}

// Lista 'permissions.deny' del ajuste (arreglo vacío si no existe); si el tipo no es el esperado, falla sin tocar nada.
function denyDeAjustes(ruta, ajustes) {
  const permisos = tiene(ajustes, "permissions") ? ajustes.permissions : {};
  if (!esObjeto(permisos)) fallar(`${ruta}: 'permissions' no es un objeto; no lo toco`);
  const deny = tiene(permisos, "deny") ? permisos.deny : [];
  if (!Array.isArray(deny)) fallar(`${ruta}: 'permissions.deny' no es un arreglo; no lo toco`);
  return deny;
}

function fijarDenyClaude(ruta, simular) {
  comprobarNombreDenyClaude(ruta);
  const ajustes = ajustesDeObjeto(ruta);
  const deny = denyDeAjustes(ruta, ajustes);
  const faltan = REGLAS_DENY_CLAUDE.filter((regla) => !deny.includes(regla));
  if (faltan.length === 0) {
    console.log("ya-estaba");
    return;
  }
  if (!simular) {
    mkdirSync(dirname(ruta), { recursive: true });
    const permisos = tiene(ajustes, "permissions") ? ajustes.permissions : {};
    escribirAtomico(ruta, { ...ajustes, permissions: { ...permisos, deny: [...deny, ...faltan] } });
  }
  for (const regla of faltan) console.log(`agregada:${regla}`);
}

function quitarDenyClaude(ruta, regla) {
  comprobarNombreDenyClaude(ruta);
  if (!existsSync(ruta)) {
    console.log("omitido");
    return;
  }
  const ajustes = ajustesDeObjeto(ruta);
  const permisos = tiene(ajustes, "permissions") ? ajustes.permissions : undefined;
  if (!esObjeto(permisos) || !Array.isArray(permisos.deny) || !permisos.deny.includes(regla)) {
    console.log("omitido");
    return;
  }
  const restantes = [...permisos.deny];
  restantes.splice(restantes.indexOf(regla), 1);
  const nuevosPermisos = { ...permisos };
  if (restantes.length) nuevosPermisos.deny = restantes;
  else delete nuevosPermisos.deny;
  const nuevos = { ...ajustes };
  if (Object.keys(nuevosPermisos).length) nuevos.permissions = nuevosPermisos;
  else delete nuevos.permissions;
  if (Object.keys(nuevos).length === 0) {
    rmSync(ruta);
    console.log("archivo-quitado");
  } else {
    escribirAtomico(ruta, nuevos);
    console.log("quitado");
  }
}

// Instrucciones de un agente para Codex: línea de identidad y cuerpo (sin el encabezado). Las usan agente-codex e instrucciones-codex.
function instruccionesCodex(agente, cuerpo) {
  return `${lineaIdentidad("codex", agente)}\n\n${cuerpo.replace(/^\s+/, "")}`;
}

// --- Reglas deny del proyecto en Codex (fijar-deny codex / quitar-deny codex) ---

// Codex bloquea por prefijo de comando (prefix_rule). Lista acordada en el plan soporte-codex (Resuelto).
// No hay regla para .env (Codex no la tiene: límite documentado). No se bloquean bash -lc / sh -lc:
// Codex ejecuta así sus comandos y bloquearlos rompería todo.
const PREFIJOS_DENY_CODEX = [
  ["git", "commit"],
  ["git", "push"],
  ["git", "merge"],
  ["gh", "pr", "create"],
  ["gh", "pr", "merge"],
  ["git", "-C"],
  ["git", "-c"],
  ["bash", "-c"],
  ["sh", "-c"],
  ["zsh", "-c"],
];
// Permitidas: el sandbox de Codex deja .git en solo lectura y `git switch -c` falla ahí. Una regla allow
// lo ejecuta fuera del sandbox sin pedir aprobación. Es la única escritura de git que el kit autoriza.
const PREFIJOS_ALLOW_CODEX = [["git", "switch", "-c"]];
const MARCA_CODEX = "# flucastr-ai:generado - no editar; se regenera con instalar.sh";

// Contenido del archivo de reglas (Starlark). Cada regla trae su ejemplo de match: Codex lo valida al cargar.
function reglasCodex() {
  const bloques = PREFIJOS_DENY_CODEX.map(
    (p) =>
      `prefix_rule(\n` +
      `    pattern = ${JSON.stringify(p)},\n` +
      `    decision = "forbidden",\n` +
      `    justification = "Lo hace Franco: flucastr-ai no hace commit, push, merge ni PR.",\n` +
      `    match = [${JSON.stringify([...p, "x"])}],\n` +
      `)\n`
  );
  const permitidas = PREFIJOS_ALLOW_CODEX.map(
    (p) =>
      `prefix_rule(\n` +
      `    pattern = ${JSON.stringify(p)},\n` +
      `    decision = "allow",\n` +
      `    justification = "Crear la rama del cambio: el sandbox de Codex deja .git en solo lectura.",\n` +
      `    match = [${JSON.stringify([...p, "feature/x"])}],\n` +
      `)\n`
  );
  return `${MARCA_CODEX}\n${[...bloques, ...permitidas].join("\n")}`;
}

function fijarDenyCodex(ruta, simular) {
  const esperado = reglasCodex();
  const actual = existsSync(ruta) ? readFileSync(ruta, "utf8") : null;
  if (actual === esperado) {
    console.log("ya-estaba");
    return;
  }
  // Un archivo que no lleva nuestra marca no es nuestro: no se pisa.
  if (actual !== null && !actual.startsWith(MARCA_CODEX)) fallar(`${ruta} existe y no es del kit; no lo toco`);
  if (!simular) {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, esperado);
  }
  console.log(actual === null ? "fijado" : "actualizado");
}

function quitarDenyCodex(ruta) {
  if (!existsSync(ruta) || !readFileSync(ruta, "utf8").startsWith(MARCA_CODEX)) {
    console.log("omitido");
    return;
  }
  rmSync(ruta);
  console.log("archivo-quitado");
}

const [orden, ...args] = process.argv.slice(2);

if (orden === "modelo" && args.length === 2) {
  process.stdout.write(resolverModelo(args[0], args[1]) + "\n");
} else if (orden === "esfuerzo" && (args.length === 1 || (args.length === 2 && args[1] === "codex"))) {
  // Con 'codex' el esfuerzo sale traducido para Codex (max -> xhigh); sin herramienta, tal cual.
  process.stdout.write(esfuerzoDe(args[1], resolverEsfuerzo(args[0])) + "\n");
} else if (orden === "modelo-esfuerzo" && args.length === 2) {
  // Modelo con el esfuerzo como sufijo (modelo:esfuerzo), que acepta `pi --model`; sin esfuerzo, solo el modelo.
  const modelo = resolverModelo(args[0], args[1]);
  const esfuerzo = esfuerzoDe(args[1], resolverEsfuerzo(args[0]));
  process.stdout.write((esfuerzo ? `${modelo}:${esfuerzo}` : modelo) + "\n");
} else if ((orden === "agente-claude" || orden === "agente-pi") && args.length === 1) {
  const archivo = args[0];
  const agente = basename(archivo, ".md");
  const { cabecera, cuerpo } = partir(archivo);

  const nombre = cabecera.match(/^name:\s*(.+?)\s*$/m)?.[1];
  if (nombre !== agente) {
    fallar(`el 'name' del encabezado ('${nombre}') debe coincidir con el archivo ('${agente}')`);
  }
  if (/^model:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'model': se define en modelos.json`);
  }
  if (/^effort:/m.test(cabecera) || /^thinking:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'effort' ni 'thinking': el esfuerzo se define en modelos.json`);
  }

  const herramienta = orden === "agente-pi" ? "pi" : "claude-code";
  const modelo = resolverModelo(agente, herramienta);
  const esfuerzo = resolverEsfuerzo(agente);
  // Claude Code lleva 'effort'; Pi lleva 'thinking'. Sin esfuerzo no se escribe ninguna de las dos.
  const lineaEsfuerzo = !esfuerzo ? "" : orden === "agente-pi" ? `thinking: ${esfuerzo}\n` : `effort: ${esfuerzo}\n`;
  const cabeceraSalida = orden === "agente-pi" ? bashPlano(cabecera) : cabecera;
  process.stdout.write(
    `---\n${cabeceraSalida}\n${lineaEsfuerzo}model: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con instalar.sh\n---\n${lineaIdentidad(herramienta, agente)}\n${cuerpo}`
  );
} else if (orden === "agente-codex" && args.length === 1) {
  // TOML de agente para Codex (~/.codex/agents/<nombre>.toml). Sin 'skills', 'tools' ni 'timeoutMs': son de otras herramientas.
  const archivo = args[0];
  const agente = basename(archivo, ".md");
  const { cabecera, cuerpo } = partir(archivo);

  if (valorCabecera(cabecera, "name") !== agente) {
    fallar(`el 'name' del encabezado ('${valorCabecera(cabecera, "name")}') debe coincidir con el archivo ('${agente}')`);
  }
  const descripcion = valorCabecera(cabecera, "description");
  if (!descripcion) fallar(`${archivo} no tiene 'description' en el encabezado (Codex la exige)`);
  if (/^model:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'model': se define en modelos.json`);
  }
  if (/^effort:/m.test(cabecera) || /^thinking:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'effort' ni 'thinking': el esfuerzo se define en modelos.json`);
  }

  const modelo = resolverModelo(agente, "codex");
  const esfuerzo = esfuerzoDe("codex", resolverEsfuerzo(agente));
  const lineaEsfuerzo = esfuerzo ? `model_reasoning_effort = ${JSON.stringify(esfuerzo)}\n` : "";
  // Cadenas TOML de una línea con escapes JSON (válidos en TOML): no hay que escapar nada a mano.
  process.stdout.write(
    `# flucastr-ai:generado - no editar; se regenera con instalar.sh\n` +
      `name = ${JSON.stringify(agente)}\n` +
      `description = ${JSON.stringify(descripcion)}\n` +
      `model = ${JSON.stringify(modelo)}\n` +
      lineaEsfuerzo +
      `developer_instructions = ${JSON.stringify(instruccionesCodex(agente, cuerpo))}\n`
  );
} else if (orden === "instrucciones-codex" && args.length === 1) {
  // Instrucciones del agente como cadena JSON: el lanzador codex-<agente> la pasa con -c developer_instructions=...
  const agente = basename(args[0], ".md");
  process.stdout.write(JSON.stringify(instruccionesCodex(agente, partir(args[0]).cuerpo)) + "\n");
} else if (orden === "cuerpo" && args.length === 1) {
  const agente = basename(args[0], ".md");
  process.stdout.write(`${lineaIdentidad("pi", agente)}\n\n` + partir(args[0]).cuerpo.replace(/^\s+/, ""));
} else if (orden === "fijar-agente" && (args.length === 2 || (args.length === 3 && args[2] === "--sobrescribir"))) {
  // Con --sobrescribir reemplaza otro agente ya fijado (lo usa --migrar) y dice cuál era.
  const [ruta, agente] = args;
  const ajustes = leerAjustes(ruta);
  if (ajustes.agent === agente) {
    console.log("ya-estaba");
  } else if (ajustes.agent && args.length === 2) {
    console.log(`omitido:${ajustes.agent}`);
  } else {
    const anterior = ajustes.agent;
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ ...ajustes, agent: agente }, null, 2) + "\n");
    console.log(anterior ? `reemplazado:${anterior}` : "fijado");
  }
} else if (orden === "quitar-agente" && args.length === 2) {
  const [ruta, agente] = args;
  const ajustes = leerAjustes(ruta);
  if (ajustes.agent !== agente) {
    console.log("omitido");
  } else {
    delete ajustes.agent;
    if (Object.keys(ajustes).length === 0) {
      rmSync(ruta);
      console.log("archivo-quitado");
    } else {
      writeFileSync(ruta, JSON.stringify(ajustes, null, 2) + "\n");
      console.log("quitado");
    }
  }
} else if (orden === "comparar-modelos" && args.length === 2) {
  // Solo avisa: no escribe nada. Diferencias: version mayor en el publicado, agentes y perfiles nuevos.
  const [personal, publicado] = args;
  const propio = leerJson(personal);
  const nuevo = leerJson(publicado);
  const tiene = (obj, clave) => Object.prototype.hasOwnProperty.call(obj ?? {}, clave);
  const lineas = [];
  if (typeof propio.version === "number" && typeof nuevo.version === "number" && nuevo.version > propio.version) {
    lineas.push(`version: personal ${propio.version}, publicado ${nuevo.version}`);
  }
  for (const agente of Object.keys(nuevo.agentes ?? {})) {
    if (!tiene(propio.agentes, agente)) lineas.push(`agente nuevo: ${agente}`);
  }
  for (const perfil of Object.keys(nuevo.perfiles ?? {})) {
    if (!tiene(propio.perfiles, perfil)) lineas.push(`perfil nuevo: ${perfil}`);
  }
  // Esfuerzo por agente: avisa si el publicado lo trae y el personal no.
  for (const agente of Object.keys(nuevo.agentes ?? {})) {
    if (!tiene(nuevo.agentes[agente], "esfuerzo")) continue;
    if (!tiene(propio.agentes?.[agente] ?? {}, "esfuerzo")) lineas.push(`campo nuevo: esfuerzo (agente ${agente})`);
  }
  // Campos del modelos.json publicado que el personal no trae: compactar_en y ventanas (por perfil).
  if (tiene(nuevo, "compactar_en") && !tiene(propio, "compactar_en")) lineas.push("campo nuevo: compactar_en");
  for (const [perfil, datos] of Object.entries(nuevo.perfiles ?? {})) {
    if (!tiene(datos, "ventanas") || !tiene(propio.perfiles, perfil)) continue;
    if (!tiene(propio.perfiles[perfil], "ventanas")) lineas.push(`campo nuevo: ventanas (perfil ${perfil})`);
  }
  for (const linea of lineas) console.log(linea);
} else if (orden === "fijar-compactacion" && args[0] === "claude" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarCompactacionClaude(args[1], args.length === 3);
} else if (orden === "quitar-compactacion" && args[0] === "claude" && args.length === 3 && /^\d+$/.test(args[2])) {
  quitarCompactacionClaude(args[1], args[2]);
} else if (orden === "fijar-hook" && args[0] === "claude" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarHookClaude(args[1], args.length === 3);
} else if (orden === "quitar-hook" && args[0] === "claude" && args.length === 2) {
  quitarHookClaude(args[1]);
} else if (orden === "fijar-deny" && args[0] === "claude" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarDenyClaude(args[1], args.length === 3);
} else if (orden === "quitar-deny" && args[0] === "claude" && args.length === 3) {
  quitarDenyClaude(args[1], args[2]);
} else if (orden === "fijar-deny" && args[0] === "codex" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarDenyCodex(args[1], args.length === 3);
} else if (orden === "quitar-deny" && args[0] === "codex" && args.length === 2) {
  quitarDenyCodex(args[1]);
} else if (orden === "fijar-compactacion" && args[0] === "pi" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarCompactacionPi(args[1], args.length === 3);
} else if (orden === "quitar-compactacion" && args[0] === "pi" && (args.length === 4 || (args.length === 5 && args[4] === "creado")) && /^\d+$/.test(args[3])) {
  quitarCompactacionPi(args[1], args[2], Number(args[3]), args.length === 5);
} else {
  fallar("uso: resolver.mjs modelo <agente> <herramienta> | esfuerzo <agente> [codex] | modelo-esfuerzo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> [--sobrescribir] | quitar-agente <json> <agente> | comparar-modelos <personal> <publicado> | fijar-compactacion pi <settings.json> [--simular] | quitar-compactacion pi <settings.json> <modelo> <reserve> [creado] | fijar-compactacion claude <settings.json> [--simular] | quitar-compactacion claude <settings.json> <valor> | fijar-hook claude <settings.local.json> [--simular] | quitar-hook claude <settings.local.json> | fijar-deny claude <settings.json> [--simular] | quitar-deny claude <settings.json> <regla> | agente-codex <archivo> | instrucciones-codex <archivo> | fijar-deny codex <rules> [--simular] | quitar-deny codex <rules>");
}
