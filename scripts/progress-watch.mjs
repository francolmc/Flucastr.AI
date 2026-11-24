#!/usr/bin/env node
// Vigilante de progreso de `kit run`: proceso hijo que corre mientras el builder trabaja.
// Cada intervalo captura los logs de sesión (Codex/Pi), marca casillas nuevas y cambios de huella
// en changes/<nombre>/progress.jsonl (solo con anexar) e imprime una línea de estado en stderr.
// Nunca escribe en stdout ni cambia decisiones: kit run decide igual con o sin vigilante.
// Uso: node scripts/progress-watch.mjs --plan <plan> --herramienta <h> --raiz <dir> [--desde <ms>] [--intervalo <seg>] [--umbral <seg>]
//   --una-vez  captura una sola vez (sin bucle, sin línea de estado) y sale; kit run lo usa antes del resumen final.
//   KIT_PROGRESO_INTERVALO (seg), KIT_PROGRESO_UMBRAL (seg).
// Sale con 0 en operación normal y con 2 si los argumentos no son válidos. Se detiene con SIGTERM.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { anexar, evento, leerEventos } from "../tools/progress/eventos.mjs";
import { calcularEstado, INTERVALO_POR_DEFECTO, UMBRAL_POR_DEFECTO } from "../tools/progress/estado.mjs";
import { capturar } from "../tools/progress/captura.mjs";
import { frontmatter } from "../tools/run/plan.mjs";
import { fingerprintTree } from "../tools/run/tree-fingerprint.mjs";

const CASILLA = /^- \[([ xX])\] (.+)$/gm;

function uso(msg) {
  process.stderr.write(`progress-watch: ${msg}\nUso: node scripts/progress-watch.mjs --plan <plan> --herramienta <h> --raiz <dir> [--desde <ms>] [--intervalo <seg>] [--umbral <seg>] [--una-vez]\n`);
  process.exit(2);
}

function numero(valor, nombre) {
  const n = Number(valor);
  if (valor === undefined || valor === "" || !Number.isFinite(n) || n <= 0) uso(`${nombre} debe ser un número de segundos mayor que 0`);
  return n;
}

export function parsear(argv, env = {}) {
  const op = {
    plan: null,
    herramienta: null,
    raiz: null,
    desde: 0,
    intervalo: env.KIT_PROGRESO_INTERVALO || INTERVALO_POR_DEFECTO,
    umbral: env.KIT_PROGRESO_UMBRAL || UMBRAL_POR_DEFECTO,
    unaVez: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--una-vez") op.unaVez = true;
    else if (a === "--plan") op.plan = argv[++i];
    else if (a === "--herramienta") op.herramienta = argv[++i];
    else if (a === "--raiz") op.raiz = argv[++i];
    else if (a === "--desde") op.desde = Number(argv[++i]) || 0;
    else if (a === "--intervalo") op.intervalo = argv[++i];
    else if (a === "--umbral") op.umbral = argv[++i];
    else uso(`opción desconocida: ${a}`);
  }
  if (!op.plan) uso("falta --plan");
  if (!op.raiz) uso("falta --raiz");
  op.plan = resolve(process.cwd(), op.plan);
  op.raiz = resolve(process.cwd(), op.raiz);
  op.intervalo = numero(op.intervalo, "--intervalo");
  op.umbral = numero(op.umbral, "--umbral");
  return op;
}

// Casillas del tramo activo (tramo-<segment>.md junto al plan) si existe; si no, las del plan.
export function casillasDelPlan(planPath) {
  const meta = frontmatter(readFileSync(planPath, "utf8"));
  const seg = meta.segment ?? null;
  const tramo = seg ? join(dirname(planPath), `tramo-${seg}.md`) : null;
  const ruta = tramo && existsSync(tramo) ? tramo : planPath;
  const texto = readFileSync(ruta, "utf8");
  const casillas = [...texto.matchAll(CASILLA)].map((m) => ({ texto: m[2].trim(), marcada: m[1] !== " " }));
  return { seg, casillas };
}

// Una pasada: captura de sesiones, casillas marcadas y paso inferido. Solo anexa; las ids salen del plan
// (seg y posición), así que repetir la pasada no duplica eventos. Nunca lanza.
export async function sincronizar(op) {
  try {
    if (op.herramienta) {
      await capturar({ herramienta: op.herramienta, raiz: op.raiz, plan: op.plan, desde: op.desde });
    }
    const destino = join(dirname(op.plan), "progress.jsonl");
    const { eventos } = leerEventos(destino);
    const { seg, casillas } = casillasDelPlan(op.plan);
    const ids = new Set(eventos.map((e) => `${e.tipo}|${e.id ?? ""}`));

    casillas.forEach((c, i) => {
      if (!c.marcada) return;
      const id = `casilla|${seg}|${i + 1}`;
      if (ids.has(`casilla_marcada|${id}`)) return;
      if (anexar(destino, evento("casilla_marcada", { seg, id, texto: c.texto }))) ids.add(`casilla_marcada|${id}`);
    });

    const siguiente = casillas.findIndex((c) => !c.marcada);
    if (siguiente >= 0) {
      const id = `paso|${seg}|${siguiente + 1}`;
      if (!ids.has(`paso_iniciado|${id}`)) {
        anexar(destino, evento("paso_iniciado", { seg, id, texto: casillas[siguiente].texto, o: "inferido" }));
      }
    }
    return true;
  } catch {
    return false;
  }
}

function lineaEstado(op, ahora) {
  const logPath = join(dirname(op.plan), "progress.jsonl");
  const { eventos } = leerEventos(logPath);
  const e = calcularEstado(eventos, { ahora, umbralSeg: op.umbral, intervaloSeg: op.intervalo });
  const ultima = e.segundosDesdeActividad === null ? "sin actividad registrada" : `última actividad hace ${e.segundosDesdeActividad} s`;
  return `[progreso] ${e.senal} · paso ${e.paso ?? "sin dato"} · ${ultima}`;
}

export function iniciar(op) {
  let previa = fingerprintTree(op.raiz);
  const padre = process.ppid;
  let ocupado = false;

  const pasada = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      await sincronizar(op);
      const h = fingerprintTree(op.raiz);
      if (h !== null && h !== previa) {
        previa = h;
        anexar(join(dirname(op.plan), "progress.jsonl"), evento("fingerprint_cambió", { seg: casillasDelPlan(op.plan).seg, id: `huella|${Date.now()}`, texto: h.slice(0, 12) }));
      }
      process.stderr.write(`${lineaEstado(op, Date.now())}\n`);
    } catch {
      // Un fallo de una pasada no detiene el vigilante.
    } finally {
      ocupado = false;
    }
  };

  const timer = setInterval(() => {
    // Si kit run muere sin detenernos, el hijo queda huérfano: se retira.
    if (process.ppid !== padre) return finalizar(0);
    pasada();
  }, op.intervalo * 1000);

  const finalizar = (codigo) => {
    clearInterval(timer);
    process.exit(codigo);
  };
  process.on("SIGTERM", () => finalizar(0));
  process.on("SIGINT", () => finalizar(0));
}

async function main(argv, env) {
  const op = parsear(argv, env);
  if (op.unaVez) {
    await sincronizar(op);
    process.exit(0);
  }
  iniciar(op);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2), process.env);
}
