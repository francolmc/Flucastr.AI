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
//   node scripts/resolver.mjs fijar-deny codex <rules> [<proyecto/AGENTS.md>] [--simular]  genera reglas conservadoras (no pisa un archivo ajeno)
//   node scripts/resolver.mjs quitar-deny codex <proyecto/.codex/rules/flucastr.rules>  borra ese archivo solo si lleva la marca del kit
//   modelo-esfuerzo <agente> codex: el esfuerzo sale traducido (max -> xhigh), como lo pide Codex
//   esfuerzo <agente> codex: igual, solo el esfuerzo traducido para Codex
//   instrucciones-codex <archivo.md>: imprime las instrucciones del agente como cadena JSON (válida como valor TOML en codex -c)
//   revisor <herramienta>: dos líneas, modelo y esfuerzo del revisor de kit run (kit_run.revisor; sin esa clave, el de principal). Esfuerzo traducido para codex.
//   compactar-codex <agente>: imprime el umbral de compactación de Codex del agente (compactar_en), o nada si no hay uno válido
//
// Archivo de modelos: la variable FLUCASTR_MODELOS (si existe y no está vacía) indica el modelos.json a leer;
// si no, se lee el modelos.json del repo. Lo usa instalar.sh --copiar con el modelos.json personal.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fallar } from "../tools/resolver/errors.mjs";
import { esObjeto, tiene } from "../tools/resolver/object.mjs";
import { ajustesDeObjeto, leerAjustes, leerAjustesOpcional, leerJson } from "../tools/resolver/json-settings.mjs";
import { escribirAtomico } from "../tools/resolver/atomic-write.mjs";
import { conBloqueo } from "../adapters/pi/file-lock.mjs";
import { crearResolucionModelos } from "../tools/model-resolution/models.mjs";
import { valorCabecera } from "../tools/resolver/agent-header.mjs";
import { bashPlano } from "../adapters/pi/agent-tools.mjs";
import { fijarCompactacionPi, quitarCompactacionPi } from "../adapters/pi/compaction.mjs";
import { fijarCompactacionClaude, quitarCompactacionClaude } from "../adapters/claude-code/compaction.mjs";
import { fijarHookClaude, quitarHookClaude } from "../adapters/claude-code/hook.mjs";
import { fijarDenyClaude, quitarDenyClaude } from "../adapters/claude-code/deny.mjs"; import { comprobarNombreDenyClaude, fijarSandboxClaude } from "../adapters/claude-code/sandbox.mjs";
import { fijarDenyCodex, quitarDenyCodex } from "../adapters/codex/deny.mjs";
import { generarAgenteCodex, instruccionesCodex } from "../adapters/codex/agent.mjs";
import { generarAgenteMarkdown } from "../adapters/shared/markdown-agent.mjs"; import { fijarAgente, quitarAgente, compararModelos } from "../tools/resolver/config-commands.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const {
  rutaModelos,
  leerConfig,
  modeloDe,
  resolverModelo,
  esfuerzoEn,
  resolverEsfuerzo,
  resolverRevisor,
  compactarCodex,
  esfuerzoDe,
} = crearResolucionModelos(raiz);






















































































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



















































// --- Compactación automática de Pi (fijar-compactacion / quitar-compactacion) ---












































































































































































































































































































































































































































































































function quitarSandboxClaude(ruta, clave, valorJson) {

  comprobarNombreDenyClaude(ruta);
  if (!existsSync(ruta)) { console.log("omitido"); return; }
  const ajustes = ajustesDeObjeto(ruta);
  const valor = JSON.parse(valorJson);
  const sandbox = ajustes.sandbox;
  if (!esObjeto(sandbox)) { console.log("omitido"); return; }
  const nuevosSandbox = { ...sandbox };
  if (clave === "sandbox.filesystem.denyRead" && typeof valor === "string") {
    const fs = sandbox.filesystem;
    if (!esObjeto(fs) || !Array.isArray(fs.denyRead) || !fs.denyRead.includes(valor)) { console.log("omitido"); return; }
    const restantes = [...fs.denyRead]; restantes.splice(restantes.indexOf(valor), 1);
    const nuevoFs = { ...fs };
    if (restantes.length) nuevoFs.denyRead = restantes; else delete nuevoFs.denyRead;
    if (Object.keys(nuevoFs).length) nuevosSandbox.filesystem = nuevoFs; else delete nuevosSandbox.filesystem;
  } else if (["sandbox.enabled", "sandbox.allowUnsandboxedCommands"].includes(clave)) {
    const propiedad = clave.split(".").at(-1);
    if (sandbox[propiedad] !== valor) { console.log("omitido"); return; }
    delete nuevosSandbox[propiedad];
  } else fallar(`clave sandbox no admitida: ${clave}`);
  const nuevos = { ...ajustes };
  if (Object.keys(nuevosSandbox).length) nuevos.sandbox = nuevosSandbox; else delete nuevos.sandbox;
  if (Object.keys(nuevos).length) escribirAtomico(ruta, nuevos); else rmSync(ruta);
  console.log("quitado");
}































































































const [orden, ...args] = process.argv.slice(2);

