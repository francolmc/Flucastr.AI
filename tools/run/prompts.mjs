const COLA = 1500;

function cola(t) {
  return t.length > COLA ? `…${t.slice(-COLA)}` : t;
}

function promptConstructor(planRel, tramo, ajuste) {
  const t = tramo ? ` (tramo: ${tramo})` : "";
  const base = `Ejecuta con la skill ejecutar-plan el plan ${planRel}${t}. Responde con la línea de retorno.`;
  return ajuste ? `${base}\n\nCorrige antes de seguir:\n${ajuste}` : base;
}

function claveFalloVerificacion(v) {
  return `${v.status ?? "sin-codigo"}:${(v.stdout + v.stderr).trim().replace(/\s+/g, " ")}`;
}

function promptRevisor(planRel, diff, esquema) {
  return [
    `Revisa el plan ${planRel} contra el diff que sigue. Solo lees; no escribes nada.`,
    "Devuelve SOLO un JSON que cumpla este esquema, sin texto alrededor:",
    JSON.stringify(esquema),
    "veredicto APROBADO si lo pedido en Aceptación está hecho; DEVUELTO con defectos (archivo, línea, criterio) si no; PAUSA si falta algo que no se puede decidir.",
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

export { claveFalloVerificacion, cola, promptConstructor, promptRevisor };
