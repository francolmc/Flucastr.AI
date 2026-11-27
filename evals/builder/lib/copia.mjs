// Copia desechable de un tramo (A2, D-03, D-04). Extrae cada repo con `git archive` en el estado
// previo al tramo, superpone archivos de tramos previos y del oráculo tomados de la referencia,
// quita `changes/<cambio>` y secretos, y deja un commit sintético en `main` con la rama
// `feature/bench`. No usa `git worktree` ni copia la historia de los repos fuente.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSyncSeguro } from "../../../tools/spawn/sync-seguro.mjs";

// Rutas de prueba: carpetas de tests, sufijos .spec/.test/.e2e-spec y prefijos test_/test-.
const PATRONES_PRUEBA = [
  /(^|\/)(tests?|e2e|verification|verificacion|pruebas|__tests__)\//,
  /\.(spec|test|e2e-spec)\.[^/]+$/,
  /(^|\/)test[_-]/,
];

// Archivos de contrato del kit (A15, D-35): el del builder y el de execute-plan, en la raíz del kit.
export const CONTRATO_RUTAS = ["core/agents/builder.md", "core/skills/execute-plan/SKILL.md"];

// Lista { ruta, origen } de los archivos de contrato que existen en `dir`.
export function contratoDe(dir) {
  return CONTRATO_RUTAS.filter((ruta) => existsSync(join(dir, ruta))).map((ruta) => ({ ruta, origen: join(dir, ruta) }));
}

function git(cwd, args, { binario = false } = {}) {
  const r = spawnSyncSeguro("git", args, { cwd, encoding: binario ? "buffer" : "utf8", maxBuffer: 512 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`git ${args[0]} falló en ${cwd}: ${String(r.stderr).trim()}`);
  return r.stdout;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function fechaDeCommit({ fuente, commit }) {
  return git(fuente, ["show", "-s", "--format=%cI", commit]).trim();
}

// Último commit de la raíz (rama actual) con fecha anterior a `fecha`: base del repo raíz.
export function ultimoAntesDe({ fuente, fecha }) {
  const hash = git(fuente, ["rev-list", "-1", `--before=${fecha}`, "HEAD"]).trim();
  if (!hash) throw new Error(`no hay commit en ${fuente} antes de ${fecha}`);
  return hash;
}

// Archivos de prueba añadidos o modificados base..referencia, sin .md ni los de `excluir`.
export function seleccionarOraculo({ fuente, base, referencia, excluir = [] }) {
  return git(fuente, ["diff", "-z", "--name-only", "--diff-filter=AM", base, referencia])
    .split("\0")
    .filter(Boolean)
    .filter((ruta) => !ruta.endsWith(".md") && !excluir.includes(ruta) && PATRONES_PRUEBA.some((p) => p.test(ruta)));
}

function extraer(fuente, commit, dir) {
  const tmp = mkdtempSync(join(tmpdir(), "copia-"));
  try {
    const tar = join(tmp, "base.tar");
    git(fuente, ["archive", "--format=tar", "-o", tar, commit]);
    const r = spawnSyncSeguro("tar", ["-xf", tar, "-C", dir]);
    if (r.status !== 0) throw new Error(`tar falló: ${String(r.stderr).trim()}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function esSecreto(nombre) {
  if (nombre === ".env.example") return false;
  return /^\.env(\.|$)/.test(nombre) || /\.(pem|key)$/.test(nombre);
}

function quitarSecretos(dir, rel, omitidas) {
  for (const entrada of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const ruta = rel ? `${rel}/${entrada.name}` : entrada.name;
    if (entrada.name === ".git" || omitidas.includes(ruta)) continue;
    if (entrada.isDirectory()) quitarSecretos(dir, ruta, omitidas);
    else if (entrada.isFile() && esSecreto(entrada.name)) rmSync(join(dir, ruta));
  }
}

function limpiar(dir, cambio, omitidas) {
  if (cambio) {
    rmSync(join(dir, "changes", cambio), { recursive: true, force: true });
    rmSync(join(dir, "changes", "done", cambio), { recursive: true, force: true });
  }
  quitarSecretos(dir, "", omitidas);
}

// repos: [{ fuente, commit, subcarpeta? }]; el repo raíz (sin subcarpeta) va primero.
// superposicion: [{ fuente, rev, ruta, subcarpeta?, oraculo? }]; devuelve hashes de los de oráculo.
// contrato: [{ ruta, origen }] de CONTRATO_RUTAS; se escribe en la raíz solo si el archivo existe en la
// base, antes del commit sintético (A15), así que el árbol queda limpio.
export function prepararCopia({ destino, cambio, repos, superposicion = [], contrato = [] }) {
  if (existsSync(destino)) throw new Error(`el destino ya existe: ${destino}`);
  try {
    mkdirSync(destino, { recursive: true });
    const dirs = repos.map((r) => ({ ...r, dir: r.subcarpeta ? join(destino, r.subcarpeta) : destino }));
    const raiz = dirs.find((r) => !r.subcarpeta);
    if (!raiz) throw new Error("falta el repo raíz");
    const subcarpetas = dirs.filter((r) => r.subcarpeta).map((r) => r.subcarpeta);
    for (const r of dirs) {
      mkdirSync(r.dir, { recursive: true });
      git(r.dir, ["init", "-b", "main", "--quiet"]);
    }
    for (const nombre of subcarpetas) appendFileSync(join(raiz.dir, ".git", "info", "exclude"), `\n/${nombre}/\n`);
    for (const r of dirs) extraer(r.fuente, r.commit, r.dir);

    const oraculo = [];
    for (const s of superposicion) {
      if (s.ruta.startsWith("/") || s.ruta.split("/").includes("..")) throw new Error(`ruta fuera del repo: ${s.ruta}`);
      const dir = s.subcarpeta ? join(destino, s.subcarpeta) : destino;
      const bytes = git(s.fuente, ["show", `${s.rev}:${s.ruta}`], { binario: true });
      const ruta = join(dir, s.ruta);
      mkdirSync(dirname(ruta), { recursive: true });
      writeFileSync(ruta, bytes);
      if (s.oraculo) oraculo.push({ ruta: s.ruta, subcarpeta: s.subcarpeta ?? "", sha256: sha256(bytes) });
    }

    for (const c of contrato) {
      if (!CONTRATO_RUTAS.includes(c.ruta)) throw new Error(`contrato fuera de la lista: ${c.ruta}`);
      const ruta = join(raiz.dir, c.ruta);
      if (existsSync(ruta)) writeFileSync(ruta, readFileSync(c.origen));
    }

    const commits = [];
    for (const r of dirs) {
      limpiar(r.dir, cambio, r.subcarpeta ? [] : subcarpetas);
      git(r.dir, ["add", "-A"]);
      git(r.dir, ["config", "user.name", "banco-builder"]);
      git(r.dir, ["config", "user.email", "banco-builder@local.invalid"]);
      git(r.dir, ["commit", "--no-verify", "--quiet", "--allow-empty", "-m", "base sintética del tramo"]);
      git(r.dir, ["branch", "feature/bench"]);
      git(r.dir, ["switch", "--quiet", "feature/bench"]);
      commits.push({ subcarpeta: r.subcarpeta ?? "", hash: git(r.dir, ["rev-parse", "HEAD"]).trim() });
    }
    return { destino, commits, oraculo };
  } catch (error) {
    rmSync(destino, { recursive: true, force: true });
    throw error;
  }
}
