import { existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname } from "node:path";
import { fallar } from "../../tools/resolver/errors.mjs";
import { esObjeto, tiene } from "../../tools/resolver/object.mjs";
import { ajustesDeObjeto } from "../../tools/resolver/json-settings.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";

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

export function fijarHookClaude(ruta, simular) {
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

export function quitarHookClaude(ruta) {
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
