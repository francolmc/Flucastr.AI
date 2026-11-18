const COLA = 1500;

function cola(t) {
  return t.length > COLA ? `…${t.slice(-COLA)}` : t;
}

function promptConstructor(planRel, tramo, ajuste) {
  const t = tramo ? ` (tramo: ${tramo})` : "";
  const base = `Execute plan ${planRel}${t} using the ejecutar-plan skill. Respond with the return line.`;
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
    "Use veredicto APROBADO if the Aceptación requirements are met; DEVUELTO with defects (archivo, linea, criterio) otherwise; PAUSA if something missing cannot be decided.",
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

export { claveFalloVerificacion, cola, promptConstructor, promptRevisor };
