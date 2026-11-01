#!/usr/bin/env node
// Informe de resultados del flujo (definitions/ARCHITECTURE.md, «Informe de resultados del flujo», F11).
// Solo lectura de registro/eventos.jsonl. Escribe solo registro/informe.md (sobrescribe) y lo imprime.
//
// Uso:
//   node scripts/informe.mjs                     escribe registro/informe.md y lo imprime (raíz: el directorio actual)
//   node scripts/informe.mjs --raiz <dir>        igual, sobre otra raíz (lo usan las pruebas)
//   node scripts/informe.mjs --minimo <n>        umbral de tareas propio (entero ≥ 1)
//   node scripts/informe.mjs --json              imprime el JSON (y escribe igual el Markdown)
//
// No abre features/, STATUS.md, .env*, ni git. No corre registrar.mjs.

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validarEvento } from "./registrar.mjs";

export const UMBRAL_TAREAS = 10;
export const UMBRAL_CORTE = 5;
const Z = 1.96;
const MENSAJE_FALTA = "falta registro/eventos.jsonl; corre antes `node scripts/registrar.mjs`";
const OPCIONES_CONOCIDAS = ["--raiz", "--minimo", "--json"];

const round1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const media = (valores) => (valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null);

function mediana(valores) {
  if (valores.length === 0) return null;
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Intervalo de Wilson al 95 % (z = 1.96), en porcentaje con 1 decimal.
export function wilson(k, n) {
  const p = k / n;
  const z2 = Z * Z;
  const denom = 1 + z2 / n;
  const centro = (p + z2 / (2 * n)) / denom;
  const margen = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { bajo: round1((centro - margen) * 100), alto: round1((centro + margen) * 100) };
}

function proporcion(k, n) {
  if (n === 0) return null;
  return { k, n, pct: round1((k / n) * 100), wilson: wilson(k, n) };
}

function contar(valores) {
  const mapa = new Map();
  for (const v of valores) mapa.set(v, (mapa.get(v) ?? 0) + 1);
  return Object.fromEntries([...mapa.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const minT = (actual, t) => (actual === null || t < actual ? t : actual);
const horas = (desde, hasta) => (Date.parse(hasta) - Date.parse(desde)) / 3600000;
const clave = (e) => `${e.feature}/${e.tarea}`;

// Lee el texto del log: cada línea se parsea y se valida; la inválida se descarta y se cuenta (sin imprimirla).
export function leerEventos(texto) {
  const eventos = [];
  let lineasNoValidas = 0;
  for (const linea of texto.split("\n")) {
    if (linea.trim() === "") continue;
    let evento;
    try {
      evento = JSON.parse(linea);
    } catch {
      lineasNoValidas++;
      continue;
    }
    if (validarEvento(evento).length > 0) {
      lineasNoValidas++;
      continue;
    }
    eventos.push(evento);
  }
  return { eventos, lineasNoValidas };
}

// Mayor n de una tarea (desempate: el más reciente).
function ejecucionDeMayorN(tarea) {
  return tarea.ejecuciones.reduce((a, b) => (b.n > a.n || (b.n === a.n && b.t > a.t) ? b : a));
}

export function calcularInforme(eventos, { minimo = UMBRAL_TAREAS, lineasNoValidas = 0 } = {}) {
  const porTarea = new Map();
  const porFeature = new Map();
  const tarea = (k) => {
    if (!porTarea.has(k)) porTarea.set(k, { ejecuciones: [], aprobadaT: null, hechaT: null, devoluciones: 0 });
    return porTarea.get(k);
  };
  const feature = (f) => {
    if (!porFeature.has(f)) porFeature.set(f, { enCursoT: null, hechaT: null });
    return porFeature.get(f);
  };

  let eventosHasta = null;
  let ejecuciones = 0;
  for (const e of eventos) {
    if (eventosHasta === null || e.t > eventosHasta) eventosHasta = e.t;
    if (e.evento === "tarea_estado") {
      const t = tarea(clave(e));
      if (e.a === "aprobada") t.aprobadaT = minT(t.aprobadaT, e.t);
      if (e.a === "hecha") t.hechaT = minT(t.hechaT, e.t);
    } else if (e.evento === "puerta") {
      if (e.n === 4 && e.resultado === "devuelta") tarea(clave(e)).devoluciones++;
    } else if (e.evento === "feature_estado") {
      const f = feature(e.feature);
      if (e.a === "en curso") f.enCursoT = minT(f.enCursoT, e.t);
      if (e.a === "hecha") f.hechaT = minT(f.hechaT, e.t);
    } else if (e.evento === "ejecucion") {
      ejecuciones++;
      tarea(clave(e)).ejecuciones.push(e);
    }
  }

  const conEjec = [...porTarea.values()].filter((t) => t.ejecuciones.length > 0);
  const tareas = conEjec.length;
  const suficiente = tareas >= minimo;
  const base = { eventosHasta, lineasNoValidas, tareas, ejecuciones, suficiente, minimo };
  if (!suficiente) {
    return { ...base, entrega: null, calidad: null, fiabilidad: null, ritmo: null, cortes: null };
  }

  // Entrega: tareas con tarea_estado a=hecha.
  const hechas = [...porTarea.values()].filter((t) => t.hechaT !== null);
  const sinDevolucion = hechas.filter((t) => t.devoluciones === 0).length;
  const entrega = {
    n: hechas.length,
    sinDevolucion: proporcion(sinDevolucion, hechas.length),
    devolucionesMedia: round1(media(hechas.map((t) => t.devoluciones))),
  };

  // Calidad: huecos de la ejecución de mayor n de cada tarea.
  const huecos = conEjec.map((t) => ejecucionDeMayorN(t).huecos);
  const calidad = {
    n: huecos.length,
    media: round1(media(huecos)),
    mediana: round1(mediana(huecos)),
    maximo: huecos.length ? Math.max(...huecos) : null,
  };

  // Fiabilidad: todas las ejecuciones.
  const todas = conEjec.flatMap((t) => t.ejecuciones);
  const fiabilidad = {
    n: todas.length,
    intentosMedia: round1(media(todas.map((e) => e.intentos))),
    pasa: proporcion(todas.filter((e) => e.verificacion === "pasa").length, todas.length),
    bloqueadasPorCausa: contar(todas.filter((e) => e.resultado === "bloqueada").map((e) => e.causa)),
    escaladasPorCausa: contar(todas.filter((e) => e.resultado === "escalada").map((e) => e.causa)),
  };

  // Ritmo: medianas en horas de aprobada a hecha (tarea) y de en curso a hecha (feature).
  const duracionesTarea = [...porTarea.values()]
    .filter((t) => t.aprobadaT !== null && t.hechaT !== null && t.hechaT >= t.aprobadaT)
    .map((t) => horas(t.aprobadaT, t.hechaT));
  const duracionesFeature = [...porFeature.values()]
    .filter((f) => f.enCursoT !== null && f.hechaT !== null && f.hechaT >= f.enCursoT)
    .map((f) => horas(f.enCursoT, f.hechaT));
  const ritmo = {
    tareas: { n: duracionesTarea.length, medianaHoras: round1(mediana(duracionesTarea)) },
    features: { n: duracionesFeature.length, medianaHoras: round1(mediana(duracionesFeature)) },
  };

  // Cortes por modelo, herramienta y modo, sobre la ejecución de mayor n de cada tarea.
  const cortes = {};
  for (const dimension of ["modelo", "herramienta", "modo"]) {
    const grupos = new Map();
    for (const t of conEjec) {
      const e = ejecucionDeMayorN(t);
      if (!grupos.has(e[dimension])) grupos.set(e[dimension], []);
      grupos.get(e[dimension]).push(e);
    }
    cortes[dimension] = [...grupos.keys()].sort().map((valor) => {
      const es = grupos.get(valor);
      const n = es.length;
      if (n < UMBRAL_CORTE) return { valor, n, insuficiente: true };
      return {
        valor,
        n,
        insuficiente: false,
        huecosMedia: round1(media(es.map((e) => e.huecos))),
        pasa: proporcion(es.filter((e) => e.verificacion === "pasa").length, n),
      };
    });
  }

  return { ...base, entrega, calidad, fiabilidad, ritmo, cortes };
}

const fmtNum = (x) => (x === null || x === undefined ? "sin datos" : x.toFixed(1));
const fmtPct = (p) => (p === null ? "sin datos" : `${p.pct.toFixed(1)}% [${p.wilson.bajo.toFixed(1)}–${p.wilson.alto.toFixed(1)}]`);
const fmtLista = (obj) => {
  const partes = Object.entries(obj).map(([causa, n]) => `${causa} ${n}`);
  return partes.length ? partes.join(", ") : "ninguna";
};

const LIMITES = [
  "- El ritmo es el reloj de los commits de Franco, no tiempo de trabajo; en yolo todo cae en un mismo commit.",
  "- `modelo` es el configurado al correr `registrar.mjs`, no necesariamente el que respondió.",
  "- Los huecos juzgan al `planificador` (calidad de la tarea), no al `constructor`.",
  "- No mide motivos de devolución ni las puertas 1 y 2.",
  "- Con n pequeño los intervalos son anchos; decidir si bastan es cosa de Franco.",
];

// Markdown del informe. Sin títulos de feature ni de tarea: solo Fxx y NN, y nunca el contenido de una línea descartada.
export function formatearMarkdown(informe) {
  const L = [];
  if (!informe.suficiente) {
    L.push(`DATOS INSUFICIENTES: n=${informe.tareas} de ${informe.minimo}; no se calculan porcentajes ni medianas`, "");
  }
  L.push("# Informe de resultados del flujo");
  L.push(`eventos hasta ${informe.eventosHasta ?? "sin eventos válidos"}`, "");
  L.push(`Tareas con ejecución: ${informe.tareas} · ejecuciones: ${informe.ejecuciones} · líneas no válidas: ${informe.lineasNoValidas}`, "");

  if (informe.suficiente) {
    const { entrega, calidad, fiabilidad, ritmo, cortes } = informe;
    L.push("## Entrega", "| Medida | Valor | n |", "|---|---|---|");
    L.push(`| Hechas sin devolución en la puerta 4 | ${fmtPct(entrega.sinDevolucion)} | ${entrega.n} |`);
    L.push(`| Devoluciones por tarea (media) | ${fmtNum(entrega.devolucionesMedia)} | ${entrega.n} |`, "");

    L.push("## Calidad", "| Medida | Valor | n |", "|---|---|---|");
    L.push(`| Huecos por tarea (media) | ${fmtNum(calidad.media)} | ${calidad.n} |`);
    L.push(`| Huecos por tarea (mediana) | ${fmtNum(calidad.mediana)} | ${calidad.n} |`);
    L.push(`| Huecos por tarea (máximo) | ${calidad.maximo ?? "sin datos"} | ${calidad.n} |`, "");

    L.push("## Fiabilidad", "| Medida | Valor | n |", "|---|---|---|");
    L.push(`| Intentos por ejecución (media) | ${fmtNum(fiabilidad.intentosMedia)} | ${fiabilidad.n} |`);
    L.push(`| Verificación pasa | ${fmtPct(fiabilidad.pasa)} | ${fiabilidad.n} |`, "");
    L.push(`Bloqueadas por causa: ${fmtLista(fiabilidad.bloqueadasPorCausa)}.`);
    L.push(`Escaladas por causa: ${fmtLista(fiabilidad.escaladasPorCausa)}.`, "");

    L.push("## Ritmo", "| Medida | Valor | n |", "|---|---|---|");
    const h = (x) => (x === null ? "sin datos" : `${x.toFixed(1)} h`);
    L.push(`| Tarea: aprobada a hecha (mediana) | ${h(ritmo.tareas.medianaHoras)} | ${ritmo.tareas.n} |`);
    L.push(`| Feature: en curso a hecha (mediana) | ${h(ritmo.features.medianaHoras)} | ${ritmo.features.n} |`, "");

    L.push("## Cortes", "| Corte | Tareas | Huecos (media) | Verificación pasa |", "|---|---|---|---|");
    for (const dimension of ["modelo", "herramienta", "modo"]) {
      for (const c of cortes[dimension]) {
        const etiqueta = `${dimension} ${c.valor}`;
        if (c.insuficiente) L.push(`| ${etiqueta} | ${c.n} | n insuficiente | n insuficiente |`);
        else L.push(`| ${etiqueta} | ${c.n} | ${fmtNum(c.huecosMedia)} | ${fmtPct(c.pasa)} |`);
      }
    }
    L.push("");
  }

  L.push("## Límites de esta lectura", ...LIMITES, "");
  return L.join("\n");
}

// JSON con las claves acordadas (sin el umbral, que es parámetro de la corrida).
export function informeJson(informe) {
  const { eventosHasta, lineasNoValidas, tareas, ejecuciones, suficiente, entrega, calidad, fiabilidad, ritmo, cortes } =
    informe;
  const salida = { eventosHasta, lineasNoValidas, tareas, ejecuciones, suficiente, entrega, calidad, fiabilidad, ritmo, cortes };
  return `${JSON.stringify(salida, null, 2)}\n`;
}

// Lee los argumentos. Cualquier cosa desconocida, repetida o inválida es error (sin tocar nada).
export function leerArgumentos(args) {
  const opciones = { raiz: null, minimo: UMBRAL_TAREAS, json: false };
  const vistas = new Set();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!OPCIONES_CONOCIDAS.includes(a)) return { error: `argumento desconocido '${a}'` };
    if (vistas.has(a)) return { error: `opción repetida '${a}'` };
    vistas.add(a);
    if (a === "--json") {
      opciones.json = true;
      continue;
    }
    const valor = args[i + 1];
    if (valor === undefined || valor.startsWith("--")) return { error: `falta el valor de ${a}` };
    i++;
    if (a === "--raiz") {
      opciones.raiz = resolve(valor);
    } else {
      if (!/^\d+$/.test(valor) || Number(valor) < 1) return { error: "--minimo exige un entero ≥ 1" };
      opciones.minimo = Number(valor);
    }
  }
  if (opciones.raiz === null) opciones.raiz = process.cwd();
  return { opciones };
}

// Ejecuta la CLI y devuelve el código de salida.
function ejecutarCli(args) {
  const { error, opciones } = leerArgumentos(args);
  if (error) {
    process.stderr.write(`error: ${error}\n`);
    return 1;
  }
  const ruta = join(opciones.raiz, "registro", "eventos.jsonl");
  if (!existsSync(ruta) || !statSync(ruta).isFile()) {
    process.stderr.write(`error: ${MENSAJE_FALTA}\n`);
    return 1;
  }
  const { eventos, lineasNoValidas } = leerEventos(readFileSync(ruta, "utf8"));
  const informe = calcularInforme(eventos, { minimo: opciones.minimo, lineasNoValidas });
  const markdown = formatearMarkdown(informe);
  writeFileSync(join(opciones.raiz, "registro", "informe.md"), markdown);
  process.stdout.write(opciones.json ? informeJson(informe) : markdown);
  return 0;
}

const RUTA_ESTE = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE) {
  process.exitCode = ejecutarCli(process.argv.slice(2));
}
