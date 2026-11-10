#!/usr/bin/env node
// Mide el revisor de kit run con defectos sembrados: gpt-6.1-sol (S) frente a gpt-6-luna (L1 y L2).
// Corre cada casos/<id>/ con el prompt y el esquema de scripts/kit-run.mjs (copiados, no importados).
// Coste de una corrida: último token_count con info de su rollout nuevo, a tarifas de scripts/tarifas.json.
//
// Uso:
//   node pruebas/revisor-luna/medir.mjs [--condicion S|L1|L2] [--tope-creditos <n>]
//   node pruebas/revisor-luna/medir.mjs --autoprueba
// Reanudable: salta lo ya escrito en resultados.jsonl (una línea por caso y condición).
// --autoprueba usa un codex falso al frente del PATH y un directorio temporal: no gasta ni toca resultados.jsonl.
// Código de salida: 0 bien; 1 autoprueba fallida; 2 uso.

import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..", "..");
const CASOS = join(AQUI, "casos");
const RESULTADOS = join(AQUI, "resultados.jsonl");
const TARIFAS = join(RAIZ, "scripts", "tarifas.json");
const CONDICIONES = {
  S: { modelo: "gpt-6.1-sol", esfuerzo: "low" },
  L1: { modelo: "gpt-6-luna", esfuerzo: "low" },
  L2: { modelo: "gpt-6-luna", esfuerzo: "medium" },
};
const TOPE_CORRIDA_MS = 15 * 60 * 1000; // igual que el revisor de kit-run
const DIFF_MAX = 60000; // igual que kit-run

// Clave de una corrida: caso, condición y si es una corrida de costo limpio (filas aparte, costo_limpio: true).
const claveHecho = (caso, condicion, limpio) => `${caso}|${condicion}|${limpio ? "limpio" : ""}`;

// Copiado de scripts/kit-run.mjs: mismo esquema de veredicto y mismo prompt del revisor.
const ESQUEMA_VEREDICTO = {
  type: "object",
  additionalProperties: false,
  required: ["veredicto", "defectos"],
  properties: {
    veredicto: { enum: ["APROBADO", "DEVUELTO", "PAUSA"] },
    defectos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["archivo", "linea", "criterio", "descripcion"],
        properties: {
          archivo: { type: "string" },
          linea: { type: "integer" },
          criterio: { type: "string" },
          descripcion: { type: "string" },
        },
      },
    },
  },
};

function promptRevisor(planRel, diff) {
  return [
    `Revisa el plan ${planRel} contra el diff que sigue. Solo lees; no escribes nada.`,
    "Devuelve SOLO un JSON que cumpla este esquema, sin texto alrededor:",
    JSON.stringify(ESQUEMA_VEREDICTO),
    "veredicto APROBADO si lo pedido en Aceptación está hecho; DEVUELTO con defectos (archivo, línea, criterio) si no; PAUSA si falta algo que no se puede decidir.",
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

function uso(mensaje) {
  console.error(`error: ${mensaje}`);
  console.error("uso: node pruebas/revisor-luna/medir.mjs [--condicion S|L1|L2] [--tope-creditos <n>] | --autoprueba");
  process.exit(2);
}

function leerArgs(argv) {
  const a = { condiciones: Object.keys(CONDICIONES), tope: 20, autoprueba: false, casos: null, limpio: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--autoprueba") a.autoprueba = true;
    else if (x === "--costo-limpio") a.limpio = true;
    else if (x === "--casos") {
      const v = argv[++i];
      if (!v) uso("--casos necesita ids separados por coma");
      a.casos = v.split(",").map((s) => s.trim()).filter(Boolean);
    }
    else if (x === "--condicion") {
      const v = argv[++i];
      if (!Object.hasOwn(CONDICIONES, v)) uso(`condición «${v}» no existe`);
      a.condiciones = [v];
    } else if (x === "--tope-creditos") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) uso("--tope-creditos necesita un número mayor que 0");
      a.tope = n;
    } else uso(`opción desconocida ${x}`);
  }
  return a;
}

