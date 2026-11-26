// Subir de nivel un solo tramo (paso 3 de la escalera de kit run). Reglas en changes/escalera-recuperacion/plan.md (Handoff).
// conNivelSuperior copia la configuración que resuelve FLUCASTR_MODELOS (o models.json del kit), sube agents.builder.level
// un escalón y fija FLUCASTR_MODELOS solo mientras corre fn; al terminar restaura el entorno y borra la copia.
// models.json no se toca. Quien llama decide cuándo: el revisor se resuelve fuera de esta función, con la original.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const ESCALONES = ["low", "medium", "high"];

// Ruta de la configuración que resuelve kit run: FLUCASTR_MODELOS si está, si no models.json de la raíz del kit.
export function origenDeConfig(raiz) {
  return process.env.FLUCASTR_MODELOS || join(raiz, "models.json");
}

// Nivel del builder en una configuración (su entrada o el nivel por defecto).
export function nivelBuilder(config) {
  return config?.agents?.builder?.level ?? config?.default_level;
}

// Siguiente escalón, o null si ya es el último o el nivel no está en la escalera.
export function nivelSuperior(nivel) {
  const i = ESCALONES.indexOf(nivel);
  return i >= 0 && i < ESCALONES.length - 1 ? ESCALONES[i + 1] : null;
}

// Nivel superior del builder según la configuración que resuelve, o null si no hay (ya en high o nivel desconocido).
export function nivelSuperiorDe(raiz) {
  const config = JSON.parse(readFileSync(origenDeConfig(raiz), "utf8"));
  return nivelSuperior(nivelBuilder(config));
}

// Ejecuta fn con la configuración del builder un escalón arriba. fn recibe { nivel, copia }. Lanza si no hay escalón superior.
export async function conNivelSuperior(raiz, fn) {
  const config = JSON.parse(readFileSync(origenDeConfig(raiz), "utf8"));
  const actual = nivelBuilder(config);
  const superior = nivelSuperior(actual);
  if (superior === null) throw new Error(`el nivel del builder (${actual}) no tiene superior en la escalera`);
  config.agents = config.agents ?? {};
  config.agents.builder = { ...(config.agents.builder ?? {}), level: superior };
  const dir = mkdtempSync(join(tmpdir(), "kit-nivel-"));
  const copia = join(dir, "models.json");
  const previo = process.env.FLUCASTR_MODELOS;
  try {
    writeFileSync(copia, `${JSON.stringify(config, null, 2)}\n`);
    process.env.FLUCASTR_MODELOS = copia;
    return await fn({ nivel: superior, copia });
  } finally {
    if (previo === undefined) delete process.env.FLUCASTR_MODELOS;
    else process.env.FLUCASTR_MODELOS = previo;
    rmSync(dir, { recursive: true, force: true });
  }
}
