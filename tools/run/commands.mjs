// Construye el comando de cada rol; los perfiles se inyectan desde el entrypoint.
// resolverCompactacion(agente) es opcional: devuelve el umbral de compactación de Codex ("" si no hay uno).
function crearComando({ resolverAgente, resolverRevisorKit, resolverCompactacion }) {
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
    const limite = resolverCompactacion ? resolverCompactacion(builder ? "builder" : "reviewer") : "";
    const compact = limite ? ["-c", `model_auto_compact_token_limit=${limite}`] : [];
    return { exe: "codex", args: ["exec", "--sandbox", sandbox, "-c", 'approval_policy="on-request"', "-m", modelo, ...cfg, ...compact, "-C", raiz, ...fin, "-"] };
  };
}

export { crearComando };