// Valida la salida del revisor contra el esquema. Devuelve { ok, error, datos }.
function validarVeredicto(texto) {
  let datos;
  try {
    datos = JSON.parse(texto.trim());
  } catch {
    return { ok: false, error: "la salida no es JSON" };
  }
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return { ok: false, error: "no es un objeto" };
  if (Object.keys(datos).sort().join(",") !== "defectos,veredicto") return { ok: false, error: "claves inesperadas" };
  if (!["APROBADO", "DEVUELTO", "PAUSA"].includes(datos.veredicto)) return { ok: false, error: `veredicto inválido: ${datos.veredicto}` };
  if (!Array.isArray(datos.defectos)) return { ok: false, error: "defectos no es una lista" };
  const defectosOk = datos.defectos.every((d) => d && typeof d === "object" && typeof d.archivo === "string"
    && Number.isInteger(d.linea) && typeof d.criterio === "string" && typeof d.descripcion === "string");
  if (!defectosOk) return { ok: false, error: "un defecto no cumple el esquema" };
  if (datos.veredicto === "APROBADO" && datos.defectos.length > 0) return { ok: false, error: "APROBADO con defectos" };
  if (datos.veredicto === "DEVUELTO" && datos.defectos.length === 0) return { ok: false, error: "DEVUELTO sin defectos" };
  return { ok: true, datos };
}

// Acierto: el veredicto coincide con el oráculo y, en los sembrados, algún defecto contiene una palabra clave.
function evaluar(oracle, veredicto, defectos) {
  if (veredicto !== "APROBADO" && veredicto !== "DEVUELTO") return false;
  const sembrado = oracle.defecto === true;
  if ((veredicto === "DEVUELTO") !== sembrado) return false;
  if (!sembrado) return true;
  const texto = defectos.map((d) => `${d.archivo} ${d.criterio} ${d.descripcion}`).join(" ").toLowerCase();
  return oracle.palabras.some((p) => texto.includes(p.toLowerCase()));
}

// Todos los rollout-*.jsonl bajo <home>/sessions.
function listarRollouts(dir, salida = []) {
  if (!existsSync(dir)) return salida;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) listarRollouts(ruta, salida);
    else if (e.name.startsWith("rollout-") && e.name.endsWith(".jsonl")) salida.push(ruta);
  }
  return salida;
}

// Último token_count con info (total acumulado de la sesión) y modelo del turno. Las líneas rotas se saltan.
function leerRollout(ruta) {
  let total = null;
  let modelo = null;
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    if (!linea.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(linea);
    } catch {
      continue;
    }
    const p = obj && typeof obj.payload === "object" ? obj.payload : null;
    if (!p) continue;
    if (obj.type === "turn_context" && typeof p.model === "string") modelo = p.model;
    if (p.type === "token_count" && p.info && typeof p.info === "object" && p.info.total_token_usage) total = p.info.total_token_usage;
  }
  return { total, modelo };
}

// Créditos: entrada sin caché × entrada + caché leída × entrada en caché + salida × salida, por millón.
function creditosDe(tarifas, modelo, t) {
  const tar = tarifas[modelo];
  const cacheada = t.cached_input_tokens ?? 0;
  const salida = t.output_tokens ?? 0;
  const entrada = Math.max(0, (t.input_tokens ?? 0) - cacheada);
  const c = (entrada * tar.entrada + cacheada * tar.entrada_cache + salida * tar.salida) / 1e6;
  return Math.round(c * 10000) / 10000;
}

