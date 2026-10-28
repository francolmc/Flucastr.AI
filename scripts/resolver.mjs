#!/usr/bin/env node
// Resuelve el modelo de cada agente según modelos.json y genera los archivos por herramienta.
//
// Uso:
//   node scripts/resolver.mjs modelo <agente> <herramienta>   imprime el modelo (herramienta: claude-code | pi)
//   node scripts/resolver.mjs agente-claude <archivo.md>      imprime el agente con el campo `model` ya resuelto (Claude Code)
//   node scripts/resolver.mjs agente-pi <archivo.md>          igual, con el modelo de Pi (para el paquete de subagentes)
//   node scripts/resolver.mjs cuerpo <archivo.md>             imprime el agente sin encabezado (para Pi)
//   node scripts/resolver.mjs fijar-agente <ajustes.json> <agente>   deja `agent` en los ajustes de un proyecto (no pisa otro valor)
//   node scripts/resolver.mjs quitar-agente <ajustes.json> <agente>  deshace lo anterior, solo si el valor es ese agente

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function fallar(mensaje) {
  console.error(`error: ${mensaje}`);
  process.exit(1);
}

function leerConfig() {
  try {
    return JSON.parse(readFileSync(join(raiz, "modelos.json"), "utf8"));
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

function leerAjustes(ruta) {
  if (!existsSync(ruta)) return {};
  try {
    return JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    fallar(`${ruta} no es JSON válido (${e.message}); no lo toco`);
  }
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

  const modelo = resolverModelo(agente, orden === "agente-pi" ? "pi" : "claude-code");
  process.stdout.write(
    `---\n${cabecera}\nmodel: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con instalar.sh\n---\n${cuerpo}`
  );
} else if (orden === "cuerpo" && args.length === 1) {
  process.stdout.write(partir(args[0]).cuerpo.replace(/^\s+/, ""));
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
} else {
  fallar("uso: resolver.mjs modelo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> | quitar-agente <json> <agente>");
}
