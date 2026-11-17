import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fallar } from "../../tools/resolver/errors.mjs";

// Solo el settings.json de un proyecto: nunca ~/.claude/settings.json ni settings.local.json.
export function comprobarNombreDenyClaude(ruta) {
  if (basename(ruta) !== "settings.json" || resolve(ruta) === join(homedir(), ".claude", "settings.json")) {
    fallar(`${ruta}: solo se toca el .claude/settings.json de un proyecto (nunca el de ~/.claude)`);
  }
}
