// Cambios de un repo git frente a una base (solo lectura): archivos tocados en la rama, sin confirmar y sin seguimiento.
// Solo ejecuta git rev-parse, merge-base, diff, status y show, sin shell (execFileSync). Nunca escribe.
// Las rutas devueltas son absolutas; el llamador las pasa a relativas del proyecto.

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

const MAX_SALIDA = 64 * 1024 * 1024;

function git(carpeta, args) {
  // --no-optional-locks: git status no reescribe el índice; la lectura queda sin efectos.
  return execFileSync("git", ["--no-optional-locks", "-C", carpeta, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: MAX_SALIDA,
  });
}

function existe(carpeta, rev) {
  try {
    git(carpeta, ["rev-parse", "--verify", "--quiet", `${rev}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

// Primera base de la lista que existe como commit en el repo, o null.
export function primeraBase(carpeta, candidatos) {
  return candidatos.find(c => c && existe(carpeta, c)) ?? null;
}

// Lee la versión de un archivo en un commit, o null si no existe allí.
export function versionEnBase(carpeta, rev, rutaEnRepo) {
  try {
    return git(carpeta, ["show", `${rev}:${rutaEnRepo}`]);
  } catch {
    return null;
  }
}

// Rutas de `git status --porcelain -z -uall`: cada entrada es «XY ruta»; en renombres la siguiente entrada es el origen.
function rutasDeEstado(salida) {
  const entradas = salida.split("\0");
  const rutas = [];
  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    if (e.length < 4) continue;
    const xy = e.slice(0, 2);
    rutas.push(e.slice(3));
    if (/[RC]/.test(xy)) rutas.push(entradas[++i]);
  }
  return rutas.filter(Boolean);
}

// Archivos sin seguimiento de `git status --porcelain -z`: entradas «?? ruta».
function sinSeguimientoDe(salida) {
  return salida
    .split("\0")
    .filter(e => e.startsWith("?? "))
    .map(e => e.slice(3));
}

// Líneas añadidas y borradas de cada archivo seguido frente al merge-base (confirmado, sin confirmar
// y en el índice). Rutas relativas a la raíz del repo; `añadidas` y `borradas` son null en binarios.
export function lineasDelRepo(carpeta, mergeBase) {
  const salida = git(carpeta, ["diff", "--numstat", "--no-renames", "-z", mergeBase]);
  return salida
    .split("\0")
    .filter(Boolean)
    .map(entrada => {
      const [a, d, ...ruta] = entrada.split("\t");
      const binario = a === "-";
      return { ruta: ruta.join("\t"), añadidas: binario ? null : Number(a), borradas: binario ? null : Number(d) };
    });
}

// Líneas de un archivo sin seguimiento, o null si no es un archivo regular dentro del repo o es binario.
// Nunca sigue enlaces: lstat del propio archivo y realpath de la ruta deben coincidir con la ruta del repo.
export function lineasSinSeguimiento(top, rutaRel) {
  try {
    const abs = join(top, rutaRel);
    if (!lstatSync(abs).isFile()) return null;
    if (realpathSync(abs) !== join(realpathSync(top), ...rutaRel.split("/"))) return null;
    const buf = readFileSync(abs);
    if (buf.includes(0)) return null;
    const texto = buf.toString("utf8");
    if (texto === "") return 0;
    return texto.split("\n").length - (texto.endsWith("\n") ? 1 : 0);
  } catch {
    return null;
  }
}

// Cambios del repo que contiene `carpeta` frente a `base`. Devuelve { error } o
// { top, mergeBase, base, absolutas, sinSeguimiento }: unión sin duplicados de la diferencia con el merge-base,
// los cambios sin confirmar y los archivos sin seguimiento; `sinSeguimiento` son esas rutas relativas a `top`.
export function cambiosDelRepo(carpeta, base) {
  let top;
  try {
    top = git(carpeta, ["rev-parse", "--show-toplevel"]).trim();
  } catch {
    return { error: "sin git: la carpeta no es un repositorio" };
  }
  if (!existe(carpeta, base)) return { error: `base inexistente: ${base}` };
  let mergeBase;
  try {
    mergeBase = git(carpeta, ["merge-base", base, "HEAD"]).trim();
  } catch {
    return { error: `sin ancestro común con ${base}` };
  }
  try {
    const enRama = git(carpeta, ["diff", "--name-only", "-z", mergeBase, "HEAD"]).split("\0");
    const sinConfirmar = git(carpeta, ["diff", "--name-only", "-z"]).split("\0");
    const salidaEstado = git(carpeta, ["status", "--porcelain", "-z", "-uall"]);
    const estado = rutasDeEstado(salidaEstado);
    const sinSeguimiento = sinSeguimientoDe(salidaEstado).filter(Boolean);
    const unidas = new Set([...enRama, ...sinConfirmar, ...estado].filter(Boolean));
    return { top, mergeBase, base, absolutas: [...unidas].map(r => join(top, r)), sinSeguimiento };
  } catch (err) {
    return { error: `git no pudo leer los cambios: ${err.message.split("\n")[0]}` };
  }
}