if (orden === "modelo" && args.length === 2) {
  process.stdout.write(resolverModelo(args[0], args[1]) + "\n");
} else if (orden === "esfuerzo" && (args.length === 1 || (args.length === 2 && args[1] === "codex"))) {
  // Con 'codex' el esfuerzo sale traducido para Codex (max -> xhigh); sin herramienta, tal cual.
  process.stdout.write(esfuerzoDe(args[1], resolverEsfuerzo(args[0])) + "\n");
} else if (orden === "revisor" && args.length === 1) {
  // Dos líneas: modelo y esfuerzo del revisor de kit run (esfuerzo traducido para Codex; línea vacía si no declara).
  const r = resolverRevisor(args[0]);
  process.stdout.write(`${r.modelo}\n${esfuerzoDe(args[0], r.esfuerzo)}\n`);
} else if (orden === "modelo-esfuerzo" && args.length === 2) {
  const modelo = resolverModelo(args[0], args[1]); const esfuerzo = esfuerzoDe(args[1], resolverEsfuerzo(args[0])); process.stdout.write((esfuerzo ? `${modelo}:${esfuerzo}` : modelo) + "\n"); // Modelo con el esfuerzo como sufijo (modelo:esfuerzo), que acepta `pi --model`; sin esfuerzo, solo el modelo.




} else if ((orden === "agente-claude" || orden === "agente-pi") && args.length === 1) {
  const archivo = args[0]; const agente = basename(archivo, ".md");
  const { cabecera, cuerpo } = partir(archivo);
  const herramienta = orden === "agente-pi" ? "pi" : "claude-code";
  process.stdout.write(generarAgenteMarkdown({
    archivo,
    agente,
    herramienta,
    cabecera,
    cuerpo,
    resolverModelo,
    resolverEsfuerzo,
    lineaIdentidad,
    adaptarCabeceraPi: bashPlano,
  }));









} else if (orden === "agente-codex" && args.length === 1) {
  // TOML de agente para Codex (~/.codex/agents/<nombre>.toml). Sin 'skills', 'tools' ni 'timeoutMs': son de otras herramientas.

  const archivo = args[0]; const agente = basename(archivo, ".md");
  const { cabecera, cuerpo } = partir(archivo);
  process.stdout.write(generarAgenteCodex({ archivo, agente, cabecera, cuerpo, valorCabecera, fallar, resolverModelo, resolverEsfuerzo, esfuerzoDe, lineaIdentidad }));

























} else if (orden === "compactar-codex" && args.length === 1) {
  // Umbral de compactación de Codex del agente; sale vacío si modelos.json no tiene compactar_en válido.
  process.stdout.write(compactarCodex(args[0]) + "\n");

} else if (orden === "instrucciones-codex" && args.length === 1) { const agente = basename(args[0], ".md");
  process.stdout.write(JSON.stringify(instruccionesCodex(agente, partir(args[0]).cuerpo, lineaIdentidad)) + "\n");
} else if (orden === "cuerpo" && args.length === 1) {
  const agente = basename(args[0], ".md");
  process.stdout.write(`${lineaIdentidad("pi", agente)}\n\n` + partir(args[0]).cuerpo.replace(/^\s+/, ""));
} else if (orden === "fijar-agente" && (args.length === 2 || (args.length === 3 && args[2] === "--sobrescribir"))) {
  fijarAgente(args, { leerAjustes, mkdirSync, dirname, writeFileSync });
} else if (orden === "quitar-agente" && args.length === 2) {
  quitarAgente(args, { leerAjustes, rmSync, writeFileSync });
} else if (orden === "comparar-modelos" && args.length === 2) {
  compararModelos(args, { leerJson });



















































} else if (orden === "fijar-compactacion" && args[0] === "claude" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarCompactacionClaude(args[1], args.length === 3, leerConfig);
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
} else if (orden === "fijar-sandbox" && args[0] === "claude" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarSandboxClaude(args[1], args.length === 3);
} else if (orden === "quitar-sandbox" && args[0] === "claude" && args.length === 4) {
  quitarSandboxClaude(args[1], args[2], args[3]);
} else if (
  orden === "fijar-deny" && args[0] === "codex" &&
  (args.length === 2 || (args.length === 3 && (args[2] === "--simular" || !args[2].startsWith("--"))) ||
    (args.length === 4 && !args[2].startsWith("--") && args[3] === "--simular"))
) {
  const opcionSimular = args.at(-1) === "--simular";
  const agentsPath = args.length >= 3 && args[2] !== "--simular" ? args[2] : undefined;
  fijarDenyCodex(args[1], agentsPath, opcionSimular);
} else if (orden === "quitar-deny" && args[0] === "codex" && args.length === 2) {
  quitarDenyCodex(args[1]);
} else if (orden === "fijar-compactacion" && args[0] === "pi" && (args.length === 2 || (args.length === 3 && args[2] === "--simular"))) {
  fijarCompactacionPi(args[1], args.length === 3, leerConfig);
} else if (orden === "quitar-compactacion" && args[0] === "pi" && (args.length === 4 || (args.length === 5 && args[4] === "creado")) && /^\d+$/.test(args[3])) {
  quitarCompactacionPi(args[1], args[2], Number(args[3]), args.length === 5);
} else {
  fallar("uso: resolver.mjs modelo <agente> <herramienta> | esfuerzo <agente> [codex] | revisor <herramienta> | modelo-esfuerzo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> [--sobrescribir] | quitar-agente <json> <agente> | comparar-modelos <personal> <publicado> | fijar-compactacion pi <settings.json> [--simular] | quitar-compactacion pi <settings.json> <modelo> <reserve> [creado] | fijar-compactacion claude <settings.json> [--simular] | quitar-compactacion claude <settings.json> <valor> | fijar-hook claude <settings.local.json> [--simular] | quitar-hook claude <settings.local.json> | fijar-deny claude <settings.json> [--simular] | quitar-deny claude <settings.json> <regla> | fijar-sandbox claude <settings.json> [--simular] | quitar-sandbox claude <settings.json> <clave> <valor-json> | agente-codex <archivo> | instrucciones-codex <archivo> | fijar-deny codex <rules> [--simular] | quitar-deny codex <rules>");
}
