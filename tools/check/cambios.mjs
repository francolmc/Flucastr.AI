// Cambios de un repo git frente a una base (solo lectura): archivos tocados en la rama, sin confirmar y sin seguimiento.
// Solo ejecuta git rev-parse, merge-base, diff, status y show, sin shell (execFileSync). Nunca escribe.
// Las rutas devueltas son absolutas; el llamador las pasa a relativas del proyecto.

import { execFileSync } from "node:child_process";
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

// Cambios del repo que contiene `carpeta` frente a `base`. Devuelve { error } o
// { top, mergeBase, base, absolutas }: unión sin duplicados de la diferencia con el merge-base,
// los cambios sin confirmar y los archivos sin seguimiento.
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
    const estado = rutasDeEstado(git(carpeta, ["status", "--porcelain", "-z", "-uall"]));
    const unidas = new Set([...enRama, ...sinConfirmar, ...estado].filter(Boolean));
    return { top, mergeBase, base, absolutas: [...unidas].map(r => join(top, r)) };
  } catch (err) {
    return { error: `git no pudo leer los cambios: ${err.message.split("\n")[0]}` };
  }
}
