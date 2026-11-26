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
import { correr, correrVigilado, topeMs } from "../tools/run/process.mjs";
import { MINUTO, configuracion, evaluarPegado } from "../tools/run/pegado.mjs";
import { fingerprintTree } from "../tools/run/tree-fingerprint.mjs";
import { ESQUEMA_VEREDICTO, validarVeredicto } from "../tools/run/verdict.mjs";
import { claveFalloVerificacion, cola, promptBuilder, promptRevisor } from "../tools/run/prompts.mjs";
import { ejecutarPuerta, herramientasFaltantes, textoParaBuilder, textoParaRevisor } from "../tools/run/puerta.mjs";
import { crearResolutoresPerfil } from "../tools/run/profiles.mjs";
import { medir, registrar } from "../tools/run/registro.mjs";
import { clasificar } from "../tools/run/clasificar.mjs";
import { MAX_CONSEJO, MAX_RELANZAMIENTOS, consejoDelPlan, decidir, diagnostico, historial, ultimasLineas } from "../tools/run/escalera.mjs";
import { decisionesUsadas, handoff } from "../tools/run/handoff.mjs";
import { crearComando } from "../tools/run/commands.mjs";
import { conNivelSuperior, nivelSuperiorDe } from "../tools/run/nivel.mjs";
import { leerTokens, notaPaso4 } from "../tools/run/estimar.mjs";
import { crearResolucionModelos } from "../tools/model-resolution/models.mjs";
import { anexar, evento, leerEventos } from "../tools/progress/eventos.mjs";
import { escribirResumen, generarResumen } from "../tools/progress/resumen.mjs";
import { casillasDelPlan } from "./progress-watch.mjs";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VIGILANTE = join(RAIZ_KIT, "scripts", "progress-watch.mjs");
// KIT_PROGRESO=0 desactiva la señal, el resumen y el evento de corte; las decisiones no cambian.
const PROGRESO = process.env.KIT_PROGRESO !== "0";
// Detector de builder pegado (KIT_RUN_PEGADO: 0 apagado, observar por defecto, cortar). Ver docs/kit-run.md.
const PEGADO = configuracionPegado(process.env);

// KIT_RUN_PEGADO_ARRANQUE_MS y KIT_RUN_PEGADO_MIN_REP_MS solo para pruebas (como KIT_RUN_TOPE_MS):
// sin ellas, las pruebas de corte tardarían los 5 min del arranque. Los valores por defecto no cambian.
function configuracionPegado(env) {
  const base = configuracion(env);
  const fijo = (valor, defecto) => {
    const n = Number(valor);
    return valor !== undefined && valor !== "" && Number.isFinite(n) && n > 0 ? Math.round(n) : defecto;
  };
  return { ...base, arranqueMs: fijo(env.KIT_RUN_PEGADO_ARRANQUE_MS, base.arranqueMs), minRepMs: fijo(env.KIT_RUN_PEGADO_MIN_REP_MS, base.minRepMs) };
}
const { resolverAgente, resolverCompactacion, resolverRevisorKit, etiquetaRevisor, etiquetaBuilder, comprobarPoliticaClaude } = crearResolutoresPerfil(RAIZ_KIT);
const comando = crearComando({ resolverAgente, resolverRevisorKit, resolverCompactacion });
const HERRAMIENTAS = ["codex", "claude", "pi"];
// Herramienta de kit run → perfil de models.json, para resolver el modelo en proceso (paso 3 y relevo).
const MODELO_HERRAMIENTA = { codex: "codex", claude: "claude-code", pi: "pi" };
const MODELOS_KIT = crearResolucionModelos(RAIZ_KIT);
// Tarifas de scripts/rates.json (créditos por millón); sin archivo legible no hay ninguna: la nota dice «sin tarifa».
function tarifasDelKit() {
  try { return JSON.parse(readFileSync(join(RAIZ_KIT, "scripts", "rates.json"), "utf8")).modelos ?? {}; } catch { return {}; }
}

