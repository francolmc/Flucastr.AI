import { spawnSync } from "node:child_process";
import { join } from "node:path";

function crearResolutoresPerfil(raizKit) {
  // Resuelve modelo o esfuerzo de un agente con resolver.mjs (modelos.json del kit).
  function resolverAgente(subcomando, agente) {
    const r = spawnSync(process.execPath, [join(raizKit, "scripts", "resolver.mjs"), subcomando, agente, "codex"], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`resolver ${subcomando} ${agente} codex falló: ${r.stderr.trim()}`);
    return r.stdout.trim();
  }

  // Modelo y esfuerzo del revisor de kit run (resolver.mjs revisor): kit_run.revisor de modelos.json, o el de principal.
  function resolverRevisorKit(herramienta) {
    const r = spawnSync(process.execPath, [join(raizKit, "scripts", "resolver.mjs"), "revisor", herramienta], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`resolver revisor ${herramienta} falló: ${r.stderr.trim()}`);
    const [modelo, esfuerzo = ""] = r.stdout.split("\n");
    return { modelo, esfuerzo };
  }

  // Rastro del revisor para la nota del plan: modelo:esfuerzo (o solo el modelo). claude y pi usan su perfil.
  const HERRAMIENTA_RESOLVER = { codex: "codex", claude: "claude-code", pi: "pi" };
  function etiquetaRevisor(herramienta) {
    const { modelo, esfuerzo } = resolverRevisorKit(HERRAMIENTA_RESOLVER[herramienta]);
    return esfuerzo ? `${modelo}:${esfuerzo}` : modelo;
  }

  // Claude debe recibir el mismo hook del proyecto tanto en el constructor como en el revisor.
  // Ambos procesos arrancan con cwd=raiz, por lo que Claude carga esta configuración de proyecto.
  function comprobarPoliticaClaude(raiz) {
    const r = spawnSync(process.execPath, [join(raizKit, "scripts", "permisos-hook.mjs"), "comprobar", raiz], { encoding: "utf8" });
    if (r.status !== 0 || r.stdout.trim() !== "instalado") {
      throw new Error(`Claude Code no tiene instalada la política conservadora en ${raiz}; ejecuta instalar.sh --proyecto ${raiz}`);
    }
  }

  return { resolverAgente, resolverRevisorKit, etiquetaRevisor, comprobarPoliticaClaude };
}

export { crearResolutoresPerfil };
