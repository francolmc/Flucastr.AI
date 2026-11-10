#!/usr/bin/env node
// kit run: lanza al constructor sin interfaz, corre la verificación, relanza hasta 2 veces
// y, al final, un revisor en proceso nuevo de solo lectura que devuelve un veredicto validado.
// El script decide el orden; ningún modelo orquesta. Solo escribe en el plan: estado y una nota en Notas.
//
// Uso:
//   node scripts/kit-run.mjs <plan.md> [--herramienta codex|claude|pi] [--raiz <dir>]
// Salida: la primera línea es COMPLETADO o PAUSA, con el mismo formato que el retorno del constructor.
// Código de salida: 0 listo, 1 parcial, 2 uso o plan no aprobado.
//
// Ejecutables reemplazables (para pruebas y para cambiar el binario): KIT_RUN_CONSTRUCTOR, KIT_RUN_REVISOR,
// KIT_RUN_VERIFY (rutas de ejecutable). Con ellas el script llama a esa ruta con los mismos argumentos y el prompt por stdin.
// Sin ellas, herramienta codex usa `codex exec`; claude y pi se mapean en el tramo 3 y hasta entonces salen con error.
// Mapeo codex: constructor con `--sandbox workspace-write`; revisor (agente principal) con `--sandbox read-only` y
// `--output-schema`. Modelo y esfuerzo salen de modelos.json (resolver.mjs): el constructor de su agente y el
// revisor de kit_run.revisor (sin esa clave, el de principal). Cada corrida tiene tope de tiempo:
// constructor 45 min, revisor 15 min, verify 30 min; KIT_RUN_TOPE_MS lo fija en ms para todas (pruebas).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_RELANZAMIENTOS = 2;
const COLA = 1500;
const HERRAMIENTAS = ["codex", "claude", "pi"];
const TOPE_MS = { CONSTRUCTOR: 45 * 60 * 1000, REVISOR: 15 * 60 * 1000, VERIFY: 30 * 60 * 1000 };

function topeMs(rol) {
  const fijo = Number(process.env.KIT_RUN_TOPE_MS);
  return Number.isFinite(fijo) && fijo > 0 ? fijo : TOPE_MS[rol];
}

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

function uso(mensaje) {
  console.error(`error: ${mensaje}`);
  console.error("uso: node scripts/kit-run.mjs <plan.md> [--herramienta codex|claude|pi] [--raiz <dir>]");
  process.exit(2);
}

function leerArgs(argv) {
  const a = { plan: null, herramienta: "codex", raiz: RAIZ_KIT };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--herramienta") a.herramienta = argv[++i];
    else if (x === "--raiz") a.raiz = resolve(argv[++i] ?? "");
    else if (x.startsWith("--")) uso(`opción desconocida ${x}`);
    else if (a.plan === null) a.plan = x;
    else uso(`sobra el argumento ${x}`);
  }
  if (!a.plan) uso("falta el plan");
  if (!HERRAMIENTAS.includes(a.herramienta)) uso(`herramienta «${a.herramienta}» no existe`);
  return a;
}

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  const datos = {};
  if (!m) return datos;
  for (const linea of m[1].split("\n")) {
    const k = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (k) datos[k[1]] = k[2].trim();
  }
  return datos;
}

function fijarEstado(planPath, estado) {
  const texto = readFileSync(planPath, "utf8");
  writeFileSync(planPath, texto.replace(/^estado: .*$/m, `estado: ${estado}`));
}

function anotarNotas(planPath, linea) {
  const texto = readFileSync(planPath, "utf8");
  writeFileSync(planPath, `${texto.trimEnd()}\n- kit run: ${linea}\n`);
}

// Cuenta casillas raíz: [x] y pendientes [ ].
function progreso(planPath) {
  const lineas = readFileSync(planPath, "utf8").split("\n");
  const hechos = lineas.filter(l => /^- \[x\]/.test(l)).length;
  const pend = lineas.filter(l => /^- \[ \]/.test(l)).length;
  return { hechos, total: hechos + pend };
}

