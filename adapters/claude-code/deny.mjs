import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { comprobarNombreDenyClaude } from "./settings-path.mjs";
import { fallar } from "../../tools/resolver/errors.mjs";
import { esObjeto, tiene } from "../../tools/resolver/object.mjs";
import { ajustesDeObjeto } from "../../tools/resolver/json-settings.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";

export { comprobarNombreDenyClaude };

// --- Reglas deny del proyecto en Claude Code (fijar-deny / quitar-deny) ---

// Reglas que el kit pone en <proyecto>/.claude/settings.json (compartido, va a git). El espacio antes de * es parte de la regla.
const REGLAS_DENY_CLAUDE = [
  "Read(./.env)",
  "Read(./.env.*)",
  "Read(./**/.env)",
  "Read(./**/.env.*)",
  "Read(./.ssh/**)",
  "Read(./.aws/**)",
  "Read(./**/.ssh/**)",
  "Read(./**/.aws/**)",
  "Read(~/.ssh/**)",
  "Read(~/.aws/**)",
  "Read(./**/*.pem)",
  "Read(./**/*.key)",
  "Read(./**/*.p12)",
  "Read(./**/*.pfx)",
  "Read(./**/id_rsa)",
  "Read(./**/id_ed25519)",
  "Read(./**/id_ecdsa)",
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
  "Bash(git -c * merge *)",
];


// Lista 'permissions.deny' del ajuste (arreglo vacío si no existe); si el tipo no es el esperado, falla sin tocar nada.
function denyDeAjustes(ruta, ajustes) {
  const permisos = tiene(ajustes, "permissions") ? ajustes.permissions : {};
  if (!esObjeto(permisos)) fallar(`${ruta}: 'permissions' no es un objeto; no lo toco`);
  const deny = tiene(permisos, "deny") ? permisos.deny : [];
  if (!Array.isArray(deny)) fallar(`${ruta}: 'permissions.deny' no es un arreglo; no lo toco`);
  return deny;
}

export function fijarDenyClaude(ruta, simular) {
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

export function quitarDenyClaude(ruta, regla) {
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
