// Escalera de recuperación para el flujo por subagente (A8 de changes/escalera-recuperacion/plan.md). El planner pasa el
// retorno o el error de un subagente builder; el comando imprime clase, acción y paso, y registra el intento en
// changes/<nombre>/runs.jsonl. No lanza procesos de modelos: reutiliza las funciones de tools/run/ que usa kit run.
// uso: node scripts/kit-escalera.mjs <plan.md> (--salida <archivo> | --resuelto) [--paso 3|4] [--herramienta claude|pi|codex]
//      [--tokens entrada,caché,salida] [--raiz <dir>]
// Salida: 0 con acción; 2 por uso o por una combinación no permitida.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { frontmatter } from "../tools/run/plan.mjs";
import { correr } from "../tools/run/process.mjs";
import { registrar } from "../tools/run/registro.mjs";
import { clasificar } from "../tools/run/clasificar.mjs";
import { MAX_CONSEJO, MAX_RELANZAMIENTOS, consejoDelPlan, decidir, diagnostico, historial, ultimasLineas } from "../tools/run/escalera.mjs";
import { decisionesUsadas, handoff } from "../tools/run/handoff.mjs";
import { conNivelSuperior } from "../tools/run/nivel.mjs";
import { leerTokens, notaPaso4 } from "../tools/run/estimar.mjs";
import { crearResolucionModelos } from "../tools/model-resolution/models.mjs";
import { casillasDelPlan } from "./progress-watch.mjs";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HERRAMIENTAS = ["codex", "claude", "pi"];
// Herramienta → perfil de models.json (igual que kit run).
const MODELO_HERRAMIENTA = { codex: "codex", claude: "claude-code", pi: "pi" };
const MODELOS = crearResolucionModelos(RAIZ_KIT);
const USO = "uso: node scripts/kit-escalera.mjs <plan.md> (--salida <archivo> | --resuelto) [--paso 3|4] [--herramienta claude|pi|codex] [--tokens entrada,caché,salida] [--raiz <dir>]";
// Paso 3 (y su cierre con --resuelto --paso 3): escalera agotada y sin un paso 3 previo con falla de tarea.
const pasoTresPermitido = (h) => h.usados >= MAX_RELANZAMIENTOS && h.fallasTarea >= 1 && !h.pasoTresTarea;
const mensajePasoTres = (plan, h) => `--paso 3 solo vale con la escalera de ${plan} agotada (${h.usados} relanzamientos y ${h.fallasTarea} fallas de tarea en runs.jsonl) y sin paso 3 previo con tarea`;

function fallar(mensaje, { conUso = false } = {}) {
  console.error(`error: ${mensaje}`);
  if (conUso) console.error(USO);
  process.exit(2);
}

function leerArgs(argv) {
  const a = { plan: null, salida: null, resuelto: false, paso: null, herramienta: "codex", tokens: null, raiz: RAIZ_KIT };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--salida") a.salida = argv[++i] ?? "";
    else if (x === "--resuelto") a.resuelto = true;
    else if (x === "--paso") {
      const v = argv[++i];
      if (v !== "3" && v !== "4") fallar("--paso solo admite 3 (nivel superior del builder) o 4 (relevo, con --resuelto)", { conUso: true });
      a.paso = Number(v);
    }
    else if (x === "--herramienta") a.herramienta = argv[++i];
    else if (x === "--tokens") a.tokens = argv[++i] ?? "";
    else if (x === "--raiz") a.raiz = resolve(argv[++i] ?? "");
    else if (x.startsWith("--")) fallar(`opción desconocida ${x}`, { conUso: true });
    else if (a.plan === null) a.plan = x;
    else fallar(`sobra el argumento ${x}`, { conUso: true });
  }
  if (!a.plan) fallar("falta el plan", { conUso: true });
  if (a.resuelto === (a.salida !== null)) fallar("indica --salida <archivo> o --resuelto, uno de los dos", { conUso: true });
  if (!a.resuelto && a.paso === 4) fallar("--paso 4 solo vale con --resuelto (relevo que termina DONE)", { conUso: true });
  if (!HERRAMIENTAS.includes(a.herramienta)) fallar(`herramienta «${a.herramienta}» no existe`, { conUso: true });
  if (a.tokens !== null) {
    const t = leerTokens(a.tokens);
    if (t === null) fallar("--tokens espera entrada,caché,salida: tres enteros ≥ 0", { conUso: true });
    a.tokens = t;
  }
  return a;
}

