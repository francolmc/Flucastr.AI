import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const COLA = 1500;
const CONTRATO_BUILDER = fileURLToPath(new URL("../../core/agents/builder.md", import.meta.url));

function cola(t) {
  return t.length > COLA ? `…${t.slice(-COLA)}` : t;
}

// Cuerpo de core/agents/builder.md sin su cabecera (el bloque inicial entre `---`). Falla si falta el archivo.
function contratoBuilder() {
  return readFileSync(CONTRATO_BUILDER, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

// Cada invocación (también un relanzamiento) lleva el contrato completo delante de la línea de ejecución.
function promptBuilder(planRel, tramo, ajuste) {
  const t = tramo ? ` (segment: ${tramo})` : "";
  const base = `Execute plan ${planRel}${t} using the execute-plan skill. Respond with the return line.`;
  const cuerpo = ajuste ? `${base}\n\nFix before continuing:\n${ajuste}` : base;
  return `Builder contract:\n${contratoBuilder()}\n\n---\n${cuerpo}`;
}

function claveFalloVerificacion(v) {
  return `${v.status ?? "sin-codigo"}:${(v.stdout + v.stderr).trim().replace(/\s+/g, " ")}`;
}

// `puertaTexto` (opcional, de textoParaRevisor): sin él, el prompt es idéntico al de antes.
function promptRevisor(planRel, diff, esquema, puertaTexto) {
  return [
    `Review plan ${planRel} against the diff below. Read only; do not write anything.`,
    "Return ONLY JSON that conforms to this schema, with no surrounding text:",
    JSON.stringify(esquema),
    "Use veredicto APPROVED if the Aceptación requirements are met; RETURNED with defects (archivo, linea, criterio) otherwise; PAUSED if something missing cannot be decided.",
    ...(puertaTexto ? ["", puertaTexto] : []),
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

export { claveFalloVerificacion, cola, promptBuilder, promptRevisor };
