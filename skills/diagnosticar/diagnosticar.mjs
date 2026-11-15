#!/usr/bin/env node
// diagnosticar: compara un proyecto con el contrato de verificación (nucleo/contrato/verificacion.md).
// Solo lee: no escribe archivos ni ejecuta los comandos declarados. Sale siempre con código 0.
// Uso: node diagnosticar.mjs [carpeta] [--json]

import { existsSync, readFileSync, readdirSync, statSync, realpathSync, accessSync, constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { builtinModules } from "node:module";
import { join, resolve, relative, sep } from "node:path";
import { homedir } from "node:os";

const CAPACIDADES = [
  { id: "Rápida", clave: "comprobacion rapida" },
  { id: "Servicio", clave: "servicio" },
  { id: "Aceptación", clave: "aceptacion" },
  { id: "Evidencia", clave: "evidencia" },
];
const NIVELES = ["rapida", "servicio", "aceptacion"];
const FALLOS = ["ninguno", "entorno", "dependencia", "prueba", "tiempo"];
const CARPETAS_ACEPTACION = ["aceptacion", "acceptance", "e2e"];
const SALTAR = new Set(["node_modules", "dist", "build", "coverage"]);
const MAX_LISTA = 20;

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Valor de una línea «Clave: valor», con o sin guion, negrita o espacios. null si no es esa línea.
function valorDeLinea(linea, clave) {
  const limpia = linea.replace(/\*\*/g, "").replace(/^\s*[-*+]\s+/, "").trimStart();
  const i = limpia.indexOf(":");
  if (i < 0) return null;
  if (norm(limpia.slice(0, i)).trim() !== clave) return null;
  return limpia.slice(i + 1).trim();
}

function spans(valor) {
  return [...valor.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
}

// Recorre la carpeta sin seguir enlaces ni entrar en carpetas ocultas o de dependencias.
function recorrer(dir, base, saltar, visita) {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    if (e.name.startsWith(".") || saltar.has(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta, base, saltar, visita);
    else if (e.isFile()) visita(ruta, relative(base, ruta));
  }
}

// Huella del contrato: { git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12.
// null si la carpeta no es la raíz de un repo o git no responde.
function huellaActual(carpeta) {
  try {
    const opts = { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 * 1024 * 1024 };
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: "0" };
    const top = execFileSync("git", ["-C", carpeta, "rev-parse", "--show-toplevel"], opts).toString().trim();
    if (realpathSync(top) !== realpathSync(carpeta)) return null;
    const st = execFileSync("git", ["-C", carpeta, "status", "--porcelain"], { ...opts, env });
    let df = Buffer.alloc(0);
    try {
      df = execFileSync("git", ["-C", carpeta, "diff", "HEAD"], { ...opts, env });
    } catch {
      // sin HEAD (repo recién creado): la huella usa solo el estado
    }
    return createHash("sha256").update(Buffer.concat([st, df])).digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

function validarResultado(obj) {
  const motivos = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return ["no es un objeto JSON"];
  if (typeof obj.huella !== "string" || !/^[0-9a-f]{12}$/.test(obj.huella)) motivos.push("huella debe ser 12 hex en minúsculas");
  if (!NIVELES.includes(obj.nivel)) motivos.push(`nivel "${obj.nivel}" no es rapida|servicio|aceptacion`);
  if (typeof obj.fase !== "string") motivos.push("fase debe ser texto");
  if (typeof obj.ok !== "boolean") motivos.push("ok debe ser booleano");
  if (!FALLOS.includes(obj.fallo)) motivos.push(`fallo "${obj.fallo}" no es ninguno|entorno|dependencia|prueba|tiempo`);
  return motivos;
}

function leerResultado(carpeta, rutaRel) {
  const ruta = join(carpeta, rutaRel);
  const base = { tipo: "resultado", ruta: rutaRel };
  if (!existsSync(ruta)) return { ...base, estado: "no existe" };
  let obj;
  try {
    obj = JSON.parse(readFileSync(ruta, "utf8"));
  } catch (e) {
    return { ...base, estado: "invalido", motivos: [`no es JSON válido: ${e.message}`] };
  }
  const motivos = validarResultado(obj);
  if (motivos.length) return { ...base, estado: "invalido", motivos };
  const actual = huellaActual(carpeta);
  let huella;
  if (actual === null) huella = "no disponible";
  else huella = obj.huella === actual ? "vigente" : "obsoleta";
  return { ...base, estado: "valido", huella, huellaValor: obj.huella, nivel: obj.nivel, fase: obj.fase, ok: obj.ok, fallo: obj.fallo };
}

function aceptacion(carpeta) {
  const archivos = [];
  recorrer(carpeta, carpeta, SALTAR, (ruta, rel) => {
    const partes = rel.split(sep);
    const nombre = partes[partes.length - 1];
    const enCarpeta = partes.slice(0, -1).some((p) => CARPETAS_ACEPTACION.includes(norm(p)));
    if (/\.(test|spec)\./.test(nombre) || enCarpeta) archivos.push(rel.split(sep).join("/"));
  });
  archivos.sort();
  return { tipo: "aceptacion", archivos: archivos.length, lista: archivos.slice(0, MAX_LISTA), mas: Math.max(0, archivos.length - MAX_LISTA) };
}

function permisosClaude(carpeta, avisos) {
  const fuentes = [
    { alcance: "global", ruta: join(homedir(), ".claude", "settings.json") },
    { alcance: "proyecto", ruta: join(carpeta, ".claude", "settings.json") },
    { alcance: "proyecto-local", ruta: join(carpeta, ".claude", "settings.local.json") },
  ];
  let allowProyecto = false;
  for (const fuente of fuentes) {
    if (!existsSync(fuente.ruta)) continue;
    try {
      const config = JSON.parse(readFileSync(fuente.ruta, "utf8"));
      for (const regla of config?.permissions?.allow ?? []) {
        const texto = String(regla).trim();
        const patron = texto.match(/^Bash\((.*)\)$/i)?.[1] ?? texto;
        if (/^(?:\*|npm\s+\*|docker\s+\*|(?:bash|sh|zsh)\s+-c(?:\s+.*)?|node\s+-e(?:\s+.*)?|python(?:3)?\s+-c(?:\s+.*)?)$/i.test(patron.trim())) {
          avisos.push("allow amplio previo en " + fuente.ruta + ": " + regla);
          if (fuente.alcance.startsWith("proyecto")) allowProyecto = true;
        }
      }
    } catch (error) {
      avisos.push("no se pudo revisar configuración de Claude en " + fuente.ruta + ": " + error.message);
    }
  }
  const local = join(carpeta, ".claude", "settings.local.json");
  let hook = false;
  try {
    const config = JSON.parse(readFileSync(local, "utf8"));
    hook = (config?.hooks?.PreToolUse ?? []).some((entrada) =>
      (entrada?.hooks ?? []).some((h) => typeof h?.command === "string" && h.command.includes("permisos-hook.mjs") && h.command.includes(" decision --project ")),
    );
  } catch {
    // La ausencia del ajuste es un aviso, no un error del diagnóstico.
  }
  if (!hook) avisos.push("falta el hook de permisos de Claude en " + local);
  if (!hook && allowProyecto) avisos.push("hay allow amplias de proyecto sin el hook de permisos de Claude");
}

const FUENTES = [
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"\n]+)['"]/g,
  /\bimport\s*['"]([^'"\n]+)['"]/g,
  /\b(?:require|import)\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
];

// Receta Node/pnpm (nucleo/recetas/node-pnpm.md): lock presente e imports directos declarados.
function recetaNode(carpeta, avisos) {
  const pj = join(carpeta, "package.json");
  if (!existsSync(pj)) return { tipo: "receta", receta: "node-pnpm", aplica: false };
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pj, "utf8"));
  } catch (e) {
    avisos.push(`package.json no es JSON válido (${e.message}): la receta Node no corrió`);
    return { tipo: "receta", receta: "node-pnpm", aplica: true, reglas: [], error: "package.json inválido" };
  }
  const reglas = [];
  const npm = existsSync(join(carpeta, "package-lock.json"));
  const pnpm = existsSync(join(carpeta, "pnpm-lock.yaml"));
  if (npm && pnpm) reglas.push({ regla: "lock", estado: "revisar", detalle: "hay package-lock.json y pnpm-lock.yaml: deja uno solo" });
  else if (npm) reglas.push({ regla: "lock", estado: "ok", detalle: "package-lock.json: instalar con `npm ci`" });
  else if (pnpm) reglas.push({ regla: "lock", estado: "ok", detalle: "pnpm-lock.yaml: instalar con `pnpm install --frozen-lockfile`" });
  else reglas.push({ regla: "lock", estado: "revisar", detalle: "sin package-lock.json ni pnpm-lock.yaml: instalar sin lock puede resolver otras versiones" });

  const declaradas = new Set(
    ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((k) => Object.keys(pkg[k] || {})),
  );
  const propio = pkg.name;
  const builtin = new Set(builtinModules);
  const sinDeclarar = new Map();
  let revisados = 0;
  recorrer(carpeta, carpeta, SALTAR, (ruta, rel) => {
    if (!/\.[cm]?[jt]sx?$/.test(rel)) return;
    if (statSync(ruta).size > 512 * 1024) return;
    revisados++;
    const fuente = readFileSync(ruta, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const re of FUENTES) {
      for (const m of fuente.matchAll(re)) {
        const s = m[1];
        if (!s || s.startsWith(".") || s.startsWith("/") || s.startsWith("#") || s.startsWith("node:")) continue;
        const partes = s.split("/");
        if (builtin.has(s) || builtin.has(partes[0])) continue;
        const nombre = s.startsWith("@") ? partes.slice(0, 2).join("/") : partes[0];
        if (nombre === propio || declaradas.has(nombre)) continue;
        if (!sinDeclarar.has(nombre)) sinDeclarar.set(nombre, rel.split(sep).join("/"));
      }
    }
  });
  const lista = [...sinDeclarar].map(([n, f]) => `${n} (ej.: ${f})`);
  reglas.push({
    regla: "imports directos declarados",
    estado: lista.length ? "revisar" : "ok",
    detalle: lista.slice(0, MAX_LISTA),
    mas: Math.max(0, lista.length - MAX_LISTA),
    archivosRevisados: revisados,
    nota: "alias de ruta (p. ej. @/ o ~/) pueden dar falsos positivos",
  });
  return { tipo: "receta", receta: "node-pnpm", aplica: true, reglas };
}

