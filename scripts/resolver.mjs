#!/usr/bin/env node
// Resuelve el modelo de cada agente según modelos.json y genera los archivos por herramienta.
//
// Uso:
//   node scripts/resolver.mjs modelo <agente> <herramienta>   imprime el modelo (herramienta: claude-code | pi)
//   node scripts/resolver.mjs agente-claude <archivo.md>      imprime el agente con el campo `model` ya resuelto (Claude Code)
//   node scripts/resolver.mjs agente-pi <archivo.md>          igual, con el modelo de Pi (para el paquete de subagentes)
//   node scripts/resolver.mjs cuerpo <archivo.md>             imprime el agente sin encabezado, con la línea de identidad de Pi (para Pi)
//   node scripts/resolver.mjs fijar-agente <ajustes.json> <agente>   deja `agent` en los ajustes de un proyecto (no pisa otro valor)
//   node scripts/resolver.mjs quitar-agente <ajustes.json> <agente>  deshace lo anterior, solo si el valor es ese agente
//   node scripts/resolver.mjs comparar-modelos <personal.json> <publicado.json>  imprime las diferencias que merecen aviso (nada si no hay)
//   node scripts/resolver.mjs fijar-compactacion pi <settings.json> [--simular]  pone compaction.modelOverrides de Pi (no pisa lo del usuario)
//   node scripts/resolver.mjs quitar-compactacion pi <settings.json> <modelo> <reserve> [creado]  deshace lo anterior, solo si el valor es ese
//
// Archivo de modelos: la variable FLUCASTR_MODELOS (si existe y no está vacía) indica el modelos.json a leer;
// si no, se lee el modelos.json del repo. Lo usa instalar.sh --copiar con el modelos.json personal.

import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
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
  if (!perfilId) fallar(`no hay perfil para la herramienta '${herramienta}'`);

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

function partir(archivo) {
  const texto = readFileSync(archivo, "utf8");
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fallar(`${archivo} no tiene encabezado entre líneas '---'`);
  return { cabecera: m[1], cuerpo: m[2] };
}

// Línea fija que dice al agente en qué herramienta corre, con qué modelo y como qué agente.
function lineaIdentidad(herramienta, agente) {
  const nombre = herramienta === "pi" ? "Pi" : "Claude Code";
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

const [orden, ...args] = process.argv.slice(2);

if (orden === "modelo" && args.length === 2) {
  process.stdout.write(resolverModelo(args[0], args[1]) + "\n");
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

  const herramienta = orden === "agente-pi" ? "pi" : "claude-code";
  const modelo = resolverModelo(agente, herramienta);
  const cabeceraSalida = orden === "agente-pi" ? bashPlano(cabecera) : cabecera;
  process.stdout.write(
    `---\n${cabeceraSalida}\nmodel: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con instalar.sh\n---\n${lineaIdentidad(herramienta, agente)}\n${cuerpo}`
  );
} else if (orden === "cuerpo" && args.length === 1) {
  const agente = basename(args[0], ".md");
  process.stdout.write(`${lineaIdentidad("pi", agente)}\n\n` + partir(args[0]).cuerpo.replace(/^\s+/, ""));
} else if (orden === "fijar-agente" && args.length === 2) {
  const [ruta, agente] = args;
  const ajustes = leerAjustes(ruta);
  if (ajustes.agent === agente) {
    console.log("ya-estaba");
  } else if (ajustes.agent) {
    console.log(`omitido:${ajustes.agent}`);
  } else {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ ...ajustes, agent: agente }, null, 2) + "\n");
    console.log("fijado");
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
  for (const linea of lineas) console.log(linea);
} else if (orden === "fijar-compactacion" && args[0] === "pi" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarCompactacionPi(args[1], args.length === 3);
} else if (orden === "quitar-compactacion" && args[0] === "pi" && (args.length === 4 || (args.length === 5 && args[4] === "creado")) && /^\d+$/.test(args[3])) {
  quitarCompactacionPi(args[1], args[2], Number(args[3]), args.length === 5);
} else {
  fallar("uso: resolver.mjs modelo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> | quitar-agente <json> <agente> | comparar-modelos <personal> <publicado> | fijar-compactacion pi <settings.json> [--simular] | quitar-compactacion pi <settings.json> <modelo> <reserve> [creado]");
}
