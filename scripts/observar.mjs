#!/usr/bin/env node
// Observador de Docker: registra eventos, memoria, builds y diagnósticos de cualquier proyecto mientras corre,
// y muestra un informe de dónde se va el tiempo, qué se solapa y qué cayó por memoria.
// Solo lectura sobre Docker: no limpia, no frena ni cambia nada. Sin dependencias; nada sale del equipo.
//
// Uso:
//   node scripts/observar.mjs start | stop | status
//   node scripts/observar.mjs informe [--datos <carpeta>] [--desde <AAAA-MM-DD>]
//
// Datos: ~/.flucastr-ai/observador/ (o la carpeta de FLUCASTR_OBSERVADOR_DIR).
//   eventos.jsonl   docker events (oom, die, health_status, create, destroy), una línea por evento.
//   muestras.jsonl  docker stats cada 5 s con «ts», y una línea «host» con free -m.
//   builds.jsonl    docker buildx history ls --format json cada 5 min, solo builds terminadas, sin repetir ref.
//   diagnosticos/   docker logs y docker inspect de un contenedor con oom, unhealthy o die con código distinto de 0 y 143.

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { crearInforme, duracionS } from "../tools/observe/report.mjs";
import { cmd, debeDiagnosticar, diagnosticar } from "../tools/observe/diagnose.mjs";
import { arrancar, estado, parar, pidDe, PID } from "../tools/observe/process.mjs";

const SELF = fileURLToPath(import.meta.url);
const EVENTOS = "eventos.jsonl";
const MUESTRAS = "muestras.jsonl";
const BUILDS = "builds.jsonl";
const DIAGNOSTICOS = "diagnosticos";
const CADA_MUESTRA_MS = 5000;
const CADA_BUILDS_MS = 5 * 60 * 1000;
const REINICIO_EVENTOS_MS = 30000;

// ---------- utilidades ----------

function carpetaDatos() {
  return resolve(process.env.FLUCASTR_OBSERVADOR_DIR || join(homedir(), ".flucastr-ai", "observador"));
}

function leerJsonl(ruta) {
  if (!existsSync(ruta)) return [];
  const filas = [];
  readFileSync(ruta, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .forEach((linea, i) => {
      try {
        filas.push(JSON.parse(linea));
      } catch {
        process.stderr.write(`aviso: ${ruta} línea ${i + 1} no es JSON; se ignora\n`);
      }
    });
  return filas;
}

function leerOpciones(args, permitidas) {
  const o = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!permitidas.includes(a)) throw new Error(`opción desconocida: ${a}`);
    const valor = args[++i];
    if (valor === undefined) throw new Error(`falta el valor de ${a}`);
    o[a.slice(2)] = valor;
  }
  return o;
}

// ---------- informe ----------

function informe(dir, desde) {
  console.log(crearInforme(dir, desde, { leerJsonl, join, EVENTOS, MUESTRAS, BUILDS }));
  return 0;
}

const FILTROS_EVENTOS = ["oom", "die", "health_status", "create", "destroy"].flatMap((e) => ["--filter", `event=${e}`]);
// Proceso en segundo plano: eventos, muestras de memoria, builds y diagnósticos. Termina con SIGTERM.
function correr(dir) {
  writeFileSync(join(dir, PID), `${process.pid}\n`);
  const hijos = new Set();
  const temporizadores = [];
  let activo = true;

  const apagar = () => {
    activo = false;
    for (const h of hijos) h.kill("SIGTERM");
    for (const t of temporizadores) clearInterval(t);
    if (pidDe(dir) === process.pid) rmSync(join(dir, PID), { force: true });
    process.exit(0);
  };
  process.on("SIGTERM", apagar);
  process.on("SIGINT", apagar);

  const arrancarEventos = () => {
    if (!activo) return;
    const h = spawn("docker", ["events", "--format", "{{json .}}", ...FILTROS_EVENTOS], { stdio: ["ignore", "pipe", "pipe"] });
    hijos.add(h);
    h.stderr.pipe(process.stderr);
    createInterface({ input: h.stdout }).on("line", (linea) => {
      const t = linea.trim();
      if (!t) return;
      appendFileSync(join(dir, EVENTOS), t + "\n");
      let ev;
      try {
        ev = JSON.parse(t);
      } catch {
        return;
      }
      if (debeDiagnosticar(ev)) diagnosticar(dir, ev, DIAGNOSTICOS);
    });
    h.on("close", () => {
      hijos.delete(h);
      // docker events termina si el daemon se reinicia; se vuelve a conectar sin bucles rápidos.
      if (activo) temporizadores.push(setTimeout(arrancarEventos, REINICIO_EVENTOS_MS));
    });
  };

  let ocupadoMuestra = false;
  const muestrear = async () => {
    if (ocupadoMuestra || !activo) return;
    ocupadoMuestra = true;
    try {
      const ts = new Date().toISOString();
      const stats = await cmd("docker", ["stats", "--no-stream", "--format", "{{json .}}"]);
      for (const linea of stats.split("\n")) {
        const t = linea.trim();
        if (!t) continue;
        try {
          appendFileSync(join(dir, MUESTRAS), JSON.stringify({ ts, ...JSON.parse(t) }) + "\n");
        } catch {
          // línea que no es JSON: se omite
        }
      }
      const libre = await cmd("free", ["-m"]);
      const fila = libre.split("\n").find((l) => l.startsWith("Mem:"));
      if (fila) {
        const c = fila.trim().split(/\s+/);
        appendFileSync(join(dir, MUESTRAS), JSON.stringify({ ts, host: { total_mb: Number(c[1]), usada_mb: Number(c[2]) } }) + "\n");
      }
    } finally {
      ocupadoMuestra = false;
    }
  };

  const refs = new Set(leerJsonl(join(dir, BUILDS)).map((b) => b.ref));
  const registrarBuilds = async () => {
    const salida = await cmd("docker", ["buildx", "history", "ls", "--format", "json"]);
    for (const linea of salida.split("\n")) {
      const t = linea.trim();
      if (!t) continue;
      let b;
      try {
        b = JSON.parse(t);
      } catch {
        continue;
      }
      if (duracionS(b) === null || refs.has(b.ref)) continue;
      refs.add(b.ref);
      appendFileSync(join(dir, BUILDS), t + "\n");
    }
  };

  arrancarEventos();
  muestrear();
  registrarBuilds();
  temporizadores.push(setInterval(muestrear, CADA_MUESTRA_MS), setInterval(registrarBuilds, CADA_BUILDS_MS));
}

// ---------- órdenes ----------

async function main(argv) {
  const [orden, ...resto] = argv;
  if (orden === "informe") {
    const o = leerOpciones(resto, ["--datos", "--desde"]);
    return informe(o.datos ? resolve(o.datos) : carpetaDatos(), o.desde);
  }
  const dir = carpetaDatos();
  if (orden === "start") return arrancar(dir, SELF);
  if (orden === "stop") return parar(dir);
  if (orden === "status") return estado(dir);
  if (orden === "--correr") {
    correr(resolve(resto[0]));
    return 0;
  }
  console.error("uso: node scripts/observar.mjs start | stop | status | informe [--datos <carpeta>] [--desde <AAAA-MM-DD>]");
  return 2;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (err) {
  console.error(`observar: ${err.message}`);
  process.exitCode = 2;
}