// Primer código de la sección ## Verificación (p. ej. `./verify`); sin él, ./verify.
function comandoVerificacion(texto) {
  const m = texto.match(/^## Verificación\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  const cod = m && m[1].match(/`([^`]+)`/);
  return cod ? cod[1] : "./verify";
}

// Resuelve modelo o esfuerzo de un agente con resolver.mjs (modelos.json del kit).
function resolverAgente(subcomando, agente) {
  const r = spawnSync(process.execPath, [join(RAIZ_KIT, "scripts", "resolver.mjs"), subcomando, agente, "codex"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`resolver ${subcomando} ${agente} codex falló: ${r.stderr.trim()}`);
  return r.stdout.trim();
}

// Modelo y esfuerzo del revisor de kit run (resolver.mjs revisor): kit_run.revisor de modelos.json, o el de principal.
function resolverRevisorKit(herramienta) {
  const r = spawnSync(process.execPath, [join(RAIZ_KIT, "scripts", "resolver.mjs"), "revisor", herramienta], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`resolver revisor ${herramienta} falló: ${r.stderr.trim()}`);
  const [modelo, esfuerzo = ""] = r.stdout.split("\n");
  return { modelo, esfuerzo };
}

// Rastro del revisor para la nota del plan: modelo:esfuerzo (o solo el modelo). claude y pi usan su perfil.
const HERRAMIENTA_RESOLVER = { codex: "codex", claude: "claude-code", pi: "pi" };
function etiquetaRevisor(herramienta) {
  const { modelo, esfuerzo } = resolverRevisorKit(HERRAMIENTA_RESOLVER[herramienta]);
  return esfuerzo ? `${modelo}:${esfuerzo}` : modelo;
}

// Comando de un rol. Con KIT_RUN_<ROL> el ejecutable cambia y los argumentos son los del mapeo sin modelo;
// sin él, herramienta codex usa `codex exec` con el modelo y el esfuerzo de cada rol.
function comando(rol, herramienta, raiz, schema) {
  const constructor = rol === "CONSTRUCTOR";
  const sandbox = constructor ? "workspace-write" : "read-only";
  const fin = constructor ? [] : ["--output-schema", schema];
  const sobre = process.env[`KIT_RUN_${rol}`];
  if (sobre) return { exe: sobre, args: ["exec", "--sandbox", sandbox, "-C", raiz, ...fin, "-"] };
  if (herramienta !== "codex") {
    throw new Error(`herramienta «${herramienta}» aún sin mapear (tramo 3); define KIT_RUN_${rol}`);
  }
  const { modelo, esfuerzo } = constructor
    ? { modelo: resolverAgente("modelo", "constructor"), esfuerzo: resolverAgente("esfuerzo", "constructor") }
    : resolverRevisorKit("codex");
  const cfg = esfuerzo ? ["-c", `model_reasoning_effort="${esfuerzo}"`] : [];
  return { exe: "codex", args: ["exec", "--sandbox", sandbox, "-m", modelo, ...cfg, "-C", raiz, ...fin, "-"] };
}

// tope: milisegundos; si se supera, spawnSync mata el proceso y error dice que superó el tope.
function correr(cmd, prompt, cwd, shell = false, tope = undefined) {
  const r = spawnSync(cmd.exe, cmd.args ?? [], {
    cwd,
    input: prompt ?? "",
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell,
    timeout: tope,
  });
  const expiro = r.error && r.error.code === "ETIMEDOUT";
  return {
    status: r.status,
    error: r.error ? (expiro ? `superó el tope de ${tope} ms` : r.error.message) : null,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

// Huella del árbol de trabajo: estado de git, diff contra HEAD y contenido de cada archivo listado.
// null si no hay git. Sirve para detectar que el revisor escribió algo.
function huellaArbol(raiz) {
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: raiz, encoding: "utf8" });
  if (top.status !== 0) return null;
  const base = top.stdout.trim();
  const st = spawnSync("git", ["status", "--porcelain=v1", "-uall"], { cwd: raiz, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const df = spawnSync("git", ["diff", "HEAD"], { cwd: raiz, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const h = createHash("sha256");
  h.update(st.stdout ?? "");
  h.update(df.stdout ?? "");
  for (const linea of (st.stdout ?? "").split("\n")) {
    const ruta = linea.slice(3).split(" -> ").pop();
    if (!ruta) continue;
    const p = join(base, ruta);
    if (existsSync(p)) h.update(readFileSync(p));
  }
  return h.digest("hex");
}

// Valida el veredicto del revisor contra ESQUEMA_VEREDICTO. Devuelve { ok, error, datos }.
function validarVeredicto(texto) {
  let datos;
  try {
    datos = JSON.parse(texto.trim());
  } catch {
    return { ok: false, error: "la salida no es JSON" };
  }
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return { ok: false, error: "no es un objeto" };
  const claves = Object.keys(datos).sort();
  if (claves.join(",") !== "defectos,veredicto") return { ok: false, error: `claves inesperadas: ${claves.join(",")}` };
  if (!["APROBADO", "DEVUELTO", "PAUSA"].includes(datos.veredicto)) return { ok: false, error: `veredicto inválido: ${datos.veredicto}` };
  if (!Array.isArray(datos.defectos)) return { ok: false, error: "defectos no es una lista" };
  for (const d of datos.defectos) {
    const ok = d && typeof d === "object" && typeof d.archivo === "string" && Number.isInteger(d.linea)
      && typeof d.criterio === "string" && typeof d.descripcion === "string"
      && Object.keys(d).length === 4;
    if (!ok) return { ok: false, error: "un defecto no cumple el esquema" };
  }
  if (datos.veredicto === "APROBADO" && datos.defectos.length > 0) return { ok: false, error: "APROBADO con defectos" };
  if (datos.veredicto === "DEVUELTO" && datos.defectos.length === 0) return { ok: false, error: "DEVUELTO sin defectos" };
  return { ok: true, datos };
}

function cola(t) {
  return t.length > COLA ? `…${t.slice(-COLA)}` : t;
}

function promptConstructor(planRel, tramo, ajuste) {
  const t = tramo ? ` (tramo: ${tramo})` : "";
  const base = `Ejecuta con la skill ejecutar-plan el plan ${planRel}${t}. Responde con la línea de retorno.`;
  return ajuste ? `${base}\n\nCorrige antes de seguir:\n${ajuste}` : base;
}

function promptRevisor(planRel, diff, esquema) {
  return [
    `Revisa el plan ${planRel} contra el diff que sigue. Solo lees; no escribes nada.`,
    "Devuelve SOLO un JSON que cumpla este esquema, sin texto alrededor:",
    JSON.stringify(esquema),
    "veredicto APROBADO si lo pedido en Aceptación está hecho; DEVUELTO con defectos (archivo, línea, criterio) si no; PAUSA si falta algo que no se puede decidir.",
    "",
    "--- diff ---",
    diff,
  ].join("\n");
}

function main() {
  const a = leerArgs(process.argv.slice(2));
  if (a.herramienta !== "codex" && !(process.env.KIT_RUN_CONSTRUCTOR && process.env.KIT_RUN_REVISOR)) {
    uso(`herramienta «${a.herramienta}» aún sin mapear (tramo 3); define KIT_RUN_CONSTRUCTOR y KIT_RUN_REVISOR`);
  }
  const raiz = a.raiz;
  const planPath = resolve(raiz, a.plan);
  if (!existsSync(planPath)) uso(`no existe el plan ${a.plan}`);
  const planRel = a.plan;
  const texto0 = readFileSync(planPath, "utf8");
  const fm = frontmatter(texto0);
  if (fm.estado !== "aprobado") {
    console.error(`error: el plan está en estado «${fm.estado ?? "?"}»; solo se ejecuta con «aprobado»`);
    process.exit(2);
  }
  const tramo = fm.tramo;
  const verificacion = comandoVerificacion(texto0);
  const pieza = tramo ? `tramo=${tramo}; ` : "";
  const veredictoOut = (linea) => console.log(linea);

  // Preflight: si el mapeo no se puede resolver (p. ej. modelos.json sin el agente o un nivel inválido), sale antes de tocar el plan.
  let revisor;
  try {
    comando("CONSTRUCTOR", a.herramienta, raiz, "");
    comando("REVISOR", a.herramienta, raiz, "");
    revisor = etiquetaRevisor(a.herramienta);
  } catch (e) {
    uso(e.message);
  }

  const dir = mkdtempSync(join(tmpdir(), "kit-run-"));
  const schemaPath = join(dir, "veredicto.schema.json");
  writeFileSync(schemaPath, JSON.stringify(ESQUEMA_VEREDICTO));

  let relanzamientos = 0;
  let prompt = promptConstructor(planRel, tramo, null);
  let final = null;

  try {
    for (;;) {
      // El constructor (ejecutar-plan, paso 3) pone «en curso» al empezar; cada corrida, relanzamientos incluidos, arranca con «aprobado».
      fijarEstado(planPath, "aprobado");
      console.error(`kit-run: constructor (corrida ${relanzamientos + 1})`);
      const c = correr(comando("CONSTRUCTOR", a.herramienta, raiz), prompt, raiz, false, topeMs("CONSTRUCTOR"));
      const primera = c.stdout.trim().split("\n")[0] ?? "";
      if (c.error || c.status !== 0) { final = { pausa: true, motivo: "acceso", msg: `el constructor falló (${c.error ?? `exit ${c.status}`}): ${cola(c.stderr)}` }; break; }
      if (primera.startsWith("PAUSA")) {
        const m = primera.match(/motivo=([a-zé]+)/);
        final = { pausa: true, motivo: m ? m[1] : "alcance", msg: primera };
        break;
      }
      if (!primera.startsWith("COMPLETADO")) { final = { pausa: true, motivo: "acceso", msg: `retorno del constructor inválido: «${primera}»` }; break; }

      console.error("kit-run: verificación");
      // Verificación: el comando del plan (sección ## Verificación) en la raíz; KIT_RUN_VERIFY lo reemplaza por un ejecutable.
      const v = process.env.KIT_RUN_VERIFY
        ? correr({ exe: process.env.KIT_RUN_VERIFY, args: [] }, null, raiz, false, topeMs("VERIFY"))
        : correr({ exe: verificacion }, null, raiz, true, topeMs("VERIFY"));
      if (v.status !== 0 || v.error) {
        if (relanzamientos < MAX_RELANZAMIENTOS) {
          relanzamientos++;
          prompt = promptConstructor(planRel, tramo, `La verificación falló (exit ${v.status}). Salida:\n${cola(v.stdout + v.stderr)}`);
          continue;
        }
        final = { pausa: true, motivo: "verify", msg: `verify no pasó tras ${relanzamientos + 1} corridas del constructor: ${cola(v.stdout + v.stderr)}` };
        break;
      }

      console.error("kit-run: revisión (solo lectura)");
      const diff = correr({ exe: "git", args: ["diff", "HEAD"] }, null, raiz).stdout;
      const antes = huellaArbol(raiz);
      const r = correr(comando("REVISOR", a.herramienta, raiz, schemaPath), promptRevisor(planRel, diff.slice(0, 60000), ESQUEMA_VEREDICTO), raiz, false, topeMs("REVISOR"));
      const despues = huellaArbol(raiz);
      if (antes !== despues) { final = { pausa: true, motivo: "acceso", msg: "el revisor modificó el árbol de trabajo; se rechaza su veredicto" }; break; }
      if (r.error || r.status !== 0) { final = { pausa: true, motivo: "acceso", msg: `el revisor falló (${r.error ?? `exit ${r.status}`})` }; break; }
      const val = validarVeredicto(r.stdout);
      if (!val.ok) { final = { pausa: true, motivo: "verify", msg: `veredicto del revisor inválido (${val.error}): ${cola(r.stdout)}` }; break; }
      const dv = val.datos;
      if (dv.veredicto === "APROBADO") { final = { aprobado: true }; break; }
      if (dv.veredicto === "PAUSA") { final = { pausa: true, motivo: "diseño", msg: `el revisor pide pausa: ${JSON.stringify(dv.defectos)}` }; break; }
      if (relanzamientos < MAX_RELANZAMIENTOS) {
        relanzamientos++;
        prompt = promptConstructor(planRel, tramo, `La revisión devolvió estos defectos:\n${JSON.stringify(dv.defectos, null, 2)}`);
        continue;
      }
      final = { pausa: true, motivo: "diseño", msg: `revisión devuelta tras ${relanzamientos + 1} corridas: ${JSON.stringify(dv.defectos)}` };
      break;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const { hechos, total } = progreso(planPath);
  if (final.aprobado) {
    fijarEstado(planPath, "listo");
    anotarNotas(planPath, `revisión APROBADO tras ${relanzamientos + 1} corrida(s) del constructor; verify pasó; revisor=${revisor}.`);
    veredictoOut(`COMPLETADO: plan=${planRel}; ${pieza}verify=pasa`);
    process.exit(0);
  }
  fijarEstado(planPath, "parcial");
  anotarNotas(planPath, `PAUSA (${final.motivo}): ${final.msg.replace(/\n/g, " ").slice(0, 600)}; revisor=${revisor}.`);
  veredictoOut(`PAUSA: plan=${planRel}; ${pieza}motivo=${final.motivo}; hecho=${hechos}/${total}; siguiente=revisar la nota de kit run en el plan; no_intentado=${final.msg.replace(/\n/g, " ").slice(0, 300)}`);
  process.exit(1);
}

main();
