#!/usr/bin/env node
// Registro de eventos del flujo (definitions/REGISTRO.md). Único escritor de registro/eventos.jsonl.
//
// Uso:
//   node scripts/registrar.mjs                    anexa los eventos nuevos (raíz: el directorio actual)
//   node scripts/registrar.mjs --raiz <dir>       igual, sobre otra raíz (lo usan las pruebas)
//   node scripts/registrar.mjs --reconstruir      regenera el archivo entero, ordenado por t e id
//
// Lee solo lo que está en commits: git log y git show sobre features/, definitions/BACKLOG.md y
// definitions/STATUS.md. Los cambios sin commit no generan eventos. Escribe solo dentro de registro/.
//
// Privacidad por construcción: el escritor emite solo las claves del ESQUEMA y valida cada valor contra
// su patrón o su lista. No hay campo de texto libre. Ningún dato de autor, de mensaje de commit ni de
// nombre de rama entra en un evento.
//
// tarea_estado.por es inferido de `a` según la regla de cada rol (no se mide):
// aprobada y hecha = franco; en curso, lista para revisión y bloqueada = constructor; borrador = planificador.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ESTADOS_TAREA = ["borrador", "aprobada", "en curso", "lista para revisión", "hecha", "bloqueada"];
export const ESTADOS_FEATURE = ["pendiente", "en curso", "hecha"];
const POR = ["franco", "constructor", "planificador"];
const POR_DE_ESTADO = {
  borrador: "planificador",
  aprobada: "franco",
  "en curso": "constructor",
  "lista para revisión": "constructor",
  hecha: "franco",
  bloqueada: "constructor",
};
const FUENTES = ["git", "notas", "status"];
const CLAVES_COMUNES = ["v", "id", "t", "fuente", "evento"];
const RE_ID = /^[0-9a-f]{12}$/;
const RE_T = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const RE_FEATURE = /^F\d{2}$/;
const RE_NUMERO = /^\d{2}$/;
const RE_SHA = /^[0-9a-f]{7}$/;
const RE_ESTADO = /^repo: .*estado: (.+?)\s*$/m;
const RE_FILA = /^\| F\d{2} \|/;
const RE_CARPETA = /^F\d{2}-/;
const RE_ARCHIVO_TAREA = /^task-(\d{2})-.+\.md$/;
const LIMITE_AVISO_BYTES = 1048576;

// Esquema cerrado: por evento, la fuente, las claves obligatorias y los campos propios con su validador.
// Para sumar un evento (task-02 agrega `ejecucion`) basta con una entrada nueva.
export const ESQUEMA = {
  tarea_estado: {
    fuente: "git",
    requeridos: ["feature", "tarea", "sha"],
    campos: {
      de: { valores: ESTADOS_TAREA, nulo: true },
      a: { valores: ESTADOS_TAREA },
      por: { valores: POR },
    },
  },
  puerta: {
    fuente: "git",
    requeridos: ["feature", "tarea", "sha"],
    campos: {
      n: { tipo: "entero", valores: [3, 4] },
      resultado: { valores: ["aprobada", "devuelta"] },
      por: { valores: ["franco"] },
    },
  },
  feature_estado: {
    fuente: "git",
    requeridos: ["feature", "sha"],
    campos: {
      de: { valores: ESTADOS_FEATURE, nulo: true },
      a: { valores: ESTADOS_FEATURE },
    },
  },
  feature_archivada: {
    fuente: "git",
    requeridos: ["feature", "sha"],
    campos: {},
  },
  escalacion: {
    fuente: "status",
    requeridos: ["sha"],
    campos: {},
  },
};

function validarCampo(nombre, valor, spec) {
  if (valor === null) return spec.nulo ? [] : [`${nombre} no puede ser nulo`];
  const entero = spec.tipo !== "entero" || Number.isInteger(valor);
  return entero && spec.valores.includes(valor) ? [] : [`${nombre} fuera de la lista o del tipo`];
}