// Último PAUSED de kit run en el plan: el error que se conserva al relanzar con consejo.
const ultimoErrorDelPlan = (texto) => texto.split("\n").filter((l) => l.includes("PAUSED (")).at(-1) ?? "";

// Registro de intentos (runs.jsonl). Si no se puede leer, esta corrida cuenta desde cero y avisa.
function lineasRegistro(ruta) {
  try {
    return readFileSync(ruta, "utf8").split("\n");
  } catch (e) {
    if (e.code !== "ENOENT") console.error(`kit-run: el registro ${ruta} no se puede leer (${e.message}); se cuenta desde cero`);
    return [];
  }
}

// Handoff del relanzamiento: casillas del plan, decisiones usadas, git status y, sin error propio, el último bloqueo de progress.jsonl.
function textoHandoff({ planPath, raiz, error }) {
  const texto = readFileSync(planPath, "utf8");
  const archivos = correr({ exe: "git", args: ["status", "--porcelain"] }, null, raiz).stdout ?? "";
  const bloqueo = leerEventos(join(dirname(planPath), "progress.jsonl")).eventos.filter((e) => e.tipo === "bloqueo").at(-1)?.texto ?? "";
  return handoff({ casillas: casillasDelPlan(planPath).casillas, decisiones: decisionesUsadas(texto), archivos, error: error || bloqueo });
}

function uso(mensaje) {
  console.error(`error: ${mensaje}`);
  console.error("uso: node scripts/kit-run.mjs <plan.md> [--tool codex|claude|pi] [--root <dir>]");
  process.exit(2);
}

function leerArgs(argv) {
  const a = { plan: null, herramienta: "codex", raiz: RAIZ_KIT, paso: null, tokens: null };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--tool") a.herramienta = argv[++i];
    else if (x === "--root") a.raiz = resolve(argv[++i] ?? "");
    else if (x === "--paso") { if (argv[++i] !== "3") uso("--paso solo admite 3 (subir el nivel del builder un tramo)"); a.paso = 3; }
    else if (x === "--tokens") a.tokens = argv[++i] ?? "";
    else if (x.startsWith("--")) uso(`opción desconocida ${x}`);
    else if (a.plan === null) a.plan = x;
    else uso(`sobra el argumento ${x}`);
  }
  if (!a.plan) uso("falta el plan");
  if (a.tokens !== null) {
    const t = leerTokens(a.tokens);
    if (t === null) uso("--tokens espera entrada,caché,salida: tres enteros ≥ 0");
    a.tokens = t;
  }
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

// Versión asíncrona de medir: el builder corre con correrVigilado (puede cortarse por pegado o por tope).
async function medirAsync(fn) {
  const inicio = process.hrtime.bigint();
  const valor = await fn();
  const ms = Number((process.hrtime.bigint() - inicio) / 1000000n);
  return { valor, ms };
}

