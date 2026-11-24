#!/usr/bin/env node
// kit run: lanza al builder sin interfaz, corre la verificación, relanza hasta 2 veces
// y, al final, un revisor en proceso nuevo de solo lectura que devuelve un veredicto validado.
// El script decide el orden; ningún modelo orquesta. Solo escribe en el plan: status y una nota en Notas.
//
// Uso:
//   node scripts/kit-run.mjs <plan.md> [--tool codex|claude|pi] [--root <dir>]
// Salida: la primera línea es DONE o PAUSED, con el mismo formato que el retorno del builder.
// Código de salida: 0 done, 1 partial, 2 uso o plan no approved.
//
// Ejecutables reemplazables (para pruebas y para cambiar el binario): KIT_RUN_BUILDER, KIT_RUN_REVIEWER,
// KIT_RUN_VERIFY (rutas de ejecutable). Con ellas el script llama a esa ruta con los mismos argumentos y el prompt por stdin.
// Sin ellas, herramienta codex usa `codex exec`; claude y pi se mapean en el tramo 3 y hasta entonces salen con error.
// Mapeo codex: builder con `--sandbox workspace-write`; revisor (agente planner) con `--sandbox read-only` y
// `--output-schema`. Modelo y esfuerzo salen de models.json (resolver.mjs): el builder de su agente y el
// revisor de kit_run.reviewer (sin esa clave, el de planner). Cada corrida tiene tope de tiempo:
// builder 45 min, revisor 15 min, verify 30 min; KIT_RUN_TOPE_MS lo fija en ms para todas (pruebas).

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { anotarNotas, comandoVerificacion, fijarEstado, frontmatter, progreso } from "../tools/run/plan.mjs";
import { correr, topeMs } from "../tools/run/process.mjs";
import { fingerprintTree } from "../tools/run/tree-fingerprint.mjs";
import { ESQUEMA_VEREDICTO, validarVeredicto } from "../tools/run/verdict.mjs";
import { claveFalloVerificacion, cola, promptBuilder, promptRevisor } from "../tools/run/prompts.mjs";
import { ejecutarPuerta, herramientasFaltantes, textoParaBuilder, textoParaRevisor } from "../tools/run/puerta.mjs";
import { crearResolutoresPerfil } from "../tools/run/profiles.mjs";
import { medir, registrar } from "../tools/run/registro.mjs";
import { crearComando } from "../tools/run/commands.mjs";
import { anexar, evento, leerEventos } from "../tools/progress/eventos.mjs";
import { escribirResumen, generarResumen } from "../tools/progress/resumen.mjs";
import { casillasDelPlan } from "./progress-watch.mjs";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VIGILANTE = join(RAIZ_KIT, "scripts", "progress-watch.mjs");
// KIT_PROGRESO=0 desactiva la señal, el resumen y el evento de corte; las decisiones no cambian.
const PROGRESO = process.env.KIT_PROGRESO !== "0";
const { resolverAgente, resolverRevisorKit, etiquetaRevisor, etiquetaBuilder, comprobarPoliticaClaude } = crearResolutoresPerfil(RAIZ_KIT);
const comando = crearComando({ resolverAgente, resolverRevisorKit });
const MAX_RELANZAMIENTOS = 2;
const HERRAMIENTAS = ["codex", "claude", "pi"];

function uso(mensaje) {
  console.error(`error: ${mensaje}`);
  console.error("uso: node scripts/kit-run.mjs <plan.md> [--tool codex|claude|pi] [--root <dir>]");
  process.exit(2);
}

function leerArgs(argv) {
  const a = { plan: null, herramienta: "codex", raiz: RAIZ_KIT };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--tool") a.herramienta = argv[++i];
    else if (x === "--root") a.raiz = resolve(argv[++i] ?? "");
    else if (x.startsWith("--")) uso(`opción desconocida ${x}`);
    else if (a.plan === null) a.plan = x;
    else uso(`sobra el argumento ${x}`);
  }
  if (!a.plan) uso("falta el plan");
  if (!HERRAMIENTAS.includes(a.herramienta)) uso(`herramienta «${a.herramienta}» no existe`);
  return a;
}

// Señal de progreso: el vigilante corre en proceso aparte mientras el builder trabaja. Todo es best effort:
// si falla, avisa por stderr y kit run decide igual.
function argsVigilante(planPath, herramienta, raiz, desde) {
  return [VIGILANTE, "--plan", planPath, "--herramienta", herramienta, "--raiz", raiz, "--desde", String(desde)];
}

