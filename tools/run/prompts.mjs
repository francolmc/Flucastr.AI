const COLA = 1500;

function cola(t) {
  return t.length > COLA ? `…${t.slice(-COLA)}` : t;
}

function promptBuilder(planRel, tramo, ajuste) {
  const t = tramo ? ` (segment: ${tramo})` : "";
  const base = `Execute plan ${planRel}${t} using the execute-plan skill. Respond with the return line.`;
  return ajuste ? `${base}\n\nFix before continuing:\n${ajuste}` : base;
}

function claveFalloVerificacion(v) {
  return `${v.status ?? "sin-codigo"}:${(v.stdout + v.stderr).trim().replace(/\s+/g, " ")}`;
}

function promptRevisor(planRel, diff, esquema) {
  return [
    `Review plan ${planRel} against the diff below. Read only; do not write anything.`,
    "Return ONLY JSON that conforms to this schema, with no surrounding text:",
    JSON.stringify(esquema),
    "Use veredicto APPROVED if the Aceptación requirements are met; RETURNED with defects (archivo, linea, criterio) otherwise; PAUSED if something missing cannot be decided.",
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

export { claveFalloVerificacion, cola, promptBuilder, promptRevisor };
