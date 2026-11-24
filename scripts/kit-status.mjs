#!/usr/bin/env node
// Estado de progreso de un plan: lee changes/<nombre>/progress.jsonl y muestra hasta 8 líneas.
// Solo lectura: no escribe nada y no usa modelo.
// Uso: node scripts/kit-status.mjs <plan> [--watch] [--intervalo <seg>] [--umbral <seg>]
//   --watch          repite la salida cada --intervalo segundos hasta Ctrl+C (por defecto 10)
//   --umbral         segundos sin eventos para «sin actividad» (por defecto 120)
//   KIT_PROGRESO_INTERVALO, KIT_PROGRESO_UMBRAL, KIT_PROGRESO_AHORA (ISO, para pruebas), KIT_PROGRESO_CICLOS (para pruebas: sale tras N impresiones)
// Salida: 0 si imprime el estado (también sin progress.jsonl); 2 si la opción o el plan no son válidos.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { leerEventos } from "../tools/progress/eventos.mjs";
import { calcularEstado, UMBRAL_POR_DEFECTO } from "../tools/progress/estado.mjs";
import { frontmatter, progreso } from "../tools/run/plan.mjs";

const INTERVALO_POR_DEFECTO = 10;
// Ventana de «cambió N veces en el último intervalo» (fija; no depende de --intervalo).
const VENTANA_HUELLA = 60;

function uso(msg) {
  process.stderr.write(`kit-status: ${msg}\nUso: node scripts/kit-status.mjs <plan> [--watch] [--intervalo <seg>] [--umbral <seg>]\n`);
  process.exit(2);
}

function numero(valor, nombre) {
  const n = Number(valor);
  if (valor === undefined || valor === "" || !Number.isFinite(n) || n <= 0) uso(`${nombre} debe ser un número de segundos mayor que 0`);
  return n;
}

function parsear(argv, env) {
  const op = {
    plan: null,
    watch: false,
    intervalo: env.KIT_PROGRESO_INTERVALO || INTERVALO_POR_DEFECTO,
    umbral: env.KIT_PROGRESO_UMBRAL || UMBRAL_POR_DEFECTO,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--watch") op.watch = true;
    else if (a === "--intervalo") op.intervalo = argv[++i];
    else if (a === "--umbral") op.umbral = argv[++i];
    else if (a.startsWith("-")) uso(`opción desconocida: ${a}`);
    else if (op.plan === null) op.plan = a;
    else uso(`solo un plan: ${a}`);
  }
  if (!op.plan) uso("falta el plan");
  op.intervalo = numero(op.intervalo, "--intervalo");
  op.umbral = numero(op.umbral, "--umbral");
  return op;
}

// «14 s», «15 min», «2 h».
function tiempo(seg) {
  if (seg < 60) return `${seg} s`;
  if (seg < 3600) return `${Math.floor(seg / 60)} min`;
  return `${Math.floor(seg / 3600)} h`;
}

function textoComando(c) {
  if (!c) return "ninguno";
  const cmd = c.cmd ?? "sin dato";
  const seg = c.ms == null ? null : Math.round(c.ms / 1000);
  if (c.enCurso) return seg == null ? `${cmd} — en curso` : `${cmd} — en curso (${tiempo(seg)})`;
  const exit = c.exit ?? "desconocido";
  return seg == null ? `${cmd} — exit ${exit}` : `${cmd} — exit ${exit} (${tiempo(seg)})`;
}

function textoSenal(e) {
  if (e.senal === "esperando comando") {
    return e.ultimoComando?.ms == null
      ? "esperando comando"
      : `esperando comando (${tiempo(Math.round(e.ultimoComando.ms / 1000))})`;
  }
  if (e.senal === "sin actividad") {
    return e.segundosDesdeActividad === null
      ? "sin actividad"
      : `sin actividad desde hace ${tiempo(e.segundosDesdeActividad)}`;
  }
  return e.senal;
}

// Casillas del tramo activo (tramo-<segment>.md junto al plan) si existe; si no, las del plan.
function casillasActivas(planPath, meta) {
  const tramo = meta.segment ? join(dirname(planPath), `tramo-${meta.segment}.md`) : null;
  const ruta = tramo && existsSync(tramo) ? tramo : planPath;
  const { hechos, total } = progreso(ruta);
  return `${hechos}/${total}`;
}

// Devuelve las líneas a imprimir. Sin log, avisa y muestra solo las casillas activas.
function resumen(planPath, { ahora, umbral }) {
  const meta = frontmatter(readFileSync(planPath, "utf8"));
  const casillas = casillasActivas(planPath, meta);
  const logPath = join(dirname(planPath), "progress.jsonl");

  if (!existsSync(logPath)) {
    return [
      `sin progress.jsonl: el builder aún no ha escrito progreso en ${logPath}`,
      `segmento ${meta.segment ?? "sin dato"} · casillas: ${casillas}`,
    ];
  }

  const { eventos, corruptas } = leerEventos(logPath);
  const e = calcularEstado(eventos, { ahora, umbralSeg: umbral, intervaloSeg: VENTANA_HUELLA, casillas });
  const out = [
    `segmento ${e.segmento ?? meta.segment ?? "sin dato"} · paso: ${e.paso ?? "sin dato"}`,
    `última actividad: ${e.segundosDesdeActividad === null ? "ninguna" : `hace ${tiempo(e.segundosDesdeActividad)}`}`,
    `último archivo: ${e.ultimoArchivo ?? "sin dato"}`,
    `último comando: ${textoComando(e.ultimoComando)}`,
    `casillas: ${casillas}`,
    `huella: cambió ${e.cambiosHuella} ${e.cambiosHuella === 1 ? "vez" : "veces"} en el último intervalo`,
    `señal: ${textoSenal(e)}`,
  ];
  if (corruptas) out.push(`líneas ignoradas: ${corruptas} (corruptas o truncadas)`);
  return out;
}

function main(argv, env) {
  const op = parsear(argv, env);
  const planPath = resolve(process.cwd(), op.plan);
  if (!existsSync(planPath)) uso(`no existe el plan: ${planPath}`);

  const fijo = env.KIT_PROGRESO_AHORA ? Date.parse(env.KIT_PROGRESO_AHORA) : NaN;
  const ahora = () => (Number.isNaN(fijo) ? Date.now() : fijo);
  const limite = env.KIT_PROGRESO_CICLOS ? Number(env.KIT_PROGRESO_CICLOS) : null;

  const imprimir = () => {
    process.stdout.write(resumen(planPath, { ahora: ahora(), umbral: op.umbral }).join("\n") + "\n");
  };

  if (!op.watch) {
    imprimir();
    return;
  }
  let n = 0;
  const ciclo = () => {
    if (process.stdout.isTTY) process.stdout.write("\x1b[2J\x1b[H");
    imprimir();
    n++;
    if (limite !== null && n >= limite) return;
    setTimeout(ciclo, op.intervalo * 1000);
  };
  ciclo();
}

main(process.argv.slice(2), process.env);
