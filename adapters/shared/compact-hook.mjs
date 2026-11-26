#!/usr/bin/env node
// Editor del hook de compactación (A8 de changes/piso-planner/tramo-8.md). Pone, comprueba o quita solo la entrada
// `SessionStart` con matcher `compact` que apunta a scripts/after-compact.mjs; los demás hooks y ajustes quedan intactos.
// Uso: node compact-hook.mjs <instalar|quitar|comprobar> <claude|codex> <proyecto> [--dry-run]
// Salidas: fijado | ya-estaba | quitado | omitido | instalado | ausente. Exit 0 ok; 1 JSON inválido o error de
// escritura (sin escribir); 2 uso.
import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ARCHIVO = { claude: join(".claude", "settings.local.json"), codex: join(".codex", "hooks.json") };
// Un hook es del kit solo si su comando contiene ambas marcas; uno ajeno con un nombre parecido no cuenta.
const MARCAS = [".flucastr-ai/raiz", "/scripts/after-compact.mjs"];
const COMANDO = 'node "$(cat "$HOME/.flucastr-ai/raiz")/scripts/after-compact.mjs"';
const ENTRADA = { matcher: "compact", hooks: [{ type: "command", command: COMANDO, timeout: 10 }] };

function esHookKit(hook) {
  const comando = String(hook?.command ?? "");
  return MARCAS.every((marca) => comando.includes(marca));
}

function esGrupoKit(grupo) {
  return Array.isArray(grupo?.hooks) && grupo.hooks.some(esHookKit);
}

// Devuelve { valor, existe }. JSON inválido lanza error: el llamador sale con 1 sin escribir.
function leer(ruta) {
  if (!existsSync(ruta)) return { valor: {}, existe: false };
  let valor;
  try {
    valor = JSON.parse(readFileSync(ruta, "utf8"));
  } catch {
    throw new Error(`JSON inválido en ${ruta}`);
  }
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error(`no es un objeto JSON: ${ruta}`);
  if (valor.hooks !== undefined && (!valor.hooks || typeof valor.hooks !== "object" || Array.isArray(valor.hooks))) {
    throw new Error(`«hooks» no es un objeto en ${ruta}`);
  }
  return { valor, existe: true };
}

function sessionStart(valor) {
  const lista = valor.hooks?.SessionStart;
  if (lista !== undefined && !Array.isArray(lista)) throw new Error("«hooks.SessionStart» no es una lista");
  return lista ?? [];
}

function escribir(ruta, valor, dryRun) {
  if (dryRun) return;
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, `${JSON.stringify(valor, null, 2)}\n`);
}

// Quita solo los hooks del kit; un grupo se borra solo si queda sin hooks. Borra el archivo de Codex solo si queda
// vacío y su carpeta si también queda vacía.
function quitar(herramienta, ruta, dryRun) {
  const { valor, existe } = leer(ruta);
  if (!existe) return "omitido";
  const lista = sessionStart(valor);
  const restantes = [];
  let quitados = 0;
  for (const grupo of lista) {
    if (!esGrupoKit(grupo)) {
      restantes.push(grupo);
      continue;
    }
    const propios = grupo.hooks.filter((h) => !esHookKit(h));
    quitados += grupo.hooks.length - propios.length;
    if (propios.length > 0) restantes.push({ ...grupo, hooks: propios });
  }
  if (quitados === 0) return "omitido";

  if (restantes.length > 0) valor.hooks.SessionStart = restantes;
  else delete valor.hooks.SessionStart;
  if (Object.keys(valor.hooks).length === 0) delete valor.hooks;

  if (herramienta === "codex" && Object.keys(valor).length === 0) {
    if (!dryRun) {
      rmSync(ruta, { force: true });
      try {
        rmdirSync(dirname(ruta));
      } catch {
        // La carpeta tiene otros archivos: se conserva.
      }
    }
    return "quitado";
  }
  escribir(ruta, valor, dryRun);
  return "quitado";
}

function instalar(ruta, dryRun) {
  const { valor } = leer(ruta);
  const lista = sessionStart(valor);
  if (lista.some(esGrupoKit)) return "ya-estaba";
  valor.hooks = valor.hooks ?? {};
  valor.hooks.SessionStart = [...lista, ENTRADA];
  escribir(ruta, valor, dryRun);
  return "fijado";
}

function comprobar(ruta) {
  const { valor } = leer(ruta);
  return sessionStart(valor).some(esGrupoKit) ? "instalado" : "ausente";
}

function main(argv) {
  const dryRun = argv.includes("--dry-run");
  const [accion, herramienta, proyecto] = argv.filter((a) => a !== "--dry-run");
  if (!["instalar", "quitar", "comprobar"].includes(accion) || !ARCHIVO[herramienta] || !proyecto) {
    process.stderr.write("uso: compact-hook.mjs <instalar|quitar|comprobar> <claude|codex> <proyecto> [--dry-run]\n");
    return 2;
  }
  const ruta = join(proyecto, ARCHIVO[herramienta]);
  try {
    const salida =
      accion === "instalar"
        ? instalar(ruta, dryRun)
        : accion === "quitar"
          ? quitar(herramienta, ruta, dryRun)
          : comprobar(ruta);
    process.stdout.write(`${salida}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
