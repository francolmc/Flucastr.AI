// Construye el comando de cada rol; los perfiles se inyectan desde el entrypoint.
function crearComando({ resolverAgente, resolverRevisorKit }) {
  return function comando(rol, herramienta, raiz, schema) {
    const builder = rol === "BUILDER";
    const sandbox = builder ? "workspace-write" : "read-only";
    const fin = builder ? [] : ["--output-schema", schema];
    const sobre = process.env[`KIT_RUN_${rol}`];
    if (sobre) return { exe: sobre, args: ["exec", "--sandbox", sandbox, "-c", 'approval_policy="on-request"', "-C", raiz, ...fin, "-"] };
    if (herramienta !== "codex") {
      throw new Error(`herramienta «${herramienta}» aún sin mapear (tramo 3); define KIT_RUN_${rol}`);
    }
    const { modelo, esfuerzo } = builder
      ? { modelo: resolverAgente("modelo", "builder"), esfuerzo: resolverAgente("effort", "builder") }
      : resolverRevisorKit("codex");
    const cfg = esfuerzo ? ["-c", `model_reasoning_effort="${esfuerzo}"`] : [];
    return { exe: "codex", args: ["exec", "--sandbox", sandbox, "-c", 'approval_policy="on-request"', "-m", modelo, ...cfg, "-C", raiz, ...fin, "-"] };
  };
}

export { crearComando };