// Registro de intentos (runs.jsonl). Si no se puede leer, se cuenta desde cero y se avisa.
function lineasRegistro(ruta) {
  try {
    return readFileSync(ruta, "utf8").split("\n");
  } catch (e) {
    if (e.code !== "ENOENT") console.error(`kit-escalera: el registro ${ruta} no se puede leer (${e.message}); se cuenta desde cero`);
    return [];
  }
}

// Tarifas de scripts/rates.json del kit; sin archivo legible no hay ninguna: la nota dice «sin tarifa».
function tarifasDelKit() {
  try { return JSON.parse(readFileSync(join(RAIZ_KIT, "scripts", "rates.json"), "utf8")).modelos ?? {}; } catch { return {}; }
}

// Modelo que models.json da a un agente con la herramienta; «?» si no se puede resolver.
function modeloDe(agente, herramienta) {
  try { return MODELOS.resolverModelo(agente, MODELO_HERRAMIENTA[herramienta]); } catch { return "?"; }
}

// Nivel superior del builder y su modelo; null si no hay superior. conNivelSuperior copia la configuración solo durante la llamada.
async function nivelSuperior(herramienta) {
  try {
    return await conNivelSuperior(RAIZ_KIT, async ({ nivel }) => ({ nivel, modelo: modeloDe("builder", herramienta) }));
  } catch {
    return null;
  }
}

// Archivos cambiados (git status) para el handoff; sin git, texto vacío.
function archivosTocados(raiz) {
  return correr({ exe: "git", args: ["status", "--porcelain"] }, null, raiz).stdout ?? "";
}

