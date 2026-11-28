import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const MARCA = "subagent-stop-hook.mjs";
const MATCHER = "builder";

function comandoHook(hook) {
  return `node '${resolve(hook).replaceAll("'", "'\\''")}'`;
}

function conHook(e, marca) {
  return Array.isArray(e?.hooks) && e.hooks.some((h) => typeof h?.command === "string" && h.command.includes(marca));
}

function quitarPropio(e, marca) {
  if (!conHook(e, marca)) return e;
  const hooks = e.hooks.filter((h) => !(typeof h?.command === "string" && h.command.includes(marca)));
  return hooks.length ? { ...e, hooks } : null;
}

function leerConfig(ajustes) {
  if (!existsSync(ajustes)) return {};
  let config;
  try { config = JSON.parse(readFileSync(ajustes, "utf8")); }
  catch (error) { throw new Error(`${ajustes} no es JSON válido: ${error.message}`); }
  if (!config || Array.isArray(config) || typeof config !== "object") throw new Error(`${ajustes} debe contener un objeto`);
  if (config.hooks !== undefined && (!config.hooks || Array.isArray(config.hooks) || typeof config.hooks !== "object")) {
    throw new Error(`${ajustes}: 'hooks' no es un objeto; no lo toco`);
  }
  const lista = config.hooks?.SubagentStop;
  if (lista !== undefined && !Array.isArray(lista)) throw new Error(`${ajustes}: 'hooks.SubagentStop' no es una lista; no lo toco`);
  return config;
}

function instalado(config, comando) {
  return Array.isArray(config?.hooks?.SubagentStop) && config.hooks.SubagentStop.some((e) =>
    e?.matcher === MATCHER && Array.isArray(e.hooks) && e.hooks.length === 1 && e.hooks[0]?.command === comando,
  );
}

function escribir(ajustes, nuevo) {
  mkdirSync(dirname(ajustes), { recursive: true });
  const temporal = `${ajustes}.subagent-stop.tmp-${process.pid}`;
  try {
    writeFileSync(temporal, JSON.stringify(nuevo, null, 2) + "\n");
    renameSync(temporal, ajustes);
  } finally {
    rmSync(temporal, { force: true });
  }
}

export function administrarHook(accion, proyecto, hook) {
  if (!["instalar", "quitar", "comprobar"].includes(accion)) throw new Error("acción debe ser instalar, quitar o comprobar");
  const ajustes = join(resolve(proyecto), ".claude", "settings.local.json");
  const comando = comandoHook(hook);
  const config = leerConfig(ajustes);
  if (accion === "comprobar") return instalado(config, comando) ? "instalado" : "ausente";
  if (accion === "instalar") {
    if (instalado(config, comando)) return "ya-estaba";
    const hooks = config.hooks ?? {};
    const lista = (hooks.SubagentStop ?? []).map((e) => quitarPropio(e, MARCA)).filter(Boolean);
    lista.push({ matcher: MATCHER, hooks: [{ type: "command", command: comando }] });
    escribir(ajustes, { ...config, hooks: { ...hooks, SubagentStop: lista } });
    if (!instalado(leerConfig(ajustes), comando)) throw new Error(`${ajustes}: la entrada escrita no pasó la comprobación`);
    return "fijado";
  }
  if (!existsSync(ajustes)) return "omitido";
  const hooks = config.hooks ?? {};
  if (!Array.isArray(hooks.SubagentStop)) return "omitido";
  const lista = hooks.SubagentStop.map((e) => quitarPropio(e, MARCA)).filter(Boolean);
  if (lista.length === hooks.SubagentStop.length) return "omitido";
  const nuevos = { ...hooks };
  if (lista.length) nuevos.SubagentStop = lista;
  else delete nuevos.SubagentStop;
  const salida = { ...config };
  if (Object.keys(nuevos).length) salida.hooks = nuevos;
  else delete salida.hooks;
  escribir(ajustes, salida);
  return "quitado";
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const [accion, proyecto, hook] = process.argv.slice(2);
  try {
    process.stdout.write(`${administrarHook(accion, proyecto, hook)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