function lanzarVigilante(planPath, herramienta, raiz, desde) {
  if (!PROGRESO) return null;
  const hijo = spawn(process.execPath, argsVigilante(planPath, herramienta, raiz, desde), { stdio: ["ignore", "ignore", "inherit"] });
  // El evento 'error' llega fuera del bucle síncrono de kit run; se escucha para que no tumbe el proceso.
  hijo.on("error", () => {});
  if (hijo.pid === undefined) console.error("progreso: no se pudo lanzar el vigilante; kit run sigue sin señal");
  return hijo;
}

// Un corte por tope lo marca el mensaje de correr («superó el tope de N ms»); no cambia el retorno.
const porTope = (r) => /superó el tope/.test(String(r?.error ?? ""));

// Última captura síncrona, antes del resumen. Así no compite con el vigilante asíncrono, ya detenido.
function cerrarProgreso({ planPath, herramienta, raiz, desde, resultado, motivo, corte, nombre }) {
  if (!PROGRESO) return;
  try {
    const r = spawnSync(process.execPath, [...argsVigilante(planPath, herramienta, raiz, desde), "--una-vez"], { stdio: ["ignore", "ignore", "inherit"] });
    if (r.error || r.status !== 0) console.error(`progreso: la captura final falló (${r.error?.message ?? `exit ${r.status}`})`);
    const eventos = leerEventos(join(dirname(planPath), "progress.jsonl")).eventos;
    escribirResumen(join(dirname(planPath), "progress-resumen.md"), eventos, { resultado, motivo, corte, casillas: casillasDelPlan(planPath).casillas, nombre });
  } catch (e) {
    console.error(`progreso: no se pudo cerrar la señal (${e.message})`);
  }
}

// Resumen de progreso para un relanzamiento: se guarda en progress-resumen.md y su texto (truncado) va al builder.
// Best effort: si falla, el relanzamiento sigue sin resumen.
function resumenParaRelanzar(planPath) {
  if (!PROGRESO) return "";
  try {
    const eventos = leerEventos(join(dirname(planPath), "progress.jsonl")).eventos;
    const plan = { resultado: null, motivo: null, corte: false, casillas: casillasDelPlan(planPath).casillas };
    const texto = generarResumen(eventos, plan);
    escribirResumen(join(dirname(planPath), "progress-resumen.md"), eventos, plan);
    return `\n\nProgress summary:\n${texto.slice(0, 3000)}`;
  } catch {
    return "";
  }
}