// Devuelve un arreglo de errores en español; vacío = válido.
export function validarEvento(evento) {
  if (evento === null || typeof evento !== "object" || Array.isArray(evento)) {
    return ["el evento no es un objeto"];
  }
  const errores = [];
  const def = Object.hasOwn(ESQUEMA, evento.evento) ? ESQUEMA[evento.evento] : null;
  if (!def) errores.push(`evento desconocido: ${String(evento.evento)}`);

  const permitidas = new Set([...CLAVES_COMUNES, ...(def ? [...def.requeridos, ...Object.keys(def.campos)] : [])]);
  for (const clave of Object.keys(evento)) {
    if (!permitidas.has(clave)) errores.push(`clave no permitida: ${clave}`);
  }
  for (const clave of CLAVES_COMUNES) {
    if (!(clave in evento)) errores.push(`falta la clave ${clave}`);
  }

  if (evento.v !== 1) errores.push("v debe ser 1");
  if (typeof evento.id !== "string" || !RE_ID.test(evento.id)) errores.push("id fuera de patrón");
  if (typeof evento.t !== "string" || !RE_T.test(evento.t) || Number.isNaN(Date.parse(evento.t))) {
    errores.push("t no es una fecha ISO válida");
  }
  if (!FUENTES.includes(evento.fuente)) {
    errores.push("fuente fuera de la lista");
  } else if (def && evento.fuente !== def.fuente) {
    errores.push(`fuente debe ser ${def.fuente}`);
  }
  if ("feature" in evento && !(typeof evento.feature === "string" && RE_FEATURE.test(evento.feature))) {
    errores.push("feature fuera de patrón");
  }
  if ("tarea" in evento && !(typeof evento.tarea === "string" && RE_NUMERO.test(evento.tarea))) {
    errores.push("tarea fuera de patrón");
  }
  if ("sha" in evento && !(typeof evento.sha === "string" && RE_SHA.test(evento.sha))) {
    errores.push("sha fuera de patrón");
  }

  if (def) {
    for (const clave of def.requeridos) {
      if (!(clave in evento)) errores.push(`falta la clave ${clave}`);
    }
    for (const [nombre, spec] of Object.entries(def.campos)) {
      if (!(nombre in evento)) {
        errores.push(`falta la clave ${nombre}`);
        continue;
      }
      errores.push(...validarCampo(nombre, evento[nombre], spec));
    }
  }
  return errores;
}

function errorCodigo(codigo, mensaje) {
  const e = new Error(mensaje);
  e.codigo = codigo;
  return e;
}

