import { comprobarNombreDenyClaude } from "./settings-path.mjs";
import { fallar } from "../../tools/resolver/errors.mjs";
import { esObjeto, tiene } from "../../tools/resolver/object.mjs";
import { ajustesDeObjeto } from "../../tools/resolver/json-settings.mjs";
import { escribirAtomico } from "../../tools/resolver/atomic-write.mjs";

export { comprobarNombreDenyClaude };

const AJUSTES_SANDBOX_CLAUDE = [
  ["sandbox.enabled", true],
  ["sandbox.allowUnsandboxedCommands", false],
  ["sandbox.filesystem.denyRead", [
    "./.env", "./.env.*", "**/.env", "**/.env.*",
    "~/.ssh/**", "~/.aws/**",
    "**/*.pem", "**/*.key", "**/*.p12", "**/*.pfx",
    "**/id_rsa", "**/id_ed25519", "**/id_ecdsa",
  ]],
];

export function fijarSandboxClaude(ruta, simular) {
  comprobarNombreDenyClaude(ruta);
  const ajustes = ajustesDeObjeto(ruta);
  const sandbox = tiene(ajustes, "sandbox") ? ajustes.sandbox : {};
  if (!esObjeto(sandbox)) fallar(`${ruta}: 'sandbox' no es un objeto; no lo toco`);
  const filesystem = tiene(sandbox, "filesystem") ? sandbox.filesystem : {};
  if (!esObjeto(filesystem)) fallar(`${ruta}: 'sandbox.filesystem' no es un objeto; no lo toco`);
  const denyRead = tiene(filesystem, "denyRead") ? filesystem.denyRead : [];
  if (!Array.isArray(denyRead)) fallar(`${ruta}: 'sandbox.filesystem.denyRead' no es un arreglo; no lo toco`);

  const cambios = [];
  const actual = { enabled: sandbox.enabled, allowUnsandboxedCommands: sandbox.allowUnsandboxedCommands };
  for (const [clave, valor] of AJUSTES_SANDBOX_CLAUDE.slice(0, 2)) {
    const propiedad = clave.split(".").at(-1);
    if (!tiene(sandbox, propiedad)) cambios.push([clave, valor]);
    else if (sandbox[propiedad] !== valor) console.log(`incompatible:${clave}`);
  }
  const faltan = AJUSTES_SANDBOX_CLAUDE[2][1].filter((patron) => !denyRead.includes(patron));
  for (const patron of faltan) cambios.push(["sandbox.filesystem.denyRead", patron]);
  if (!simular && cambios.length) {
    const nuevoSandbox = { ...sandbox };
    for (const [clave, valor] of cambios) {
      if (clave === "sandbox.enabled" || clave === "sandbox.allowUnsandboxedCommands") {
        nuevoSandbox[clave.split(".").at(-1)] = valor;
      }
    }
    if (faltan.length) nuevoSandbox.filesystem = { ...filesystem, denyRead: [...denyRead, ...faltan] };
    escribirAtomico(ruta, { ...ajustes, sandbox: nuevoSandbox });
  }
  if (!cambios.length) console.log("ya-estaba");
  else for (const [clave, valor] of cambios) console.log(`agregado:${clave}:${JSON.stringify(valor)}`);
}

