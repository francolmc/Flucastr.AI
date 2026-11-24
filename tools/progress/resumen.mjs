import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Resumen de la corrida (progress-resumen.md) a partir de los eventos del log. Función pura en generarResumen;
// escribirResumen la guarda con best effort (nunca lanza). Solo usa campos ya redactados y truncados.

export const ENCABEZADO_CORTE = "CORTE POR TOPE DE TIEMPO — no es un PAUSED del producto";
export const UMBRAL_ESPERA_MS = 30000;
export const MINIMO_REINTENTOS = 2;

function ms(t) {
  const n = Date.parse(t);
  return Number.isNaN(n) ? null : n;
}

function segundos(valorMs) {
  return `${Math.round(valorMs / 1000)} s`;
}

function lista(lineas) {
  return lineas.length ? lineas.join("\n") : "- (ninguno)";
}

// plan: { resultado: "DONE" | "PAUSED", motivo, corte: boolean, casillas: [{ texto, marcada }] }
export function generarResumen(eventos, plan = {}) {
  const casillas = plan.casillas ?? [];
  const hechas = casillas.filter((c) => c.marcada);
  const pendientes = casillas.filter((c) => !c.marcada);
  const corte = plan.corte === true;

  let estado;
  if (corte) estado = ENCABEZADO_CORTE;
  else if (plan.resultado === "PAUSED") estado = `PAUSED: motivo=${plan.motivo ?? "?"}`;
  else estado = "DONE";

  // Tiempo por paso: entre casilla_marcada consecutivas; el primero parte del inicio del log.
  const inicio = eventos.length ? ms(eventos[0].t) : null;
  const tiempos = [];
  let previo = inicio;
  for (const e of eventos) {
    if (e.tipo !== "casilla_marcada") continue;
    const t = ms(e.t);
    if (t === null || previo === null) {
      previo = t;
      continue;
    }
    tiempos.push(`- ${e.texto ?? "paso"}: ${segundos(t - previo)}`);
    previo = t;
  }

  // Comandos por id y cmd, para resolver el texto de comando_terminado.
  const cmdPorId = new Map();
  const cmdsIniciados = [];
  for (const e of eventos) {
    if (e.tipo !== "comando_iniciado") continue;
    if (e.id != null) cmdPorId.set(e.id, e.cmd ?? "(comando)");
    cmdsIniciados.push(e.cmd ?? "(comando)");
  }

  const esperas = eventos
    .filter((e) => e.tipo === "comando_terminado" && typeof e.ms === "number" && e.ms >= UMBRAL_ESPERA_MS)
    .map((e) => `- ${cmdPorId.get(e.id) ?? e.cmd ?? "(comando)"}: ${segundos(e.ms)}`);

  const conteo = new Map();
  for (const c of cmdsIniciados) conteo.set(c, (conteo.get(c) ?? 0) + 1);
  const reintentos = [...conteo]
    .filter(([, n]) => n >= MINIMO_REINTENTOS)
    .map(([cmd, n]) => `- ${cmd} ×${n}`);

  const ultimo = (tipo, campo) => {
    for (let i = eventos.length - 1; i >= 0; i--) {
      if (eventos[i].tipo === tipo && eventos[i][campo] != null) return eventos[i][campo];
    }
    return null;
  };
  const ultimoPaso = ultimo("paso_iniciado", "texto") ?? ultimo("casilla_marcada", "texto");
  const ultimoArchivo = ultimo("archivo_editado", "archivo");
  const ultimoComando = ultimo("comando_iniciado", "cmd");

  const falta = pendientes.map((c) => `- [ ] ${c.texto}`);
  if (corte) {
    falta.push(
      `- Punto de reanudación: último paso ${ultimoPaso ?? "(ninguno)"}; archivo ${ultimoArchivo ?? "(ninguno)"}; comando ${ultimoComando ?? "(ninguno)"}.`,
      `- Primera casilla pendiente: ${pendientes[0]?.texto ?? "(ninguna)"}.`,
    );
  }

  return [
    "# Resumen de corrida",
    "",
    `Plan: ${plan.nombre ?? "(sin nombre)"}`,
    "",
    "## Estado",
    estado,
    "",
    "## Hecho",
    lista(hechas.map((c) => `- [x] ${c.texto}`)),
    "",
    "## Tiempo por paso",
    lista(tiempos),
    "",
    "## Dónde esperó",
    lista(esperas),
    "",
    "## Dónde reintentó",
    lista(reintentos),
    "",
    "## Falta",
    lista(falta),
    "",
  ].join("\n");
}

// Escribe el resumen en ruta. Best effort: devuelve false y avisa por stderr si no puede escribir.
export function escribirResumen(ruta, eventos, plan) {
  try {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, generarResumen(eventos, plan));
    return true;
  } catch (e) {
    try { process.stderr.write(`progreso: no se pudo escribir el resumen ${ruta} (${e.code ?? e.message})\n`); } catch {}
    return false;
  }
}