async function main() {
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

  // El registro va junto al plan (changes/<nombre>/runs.jsonl). registrar nunca lanza.
  const rutaRegistro = join(dirname(planPath), "runs.jsonl");
  // Escalera: el historial del tramo (desde el último DONE) decide el punto de partida. Sin consejo válido en la
  // segunda falla, o con la escalera agotada, sale con 2 sin tocar el plan.
  const h = historial(lineasRegistro(rutaRegistro), planRel, tramo ? Number(tramo) : null);
  // --paso 3 (D1): aprobación explícita del paso que sube el nivel del builder un tramo. Vale con la escalera agotada
  // (dos relanzamientos y una falla de tarea), aunque infra haya gastado el cupo; se niega si un paso 3 ya falló por tarea.
  const pasoTres = a.paso === 3;
  if (pasoTres) {
    if (!(h.usados >= MAX_RELANZAMIENTOS && h.fallasTarea >= 1 && !h.pasoTresTarea)) {
      console.error(`error: --paso 3 solo vale con la escalera de ${planRel} agotada (${h.usados} relanzamientos y ${h.fallasTarea} fallas de tarea en runs.jsonl) y sin paso 3 previo`);
      process.exit(2);
    }
    let superior = null;
    try { superior = nivelSuperiorDe(RAIZ_KIT); } catch (e) { uso(`no pude leer la configuración del builder (${e.message})`); }
    if (superior === null) {
      console.error("error: el nivel del builder no tiene superior en la escalera; no se sube");
      process.exit(2);
    }
  } else if (h.usados >= MAX_RELANZAMIENTOS && h.fallasTarea >= 1) {
    // Cupo gastado solo por infraestructura (sin falla de tarea) corre una vez sin relanzar.
    console.error(`error: la escalera de ${planRel} está agotada (${h.usados} relanzamientos en runs.jsonl); no se relanza. Para otro relanzamiento la persona aprueba --paso 3, o aparta runs.jsonl si el plan se rehízo.`);
    process.exit(2);
  }
  const pideConsejo = h.fallasTarea >= 2 && h.paso < 2 && h.usados < MAX_RELANZAMIENTOS;
  const consejo = pideConsejo ? consejoDelPlan(texto0, tramo) : null;
  if (pideConsejo && consejo === null) {
    console.error(`error: la segunda falla de ${planRel} pide consejo: escribe en Notas «Consejo (tramo ${tramo ?? 1}): …» (una línea, ≤ ${MAX_CONSEJO} caracteres) y vuelve a lanzar.`);
    process.exit(2);
  }

  const dir = mkdtempSync(join(tmpdir(), "kit-run-"));
  const schemaPath = join(dir, "veredicto.schema.json");
  writeFileSync(schemaPath, JSON.stringify(ESQUEMA_VEREDICTO));

  let relanzamientos = h.usados;
  let fallasTarea = h.fallasTarea;
  let pasoActual = pasoTres ? 3 : h.paso;
  // El paso 3 cuenta como un relanzamiento más (D1); su builder corre en el nivel superior (ver más abajo).
  if (pasoTres) relanzamientos++;
  let nivelPaso3 = null;
  let modeloPaso3 = null;
  let etiquetaPaso3 = null;
  let fallosVerificacion = new Set();
  let prompt = promptBuilder(planRel, tramo, null);
  if (pasoTres) {
    const ultimo = ultimoErrorDelPlan(texto0);
    const consejoTres = consejoDelPlan(texto0, tramo);
    prompt = promptBuilder(planRel, tramo, `${ultimo}\n\n${textoHandoff({ planPath, raiz, error: ultimo })}${consejoTres ? `\n\nConsejo del planner:\n${consejoTres}` : ""}`);
  } else if (consejo !== null) {
    // Relanzamiento 2 con el consejo: conserva el último error del plan y añade el handoff.
    relanzamientos++;
    pasoActual = 2;
    const ultimo = ultimoErrorDelPlan(texto0);
    prompt = promptBuilder(planRel, tramo, `${ultimo}\n\n${textoHandoff({ planPath, raiz, error: ultimo })}\n\nConsejo del planner:\n${consejo}`);
  }
  let final = null;
  // Intento en curso: se completa a medida que corre el builder, la verificación y el revisor.
  let intento = null;
  const volcarIntento = () => { if (intento !== null) { registrar(rutaRegistro, intento); intento = null; } };
  // Intento nuevo: clase null, paso en curso (0 al empezar; un relanzamiento por infraestructura no lo avanza) y resuelto_por null hasta una línea DONE.
  const nuevoIntento = () => ({ plan: planRel, tramo: tramo ? Number(tramo) : null, fecha: new Date().toISOString(), herramienta: a.herramienta, builder_modelo: builderModelo, builder_ms: null, verify_ms: null, revisor_ms: null, resultado: null, motivo_relanzamiento: null, relanzamientos, huella_inicio: fingerprintTree(raiz), huella_fin: null, puerta: null, puerta_ms: null, clase: null, paso: pasoActual, resuelto_por: null });
  // Falla de tarea (verificación, puerta o revisor): la primera relanza con handoff (paso 1); la segunda deja `final`
  // pidiendo consejo; sin cupo se agota. Devuelve true si relanza.
  const fallaTarea = ({ cuerpo, motivoRelanzamiento, motivo, msg, senal }) => {
    fallasTarea++;
    const d = decidir({ clase: "tarea", usados: relanzamientos, limite: MAX_RELANZAMIENTOS, fallasTarea, consejo: consejo !== null });
    if (d.accion === "relanzar") {
      intento.resultado = "devuelto";
      intento.motivo_relanzamiento = motivoRelanzamiento;
      relanzamientos++;
      pasoActual = d.paso;
      const bloqueConsejo = d.paso === 2 ? `\n\nConsejo del planner:\n${consejo}` : "";
      prompt = promptBuilder(planRel, tramo, `${cuerpo}${resumenParaRelanzar(planPath)}\n\n${textoHandoff({ planPath, raiz, error: cuerpo })}${bloqueConsejo}`);
      return true;
    }
    if (d.accion === "consejo") {
      final = { pausa: true, motivo, msg: `paso 2: escribe «Consejo (tramo ${tramo ?? 1}): …» y vuelve a lanzar. Fallo: ${msg}`, clase: "tarea", senal };
      return false;
    }
    final = { pausa: true, motivo, msg: `escalera agotada: ${msg}${pasoTres ? "" : ". Para otro relanzamiento la persona aprueba --paso 3"}`, clase: "tarea", senal };
    return false;
  };
  // Señal de progreso: el log va junto al plan; bloqueo «corte por tope» lo escribe kit run (origen kitrun).
  const rutaProgreso = join(dirname(planPath), "progress.jsonl");
  const bloqueoCorte = () => { if (PROGRESO) anexar(rutaProgreso, evento("bloqueo", { seg: tramo ?? null, o: "kitrun", texto: "corte por tope" })); };
  let corte = false;
  let inicioPrimera = null;

  try {
    for (;;) {
      volcarIntento();
      // Relanzamientos previos a este intento: el intento que relanza deja 0 y el siguiente 1.
      intento = nuevoIntento();
      // El builder (execute-plan, paso 3) pone «in progress» al empezar; cada corrida, relanzamientos incluidos, arranca con «approved».
      fijarEstado(planPath, "approved");
      console.error(`kit-run: builder (corrida ${relanzamientos + 1})`);
      const inicioRun = Date.now();
      if (inicioPrimera === null) inicioPrimera = inicioRun;
      const vigilante = lanzarVigilante(planPath, a.herramienta, raiz, inicioRun);
      // Pegado: sin escrituras ni eventos de avance durante el umbral, el builder se corta (cortar) o se registra (observar).
      let pegadoCorte = null;
      const vigilarPegado = () => {
        const r = evaluarPegado(leerEventos(rutaProgreso).eventos, { ahora: Date.now(), inicioMs: inicioRun, config: PEGADO, declarados: PEGADO.largos });
        if (r.estado !== "pegado") return { cortar: false };
        if (PEGADO.modo === "cortar") {
          pegadoCorte = r;
          if (PROGRESO) anexar(rutaProgreso, evento("bloqueo", { seg: tramo ?? null, o: "kitrun", texto: `pegado: ${r.patron}` }));
          return { cortar: true, motivo: r.patron };
        }
        if (intento !== null && intento.pegado === undefined) {
          intento.pegado = { modo: PEGADO.modo, patron: r.patron, detalle: r.detalle, minuto: Math.round((Date.now() - inicioRun) / MINUTO) };
          if (PROGRESO) anexar(rutaProgreso, evento("bloqueo", { seg: tramo ?? null, o: "kitrun", texto: `pegado (observado): ${r.patron}` }));
        }
        return { cortar: false };
      };
      const correrBuilder = () => correrVigilado(comando("BUILDER", a.herramienta, raiz), prompt, raiz, {
        tope: topeMs("BUILDER"),
        intervaloMs: PEGADO.intervaloMs,
        vigilar: PEGADO.modo === "apagado" ? null : vigilarPegado,
      });
      // Paso 3: el builder corre en el nivel superior. La copia de FLUCASTR_MODELOS vive solo durante esa corrida; el revisor no la ve.
      const cm = await medirAsync(() => (pasoTres
        ? conNivelSuperior(RAIZ_KIT, async ({ nivel }) => {
          nivelPaso3 = nivel;
          modeloPaso3 = MODELOS_KIT.resolverModelo("builder", MODELO_HERRAMIENTA[a.herramienta]);
          etiquetaPaso3 = etiquetaBuilder(a.herramienta);
          intento.builder_modelo = etiquetaPaso3;
          return correrBuilder();
        })
        : correrBuilder()));
      vigilante?.kill("SIGTERM");
      const c = cm.valor;
      if (porTope(c)) { corte = true; bloqueoCorte(); }
      intento.builder_ms = cm.ms;
      intento.huella_fin = fingerprintTree(raiz);
      if (pegadoCorte !== null && /^cortado: /.test(String(c.error ?? ""))) {
        final = { pausa: true, motivo: "access", msg: `builder pegado (${pegadoCorte.patron}): ${pegadoCorte.detalle}`, pegado: pegadoCorte, clase: "tarea" };
        break;
      }
      const primera = c.stdout.trim().split("\n")[0] ?? "";
      if (c.error || c.status !== 0) {
        // Proceso muerto: infra se repite con el mismo modelo mientras queden cupos; entorno devuelve a la persona.
        const cl = clasificar({ origen: "builder", status: c.status, error: c.error, salida: ultimasLineas(c.stderr), retorno: primera });
        intento.clase = cl.clase;
        if (decidir({ clase: cl.clase, usados: relanzamientos, limite: MAX_RELANZAMIENTOS }).accion === "relanzar") {
          intento.resultado = "devuelto";
          intento.motivo_relanzamiento = "infra";
          relanzamientos++;
          continue;
        }
        final = { pausa: true, motivo: "access", msg: `el builder falló (${c.error ?? `exit ${c.status}`}): ${cola(c.stderr)}`, clase: cl.clase, senal: cl.senal };
        break;
      }
      if (primera.startsWith("PAUSED")) {
        const m = primera.match(/motivo=([a-zé]+)/);
        const cl = clasificar({ origen: "builder", status: 0, retorno: primera });
        intento.clase = cl.clase;
        // PAUSED motivo=verify del builder es una falla de tarea: entra en la escalera (paso 1, consejo, agotada).
        if (cl.clase === "tarea") {
          if (fallaTarea({ cuerpo: `Builder paused (motivo=verify): ${primera}`, motivoRelanzamiento: "verify", motivo: "verify", msg: primera, senal: cl.senal })) continue;
          break;
        }
        final = { pausa: true, motivo: m ? m[1] : "alcance", msg: primera, clase: cl.clase, senal: cl.senal };
        break;
      }
      if (!primera.startsWith("DONE")) {
        const cl = clasificar({ origen: "builder", status: 0, retorno: primera });
        final = { pausa: true, motivo: "access", msg: `retorno del builder inválido: «${primera}»`, clase: cl.clase, senal: cl.senal };
        break;
      }

      console.error("kit-run: verificación");
      // Verificación: el comando del plan (sección ## Verification) en la raíz; KIT_RUN_VERIFY lo reemplaza por un ejecutable.
      const vm = medir(() => process.env.KIT_RUN_VERIFY
        ? correr({ exe: process.env.KIT_RUN_VERIFY, args: [] }, null, raiz, false, topeMs("VERIFY"))
        : correr({ exe: verificacion }, null, raiz, true, topeMs("VERIFY")));
      const v = vm.valor;
      if (porTope(v)) { corte = true; bloqueoCorte(); }
      intento.verify_ms = vm.ms;
      if (v.status !== 0 || v.error) {
        // Verificación con entorno no verificable (disco, Docker, tope, etc.): pausa sin relanzar; una tarea sigue el relanzamiento de siempre.
        const cl = clasificar({ origen: "verify", status: v.status, error: v.error, salida: ultimasLineas(v.stdout + v.stderr) });
        intento.clase = cl.clase;
        if (cl.clase !== "tarea") {
          final = { pausa: true, motivo: "verify", msg: `la verificación no es verificable (${cl.senal}): ${cola(v.stdout + v.stderr)}`, clase: cl.clase, senal: cl.senal };
          break;
        }
        const causa = claveFalloVerificacion(v);
        if (continuidad && fallosVerificacion.has(causa)) {
          final = { pausa: true, motivo: "verify", msg: `la verificación repitió la misma causa: ${cola(v.stdout + v.stderr)}`, clase: "tarea", senal: "verify" };
          break;
        }
        fallosVerificacion.add(causa);
        if (fallaTarea({ cuerpo: `Verification failed (exit ${v.status}). Output:\n${cola(v.stdout + v.stderr)}`, motivoRelanzamiento: "verify", motivo: "verify", msg: `verify no pasó tras ${relanzamientos + 1} corridas del builder: ${cola(v.stdout + v.stderr)}`, senal: "verify" })) continue;
        break;
      }

      // Puerta mecánica: si bloquea, no hay revisor; el builder recibe la lista exacta y el mismo contador de relanzamientos.
      console.error("kit-run: puerta mecánica");
      const pm = medir(() => ejecutarPuerta({ planPath, raiz, tramo }));
      const puerta = pm.valor;
      intento.puerta = puerta.estado;
      intento.puerta_ms = pm.ms;
      if (puerta.bloquea) {
        intento.clase = "tarea";
        if (fallaTarea({ cuerpo: textoParaBuilder(puerta), motivoRelanzamiento: "puerta", motivo: puerta.motivo, msg: `la puerta mecánica no pasó tras ${relanzamientos + 1} corridas del builder: ${puerta.lista.join("; ")}`, senal: "puerta" })) continue;
        break;
      }

      console.error("kit-run: revisión (solo lectura)");
      const diff = correr({ exe: "git", args: ["diff", "HEAD"] }, null, raiz).stdout;
      const antes = fingerprintTree(raiz);
      // Revisor en solo lectura. Si muere por infraestructura se repite solo el revisor, con el mismo modelo y el contador compartido (D3); no se relanza al builder.
      const revisar = () => {
        for (;;) {
          const rm = medir(() => correr(comando("REVIEWER", a.herramienta, raiz, schemaPath), promptRevisor(planRel, diff.slice(0, 60000), ESQUEMA_VEREDICTO, textoParaRevisor(puerta)), raiz, false, topeMs("REVIEWER")));
          const r = rm.valor;
          if (porTope(r)) { corte = true; bloqueoCorte(); }
          intento.revisor_ms = rm.ms;
          if (fingerprintTree(raiz) !== antes) return { r, modificado: true };
          if (!r.error && r.status === 0) return { r, modificado: false };
          const cl = clasificar({ origen: "revisor", status: r.status, error: r.error, salida: ultimasLineas(r.stderr) });
          intento.clase = cl.clase;
          if (decidir({ clase: cl.clase, usados: relanzamientos, limite: MAX_RELANZAMIENTOS }).accion !== "relanzar") return { r, modificado: false, clase: cl.clase, senal: cl.senal };
          intento.resultado = "devuelto";
          intento.motivo_relanzamiento = "infra";
          volcarIntento();
          relanzamientos++;
          intento = { ...nuevoIntento(), huella_fin: fingerprintTree(raiz) };
        }
      };
      const rv = revisar();
      const r = rv.r;
      if (rv.modificado) { final = { pausa: true, motivo: "access", msg: "el revisor modificó el árbol de trabajo; se rechaza su veredicto", clase: "entorno", senal: "arbol_modificado" }; break; }
      if (rv.clase) { final = { pausa: true, motivo: "access", msg: `el revisor falló (${r.error ?? `exit ${r.status}`})`, clase: rv.clase, senal: rv.senal }; break; }
      const val = validarVeredicto(r.stdout);
      if (!val.ok) { final = { pausa: true, motivo: "verify", msg: `veredicto del revisor inválido (${val.error}): ${cola(r.stdout)}`, clase: "entorno", senal: "veredicto_invalido" }; break; }
      const dv = val.datos;
      if (dv.veredicto === "APPROVED") { intento.resultado = "DONE"; final = { aprobado: true }; break; }
      if (dv.veredicto === "PAUSED") { final = { pausa: true, motivo: "design", msg: `el revisor pide pausa: ${JSON.stringify(dv.defectos)}`, clase: "decision", senal: "motivo=design" }; break; }
      intento.clase = "tarea";
      if (fallaTarea({ cuerpo: `The review returned these defects:\n${JSON.stringify(dv.defectos, null, 2)}`, motivoRelanzamiento: "revisor", motivo: "design", msg: `revisión devuelta tras ${relanzamientos + 1} corridas: ${JSON.stringify(dv.defectos)}`, senal: "RETURNED" })) continue;
      break;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // El último intento no se relanza: su resultado es DONE si se aprobó, o PAUSED en otro caso.
  if (intento !== null) {
    intento.resultado = final.aprobado ? "DONE" : "PAUSED";
    intento.clase = final.aprobado ? null : (final.clase ?? null);
    intento.resuelto_por = final.aprobado ? intento.paso : null;
    volcarIntento();
  }
  const { hechos, total } = progreso(planPath);
  cerrarProgreso({ planPath, herramienta: a.herramienta, raiz, desde: inicioPrimera ?? Date.now(), resultado: final.aprobado ? "DONE" : "PAUSED", motivo: final.motivo, corte: corte && !final.aprobado, nombre: planRel });
  // Corte por pegado: nota con lo hecho, la primera casilla pendiente y la causa. Las casillas no se tocan.
  if (final.pegado) {
    const pendiente = casillasDelPlan(planPath).casillas.find((c) => !c.marcada)?.texto ?? "ninguna";
    anotarNotas(planPath, `builder pegado (${final.pegado.patron}); hecho=${hechos}/${total}; falta=${pendiente}; causa=${final.pegado.detalle}. No se relanzó; revisar el plan antes de reanudar.`);
  }
  if (final.aprobado) {
    fijarEstado(planPath, "done");
    anotarNotas(planPath, `revisión APPROVED tras ${relanzamientos + 1} corrida(s) del builder; verify pasó; revisor=${revisor}.`);
    veredictoOut(`DONE: plan=${planRel}; ${pieza}verify=pasa`);
    process.exit(0);
  }
  fijarEstado(planPath, "partial");
  anotarNotas(planPath, `PAUSED (${final.motivo}): ${final.msg.replace(/\n/g, " ").slice(0, 600)}; revisor=${revisor}.`);
  // Entorno, plan, decisión o infraestructura agotada: diagnóstico sin relevo; las tareas no llevan diagnóstico.
  if (final.clase && final.clase !== "tarea") anotarNotas(planPath, diagnostico({ clase: final.clase, senal: final.senal }));
  // Paso 3 que falló por tarea: nota paso 4 con los créditos y la pregunta de relevo. Entorno, plan, decisión o infra no la llevan.
  if (pasoTres && final.clase === "tarea") {
    anotarNotas(planPath, notaPaso4({ causa: final.msg, nivel: nivelPaso3 ?? "?", modeloBuilder: modeloPaso3 ?? "?", modeloPlanner: MODELOS_KIT.resolverModelo("planner", MODELO_HERRAMIENTA[a.herramienta]), tokens: a.tokens, tarifas: tarifasDelKit() }));
  }
  veredictoOut(`PAUSED: plan=${planRel}; ${pieza}motivo=${final.motivo}; hecho=${hechos}/${total}; siguiente=revisar la nota de kit run en el plan; no_intentado=${final.msg.replace(/\n/g, " ").slice(0, 300)}`);
  process.exit(1);
}

await main();