// Ejecuta git sin shell, dentro de la raíz. Devuelve { ok, salida }.
function git(raiz, args) {
  const r = spawnSync("git", ["-c", "core.quotepath=off", ...args], {
    cwd: raiz,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  return { ok: r.status === 0, salida: r.stdout ?? "" };
}

function comprobarRepositorio(raiz) {
  if (!git(raiz, ["rev-parse", "--git-dir"]).ok) {
    throw errorCodigo("no-repo", "no es un repositorio git");
  }
  const top = git(raiz, ["rev-parse", "--show-toplevel"]);
  if (!top.ok || realpathSync(top.salida.trim()) !== realpathSync(resolve(raiz))) {
    throw errorCodigo("no-raiz", "no es la raíz del repositorio git");
  }
}

// Bloques de `git log --format=%x01%H%x09%ct`: [{ sha, epoch, lineas }], en el orden de git.
function registros(salida) {
  return salida.split("\x01").slice(1).map((bloque) => {
    const lineas = bloque.split("\n");
    const [sha, epoch] = lineas[0].split("\t");
    return { sha, epoch: Number(epoch), lineas: lineas.slice(1).filter((l) => l.length > 0) };
  });
}

const iso = (epoch) => new Date(epoch * 1000).toISOString().slice(0, 19) + "Z";
const corto = (sha) => sha.slice(0, 7);

function celdas(linea) {
  return linea.split("|").slice(1, -1).map((c) => c.trim());
}

function estadoDe(texto) {
  return RE_ESTADO.exec(texto)?.[1]?.trim() ?? "";
}

// Cuerpo de la sección «## Escalación» (hasta el siguiente «## »); "" si no existe.
function seccionEscalacion(texto) {
  const lineas = texto.replace(/\r\n?/g, "\n").split("\n");
  const i = lineas.findIndex((l) => /^## Escalación\s*$/.test(l));
  if (i < 0) return "";
  const cuerpo = [];
  for (let j = i + 1; j < lineas.length && !lineas[j].startsWith("## "); j++) cuerpo.push(lineas[j]);
  return cuerpo.join("\n");
}

// Tareas presentes hoy en el árbol de trabajo: features/Fxx-*/task-NN-*.md y features/completed/Fxx-*/...
function listarTareas(raiz) {
  const tareas = [];
  for (const base of ["features", "features/completed"]) {
    const dirBase = join(raiz, ...base.split("/"));
    if (!existsSync(dirBase)) continue;
    for (const carpeta of readdirSync(dirBase).sort()) {
      if (!RE_CARPETA.test(carpeta) || !statSync(join(dirBase, carpeta)).isDirectory()) continue;
      for (const archivo of readdirSync(join(dirBase, carpeta)).sort()) {
        const m = RE_ARCHIVO_TAREA.exec(archivo);
        if (!m) continue;
        tareas.push({ ruta: `${base}/${carpeta}/${archivo}`, feature: carpeta.slice(0, 3), tarea: m[1] });
      }
    }
  }
  return tareas;
}

const POR_ID_PARTES = ["fuente", "feature", "tarea", "sha", "evento", "clave"];

function claveDe(evento, propios) {
  if (evento === "tarea_estado" || evento === "feature_estado") {
    return `${propios.de ?? "null"}>${propios.a}`;
  }
  if (evento === "puerta") return `${propios.n}|${propios.resultado}`;
  return "";
}

// Construye un evento con las claves en orden fijo: v, id, t, fuente, evento, feature, tarea, sha, propias.
function construir(evento, t, sha, { feature, tarea } = {}, propios = {}) {
  const fuente = ESQUEMA[evento].fuente;
  const partes = { fuente, feature: feature ?? "", tarea: tarea ?? "", sha, evento, clave: claveDe(evento, propios) };
  const id = createHash("sha1")
    .update(POR_ID_PARTES.map((p) => partes[p]).join("|"))
    .digest("hex")
    .slice(0, 12);
  const e = { v: 1, id, t, fuente, evento };
  if (feature !== undefined) e.feature = feature;
  if (tarea !== undefined) e.tarea = tarea;
  e.sha = sha;
  return Object.assign(e, propios);
}

// Derivado de tarea_estado: qué puerta del flujo cruzó la transición.
function puertaDe(de, a) {
  if (de === "borrador" && a === "aprobada") return { n: 3, resultado: "aprobada" };
  if (de === "lista para revisión" && a === "hecha") return { n: 4, resultado: "aprobada" };
  if (de === "lista para revisión" && (a === "aprobada" || a === "en curso")) {
    return { n: 4, resultado: "devuelta" };
  }
  return null;
}

// Extrae todos los eventos desde git. Devuelve { eventos (ordenados por t e id), descartados }.
export function extraer(raiz) {
  comprobarRepositorio(raiz);
  const crudos = [];
  let descartados = 0;

  // tarea_estado y puerta: historial de cada tarea presente hoy (sigue renombres con --follow).
  for (const tarea of listarTareas(raiz)) {
    // Sin --reverse: con --follow, git 2.54 corta el historial de un renombre si se pide --reverse.
    // El orden cronológico se invierte aquí.
    const log = git(raiz, ["log", "--follow", "--name-only", "--format=%x01%H%x09%ct", "--", tarea.ruta]);
    let previo = null;
    for (const reg of registros(log.salida).reverse()) {
      const rutaEseCommit = reg.lineas[0];
      if (!rutaEseCommit) continue;
      const show = git(raiz, ["show", `${reg.sha}:${rutaEseCommit}`]);
      if (!show.ok) continue;
      const estado = estadoDe(show.salida);
      if (!ESTADOS_TAREA.includes(estado)) {
        descartados++;
        continue;
      }
      if (estado === previo) continue;
      const t = iso(reg.epoch);
      const sha = corto(reg.sha);
      const ubicacion = { feature: tarea.feature, tarea: tarea.tarea };
      crudos.push(construir("tarea_estado", t, sha, ubicacion, { de: previo, a: estado, por: POR_DE_ESTADO[estado] }));
      const p = previo === null ? null : puertaDe(previo, estado);
      if (p) crudos.push(construir("puerta", t, sha, ubicacion, { n: p.n, resultado: p.resultado, por: "franco" }));
      previo = estado;
    }
  }

  // feature_estado: historial de la columna Estado de las filas «| Fxx |» de BACKLOG.md.
  const anterior = new Map();
  const logBacklog = git(raiz, ["log", "--reverse", "--name-only", "--format=%x01%H%x09%ct", "--", "definitions/BACKLOG.md"]);
  for (const reg of registros(logBacklog.salida)) {
    const show = git(raiz, ["show", `${reg.sha}:definitions/BACKLOG.md`]);
    if (!show.ok) continue;
    const t = iso(reg.epoch);
    const sha = corto(reg.sha);
    for (const linea of show.salida.replace(/\r\n?/g, "\n").split("\n")) {
      if (!RE_FILA.test(linea)) continue;
      const c = celdas(linea);
      if (c.length < 7) continue;
      const feature = c[0];
      const estado = c[6];
      if (!ESTADOS_FEATURE.includes(estado)) {
        descartados++;
        continue;
      }
      if (anterior.get(feature) === estado) continue;
      crudos.push(construir("feature_estado", t, sha, { feature }, { de: anterior.get(feature) ?? null, a: estado }));
      anterior.set(feature, estado);
    }
  }

  // feature_archivada: renombres features/Fxx-* -> features/completed/Fxx-*, un evento por (feature, commit).
  const renombres = git(raiz, ["log", "--reverse", "-M", "--diff-filter=R", "--name-status", "--format=%x01%H%x09%ct"]);
  const archivadasVistas = new Set();
  for (const reg of registros(renombres.salida)) {
    for (const linea of reg.lineas) {
      const [estado, antes, despues] = linea.split("\t");
      if (!estado || !estado.startsWith("R")) continue;
      const origen = /^features\/(F\d{2})-/.exec(antes ?? "");
      const destino = /^features\/completed\/(F\d{2})-/.exec(despues ?? "");
      if (!origen || !destino || origen[1] !== destino[1]) continue;
      const clave = `${origen[1]}|${reg.sha}`;
      if (archivadasVistas.has(clave)) continue;
      archivadasVistas.add(clave);
      crudos.push(construir("feature_archivada", iso(reg.epoch), corto(reg.sha), { feature: origen[1] }, {}));
    }
  }

  // escalacion: la sección «## Escalación» pasa de vacía (o no existe) a con texto.
  const logStatus = git(raiz, ["log", "--reverse", "--format=%x01%H%x09%ct", "--", "definitions/STATUS.md"]);
  let previaVacia = true;
  for (const reg of registros(logStatus.salida)) {
    const show = git(raiz, ["show", `${reg.sha}:definitions/STATUS.md`]);
    const vacia = seccionEscalacion(show.ok ? show.salida : "").trim() === "";
    if (!vacia && previaVacia) crudos.push(construir("escalacion", iso(reg.epoch), corto(reg.sha), {}, {}));
    previaVacia = vacia;
  }

  // Validación final y deduplicado por id (un renombre no duplica: el id no incluye la ruta).
  const eventos = [];
  const ids = new Set();
  for (const e of crudos) {
    if (validarEvento(e).length > 0) {
      descartados++;
      continue;
    }
    if (ids.has(e.id)) continue;
    ids.add(e.id);
    eventos.push(e);
  }
  eventos.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { eventos, descartados };
}

const serializar = (e) => JSON.stringify(e) + "\n";

// Ids y cantidad de eventos ya presentes; las líneas que no son JSON se cuentan aparte y no se tocan.
function idsPresentes(texto) {
  const ids = new Set();
  let total = 0;
  for (const linea of texto.split("\n")) {
    if (linea === "") continue;
    try {
      const o = JSON.parse(linea);
      if (o && typeof o.id === "string") {
        ids.add(o.id);
        total++;
      }
    } catch {
      // línea que no es JSON: se deja intacta
    }
  }
  return { ids, total };
}

// Escribe registro/eventos.jsonl bajo la raíz. Modo normal: anexa solo los id nuevos.
// reconstruir: regenera el archivo entero (temporal y renombre).
export function registrar({ raiz, reconstruir = false }) {
  const { eventos, descartados } = extraer(raiz);
  const dir = join(raiz, "registro");
  const ruta = join(dir, "eventos.jsonl");
  mkdirSync(dir, { recursive: true });
  const gitignore = join(dir, ".gitignore");
  if (!existsSync(gitignore)) writeFileSync(gitignore, "*\n");

  const existente = existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
  const presentes = idsPresentes(existente);
  const nuevos = eventos.filter((e) => !presentes.ids.has(e.id));

  if (reconstruir) {
    const contenido = eventos.map(serializar).join("");
    writeFileSync(`${ruta}.tmp`, contenido);
    renameSync(`${ruta}.tmp`, ruta);
    return { nuevos: nuevos.length, total: eventos.length, descartados, bytes: Buffer.byteLength(contenido) };
  }

  if (nuevos.length === 0) {
    return { nuevos: 0, total: presentes.total, descartados, bytes: Buffer.byteLength(existente) };
  }
  const separador = existente !== "" && !existente.endsWith("\n") ? "\n" : "";
  appendFileSync(ruta, separador + nuevos.map(serializar).join(""));
  return {
    nuevos: nuevos.length,
    total: presentes.total + nuevos.length,
    descartados,
    bytes: statSync(ruta).size,
  };
}

const RUTA_ESTE = fileURLToPath(import.meta.url);
const USO = "uso: node scripts/registrar.mjs [--raiz <dir>] [--reconstruir]";

function leerArgumentos(args) {
  const opciones = { raiz: null, raizTexto: null, reconstruir: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--raiz") {
      const valor = args[i + 1];
      if (valor === undefined || valor.startsWith("--")) return { error: "falta el valor de --raiz" };
      opciones.raiz = resolve(valor);
      opciones.raizTexto = valor;
      i++;
    } else if (a === "--reconstruir") {
      opciones.reconstruir = true;
    } else {
      return { error: `opción desconocida '${a}'` };
    }
  }
  return { opciones };
}

if (process.argv[1] && resolve(process.argv[1]) === RUTA_ESTE) {
  const { error, opciones } = leerArgumentos(process.argv.slice(2));
  if (error) {
    console.error(`error: ${error}`);
    console.error(USO);
    process.exit(1);
  }
  const raiz = opciones.raiz ?? process.cwd();
  // Se muestra la raíz tal como se escribió (nunca una ruta absoluta).
  const mostrada = opciones.raizTexto ?? ".";
  try {
    const r = registrar({ raiz, reconstruir: opciones.reconstruir });
    console.log(`registrar: ${r.nuevos} eventos nuevos; ${r.total} en total; ${r.descartados} descartados`);
    if (r.bytes > LIMITE_AVISO_BYTES) {
      console.log(`AVISO: registro/eventos.jsonl pesa ${Math.round(r.bytes / 1024)} KB (más de 1024 KB)`);
    }
    process.exit(0);
  } catch (e) {
    if (e.codigo === "no-repo") console.error(`error: ${mostrada} no es un repositorio git`);
    else if (e.codigo === "no-raiz") console.error(`error: ${mostrada} no es la raíz del repositorio git`);
    else console.error(`error: ${e.code ?? "fallo inesperado"}`);
    process.exit(1);
  }
}
