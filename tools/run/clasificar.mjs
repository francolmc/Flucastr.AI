// Clasificador de fallas para la escalera de recuperación de kit run. Función pura: no lee archivos,
// no toca red ni procesos. Reglas en changes/escalera-recuperacion/plan.md (Assumptions) y tramo-1.md (Handoff).
// Entrada: { origen: "builder" | "revisor" | "verify", status, error, salida, retorno }.
// Salida: { clase: "infra" | "entorno" | "plan" | "decision" | "tarea", senal }.

// Infraestructura: solo para el proceso que murió (builder o revisor), nunca para la salida de verify.
const INFRA_PROCESO = [
  ["thrashing", /Autocompact is thrashing/],
  ["invalid_request", /invalid_request/],
  ["tope", /superó el tope/],
];

// Entorno en texto: disco lleno, Docker, permisos, imagen o navegador ausentes.
const ENTORNO_TEXTO = [
  ["ENOSPC", /ENOSPC|No space left/],
  ["docker", /Cannot connect to the Docker daemon/],
  ["EPERM", /EPERM|Operation not permitted/],
  ["imagen", /pull access denied|No such image/],
  ["navegador", /Executable doesn't exist/],
];

// Entorno de un proceso que murió: límite de uso y errores de red.
const ENTORNO_PROCESO = [
  ["limite_uso", /usage limit|rate limit|límite de uso/i],
  ["red", /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|network error/i],
];

// Motivo de PAUSED del builder → clase. Motivo no listado → plan.
const CLASE_POR_MOTIVO = new Map([
  ["ambiguous", "decision"],
  ["design", "decision"],
  ["scope", "plan"],
  ["access", "entorno"],
  ["verify", "tarea"],
]);

const primerLinea = (texto) => String(texto ?? "").split("\n", 1)[0].trim();
const primerHallazgo = (lista, texto) => lista.find(([, re]) => re.test(texto));

function clasificarPausa(linea) {
  const entorno = primerHallazgo(ENTORNO_TEXTO, linea);
  if (entorno) return { clase: "entorno", senal: entorno[0] };
  const motivo = /motivo=([^;\s]+)/.exec(linea)?.[1] ?? "";
  return { clase: CLASE_POR_MOTIVO.get(motivo) ?? "plan", senal: `motivo=${motivo || "desconocido"}` };
}

function clasificarMuerto(texto) {
  const infra = primerHallazgo(INFRA_PROCESO, texto);
  if (infra) return { clase: "infra", senal: infra[0] };
  const entorno = primerHallazgo([...ENTORNO_TEXTO, ...ENTORNO_PROCESO], texto);
  return { clase: "entorno", senal: entorno ? entorno[0] : "desconocida" };
}

function clasificarVerify({ status, error, texto }) {
  const entorno = primerHallazgo(ENTORNO_TEXTO, texto);
  if (entorno) return { clase: "entorno", senal: entorno[0] };
  if (status === 137 || status === 143) return { clase: "entorno", senal: `status ${status}` };
  if (/superó el tope/.test(String(error ?? ""))) return { clase: "entorno", senal: "tope" };
  return { clase: "tarea", senal: "verify" };
}

export function clasificar({ origen, status = 0, error = null, salida = "", retorno = "" } = {}) {
  const texto = `${error ?? ""}\n${salida ?? ""}`;
  if (origen === "verify") return clasificarVerify({ status, error, texto });
  const linea = primerLinea(retorno);
  if (linea.startsWith("PAUSED")) return clasificarPausa(linea);
  if (linea.startsWith("RETURNED")) return { clase: "tarea", senal: "RETURNED" };
  if (status !== 0 || error) return clasificarMuerto(texto);
  return { clase: "entorno", senal: "desconocida" };
}
