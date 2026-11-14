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

import { execFile, spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const PID = "observador.pid";
const LOG = "observador.log";
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

// Docker y buildx escriben nanosegundos; JavaScript lee milisegundos.
function aMs(iso) {
  return Date.parse(String(iso).replace(/(\.\d{3})\d+/, "$1"));
}

function horaUtc(ms) {
  return new Date(ms).toISOString().slice(11, 19);
}

const r1 = (x) => Math.round(x * 10) / 10;
const suma = (xs) => xs.reduce((a, b) => a + b, 0);

// Convierte «1.5GiB» o «450MiB» a MiB. Devuelve null si no entiende la cifra.
const UNIDADES_A_MIB = { B: 1 / 1048576, kB: 1e3 / 1048576, KB: 1e3 / 1048576, KiB: 1024 / 1048576, MB: 1e6 / 1048576, MiB: 1, GB: 1e9 / 1048576, GiB: 1024 };
function aMiB(texto) {
  const m = /^([\d.]+)\s*([A-Za-z]+)$/.exec(String(texto).trim());
  if (!m || !Object.hasOwn(UNIDADES_A_MIB, m[2])) return null;
  return Number(m[1]) * UNIDADES_A_MIB[m[2]];
}

// Duración en segundos de una build terminada; null si no terminó (completed_at en 0001) o no tiene fechas.
function duracionS(b) {
  const ini = aMs(b.created_at);
  const fin = aMs(b.completed_at);
  if (!(fin > ini)) return null;
  return (fin - ini) / 1000;
}

function mediana(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  const m = Math.floor(n / 2);
  return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
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
  const corte = desde ? Date.parse(`${desde}T00:00:00Z`) : -Infinity;
  if (Number.isNaN(corte)) throw new Error(`--desde debe ser AAAA-MM-DD: ${desde}`);

  const todosEventos = leerJsonl(join(dir, EVENTOS)).map((e) => ({ ...e, ms: Number(e.time) * 1000 }));
  const eventos = todosEventos.filter((e) => e.ms >= corte);

  // Proyecto de cada contenedor, por su nombre: sale de la etiqueta de Compose de sus eventos.
  const proyectoDe = new Map();
  for (const e of todosEventos) {
    const a = e.Actor?.Attributes ?? {};
    if (a.name && a["com.docker.compose.project"]) proyectoDe.set(a.name, a["com.docker.compose.project"]);
  }

  const muestras = leerJsonl(join(dir, MUESTRAS)).filter((m) => Date.parse(m.ts) >= corte);

  const vistos = new Set();
  const builds = [];
  for (const b of leerJsonl(join(dir, BUILDS))) {
    const dur = duracionS(b);
    if (dur === null || vistos.has(b.ref) || aMs(b.created_at) < corte) continue;
    vistos.add(b.ref);
    builds.push({ ...b, dur });
  }

  const salida = [];

  // BUILDS: por nombre, con mediana, máximo y porcentaje de pasos en caché.
  salida.push("BUILDS (UTC; sin duplicados por ref)");
  const porNombre = new Map();
  for (const b of builds) {
    if (!porNombre.has(b.name)) porNombre.set(b.name, []);
    porNombre.get(b.name).push(b);
  }
  if (porNombre.size === 0) salida.push("(sin builds terminadas)");
  for (const nombre of [...porNombre.keys()].sort()) {
    const bs = porNombre.get(nombre);
    const cached = suma(bs.map((b) => b.cached_steps ?? 0));
    const total = suma(bs.map((b) => b.total_steps ?? b.completed_steps ?? 0));
    const cache = total > 0 ? `${Math.round((100 * cached) / total)}%` : "-";
    salida.push(
      `${nombre}: n=${bs.length} mediana=${r1(mediana(bs.map((b) => b.dur)))}s maximo=${r1(Math.max(...bs.map((b) => b.dur)))}s cache=${cache}`,
    );
  }

  // Ventana de cada proyecto Compose: del primer al último evento de sus contenedores.
  const proyectos = new Map();
  for (const e of eventos) {
    const p = e.Actor?.Attributes?.["com.docker.compose.project"];
    if (!p) continue;
    const r = proyectos.get(p) ?? { inicio: Infinity, fin: -Infinity };
    r.inicio = Math.min(r.inicio, e.ms);
    r.fin = Math.max(r.fin, e.ms);
    proyectos.set(p, r);
  }

  // Pico de memoria por contenedor, según las muestras de docker stats.
  const picos = new Map();
  for (const m of muestras) {
    if (!m.Name) continue;
    const mib = aMiB(String(m.MemUsage ?? "").split("/")[0]);
    if (mib === null) continue;
    picos.set(m.Name, Math.max(picos.get(m.Name) ?? 0, mib));
  }

  salida.push("PROYECTOS (UTC)");
  if (proyectos.size === 0) salida.push("(sin proyectos Compose)");
  const porInicio = [...proyectos.entries()].sort((a, b) => a[1].inicio - b[1].inicio);
  for (const [p, r] of porInicio) {
    const contenedores = [...picos.keys()].filter((n) => proyectoDe.get(n) === p).sort();
    const pico = contenedores.length
      ? "pico " + contenedores.map((n) => `${n}=${Math.round(picos.get(n))}MiB`).join(" ")
      : "pico sin muestras";
    salida.push(`${p}: ${horaUtc(r.inicio)} -> ${horaUtc(r.fin)} ${pico}`);
  }

  // EVENTOS: oom y unhealthy, con su contenedor y su proyecto.
  salida.push("EVENTOS");
  const alertas = eventos
    .filter((e) => e.Action === "oom" || String(e.status ?? "").startsWith("health_status: unhealthy"))
    .sort((a, b) => a.ms - b.ms)
    .map((e) => {
      const a = e.Actor?.Attributes ?? {};
      const contenedor = a.name ?? e.Actor?.ID ?? "?";
      const proyecto = a["com.docker.compose.project"] ?? "-";
      const tipo = e.Action === "oom" ? "OOM" : "UNHEALTHY";
      return `${tipo} ${horaUtc(e.ms)} contenedor=${contenedor} proyecto=${proyecto}`;
    });
  if (alertas.length === 0) salida.push("(ninguno)");
  salida.push(...alertas);

  // SOLAPES: pares de proyectos con ventanas que se cruzan.
  salida.push("SOLAPES");
  const nombres = porInicio.map(([p]) => p);
  let solapes = 0;
  for (let i = 0; i < nombres.length; i++) {
    for (let j = i + 1; j < nombres.length; j++) {
      const a = proyectos.get(nombres[i]);
      const b = proyectos.get(nombres[j]);
      const ini = Math.max(a.inicio, b.inicio);
      const fin = Math.min(a.fin, b.fin);
      if (fin <= ini) continue;
      solapes++;
      salida.push(`${nombres[i]} <-> ${nombres[j]}: ${r1((fin - ini) / 60000)} min (${horaUtc(ini)} -> ${horaUtc(fin)})`);
    }
  }
  if (solapes === 0) salida.push("(ninguno)");

  // HOST: pico de memoria usada del equipo.
  salida.push("HOST (UTC)");
  const host = muestras.filter((m) => m.host);
  if (host.length === 0) {
    salida.push("sin muestras");
  } else {
    const pico = host.reduce((mejor, m) => (m.host.usada_mb > mejor.host.usada_mb ? m : mejor));
    salida.push(`pico memoria usada ${pico.host.usada_mb}MiB de ${pico.host.total_mb}MiB`);
  }

  console.log(salida.join("\n"));
  return 0;
}

// ---------- ciclo de vida ----------

function pidDe(dir) {
  const ruta = join(dir, PID);
  if (!existsSync(ruta)) return null;
  const pid = Number(readFileSync(ruta, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function vivo(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

function arrancar(dir) {
  mkdirSync(join(dir, DIAGNOSTICOS), { recursive: true });
  const previo = pidDe(dir);
  if (previo && vivo(previo)) {
    console.log(`ya corre (pid ${previo}); datos en ${dir}`);
    return 0;
  }
  const log = openSync(join(dir, LOG), "a");
  const hijo = spawn(process.execPath, [SELF, "--correr", dir], { detached: true, stdio: ["ignore", log, log], env: process.env });
  hijo.unref();
  writeFileSync(join(dir, PID), `${hijo.pid}\n`);
  console.log(`arrancado (pid ${hijo.pid}); datos en ${dir}`);
  return 0;
}

async function parar(dir) {
  const pid = pidDe(dir);
  if (!pid || !vivo(pid)) {
    rmSync(join(dir, PID), { force: true });
    console.log(`no corre; datos en ${dir}`);
    return 0;
  }
  process.kill(pid, "SIGTERM");
  for (let i = 0; i < 50 && vivo(pid); i++) await new Promise((r) => setTimeout(r, 100));
  if (vivo(pid)) process.kill(pid, "SIGKILL");
  const sigue = vivo(pid);
  if (!sigue) rmSync(join(dir, PID), { force: true });
  console.log(sigue ? `no pudo parar (pid ${pid})` : `parado (pid ${pid})`);
  return sigue ? 1 : 0;
}

function estado(dir) {
  const pid = pidDe(dir);
  console.log(pid && vivo(pid) ? `corriendo (pid ${pid}); datos en ${dir}` : `parado; datos en ${dir}`);
  return 0;
}

// Comando externo sin lanzar excepciones: devuelve su salida (vacía si falla) y deja el error en el log.
function cmd(bin, args) {
  return new Promise((resolver) => {
    execFile(bin, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err) process.stderr.write(`${new Date().toISOString()} ${bin} ${args[0]}: ${err.message.split("\n")[0]}\n`);
      resolver(stdout ?? "");
    });
  });
}

const FILTROS_EVENTOS = ["oom", "die", "health_status", "create", "destroy"].flatMap((e) => ["--filter", `event=${e}`]);

// Un evento merece diagnóstico si es oom, unhealthy, o un die con código distinto de 0 y 143.
function debeDiagnosticar(ev) {
  const attrs = ev.Actor?.Attributes ?? {};
  const estadoEv = String(ev.status ?? ev.Action ?? "");
  if (estadoEv === "oom" || estadoEv.startsWith("health_status: unhealthy")) return true;
  if (estadoEv === "die") {
    const code = Number(attrs.exitCode);
    return Number.isInteger(code) && code !== 0 && code !== 143;
  }
  return false;
}

function diagnosticar(dir, ev) {
  const id = ev.Actor?.ID ?? ev.id;
  if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) return;
  const attrs = ev.Actor?.Attributes ?? {};
  const logs = spawnSync("docker", ["logs", "--tail", "80", id], { encoding: "utf8" });
  const insp = spawnSync("docker", ["inspect", id], { encoding: "utf8" });
  const cuerpo = [
    `# ${ev.status ?? ev.Action} ${new Date(Number(ev.time) * 1000).toISOString()} ${attrs.name ?? ""}`,
    "## docker logs --tail 80",
    (logs.stdout ?? "") + (logs.stderr ?? ""),
    "## docker inspect",
    (insp.stdout ?? "") + (insp.stderr ?? ""),
  ];
  writeFileSync(join(dir, DIAGNOSTICOS, `${id}.txt`), cuerpo.join("\n") + "\n");
}

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
      if (debeDiagnosticar(ev)) diagnosticar(dir, ev);
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
  if (orden === "start") return arrancar(dir);
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
