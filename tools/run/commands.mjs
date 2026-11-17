// Construye el comando de cada rol; los perfiles se inyectan desde el entrypoint.
function crearComando({ resolverAgente, resolverRevisorKit }) {
  return function comando(rol, herramienta, raiz, schema) {
    const constructor = rol === "CONSTRUCTOR";
    const sandbox = constructor ? "workspace-write" : "read-only";
    const fin = constructor ? [] : ["--output-schema", schema];
    const sobre = process.env[`KIT_RUN_${rol}`];
    if (sobre) return { exe: sobre, args: ["exec", "--sandbox", sandbox, "-c", 'approval_policy="on-request"', "-C", raiz, ...fin, "-"] };
    if (herramienta !== "codex") {
      throw new Error(`herramienta «${herramienta}» aún sin mapear (tramo 3); define KIT_RUN_${rol}`);
    }
    const { modelo, esfuerzo } = constructor
      ? { modelo: resolverAgente("modelo", "constructor"), esfuerzo: resolverAgente("esfuerzo", "constructor") }
      : resolverRevisorKit("codex");
    const cfg = esfuerzo ? ["-c", `model_reasoning_effort="${esfuerzo}"`] : [];
    return { exe: "codex", args: ["exec", "--sandbox", sandbox, "-c", 'approval_policy="on-request"', "-m", modelo, ...cfg, "-C", raiz, ...fin, "-"] };
  };
}

export { crearComando };