function main() {
  const a = leerArgs(process.argv.slice(2));
  if (a.herramienta !== "codex" && !(process.env.KIT_RUN_BUILDER && process.env.KIT_RUN_REVIEWER)) {
    uso(`herramienta «${a.herramienta}» aún sin mapear (tramo 3); define KIT_RUN_BUILDER y KIT_RUN_REVIEWER`);
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
  if (fm.status !== "approved") {
    console.error(`error: el plan está en status «${fm.status ?? "?"}»; solo se ejecuta con «approved»`);
    process.exit(2);
  }
  const tramo = fm.segment;
  const continuidad = fm.continuity === "continuous";
  const verificacion = comandoVerificacion(texto0);
  const pieza = tramo ? `segment=${tramo}; ` : "";
  const veredictoOut = (linea) => console.log(linea);

  // Preflight: si el mapeo no se puede resolver (p. ej. models.json sin el agente o un nivel inválido), sale antes de tocar el plan.
  let revisor, builderModelo;
  try {
    comando("BUILDER", a.herramienta, raiz, "");
    comando("REVIEWER", a.herramienta, raiz, "");
    revisor = etiquetaRevisor(a.herramienta);
    builderModelo = etiquetaBuilder(a.herramienta);
  } catch (e) {
    uso(e.message);
  }
  // Puerta mecánica: sin las tres herramientas no hay forma de comprobar el resultado; sale antes de tocar el plan.
  const faltan = herramientasFaltantes();
  if (faltan.length) uso(`faltan herramientas de la puerta mecánica en scripts/: ${faltan.join(", ")}`);

  const dir = mkdtempSync(join(tmpdir(), "kit-run-"));
  const schemaPath = join(dir, "veredicto.schema.json");
  writeFileSync(schemaPath, JSON.stringify(ESQUEMA_VEREDICTO));

  let relanzamientos = 0;
  let fallosVerificacion = new Set();
  let prompt = promptBuilder(planRel, tramo, null);
  let final = null;
  // Intento en curso: se completa a medida que corre el builder, la verificación y el revisor.
  let intento = null;
  // El registro va junto al plan (changes/<nombre>/runs.jsonl). registrar nunca lanza.
  const rutaRegistro = join(dirname(planPath), "runs.jsonl");
  const volcarIntento = () => { if (intento !== null) { registrar(rutaRegistro, intento); intento = null; } };
  // Señal de progreso: el log va junto al plan; bloqueo «corte por tope» lo escribe kit run (origen kitrun).
  const rutaProgreso = join(dirname(planPath), "progress.jsonl");
  const bloqueoCorte = () => { if (PROGRESO) anexar(rutaProgreso, evento("bloqueo", { seg: tramo ?? null, o: "kitrun", texto: "corte por tope" })); };
  let corte = false;
  let inicioPrimera = null;

  try {
    for (;;) {
      volcarIntento();
      // Relanzamientos previos a este intento: el intento que relanza deja 0 y el siguiente 1.
      intento = { plan: planRel, tramo: tramo ? Number(tramo) : null, fecha: new Date().toISOString(), herramienta: a.herramienta, builder_modelo: builderModelo, builder_ms: null, verify_ms: null, revisor_ms: null, resultado: null, motivo_relanzamiento: null, relanzamientos, huella_inicio: fingerprintTree(raiz), huella_fin: null, puerta: null, puerta_ms: null };
      // El builder (execute-plan, paso 3) pone «in progress» al empezar; cada corrida, relanzamientos incluidos, arranca con «approved».
      fijarEstado(planPath, "approved");
      console.error(`kit-run: builder (corrida ${relanzamientos + 1})`);
      const inicioRun = Date.now();
      if (inicioPrimera === null) inicioPrimera = inicioRun;
      const vigilante = lanzarVigilante(planPath, a.herramienta, raiz, inicioRun);
      const cm = medir(() => correr(comando("BUILDER", a.herramienta, raiz), prompt, raiz, false, topeMs("BUILDER")));
      vigilante?.kill("SIGTERM");
      const c = cm.valor;
      if (porTope(c)) { corte = true; bloqueoCorte(); }
      intento.builder_ms = cm.ms;
      intento.huella_fin = fingerprintTree(raiz);
      const primera = c.stdout.trim().split("\n")[0] ?? "";
      if (c.error || c.status !== 0) { final = { pausa: true, motivo: "access", msg: `el builder falló (${c.error ?? `exit ${c.status}`}): ${cola(c.stderr)}` }; break; }
      if (primera.startsWith("PAUSED")) {
        const m = primera.match(/motivo=([a-zé]+)/);
        final = { pausa: true, motivo: m ? m[1] : "alcance", msg: primera };
        break;
      }
      if (!primera.startsWith("DONE")) { final = { pausa: true, motivo: "access", msg: `retorno del builder inválido: «${primera}»` }; break; }

      console.error("kit-run: verificación");
      // Verificación: el comando del plan (sección ## Verification) en la raíz; KIT_RUN_VERIFY lo reemplaza por un ejecutable.
      const vm = medir(() => process.env.KIT_RUN_VERIFY
        ? correr({ exe: process.env.KIT_RUN_VERIFY, args: [] }, null, raiz, false, topeMs("VERIFY"))
        : correr({ exe: verificacion }, null, raiz, true, topeMs("VERIFY")));
      const v = vm.valor;
      if (porTope(v)) { corte = true; bloqueoCorte(); }
      intento.verify_ms = vm.ms;
      if (v.status !== 0 || v.error) {
        intento.resultado = "devuelto";
        intento.motivo_relanzamiento = "verify";
        const causa = claveFalloVerificacion(v);
        if (continuidad && fallosVerificacion.has(causa)) {
          final = { pausa: true, motivo: "verify", msg: `la verificación repitió la misma causa: ${cola(v.stdout + v.stderr)}` };
          break;
        }
        fallosVerificacion.add(causa);
        if (relanzamientos < MAX_RELANZAMIENTOS) {
          relanzamientos++;
          prompt = promptBuilder(planRel, tramo, `Verification failed (exit ${v.status}). Output:\n${cola(v.stdout + v.stderr)}${resumenParaRelanzar(planPath)}`);
          continue;
        }
        final = { pausa: true, motivo: "verify", msg: `verify no pasó tras ${relanzamientos + 1} corridas del builder: ${cola(v.stdout + v.stderr)}` };
        break;
      }

      // Puerta mecánica: si bloquea, no hay revisor; el builder recibe la lista exacta y el mismo contador de relanzamientos.
      console.error("kit-run: puerta mecánica");
      const pm = medir(() => ejecutarPuerta({ planPath, raiz, tramo }));
      const puerta = pm.valor;
      intento.puerta = puerta.estado;
      intento.puerta_ms = pm.ms;
      if (puerta.bloquea) {
        intento.resultado = "devuelto";
        intento.motivo_relanzamiento = "puerta";
        if (relanzamientos < MAX_RELANZAMIENTOS) {
          relanzamientos++;
          prompt = promptBuilder(planRel, tramo, `${textoParaBuilder(puerta)}${resumenParaRelanzar(planPath)}`);
          continue;
        }
        final = { pausa: true, motivo: puerta.motivo, msg: `la puerta mecánica no pasó tras ${relanzamientos + 1} corridas del builder: ${puerta.lista.join("; ")}` };
        break;
      }

      console.error("kit-run: revisión (solo lectura)");
      const diff = correr({ exe: "git", args: ["diff", "HEAD"] }, null, raiz).stdout;
      const antes = fingerprintTree(raiz);
      const rm = medir(() => correr(comando("REVIEWER", a.herramienta, raiz, schemaPath), promptRevisor(planRel, diff.slice(0, 60000), ESQUEMA_VEREDICTO, textoParaRevisor(puerta)), raiz, false, topeMs("REVIEWER")));
      const r = rm.valor;
      if (porTope(r)) { corte = true; bloqueoCorte(); }
      intento.revisor_ms = rm.ms;
      const despues = fingerprintTree(raiz);
      if (antes !== despues) { final = { pausa: true, motivo: "access", msg: "el revisor modificó el árbol de trabajo; se rechaza su veredicto" }; break; }
      if (r.error || r.status !== 0) { final = { pausa: true, motivo: "access", msg: `el revisor falló (${r.error ?? `exit ${r.status}`})` }; break; }
      const val = validarVeredicto(r.stdout);
      if (!val.ok) { final = { pausa: true, motivo: "verify", msg: `veredicto del revisor inválido (${val.error}): ${cola(r.stdout)}` }; break; }
      const dv = val.datos;
      if (dv.veredicto === "APPROVED") { intento.resultado = "DONE"; final = { aprobado: true }; break; }
      if (dv.veredicto === "PAUSED") { final = { pausa: true, motivo: "design", msg: `el revisor pide pausa: ${JSON.stringify(dv.defectos)}` }; break; }
      intento.resultado = "devuelto";
      intento.motivo_relanzamiento = "revisor";
      if (relanzamientos < MAX_RELANZAMIENTOS) {
        relanzamientos++;
        prompt = promptBuilder(planRel, tramo, `The review returned these defects:\n${JSON.stringify(dv.defectos, null, 2)}${resumenParaRelanzar(planPath)}`);
        continue;
      }
      final = { pausa: true, motivo: "design", msg: `revisión devuelta tras ${relanzamientos + 1} corridas: ${JSON.stringify(dv.defectos)}` };
      break;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // El último intento no se relanza: su resultado es DONE si se aprobó, o PAUSED en otro caso.
  if (intento !== null) { intento.resultado = final.aprobado ? "DONE" : "PAUSED"; volcarIntento(); }
  const { hechos, total } = progreso(planPath);
  cerrarProgreso({ planPath, herramienta: a.herramienta, raiz, desde: inicioPrimera ?? Date.now(), resultado: final.aprobado ? "DONE" : "PAUSED", motivo: final.motivo, corte: corte && !final.aprobado, nombre: planRel });
  if (final.aprobado) {
    fijarEstado(planPath, "done");
    anotarNotas(planPath, `revisión APPROVED tras ${relanzamientos + 1} corrida(s) del builder; verify pasó; revisor=${revisor}.`);
    veredictoOut(`DONE: plan=${planRel}; ${pieza}verify=pasa`);
    process.exit(0);
  }
  fijarEstado(planPath, "partial");
  anotarNotas(planPath, `PAUSED (${final.motivo}): ${final.msg.replace(/\n/g, " ").slice(0, 600)}; revisor=${revisor}.`);
  veredictoOut(`PAUSED: plan=${planRel}; ${pieza}motivo=${final.motivo}; hecho=${hechos}/${total}; siguiente=revisar la nota de kit run en el plan; no_intentado=${final.msg.replace(/\n/g, " ").slice(0, 300)}`);
  process.exit(1);
}

main();
