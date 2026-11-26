// Handoff cronológico del primer relanzamiento de kit run (A4 de changes/escalera-recuperacion/plan.md).
// Funciones puras: kit run reúne los datos (casillas, plan, git status, progress.jsonl) y aquí solo se da formato.

export const ENCABEZADO_HANDOFF = "Handoff (cronológico):";
const MAX_LINEAS_ERROR = 10;

const lista = (items) => (items.length ? items.map((x) => `- ${x}`) : ["- ninguno"]);

// Último error: el texto del fallo sin líneas vacías, como mucho las últimas 10.
function lineasError(error) {
  const lineas = String(error ?? "").split("\n").filter((l) => l.trim());
  return lineas.length ? lineas.slice(-MAX_LINEAS_ERROR) : ["ninguno"];
}

// Texto del handoff. `casillas` = [{ texto, marcada }]; `decisiones` = líneas de «Decisions already taken»;
// `archivos` = salida de `git status --porcelain`; `error` = texto del último fallo.
export function handoff({ casillas = [], decisiones = [], archivos = "", error = "" } = {}) {
  const hechas = casillas.filter((c) => c.marcada).map((c) => c.texto);
  const pendientes = casillas.filter((c) => !c.marcada).map((c) => c.texto);
  const proxima = pendientes.length ? `completar «${pendientes[0]}»` : "corregir el último error y volver a verificar";
  const archivosTocados = String(archivos).split("\n").map((l) => l.trimEnd()).filter(Boolean);
  return [
    ENCABEZADO_HANDOFF,
    "Hecho:",
    ...lista(hechas),
    "Pendiente:",
    ...lista(pendientes),
    "Decisiones usadas:",
    ...lista(decisiones),
    "Archivos tocados:",
    ...lista(archivosTocados),
    "Último error:",
    ...lineasError(error),
    `Próxima acción: ${proxima}`,
  ].join("\n");
}

// Líneas «- …» de la sección «## Decisions already taken» del plan.
export function decisionesUsadas(texto) {
  const lineas = String(texto ?? "").split("\n");
  const inicio = lineas.findIndex((l) => /^## Decisions already taken\s*$/.test(l));
  if (inicio < 0) return [];
  const decisiones = [];
  for (const linea of lineas.slice(inicio + 1)) {
    if (/^## /.test(linea)) break;
    const m = /^- (.+)$/.exec(linea);
    if (m) decisiones.push(m[1].trim());
  }
  return decisiones;
}
