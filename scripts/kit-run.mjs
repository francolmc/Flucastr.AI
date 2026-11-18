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
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { anotarNotas, comandoVerificacion, fijarEstado, frontmatter, progreso } from "../tools/run/plan.mjs";
import { correr, topeMs } from "../tools/run/process.mjs";
import { huellaArbol } from "../tools/run/tree-fingerprint.mjs";
import { ESQUEMA_VEREDICTO, validarVeredicto } from "../tools/run/verdict.mjs";
import { claveFalloVerificacion, cola, promptConstructor, promptRevisor } from "../tools/run/prompts.mjs";
import { crearResolutoresPerfil } from "../tools/run/profiles.mjs";
import { crearComando } from "../tools/run/commands.mjs";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { resolverAgente, resolverRevisorKit, etiquetaRevisor, comprobarPoliticaClaude } = crearResolutoresPerfil(RAIZ_KIT);
const comando = crearComando({ resolverAgente, resolverRevisorKit });
const MAX_RELANZAMIENTOS = 2;
const HERRAMIENTAS = ["codex", "claude", "pi"];

function uso(mensaje) {
  console.error(`error: ${mensaje}`);
  console.error("uso: node scripts/kit-run.mjs <plan.md> [--herramienta codex|claude|pi] [--raiz <dir>]");
  process.exit(2);
}

function leerArgs(argv) {
  const a = { plan: null, herramienta: "codex", raiz: RAIZ_KIT };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--herramienta" || x === "--tool") a.herramienta = argv[++i];
    else if (x === "--raiz" || x === "--root") a.raiz = resolve(argv[++i] ?? "");
    else if (x.startsWith("--")) uso(`opción desconocida ${x}`);
    else if (a.plan === null) a.plan = x;
    else uso(`sobra el argumento ${x}`);
  }
  if (!a.plan) uso("falta el plan");
  if (!HERRAMIENTAS.includes(a.herramienta)) uso(`herramienta «${a.herramienta}» no existe`);
  return a;
}

function main() {
  const a = leerArgs(process.argv.slice(2));
  if (a.herramienta !== "codex" && !(process.env.KIT_RUN_CONSTRUCTOR && process.env.KIT_RUN_REVISOR)) {
    uso(`herramienta «${a.herramienta}» aún sin mapear (tramo 3); define KIT_RUN_CONSTRUCTOR y KIT_RUN_REVISOR`);
  }
  const raiz = a.raiz;
  if (a.herramienta === "claude") {
    try { comprobarPoliticaClaude(raiz); } catch (e) { uso(e.message); }
  }
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
  const continuidad = fm.continuidad === "continua";
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
  let fallosVerificacion = new Set();
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
        const causa = claveFalloVerificacion(v);
        if (continuidad && fallosVerificacion.has(causa)) {
          final = { pausa: true, motivo: "verify", msg: `la verificación repitió la misma causa: ${cola(v.stdout + v.stderr)}` };
          break;
        }
        fallosVerificacion.add(causa);
        if (relanzamientos < MAX_RELANZAMIENTOS) {
          relanzamientos++;
          prompt = promptConstructor(planRel, tramo, `Verification failed (exit ${v.status}). Output:\n${cola(v.stdout + v.stderr)}`);
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
        prompt = promptConstructor(planRel, tramo, `The review returned these defects:\n${JSON.stringify(dv.defectos, null, 2)}`);
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
