#!/usr/bin/env node
// Hook conservador de PreToolUse para Claude Code. Solo autoriza capacidades
// declaradas cuyo comando y scripts protegidos siguen idénticos a HEAD.

import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const SCRIPT = fileURLToPath(import.meta.url);
const COMMAND = `node ${shellQuote(SCRIPT)} decision --project `;
const HOOK_MARKER = COMMAND;
const CAPACIDADES = /^(?:[-*]\s*)?(?:\*\*)?(?:Comprobación rápida|Servicio|Aceptación)(?:\*\*)?:\s*(.*)$/i;
export const META = /[\n\r;|&<>`$()\\'"?*\[\]{}!~]/;
const SCRIPT_EXT = /\.(?:mjs|cjs|js|sh|py)$/i;

function respuesta(decision, reason) {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  })}\n`);
}

function ejecutarGit(raiz, args) {
  const r = spawnSync("git", args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) throw new Error(`git ${args.join(" ")} no pudo comprobarse`);
  return r.stdout.trim();
}

function rutaRelativaSegura(raiz, p) {
  if (!p || p.includes("\0")) return null;
  const abs = resolve(raiz, p);
  const rel = relative(raiz, abs);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return rel.split(sep).join("/");
}

function sinCambiosEnHead(raiz, rutas) {
  for (const ruta of rutas) {
    if (!rutaRelativaSegura(raiz, ruta)) return false;
    try {
      if (lstatSync(join(raiz, ruta)).isSymbolicLink()) return false;
      ejecutarGit(raiz, ["ls-files", "--error-unmatch", "--", ruta]);
      // Revisa índice y árbol por separado: cambios opuestos en ambas capas
      // no deben compensarse y parecer iguales a HEAD.
      for (const args of [["diff", "--cached", "--quiet", "HEAD", "--", ruta], ["diff", "--quiet", "--", ruta]]) {
        const r = spawnSync("git", args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        if (r.error || (r.status !== 0 && r.status !== 1)) return false;
        if (r.status === 1) return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

function comandosDeclarados(raiz) {
  const archivo = join(raiz, "AGENTS.md");
  if (!existsSync(archivo)) return [];
  const salida = [];
  for (const linea of readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = linea.match(CAPACIDADES);
    if (!m) continue;
    const c = [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1]);
    if (c.length !== 1 || META.test(c[0])) continue;
    salida.push(c[0].trim());
  }
  return [...new Set(salida)];
}

function rutasScriptDelComando(raiz, comando) {
  const palabras = comando.split(" ");
  if (palabras.some(p => p.startsWith("-") && p.includes("="))) return null;
  const rutas = [];
  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];
    if (SCRIPT_EXT.test(palabra) || palabra === "verify" || palabra === "./verify") {
      const normalizada = palabra.startsWith("./") ? palabra.slice(2) : palabra;
      if (!rutaRelativaSegura(raiz, normalizada)) return null;
      rutas.push(normalizada);
    }
  }
  // Protege también ejecutables del proyecto sin extensión (p. ej. ./scripts/check).
  const primero = palabras[0];
  if (primero.startsWith("./") || (!isAbsolute(primero) && existsSync(join(raiz, primero)))) {
    const local = primero.replace(/^\.\//, "");
    if (!rutaRelativaSegura(raiz, local)) return null;
    try {
      if (!statSync(join(raiz, local)).isFile()) return null;
      rutas.push(local);
    } catch {
      return null;
    }
  }
  // Gestores e intérpretes no permiten identificar de forma unívoca el script ejecutado.
  const binario = palabras[0];
  if (["npm", "pnpm", "yarn", "bun", "bash", "sh", "zsh", "python", "python3"].includes(binario)) return null;
  if (binario === "node" && rutas.length === 0) return null;
  return rutas;
}

function comandoSeguro(raiz, comando) {
  if (!comando || META.test(comando) || comando !== comando.trim()) return false;
  if (accionProtegida(comando)) return false;
  const declarados = comandosDeclarados(raiz);
  if (!declarados.includes(comando)) return false;
  const scripts = rutasScriptDelComando(raiz, comando);
  if (!scripts) return false;
  // Estas rutas son obligatorias para cualquier permiso de verificación.
  const protegidas = ["verify", "verificacion/rapida.mjs", ...scripts];
  return sinCambiosEnHead(raiz, [...new Set(protegidas)]);
}

export function accionProtegida(comando) {
  const palabras = comando.toLowerCase().split(/\s+/).map(p => p.replace(/^['"]|['"]$/g, ""));
  if (palabras.some(esSecreto)) return true;
  const git = palabras.indexOf("git");
  if (git >= 0 && palabras.slice(git + 1).some(p => ["commit", "push", "merge"].includes(p))) return true;
  if (palabras.some((p, i) => p === "gh" && palabras[i + 1] === "pr" && ["create", "merge"].includes(palabras[i + 2]))) return true;
  if (["rm", "rmdir", "unlink"].includes(palabras[0]) || (palabras[0] === "find" && palabras.includes("-delete"))) {
    const destinos = palabras.slice(1).filter(p => !p.startsWith("-"));
    if (destinos.some(p => p.split(/[\\/]/).includes("..") || !/^\.?\/?pruebas\/.temporales(?:\/|$)/.test(p))) return true;
  }
  if (palabras.some(p => /^(?:deploy|deployment)$/.test(p))) return true;
  return false;
}

function esSecreto(ruta) {
  return /(^|\/)(?:\.env(?:\..*)?|[^/]*(?:id_rsa|id_ed25519|\.pem|\.key|credentials?)(?:$|\/)|\.ssh(?:\/|$)|\.aws(?:\/|$))/i.test(ruta ?? "");
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function instalar(raiz) {
  const settings = join(raiz, ".claude", "settings.local.json");
  mkdirSync(dirname(settings), { recursive: true });
  let config = {};
  if (existsSync(settings)) config = JSON.parse(readFileSync(settings, "utf8"));
  if (!config || Array.isArray(config) || typeof config !== "object") throw new Error("settings.local.json debe contener un objeto");
  const hooks = config.hooks ?? {};
  if (!hooks || Array.isArray(hooks) || typeof hooks !== "object") throw new Error("hooks debe ser un objeto");
  const pre = hooks.PreToolUse ?? [];
  if (!Array.isArray(pre)) throw new Error("hooks.PreToolUse debe ser una lista");
  if (estaInstalado(raiz)) {
    process.stdout.write("ya-estaba\n");
    return;
  }
  const command = `${COMMAND}${shellQuote(raiz)}`;
  const entrada = { matcher: "Bash", hooks: [{ type: "command", command, onFailure: "block" }] };
  config.hooks = { ...hooks, PreToolUse: [...pre.map(sinHookKit), entrada].filter(Boolean) };
  writeFileSync(settings, `${JSON.stringify(config, null, 2)}\n`);
  if (!estaInstalado(raiz)) {
    quitar(raiz);
    throw new Error("el hook escrito no pasó la comprobación; se retiró la entrada del kit");
  }
  process.stdout.write("fijado\n");
}

function quitar(raiz) {
  const settings = join(raiz, ".claude", "settings.local.json");
  if (!existsSync(settings)) return;
  const config = JSON.parse(readFileSync(settings, "utf8"));
  const pre = config?.hooks?.PreToolUse;
  if (!Array.isArray(pre)) return;
  const siguiente = pre.map(sinHookKit).filter(Boolean);
  if (siguiente.length === pre.length) return;
  if (siguiente.length) config.hooks.PreToolUse = siguiente;
  else delete config.hooks.PreToolUse;
  if (!Object.keys(config.hooks ?? {}).length) delete config.hooks;
  writeFileSync(settings, JSON.stringify(config, null, 2) + "\n");
}

function esAllowAmplia(regla) {
  const s = String(regla).trim();
  const patron = s.match(/^Bash\((.*)\)$/i)?.[1] ?? s;
  return /^(?:\*|npm\s+\*|docker\s+\*|(?:bash|sh|zsh)\s+-c(?:\s+.*)?|node\s+-e(?:\s+.*)?|python(?:3)?\s+-c(?:\s+.*)?)$/i.test(patron.trim());
}

function auditar(raiz) {
  const rutas = [
    { alcance: "global", ruta: join(homedir(), ".claude", "settings.json") },
    { alcance: "proyecto", ruta: join(raiz, ".claude", "settings.json") },
    { alcance: "proyecto-local", ruta: join(raiz, ".claude", "settings.local.json") },
  ];
  const hallazgos = [];
  const errores = [];
  for (const fuente of rutas) {
    if (!existsSync(fuente.ruta)) continue;
    try {
      const config = JSON.parse(readFileSync(fuente.ruta, "utf8"));
      for (const regla of config?.permissions?.allow ?? []) {
        if (esAllowAmplia(regla)) hallazgos.push({ tipo: "allow-amplia", alcance: fuente.alcance, ruta: fuente.ruta, regla });
      }
    } catch (error) {
      errores.push({ ruta: fuente.ruta, error: error.message });
    }
  }
  const hookInstalado = estaInstalado(raiz);
  if (!hookInstalado) hallazgos.push({ tipo: "hook-ausente", ruta: join(raiz, ".claude", "settings.local.json") });
  if (!hookInstalado && hallazgos.some(h => h.tipo === "allow-amplia")) {
    hallazgos.push({ tipo: "allow-sin-hook", ruta: join(raiz, ".claude") });
  }
  return { hookInstalado, hallazgos, errores };
}

function estaInstalado(raiz) {
  const settings = join(raiz, ".claude", "settings.local.json");
  if (!existsSync(settings)) return false;
  try {
    const config = JSON.parse(readFileSync(settings, "utf8"));
    const pre = config?.hooks?.PreToolUse;
    if (!Array.isArray(pre)) return false;
    const esperados = new Set(["Bash"]);
    const comando = `${COMMAND}${shellQuote(resolve(raiz))}`;
    for (const e of pre.filter(esHookKit)) {
      if (e.matcher !== "Bash") return false;
      if (!esperados.has(e.matcher)) return false;
      esperados.delete(e.matcher);
      if (e.hooks.length !== 1 || e.hooks[0].command !== comando || e.hooks[0].onFailure !== "block") return false;
    }
    return esperados.size === 0;
  } catch {
    return false;
  }
}

function esHookKit(e) {
  return Array.isArray(e?.hooks) && e.hooks.some(h => typeof h?.command === "string" && h.command.includes(HOOK_MARKER));
}

function sinHookKit(e) {
  if (!esHookKit(e)) return e;
  const hooks = e.hooks.filter(h => !(typeof h?.command === "string" && h.command.includes(HOOK_MARKER)));
  return hooks.length ? { ...e, hooks } : null;
}

function decidir(raiz, entrada) {
  const herramienta = entrada?.tool_name;
  const input = entrada?.tool_input ?? {};
  if (herramienta === "Bash") {
    const cmd = input.command;
    if (typeof cmd !== "string") return respuesta("ask", "comando no identificable");
    if (comandoSeguro(raiz, cmd)) return respuesta("allow", "comando declarado y scripts verificados contra HEAD");
    if (accionProtegida(cmd)) return respuesta("deny", "acción protegida: la hace la persona usuaria");
    // Sin decisión: los demás comandos siguen el permiso normal de Claude Code.
    return;
  }
  // Read, Grep y Glob no pasan por este hook: `.env` lo protegen las reglas deny y el sandbox.
  // Sin decisión, Claude Code aplica su permiso normal.
}

// Solo corre como script: importar el módulo (accionProtegida, META) no ejecuta main.
if (resolve(process.argv[1] ?? "") === SCRIPT) try {
  const [accion, ...args] = process.argv.slice(2);
  if (accion === "instalar" && args.length === 1) instalar(resolve(args[0]));
  else if (accion === "quitar" && args.length === 1) quitar(resolve(args[0]));
  else if (accion === "comprobar" && args.length === 1) process.stdout.write(estaInstalado(resolve(args[0])) ? "instalado\n" : "ausente\n");
  else if (accion === "auditar" && args.length === 1) process.stdout.write(JSON.stringify(auditar(resolve(args[0]))).concat("\n"));
  else if (accion === "decision" && args.length === 2 && args[0] === "--project") {
    const raiz = resolve(args[1]);
    const entrada = JSON.parse(readFileSync(0, "utf8"));
    decidir(raiz, entrada);
  } else {
    process.stderr.write("uso: permissions-hook.mjs instalar <proyecto> | decision --project <proyecto>\n");
    process.exitCode = 2;
  }
} catch (error) {
  // onFailure:block en la configuración hace que Claude bloquee también si este hook falla.
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
