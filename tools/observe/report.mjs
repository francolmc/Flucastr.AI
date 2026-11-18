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
export function duracionS(b) {
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

export function crearInforme(dir, desde, { leerJsonl, join, EVENTOS, MUESTRAS, BUILDS }) {
  const corte = desde ? Date.parse(`${desde}T00:00:00Z`) : -Infinity;
  if (Number.isNaN(corte)) throw new Error(`--since debe ser AAAA-MM-DD: ${desde}`);

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

  return salida.join("\n");
}