function cargarCasos() {
  return readdirSync(CASOS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .map((id) => {
      const dir = join(CASOS, id);
      return { id, dir, oracle: JSON.parse(readFileSync(join(dir, "oracle.json"), "utf8")) };
    });
}

function leerResultados(archivo) {
  if (!existsSync(archivo)) return [];
  return readFileSync(archivo, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

// Una corrida: codex exec en solo lectura con el prompt del caso; cuenta los créditos de los rollouts nuevos.
function correrCaso(caso, nombre, cond, tarifas, env, home, schemaPath) {
  const planRel = `pruebas/revisor-luna/casos/${caso.id}/plan.md`;
  const diff = readFileSync(join(caso.dir, "diff.patch"), "utf8").slice(0, DIFF_MAX);
  const antes = new Set(listarRollouts(join(home, "sessions")));
  const r = spawnSync("codex", [
    "exec", "--sandbox", "read-only", "-m", cond.modelo, "-c", `model_reasoning_effort="${cond.esfuerzo}"`,
    "-C", RAIZ, "--output-schema", schemaPath, "-",
  ], {
    cwd: RAIZ,
    input: promptRevisor(planRel, diff),
    encoding: "utf8",
    env,
    timeout: TOPE_CORRIDA_MS,
    maxBuffer: 256 * 1024 * 1024,
  });
  const error = [];
  if (r.error) error.push(`no pude correr codex: ${r.error.message}`);
  else if (r.status !== 0) error.push(`codex salió con exit ${r.status}`);

  const nuevos = listarRollouts(join(home, "sessions")).filter((p) => !antes.has(p));
  let creditos = 0;
  if (nuevos.length === 0) error.push("sin rollout nuevo");
  for (const ruta of nuevos) {
    const { total, modelo } = leerRollout(ruta);
    if (!total) error.push(`${ruta}: sin token_count con info`);
    else if (modelo !== cond.modelo) error.push(`${ruta}: el modelo es ${modelo}, no ${cond.modelo}`);
    else creditos += creditosDe(tarifas, cond.modelo, total);
  }

  let veredicto = null;
  let defectos = [];
  if (!r.error && r.status === 0) {
    const v = validarVeredicto(r.stdout ?? "");
    if (v.ok) {
      veredicto = v.datos.veredicto;
      defectos = v.datos.defectos;
    } else error.push(`veredicto inválido (${v.error})`);
  }

  const sembrado = caso.oracle.defecto === true;
  return {
    caso: caso.id,
    condicion: nombre,
    modelo: cond.modelo,
    esfuerzo: cond.esfuerzo,
    sembrado,
    veredicto,
    defectos,
    acierto: veredicto !== null && evaluar(caso.oracle, veredicto, defectos),
    falsa_alarma: !sembrado && veredicto === "DEVUELTO",
    creditos: Math.round(creditos * 10000) / 10000,
    rollouts: nuevos.map((p) => p.split(/[\\/]/).pop()),
    error: error.length ? error.join("; ") : null,
    fecha: new Date().toISOString(),
  };
}

// Corre lo pendiente, en orden caso y luego condición; se detiene antes de una corrida si el gasto ya llegó al tope.
function correrTodo({ casos, condiciones, tope, archivo, home, env, tarifas, log, limpio = false }) {
  const previos = leerResultados(archivo);
  const hechos = new Set(previos.map((r) => claveHecho(r.caso, r.condicion, r.costo_limpio === true)));
  let gastado = previos.reduce((a, r) => a + (r.creditos ?? 0), 0);
  let nuevas = 0;
  let cortado = false;
  const dirEsquema = mkdtempSync(join(tmpdir(), "revisor-luna-"));
  const schemaPath = join(dirEsquema, "veredicto.schema.json");
  writeFileSync(schemaPath, JSON.stringify(ESQUEMA_VEREDICTO));
  try {
    for (const caso of casos) {
      for (const nombre of condiciones) {
        if (hechos.has(claveHecho(caso.id, nombre, limpio))) continue;
        if (gastado >= tope) {
          cortado = true;
          break;
        }
        const r = correrCaso(caso, nombre, CONDICIONES[nombre], tarifas, env, home, schemaPath);
        if (limpio) r.costo_limpio = true;
        appendFileSync(archivo, `${JSON.stringify(r)}\n`);
        hechos.add(claveHecho(caso.id, nombre, limpio));
        gastado += r.creditos;
        nuevas++;
        log(`${caso.id} ${nombre}: ${r.veredicto ?? "sin veredicto"} acierto=${r.acierto} creditos=${r.creditos}${r.error ? ` ERROR: ${r.error}` : ""}`);
      }
      if (cortado) break;
    }
  } finally {
    rmSync(dirEsquema, { recursive: true, force: true });
  }
  return { nuevas, gastado, cortado };
}

// codex falso para la autoprueba: escribe un rollout con dos token_count (el último con info es el que cuenta)
// y responde APROBADO. Sin plantillas de texto dentro, para no confundir con interpolaciones.
const FAKE_CODEX = `#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
const modelo = args[args.indexOf("-m") + 1];
readFileSync(0, "utf8");
const dir = join(process.env.CODEX_HOME, "sessions", "2026", "11", "10");
mkdirSync(dir, { recursive: true });
const token = (input, cacheada, salida) => ({ info: { total_token_usage: { input_tokens: input, cached_input_tokens: cacheada, output_tokens: salida } } });
const lineas = [
  { type: "turn_context", payload: { model: modelo } },
  { type: "event_msg", payload: { type: "token_count", ...token(1000, 0, 100) } },
  { type: "event_msg", payload: { type: "token_count", info: null } },
  { type: "event_msg", payload: { type: "token_count", ...token(10000, 2000, 1000) } },
];
writeFileSync(join(dir, "rollout-fake-" + process.pid + "-" + Date.now() + ".jsonl"), lineas.map((o) => JSON.stringify(o)).join("\\n") + "\\n");
process.stdout.write(JSON.stringify({ veredicto: "APROBADO", defectos: [] }) + "\\n");
`;

// Prueba sin red: 2 casos x 3 condiciones con tope 1; deben correr 4 y cortar en la quinta.
// Sol cuesta 0,655 por corrida (el último token_count), así que la primera fila debe valer 0,655.
function autoprueba(tarifas) {
  const dir = mkdtempSync(join(tmpdir(), "revisor-luna-auto-"));
  try {
    const bin = join(dir, "bin");
    const home = join(dir, "codex-home");
    const archivo = join(dir, "resultados.jsonl");
    mkdirSync(bin);
    mkdirSync(home);
    writeFileSync(join(bin, "codex"), FAKE_CODEX, { mode: 0o755 });
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, CODEX_HOME: home };
    const res = correrTodo({
      casos: cargarCasos().slice(0, 2),
      condiciones: Object.keys(CONDICIONES),
      tope: 1,
      archivo,
      home,
      env,
      tarifas,
      log: (l) => console.log(l),
    });
    const filas = leerResultados(archivo);
    const ok = res.cortado && filas.length === 4
      && filas.every((f) => f.error === null && f.veredicto === "APROBADO")
      && Math.abs(filas[0].creditos - 0.655) < 1e-9;
    console.log(`autoprueba: filas=${filas.length}; corridas=${res.nuevas}; tope cortó=${res.cortado}; primera fila=${filas[0]?.creditos}`);
    return ok;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const a = leerArgs(process.argv.slice(2));
  const tarifas = JSON.parse(readFileSync(TARIFAS, "utf8")).modelos;
  if (a.autoprueba) {
    const ok = autoprueba(tarifas);
    console.log(ok ? "AUTOPRUEBA OK" : "AUTOPRUEBA FALLO");
    process.exit(ok ? 0 : 1);
  }
  const home = process.env.CODEX_HOME ?? join(homedir(), ".codex");
  const todos = cargarCasos();
  const casos = a.casos ? todos.filter((c) => a.casos.includes(c.id)) : todos;
  if (a.casos && casos.length !== a.casos.length) uso(`algún id de --casos no existe (${a.casos.join(",")})`);
  const res = correrTodo({
    casos,
    condiciones: a.condiciones,
    tope: a.tope,
    archivo: RESULTADOS,
    home,
    env: process.env,
    tarifas,
    limpio: a.limpio,
    log: (l) => console.log(l),
  });
  console.log(`corridas nuevas: ${res.nuevas}; líneas en resultados.jsonl: ${leerResultados(RESULTADOS).length}; créditos acumulados: ${res.gastado.toFixed(4)}; tope ${a.tope}${res.cortado ? "; el tope cortó (quedan corridas pendientes)" : ""}`);
}

main();
