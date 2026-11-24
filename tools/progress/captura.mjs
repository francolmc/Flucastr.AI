import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { listarJsonl, reciente } from "../usage/jsonl.mjs";
import { anexar, leerEventos } from "./eventos.mjs";
import { leerSesionCodex } from "./lector-codex.mjs";
import { leerSesionPi } from "./lector-pi.mjs";

// Captura automática desde los logs de sesión de Codex y Pi hacia changes/<plan>/progress.jsonl.
// Dedupe por `${tipo}|${id}` leyendo el propio progress.jsonl: sin archivo de offset.
// Nunca lanza: devuelve { anadidos, motivo }.

const LECTORES = {
  codex: {
    raiz: () => join(homedir(), ".codex", "sessions"),
    archivo: (nombre) => /^rollout-.*\.jsonl$/.test(nombre),
    leer: leerSesionCodex,
  },
  pi: {
    raiz: () => join(homedir(), ".pi", "agent", "sessions"),
    archivo: () => true,
    leer: leerSesionPi,
  },
};

function aMs(fecha) {
  if (typeof fecha === "number") return fecha;
  return fecha ? Date.parse(fecha) : NaN;
}

function segmentoDe(plan) {
  try {
    if (!existsSync(plan)) return null;
    const m = /^segment:\s*(\d+)/m.exec(readFileSync(plan, "utf8"));
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

export async function capturar({ herramienta, raiz, plan, desde = 0, raizSesiones } = {}) {
  try {
    const lector = LECTORES[herramienta];
    if (!lector) return { anadidos: 0, motivo: `sin lector para ${herramienta}` };

    const destino = join(dirname(plan), "progress.jsonl");
    const seg = segmentoDe(plan);
    const dir = resolve(raiz);
    const sesiones = listarJsonl(raizSesiones ?? lector.raiz(), lector.archivo).filter((ruta) =>
      reciente(ruta, desde),
    );

    const vistos = new Set(leerEventos(destino).eventos.map((e) => `${e.tipo}|${e.id ?? ""}`));
    let anadidos = 0;
    let encontrada = false;

    for (const ruta of sesiones) {
      let sesion;
      try {
        sesion = await lector.leer(ruta, { seg });
      } catch {
        continue;
      }
      if (!sesion.cwd || resolve(sesion.cwd) !== dir) continue;
      if (aMs(sesion.fecha) < desde) continue;
      encontrada = true;
      for (const evt of sesion.eventos) {
        const clave = `${evt.tipo}|${evt.id ?? ""}`;
        if (vistos.has(clave)) continue;
        if (anexar(destino, evt)) {
          vistos.add(clave);
          anadidos++;
        }
      }
    }

    if (!encontrada) return { anadidos: 0, motivo: "sin sesión que coincida con la raíz desde la fecha indicada" };
    return { anadidos, motivo: anadidos ? null : "sin eventos nuevos" };
  } catch (e) {
    return { anadidos: 0, motivo: `error al capturar: ${e.message}` };
  }
}
