// Escaneo estático (A10 a A12): cada llamada síncrona de hijo (spawnSync, execFileSync, execSync)
// en tools/, scripts/, core/, tests/ y adapters/ debe dejar stdin fuera de pipe. Con stdin pipe,
// Codex workspace-write devuelve EPERM (ver changes/fix-verify-sandbox-eperm/exploracion.md).
// Aceptado: stdio ["ignore"|"inherit"|<fd numérico>, ...], o stdio "ignore"/"inherit".
// Las opciones pueden ser un literal o una variable `const|let|var X = {...}` del mismo archivo
// (también como `...X` dentro de otro literal). Excepción visible: una llamada cruda a la que
// su línea o la anterior menciona `estatico: control-crudo` (el control de tests/spawn-seguro/run.mjs).
// Ignora comentarios y el contenido de cadenas y regex. Limitación: no analiza código dentro de
// `${...}` de plantillas. Sale 0 si pasan todas y hay al menos una llamada; 1 si falla alguna o no
// hay ninguna; 2 si el uso es incorrecto.
// Uso: node tests/spawn-seguro/estatico.mjs [--fixture-mala | --vacio]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CARPETAS = ["tools", "scripts", "core", "tests", "adapters"];
const EXTENSIONES = [".mjs", ".js", ".cjs"];
const OMITIDAS = new Set(["node_modules", ".git"]);
// El helper decide el stdio dentro de prepararStdio (A1 a A3); su llamada cruda es la que envuelve.
const EXENTAS = new Set(["tools/spawn/sync-seguro.mjs"]);
const MARCA_CONTROL = "estatico: control-crudo";
const LLAMADA = /\b(spawnSync|execFileSync|execSync)\s*\(/g;
const DECLARACION = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
const IDENTIFICADOR = /^[A-Za-z_$][\w$]*$/;
const STDIN_OK = /^(["'`])(ignore|inherit)\1$/;
const FIXTURE_MALA = [
  '// Comentario: spawnSync("bash", ["-c", "x"]) no cuenta, está en un comentario.',
  'const r = spawnSync("bash", ["-c", "x"], { encoding: "utf8" });',
  "",
].join("\n");

// Dos copias de src con la misma longitud (los índices coinciden): sinComent quita comentarios;
// sinCad quita también el contenido de cadenas y regex, para localizar llamadas sin confundirse.
function enmascarar(src) {
  const a = src.split("");
  const b = src.split("");
  const n = src.length;
  const blanco = (arr, ini, fin) => {
    for (let k = ini; k < fin; k++) if (arr[k] !== "\n") arr[k] = " ";
  };
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      let fin = src.indexOf("\n", i);
      if (fin < 0) fin = n;
      blanco(a, i, fin);
      blanco(b, i, fin);
      i = fin;
      continue;
    }
    if (c === "/" && d === "*") {
      const cierre = src.indexOf("*/", i + 2);
      const fin = cierre < 0 ? n : cierre + 2;
      blanco(a, i, fin);
      blanco(b, i, fin);
      i = fin;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") j++;
        j++;
      }
      const fin = Math.min(j + 1, n);
      blanco(b, i + 1, fin - 1);
      i = fin;
      continue;
    }
    if (c === "/" && /(?:^|[(,=:[!&|?{};+\-*%<>~^]|\b(?:return|typeof))\s*$/.test(src.slice(Math.max(0, i - 24), i))) {
      let j = i + 1;
      let clase = false;
      while (j < n && src[j] !== "\n") {
        const ch = src[j];
        if (ch === "\\") {
          j += 2;
          continue;
        }
        if (ch === "[") clase = true;
        else if (ch === "]") clase = false;
        else if (ch === "/" && !clase) break;
        j++;
      }
      blanco(b, i + 1, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return { sinComent: a.join(""), sinCad: b.join("") };
}

// Índice del delimitador que cierra el que está en abre (sobre la copia sinCad).
function cierreDe(b, abre) {
  let prof = 0;
  for (let k = abre; k < b.length; k++) {
    const ch = b[k];
    if ("([{".includes(ch)) prof++;
    else if (")]}".includes(ch)) {
      prof--;
      if (prof === 0) return k;
    }
  }
  return -1;
}

// Rangos [inicio, fin) de los elementos separados por comas de primer nivel, sin los vacíos.
function partes(b, ini, fin) {
  const rangos = [];
  let prof = 0;
  let desde = ini;
  for (let k = ini; k < fin; k++) {
    const ch = b[k];
    if ("([{".includes(ch)) prof++;
    else if (")]}".includes(ch)) prof--;
    else if (ch === "," && prof === 0) {
      rangos.push([desde, k]);
      desde = k + 1;
    }
  }
  rangos.push([desde, fin]);
  return rangos.filter(([i, f]) => b.slice(i, f).trim() !== "");
}

// Declaraciones `const|let|var NOMBRE = {` del archivo, para resolver opciones guardadas en variables.
function declaraciones(b) {
  const lista = [];
  for (const m of b.matchAll(DECLARACION)) {
    const abre = m.index + m[0].length - 1;
    lista.push({ nombre: m[1], pos: m.index, abre, cierre: cierreDe(b, abre) });
  }
  return lista;
}

// Declaración con ese nombre vigente en pos (la última anterior a pos).
function resolver(decl, nombre, pos) {
  let hallada = null;
  for (const d of decl) if (d.nombre === nombre && d.pos < pos) hallada = d;
  return hallada;
}

// Lee un objeto literal: stdio (rango o "sin-valor"), input, y si tiene spreads no resueltos.
function leerObjeto(a, b, abre, cierre, decl, pos, nivel = 0) {
  const txt = ([i, f]) => a.slice(i, f).trim();
  const est = { stdio: null, input: false, espacio: false };
  if (nivel > 5 || cierre < 0) {
    est.espacio = true;
    return est;
  }
  for (const r of partes(b, abre + 1, cierre)) {
    const e = txt(r);
    if (e.startsWith("...")) {
      const nombre = e.slice(3).trim();
      const d = IDENTIFICADOR.test(nombre) ? resolver(decl, nombre, pos) : null;
      if (!d) {
        est.espacio = true;
        continue;
      }
      const sub = leerObjeto(a, b, d.abre, d.cierre, decl, d.pos, nivel + 1);
      if (sub.stdio !== null) est.stdio = sub.stdio;
      est.input = est.input || sub.input;
      est.espacio = est.espacio || sub.espacio;
      continue;
    }
    const dos = a.indexOf(":", r[0]);
    const conDos = dos >= 0 && dos < r[1];
    const clave = (conDos ? a.slice(r[0], dos) : e).trim().replace(/^["'`]|["'`]$/g, "");
    if (clave === "stdio") est.stdio = conDos ? [dos + 1, r[1]] : "sin-valor";
    if (clave === "input") est.input = true;
  }
  return est;
}

// Devuelve null si la llamada deja stdin fuera de pipe; si no, el motivo.
function analizar(nombre, a, b, abre, cierre, decl) {
  const txt = ([i, f]) => a.slice(i, f).trim();
  const args = partes(b, abre + 1, cierre);
  let opciones = null;
  if (nombre === "execSync") {
    if (args.length >= 2) opciones = args[1];
  } else if (args.length >= 3) {
    opciones = args[2];
  } else if (args.length === 2 && !txt(args[1]).startsWith("[")) {
    opciones = args[1];
  }
  if (!opciones) return `${nombre} sin opciones: stdin queda como pipe por defecto`;
  const o = txt(opciones);
  let obj = null;
  if (o.startsWith("{")) {
    const abreObj = b.indexOf("{", opciones[0]);
    obj = { abre: abreObj, cierre: cierreDe(b, abreObj), pos: abre };
  } else if (IDENTIFICADOR.test(o)) {
    const d = resolver(decl, o, abre);
    if (d) obj = { abre: d.abre, cierre: d.cierre, pos: d.pos };
  }
  if (!obj) return `${nombre} con opciones no literales («${o}»)`;
  const est = leerObjeto(a, b, obj.abre, obj.cierre, decl, obj.pos);
  if (est.stdio === null) {
    if (est.espacio) return `${nombre} con ...spread no resuelto: no se puede comprobar stdin`;
    return est.input ? `${nombre} con input y sin stdio: stdin como pipe` : `${nombre} sin stdio: stdin queda como pipe por defecto`;
  }
  if (est.stdio === "sin-valor") return `${nombre} con stdio sin valor literal`;
  const v = txt(est.stdio);
  if (STDIN_OK.test(v)) return null;
  if (v.startsWith("[")) {
    const abreArr = b.indexOf("[", est.stdio[0]);
    const primero = partes(b, abreArr + 1, cierreDe(b, abreArr))[0];
    const p = primero ? txt(primero) : "";
    if (STDIN_OK.test(p) || /^\d+$/.test(p)) return null;
    return `${nombre} con stdin «${p || "vacío"}» (se espera ignore, inherit o fd numérico)`;
  }
  return `${nombre} con stdio no literal («${v}»)`;
}

function archivos(dir, salida = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (OMITIDAS.has(ent.name)) continue;
    const ruta = join(dir, ent.name);
    if (ent.isDirectory()) archivos(ruta, salida);
    else if (ent.isFile() && EXTENSIONES.some((ext) => ent.name.endsWith(ext))) salida.push(ruta);
  }
  return salida;
}

function escanear(raiz, carpetas) {
  const r = { llamadas: 0, exentas: 0, archivos: 0, malas: [] };
  for (const carpeta of carpetas) {
    const dir = join(raiz, carpeta);
    if (!existsSync(dir)) continue;
    for (const ruta of archivos(dir)) {
      const rel = relative(raiz, ruta).split(sep).join("/");
      const src = readFileSync(ruta, "utf8");
      const lineas = src.split("\n");
      const { sinComent, sinCad } = enmascarar(src);
      const decl = declaraciones(sinCad);
      r.archivos++;
      for (const m of sinCad.matchAll(LLAMADA)) {
        const linea = (src.slice(0, m.index).match(/\n/g) || []).length + 1;
        const abre = m.index + m[0].length - 1;
        const cierre = cierreDe(sinCad, abre);
        r.llamadas++;
        if (cierre < 0) {
          r.malas.push({ archivo: rel, linea, motivo: `${m[1]} con paréntesis sin cerrar` });
          continue;
        }
        const control = [lineas[linea - 1], lineas[linea - 2]].some((t) => t && t.includes(MARCA_CONTROL));
        if (EXENTAS.has(rel) || control) {
          r.exentas++;
          continue;
        }
        const motivo = analizar(m[1], sinComent, sinCad, abre, cierre, decl);
        if (motivo) r.malas.push({ archivo: rel, linea, motivo });
      }
    }
  }
  return r;
}

function principal(argv) {
  const validos = ["--fixture-mala", "--vacio"];
  if (argv.length > 1 || (argv.length === 1 && !validos.includes(argv[0]))) {
    console.error("uso: node tests/spawn-seguro/estatico.mjs [--fixture-mala | --vacio]");
    return 2;
  }
  let raiz = RAIZ;
  let carpetas = CARPETAS;
  let temporal = null;
  if (argv.length === 1) {
    temporal = mkdtempSync(join(tmpdir(), "estatico-"));
    raiz = temporal;
    carpetas = ["tools"];
    if (argv[0] === "--fixture-mala") {
      mkdirSync(join(temporal, "tools"));
      writeFileSync(join(temporal, "tools", "llamada-mala.mjs"), FIXTURE_MALA);
    }
  }
  try {
    const r = escanear(raiz, carpetas);
    if (r.llamadas === 0) {
      console.error("estatico: FALLO no se descubrió ninguna llamada síncrona; un escaneo sin llamadas no prueba nada");
      return 1;
    }
    if (r.malas.length > 0) {
      for (const m of r.malas) console.error(`${m.archivo}:${m.linea}: ${m.motivo}`);
      console.error(`estatico: FALLO ${r.malas.length} llamada(s) con stdin que puede ser pipe`);
      return 1;
    }
    console.log(`estatico: OK ${r.llamadas} llamadas en ${r.archivos} archivos (${r.exentas} exentas: helper o control marcado)`);
    return 0;
  } finally {
    if (temporal) rmSync(temporal, { recursive: true, force: true });
  }
}

process.exitCode = principal(process.argv.slice(2));