async function main() {
  const a = leerArgs(process.argv.slice(2));
  const planPath = resolve(a.raiz, a.plan);
  if (!existsSync(planPath)) fallar(`no existe el plan ${a.plan}`);
  const texto = readFileSync(planPath, "utf8");
  const tramo = frontmatter(texto).segment;
  const numTramo = tramo ? Number(tramo) : null;
  const ruta = join(dirname(planPath), "runs.jsonl");
  const h = historial(lineasRegistro(ruta), a.plan, numTramo);
  const base = (campos) => ({
    plan: a.plan, tramo: numTramo, fecha: new Date().toISOString(), herramienta: a.herramienta, builder_modelo: null,
    builder_ms: null, verify_ms: null, revisor_ms: null, resultado: null, motivo_relanzamiento: null, relanzamientos: h.usados,
    huella_inicio: null, huella_fin: null, puerta: null, puerta_ms: null, clase: null, paso: h.paso, resuelto_por: null, senal: null,
    ...campos,
  });

  // --resuelto: la persona (o el planner tras revisar) confirma que el tramo está resuelto. Sin --paso, el paso que lo resolvió
  // es el mayor del tramo; con --paso 3 o --paso 4 (DONE del paso 3 o del relevo) es ese paso, con las mismas condiciones.
  if (a.resuelto) {
    if (a.paso === 3 && !pasoTresPermitido(h)) fallar(mensajePasoTres(a.plan, h));
    if (a.paso === 4 && !h.pasoTresTarea) fallar("--paso 4 solo vale tras un paso 3 que falló por tarea (relevo)");
    const resueltoPor = a.paso ?? h.paso;
    const ok = registrar(ruta, base({ resultado: "DONE", paso: resueltoPor, resuelto_por: resueltoPor }));
    console.log(`accion=resuelto; resuelto_por=${resueltoPor}`);
    process.exit(ok ? 0 : 1);
  }

  let salida;
  try {
    salida = readFileSync(resolve(a.salida), "utf8");
  } catch (e) {
    fallar(`no se puede leer ${a.salida} (${e.message})`);
  }
  const retorno = salida.split("\n").map((l) => l.trim()).find((l) => /^(DONE|PAUSED)\b/.test(l)) ?? "";
  if (retorno.startsWith("DONE")) fallar("la salida dice DONE: el resultado final se registra con --resuelto tras la revisión", { conUso: false });

  // Sin DONE ni PAUSED el texto cuenta como proceso muerto (clasificar lo lee con status 1).
  const clas = clasificar({ origen: "builder", status: retorno ? 0 : 1, retorno, salida: ultimasLineas(salida) });

  // --paso 3 (aprobado por la persona): solo con la escalera agotada y sin un paso 3 previo con falla de tarea.
  const pasoTres = a.paso === 3;
  if (pasoTres && !pasoTresPermitido(h)) fallar(mensajePasoTres(a.plan, h));

  const fallasTarea = h.fallasTarea + (clas.clase === "tarea" ? 1 : 0);
  const consejo = consejoDelPlan(texto, numTramo);
  const d = decidir({ clase: clas.clase, usados: h.usados, limite: MAX_RELANZAMIENTOS, fallasTarea, consejo: consejo !== null });

  // Consejo pendiente: no hay intento que registrar. El planner lo escribe y vuelve a llamar con el mismo --salida.
  if (!pasoTres && d.accion === "consejo") {
    console.log("clase=tarea; accion=consejo; paso=2");
    console.log(`Escribe «Consejo (tramo ${numTramo ?? 1}): …» en el plan (una línea, ≤ ${MAX_CONSEJO} caracteres) y vuelve a llamar con el mismo --salida. Sin registro hasta entonces.`);
    process.exit(0);
  }

  const relanza = !pasoTres && d.accion === "relanzar";
  const paso = pasoTres ? 3 : relanza ? (d.paso ?? 0) : h.paso;
  // Relanzar y el paso 3 cuentan como un relanzamiento más (D1 y D3).
  const usados = h.usados + (relanza || pasoTres ? 1 : 0);
  const ok = registrar(ruta, base({
    resultado: relanza ? "devuelto" : "PAUSED",
    clase: clas.clase,
    paso,
    relanzamientos: usados,
    motivo_relanzamiento: relanza ? clas.senal : null,
    senal: clas.senal,
  }));

  const lineas = [`clase=${clas.clase}; accion=${relanza ? "relanzar" : "devolver"}; paso=${paso}`];
  if (relanza && clas.clase === "tarea") {
    lineas.push(handoff({ casillas: casillasDelPlan(planPath).casillas, decisiones: decisionesUsadas(texto), archivos: archivosTocados(a.raiz), error: salida }));
    if (paso === 2) lineas.push(`Consejo del planner:\n${consejo}`);
  }
  if (!relanza && clas.clase !== "tarea") lineas.push(diagnostico({ clase: clas.clase, senal: clas.senal }));
  // Falla de tarea agotada sin paso 3 previo: se propone el paso 3 con el nivel superior, solo con el sí de la persona.
  if (!relanza && !pasoTres && clas.clase === "tarea" && !h.pasoTresTarea) {
    const sup = await nivelSuperior(a.herramienta);
    if (sup) lineas.push(`propuesta: paso 3 con el nivel ${sup.nivel} (modelo ${sup.modelo}); solo con tu sí. Si lo das, corre el builder en ese nivel: si termina DONE, cierra con \`--resuelto --paso 3\`; si falla, vuelve a llamar con --paso 3 y el mismo --salida.`);
  }
  // Paso 3 que falló por tarea: nota paso 4 con los créditos estimados y la pregunta de relevo. Otras clases no la llevan.
  if (pasoTres && clas.clase === "tarea") {
    const sup = await nivelSuperior(a.herramienta);
    lineas.push(notaPaso4({
      causa: retorno || ultimasLineas(salida),
      nivel: sup?.nivel ?? "?",
      modeloBuilder: sup?.modelo ?? "?",
      modeloPlanner: modeloDe("planner", a.herramienta),
      tokens: a.tokens,
      tarifas: tarifasDelKit(),
      cierre: "si el relevo termina DONE, cierra con `--resuelto --paso 4`.",
    }));
  }
  for (const l of lineas) console.log(l);
  if (!ok) process.exit(1);
}

await main();