function diagnosticar(carpeta) {
  const avisos = [];
  const agentesPath = join(carpeta, "AGENTS.md");
  const lineas = existsSync(agentesPath) ? readFileSync(agentesPath, "utf8").split(/\r?\n/) : null;
  if (!lineas) avisos.push("no hay AGENTS.md: no hay contrato que comparar");

  const capacidades = CAPACIDADES.map((c) => {
    let valor = null;
    for (const l of lineas || []) {
      valor = valorDeLinea(l, c.clave);
      if (valor !== null) break;
    }
    const comando = valor ? (spans(valor)[0] ?? valor) : "";
    const out = { tipo: "capacidad", capacidad: c.id, estado: comando ? "declarada" : "falta", comando: comando || null };
    if (c.id === "Evidencia") {
      const json = valor ? spans(valor).find((s) => s.endsWith(".json")) : null;
      out.ruta = json || "resultado.json";
    }
    return out;
  });

  const ev = capacidades.find((c) => c.capacidad === "Evidencia");
  const resultado = leerResultado(carpeta, ev.ruta);
  const acept = aceptacion(carpeta);
  const aceptDeclarada = capacidades.find((c) => c.capacidad === "Aceptación").estado === "declarada";
  if (aceptDeclarada && acept.archivos === 0) {
    avisos.push("Aceptación declarada pero no hay archivos de flujo (*.test.*, *.spec.* o carpetas aceptacion|acceptance|e2e)");
  }
  const verify = join(carpeta, "verify");
  if (!existsSync(verify)) {
    avisos.push("no hay ./verify: el contrato lo cubre todo; falta el comando de verificación");
  } else {
    try {
      accessSync(verify, constants.X_OK);
    } catch {
      avisos.push("./verify existe pero no es ejecutable");
    }
  }
  const receta = recetaNode(carpeta, avisos);
  permisosClaude(carpeta, avisos);
  return { carpeta, capacidades, resultado, aceptacion: acept, receta, avisos };
}

