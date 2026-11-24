#!/usr/bin/env node
// Contrasta los cambios git de la rama con el Scope del plan antes de la revisión. Solo lectura; no usa modelo.
// Uso: node scripts/kit-scope.mjs <plan> [--base <rama>] [--json] [--help]
//   --base <rama>  base de comparación (por defecto: base: del plan → origin/HEAD → main → master)
//   --json         salida JSON (mismo contenido que la tabla)
//   --help         imprime este uso y sale con 0
// Tabla en stdout: nivel | elemento | detalle. Códigos de salida:
//   0  sin errores ni «no verificable» (los avisos no cuentan)
//   1  hay errores (fuera de Scope, excluida, prohibida o plan alterado)
//   3  no verificable: base inexistente, sin git, Scope sin rutas o sin versión previa del plan
//   2  uso o plan inexistente (no ejecuta nada)

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { cambiosDelRepo, primeraBase, versionEnBase } from "../tools/check/cambios.mjs";
import { clasificarRuta, coincide, parsearAlcance, protegido } from "../tools/check/alcance.mjs";
import { crearInforme, tabla } from "../tools/check/informe.mjs";

const USO = "Uso: node scripts/kit-scope.mjs <plan> [--base <rama>] [--json] [--help]\n";

function uso(msg) {
  process.stderr.write(`kit-scope: ${msg}\n${USO}`);
  process.exit(2);
}

function leerArgs(argv) {
  const opts = { plan: null, base: null, json: false, ayuda: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.ayuda = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--base") {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith("--")) uso("--base necesita un valor");
      opts.base = argv[++i];
    } else if (a.startsWith("--")) uso(`opción desconocida: ${a}`);
    else {
      if (opts.plan !== null) uso(`un solo plan; sobra «${a}»`);
      opts.plan = a;
    }
  }
  return opts;
}

// Campos simples de la cabecera YAML (`clave: valor`).
function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const campos = {};
  for (const linea of m[1].split("\n")) {
    const k = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (k) campos[k[1]] = k[2].trim();
  }
  return campos;
}

// `repos: [.]` o `repos: [apps/web, api]`.
function lista(valor) {
  return valor.replace(/^\[|\]$/g, "").split(",").map(s => s.trim()).filter(Boolean);
}

// Tramos tramo-N.md junto al plan; el parser toma solo los N ≤ segmento.
function tramosDe(dir) {
  return readdirSync(dir)
    .map(f => f.match(/^tramo-(\d+)\.md$/))
    .filter(Boolean)
    .map(m => ({ n: Number(m[1]), texto: readFileSync(resolve(dir, m[0]), "utf8") }));
}

function aRelativa(raizProyecto, absoluta) {
  return relative(raizProyecto, absoluta).split(sep).join("/");
}

export function analizar({ planAbs, raizProyecto, baseOpcion }) {
  const filas = [];
  const texto = readFileSync(planAbs, "utf8");
  const campos = frontmatter(texto);
  const nombre = basename(dirname(planAbs));
  const planRel = aRelativa(raizProyecto, planAbs);
  const segmento = campos.segment !== undefined && /^\d+$/.test(campos.segment) ? Number(campos.segment) : undefined;

  const alcance = parsearAlcance(texto, { segmento, tramos: tramosDe(dirname(planAbs)) });
  if (alcance.estado !== "ok") {
    filas.push({ nivel: "no_verificable", elemento: planRel, mensaje: `Scope: ${alcance.motivo}` });
    return crearInforme(filas);
  }

  const repos = lista(campos.repos ?? "[.]");
  const cambiosPorRepo = [];
  for (const r of repos) {
    const carpeta = resolve(raizProyecto, r);
    const candidatos = baseOpcion ? [baseOpcion] : [campos.base, "origin/HEAD", "main", "master"];
    const base = primeraBase(carpeta, candidatos.filter(Boolean)) ?? candidatos.filter(Boolean)[0] ?? "main";
    const res = cambiosDelRepo(carpeta, base);
    if (res.error) filas.push({ nivel: "no_verificable", elemento: r, mensaje: res.error });
    else cambiosPorRepo.push(res);
  }
  if (cambiosPorRepo.length === 0) return crearInforme(filas);

  const cambiados = new Set(cambiosPorRepo.flatMap(r => r.absolutas.map(a => aRelativa(raizProyecto, a))));
  const permitido = ruta => ruta.startsWith(`changes/${nombre}/`);

  // El propio plan: Scope y criterios A# no pueden cambiar respecto de la base.
  if (cambiados.has(planRel)) {
    const repo = cambiosPorRepo.find(r => planAbs.startsWith(r.top + sep));
    const previa = repo ? versionEnBase(repo.top, repo.mergeBase, relative(repo.top, planAbs).split(sep).join("/")) : null;
    if (previa === null) filas.push({ nivel: "no_verificable", elemento: planRel, mensaje: "plan sin versión previa en la base" });
    else if (protegido(previa) !== protegido(texto)) filas.push({ nivel: "error", elemento: planRel, mensaje: "prohibido: plan (Scope o criterios A# cambiados)" });
  }

  const rutas = [...cambiados].filter(r => r !== planRel && !permitido(r)).sort();
  for (const ruta of rutas) {
    const clase = clasificarRuta(ruta, alcance);
    if (clase === "dentro") filas.push({ nivel: "ok", elemento: ruta, mensaje: "dentro de Scope" });
    else if (clase === "prohibida") filas.push({ nivel: "error", elemento: ruta, mensaje: "prohibido: secreto o lockfile no autorizado" });
    else if (clase === "excluida") filas.push({ nivel: "error", elemento: ruta, mensaje: "fuera de Scope (excluida)" });
    else filas.push({ nivel: "error", elemento: ruta, mensaje: "fuera de Scope" });
  }

  // Omisiones: rutas exactas sin tocar son aviso; globs y carpetas solo si ninguna ruta las toca.
  const vistas = new Set();
  for (const inc of alcance.incluidas) {
    if (vistas.has(inc.ruta)) continue;
    vistas.add(inc.ruta);
    const exacta = !inc.ruta.includes("*") && !inc.ruta.endsWith("/");
    const tocada = exacta ? cambiados.has(inc.ruta) : [...cambiados].some(c => coincide(inc.ruta, c));
    if (!tocada) filas.push({ nivel: "aviso", elemento: inc.ruta, mensaje: "posible omisión: no se tocó" });
  }

  return crearInforme(filas);
}

function principal(argv) {
  const opts = leerArgs(argv);
  if (opts.ayuda) {
    process.stdout.write(USO);
    return 0;
  }
  if (opts.plan === null) uso("falta el plan");
  const raizProyecto = process.cwd();
  const planAbs = resolve(raizProyecto, opts.plan);
  if (!existsSync(planAbs) || !statSync(planAbs).isFile()) uso(`no existe el plan: ${opts.plan}`);

  const informe = analizar({ planAbs, raizProyecto, baseOpcion: opts.base });
  if (opts.json) process.stdout.write(JSON.stringify(informe, null, 2) + "\n");
  else process.stdout.write(tabla(informe) + "\n");
  return informe.codigo;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = principal(process.argv.slice(2));
}
