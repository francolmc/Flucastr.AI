import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fallar } from "../../tools/resolver/errors.mjs";

// --- Reglas deny del proyecto en Codex (fijar-deny codex / quitar-deny codex) ---

// Codex bloquea por prefijo (prefix_rule), que acepta argumentos adicionales. No permite
// comparar el comando completo ni proteger los efectos de scripts, así que esos permisos se omiten.
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
const MARCA_CODEX = "# flucastr-ai:generado - no editar; se regenera con install.sh";

function comandosCapacidad(agentsPath) {
  if (!agentsPath || !existsSync(agentsPath)) return [];
  const comandos = [];
  for (const linea of readFileSync(agentsPath, "utf8").split(/\r?\n/)) {
    if (!/^\s*-?\s*(?:Comprobación rápida|Servicio|Aceptación):/i.test(linea)) continue;
    const literal = linea.match(/`([^`]+)`/);
    if (!literal) continue;
    const comando = literal[1].trim();
    if (!comando || /[;&|<>*$()`\n\r]|\$\{|\$[A-Za-z_]/.test(comando)) continue;
    comandos.push(comando);
  }
  return [...new Set(comandos)];
}

// Contenido del archivo de reglas (Starlark). Cada regla trae su ejemplo de match: Codex lo valida al cargar.
function reglasCodex(agentsPath) {
  const declarados = comandosCapacidad(agentsPath);
  // Solo consultas de metadatos: una regla de prefijo para git log/diff o rg podría leer contenido,
  // y una regla para cualquier comando declarado podría aceptar argumentos que cambien su efecto.
  const allow = [["ls"]];
  for (const comando of declarados) {
    const tokens = comando.split(/\s+/);
    if (tokens.length === 1 && tokens[0] === "ls") allow.push(tokens);
  }
  const allowUnicos = [...new Map(allow.map((p) => [JSON.stringify(p), p])).values()];
  const bloques = PREFIJOS_DENY_CODEX.map(
    (p) =>
      `prefix_rule(\n` +
      `    pattern = ${JSON.stringify(p)},\n` +
      `    decision = "forbidden",\n` +
      `    justification = "Lo hace el mantenedor: flucastr-ai no hace commit, push, merge ni PR.",\n` +
      `    match = [${JSON.stringify([...p, "x"])}],\n` +
      `)\n`
  );
  const permitidas = allowUnicos.map(
    (p) =>
      `prefix_rule(\n` +
      `    pattern = ${JSON.stringify(p)},\n` +
      `    decision = "allow",\n` +
      `    justification = "Comando habitual del plan: sin esta regla el sandbox de Codex pide permiso y el subagente espera.",\n` +
      `    match = [${JSON.stringify([...p, "x"])}],\n` +
      `)\n`
  );
  return `${MARCA_CODEX}\n${[...bloques, ...permitidas].join("\n")}`;
}

export function fijarDenyCodex(ruta, agentsPath, simular) {
  const esperado = reglasCodex(agentsPath);
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

export function quitarDenyCodex(ruta) {
  if (!existsSync(ruta) || !readFileSync(ruta, "utf8").startsWith(MARCA_CODEX)) {
    console.log("omitido");
    return;
  }
  rmSync(ruta);
  console.log("archivo-quitado");
}