function lineasJson(d) {
  if (d.error) return [{ tipo: "error", error: d.error }];
  return [
    ...d.capacidades,
    d.resultado,
    d.aceptacion,
    d.receta,
    ...d.avisos.map((texto) => ({ tipo: "aviso", texto })),
  ];
}

function textoDe(d) {
  if (d.error) return `Diagnóstico no completado: ${d.error}`;
  const out = [`Diagnóstico de ${d.carpeta}`, "", "Capacidades del contrato:"];
  for (const c of d.capacidades) {
    const det = c.estado === "declarada" ? c.comando : "se cubre con ./verify";
    out.push(`  ${c.capacidad.padEnd(10)} ${c.estado.padEnd(10)} ${det}`);
  }
  const r = d.resultado;
  out.push("", "resultado.json:");
  if (r.estado === "no existe") out.push(`  no existe (ruta buscada: ${r.ruta})`);
  else if (r.estado === "invalido") out.push(`  inválido (${r.ruta}): ${r.motivos.join("; ")}`);
  else out.push(`  forma válida (${r.ruta}); huella ${r.huella}; nivel ${r.nivel}; ok ${r.ok}; fallo ${r.fallo}; fase: ${r.fase}`);
  const a = d.aceptacion;
  out.push("", `Aceptación: ${a.archivos} archivo(s) de flujo`);
  for (const f of a.lista) out.push(`  ${f}`);
  if (a.mas) out.push(`  y ${a.mas} más`);
  out.push("", "Receta Node/pnpm:");
  if (!d.receta.aplica) out.push("  no aplica (sin package.json)");
  for (const r2 of d.receta.reglas || []) {
    out.push(`  ${r2.regla}: ${r2.estado}`);
    const det = Array.isArray(r2.detalle) ? r2.detalle : [r2.detalle];
    for (const x of det) out.push(`    - ${x}`);
    if (r2.mas) out.push(`    - y ${r2.mas} más`);
    if (r2.nota) out.push(`    (${r2.nota}; archivos revisados: ${r2.archivosRevisados})`);
  }
  if (d.receta.error) out.push(`  ${d.receta.error}`);
  if (d.avisos.length) {
    out.push("", "Avisos:");
    for (const x of d.avisos) out.push(`  - ${x}`);
  }
  return out.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const posicional = args.filter((a) => !a.startsWith("--"));
  const carpeta = resolve(posicional[0] ?? ".");
  let d;
  try {
    if (!existsSync(carpeta) || !statSync(carpeta).isDirectory()) throw new Error(`no es una carpeta: ${carpeta}`);
    d = diagnosticar(carpeta);
  } catch (e) {
    d = { error: String((e && e.message) || e), carpeta };
  }
  if (json) {
    for (const obj of lineasJson(d)) process.stdout.write(JSON.stringify(obj) + "\n");
  } else {
    process.stdout.write(textoDe(d) + "\n");
  }
  process.exitCode = 0;
}

main();
