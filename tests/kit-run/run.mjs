#!/usr/bin/env node
// Arnés de kit run con builder, verificación y revisor simulados (A1, A2, A3, A5).
// Cada caso corre scripts/kit-run.mjs en un repo git temporal con ejecutables falsos.
// Los falsos anotan cada invocación en un registro JSON-lines; el caso lo lee y compara.
// Sin red, sin CLIs reales, sin escribir fuera de un temporal que se borra al salir.

import assert from "node:assert/strict";
import { appendFileSync, chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { fileURLToPath } from "node:url";
import { promptRevisor } from "../../tools/run/prompts.mjs";
import { ESQUEMA_VEREDICTO } from "../../tools/run/verdict.mjs";
import { ejecutarPuerta, filasCheck, herramientasFaltantes, textoParaBuilder, textoParaRevisor } from "../../tools/run/puerta.mjs";

const KIT = fileURLToPath(new URL("../../scripts/kit-run.mjs", import.meta.url));
const KIT_RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const PLAN_REL = "changes/prueba/plan.md";
const PLAN = `---
status: approved
branch: feature/prueba
base: main
repos: [.]
executor: builder
segment: 1
---
# Prueba de kit run

## Scope
- \`creado.txt\`
- \`segundo.txt\`

## Steps
### Segment 1 — Story: prueba
Acceptance:
- A1: creado.txt existe; check with \`node -e "process.exit(require('fs').existsSync('creado.txt')?0:1)"\`; expect exit 0.
TODO:
- [x] crear creado.txt. Check: \`node -e "process.exit(require('fs').existsSync('creado.txt')?0:1)"\`; expect exit 0.

## Verification
\`./verify\`

## Evidence
A1:
$ node -e "process.exit(require('fs').existsSync('creado.txt')?0:1)"
exit 0
`;
const PLAN_CONTINUA = PLAN.replace("segment: 1\n", "segment: 1\ncontinuity: continuous\n")
  .replace("- [x] crear creado.txt", "- [ ] crear primero.txt\n- [ ] crear segundo.txt");

const CABECERA = `#!${process.execPath}\n`;
const REGISTRO = `
import { appendFileSync, readFileSync } from "node:fs";
const args = process.argv.slice(2);
const entrada = (() => { try { return readFileSync(0, "utf8"); } catch { return ""; } })();
export function anotar(rol, extra = {}) {
  appendFileSync(process.env.KR_LOG, JSON.stringify({ rol, args, entrada, ...extra }) + "\\n");
}
`;
const FALSOS = {
  // Builder: crea creado.txt en la raíz del repo y devuelve DONE.
  "builder.mjs": `${CABECERA}${REGISTRO}
import { writeFileSync } from "node:fs";
import { join } from "node:path";
// Como execute-plan (paso 1): solo arranca con status approved; lo pasa a in progress al empezar.
const planPath = join(process.cwd(), "changes/prueba/plan.md");
const estado = readFileSync(planPath, "utf8").match(/^status: (.*)$/m)[1];
anotar("builder", { estado });
if (estado !== "approved") {
  console.log("PAUSED: plan=changes/prueba/plan.md; segment=1; motivo=ambiguous; hecho=0/1; siguiente=arrancar con el plan aprobado; no_intentado=el plan llegó con status " + estado);
  process.exit(0);
}
// Como execute-plan: al terminar con verify pasado deja status done (kit-close espera done con DONE).
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
// FAKE_BUILDER_SIN_ARCHIVO=1: nunca crea creado.txt; FAKE_BUILDER_SIN_ARCHIVO_HASTA=n: no lo crea en las n primeras corridas.
const corridas = readFileSync(process.env.KR_LOG, "utf8").split("\\n").filter(l => l.includes('"rol":"builder"')).length;
const sinArchivo = process.env.FAKE_BUILDER_SIN_ARCHIVO === "1" || corridas <= Number(process.env.FAKE_BUILDER_SIN_ARCHIVO_HASTA || 0);
if (!sinArchivo) writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
if (process.env.FAKE_BUILDER_FUERA === "1") writeFileSync(join(process.cwd(), "extra.txt"), "fuera de Scope\\n");
if (readFileSync(planPath, "utf8").includes("continuity: continuous")) {
  let plan = readFileSync(planPath, "utf8").replace("- [ ] crear primero.txt", "- [x] crear primero.txt")
    .replace("- [ ] crear segundo.txt", "- [x] crear segundo.txt")
    .replace("segment: 1", "segment: 2");
  writeFileSync(planPath, plan);
  writeFileSync(join(process.cwd(), "segundo.txt"), "hecho\\n");
  console.log("DONE: plan=changes/prueba/plan.md; segment=2; verify=pasa");
  process.exit(0);
}
console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
`,
  // Builder con progreso falso (casos D1–D5): escribe eventos en changes/prueba/progress.jsonl según FAKE_PEGADO_ESCENARIO
  // (progreso: avance continuo; sondeos: sleep 1 repetidos sin avance; verify: ./verify en curso sin escribir) durante
  // FAKE_PEGADO_SEGUNDOS, y luego deja DONE como builder.mjs. Si lo corta kit run, muere antes de llegar al final.
  "builder-pegado.mjs": `${CABECERA}${REGISTRO}
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const planPath = join(process.cwd(), "changes/prueba/plan.md");
const progresoPath = join(process.cwd(), "changes/prueba/progress.jsonl");
const estado = readFileSync(planPath, "utf8").match(/^status: (.*)$/m)[1];
anotar("builder", { estado });
const emitir = (tipo, campos) => appendFileSync(progresoPath, JSON.stringify({ t: new Date().toISOString(), seg: null, tipo, o: "automatico", ...campos }) + "\\n");
const dormir = (ms) => new Promise(resolver => setTimeout(resolver, ms));
const escenario = process.env.FAKE_PEGADO_ESCENARIO || "progreso";
const hasta = Date.now() + Number(process.env.FAKE_PEGADO_SEGUNDOS || 4) * 1000;
if (escenario === "progreso") {
  emitir("paso_iniciado", {});
  for (let n = 1; Date.now() < hasta; n++) {
    emitir("archivo_editado", { archivo: "trabajo" + n + ".txt" });
    await dormir(100);
  }
} else if (escenario === "sondeos") {
  for (let n = 1; Date.now() < hasta; n++) {
    emitir("comando_iniciado", { id: String(n), cmd: "sleep 1" });
    await dormir(100);
    emitir("comando_terminado", { id: String(n), exit: 0 });
    await dormir(50);
  }
} else if (escenario === "verify") {
  emitir("comando_iniciado", { id: "v", cmd: "./verify" });
  await dormir(Math.max(0, hasta - Date.now()));
  emitir("comando_terminado", { id: "v", exit: 0 });
}
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
`,
  // Verificación: falla si FAKE_VERIFY_FALLA=1.
  "verify.mjs": `${CABECERA}${REGISTRO}
anotar("verify");
const n = readFileSync(process.env.KR_LOG, "utf8").split("\\n").filter(l => l.includes('"rol":"verify"')).length;
if (process.env.FAKE_VERIFY_FALLA === "1" || n <= Number(process.env.FAKE_VERIFY_FALLA_HASTA || 0)) { console.log("verify: fallo simulado"); process.exit(1); }
console.log("verify: ok");
`,
  // codex falso (en el PATH, sin KIT_RUN_BUILDER/REVIEWER): registra argumentos y el esquema del --output-schema.
  // Builder: crea creado.txt y devuelve DONE; con FAKE_CODEX_CUELGA=1 no termina (prueba el tope).
  // Revisor (con --output-schema): APPROVED.
  "codex": `${CABECERA}${REGISTRO}
import { readFileSync as leer, writeFileSync } from "node:fs";
import { join } from "node:path";
const rev = args.includes("--output-schema");
const esquema = rev ? JSON.parse(leer(args[args.indexOf("--output-schema") + 1], "utf8")) : null;
anotar(rev ? "reviewer" : "builder", { esquema: esquema ? Object.keys(esquema.properties) : null });
if (rev) {
  console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
} else if (process.env.FAKE_CODEX_CUELGA === "1") {
  setTimeout(() => {}, 60000);
} else {
  // Como execute-plan: deja el plan en done antes de devolver DONE (la puerta lo exige con DONE).
  const planPath = join(process.cwd(), "changes/prueba/plan.md");
  writeFileSync(planPath, leer(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
  writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
  console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
}
`,
  // Revisor: en read-only no escribe (el sandbox rechaza la escritura); con FAKE_REVIEWER_ESCRIBE_SIEMPRE=1 escribe
  // igual (sandbox roto). Devuelve RETURNED las primeras FAKE_DEVUELVE_HASTA veces, luego FAKE_VEREDICTO o APPROVED.
  "revisor.mjs": `${CABECERA}${REGISTRO}
import { writeFileSync, readFileSync as leer } from "node:fs";
import { join } from "node:path";
const lectura = args.includes("read-only");
const previas = leer(process.env.KR_LOG, "utf8").split("\\n").filter(l => l.includes('"rol":"reviewer"')).length;
const escribe = !lectura || process.env.FAKE_REVIEWER_ESCRIBE_SIEMPRE === "1";
if (escribe) writeFileSync(join(process.cwd(), "revisor.txt"), "escrito por el revisor\\n");
anotar("reviewer", { escribio: escribe });
const n = previas + 1;
if (process.env.FAKE_VEREDICTO) { console.log(process.env.FAKE_VEREDICTO); process.exit(0); }
if (n <= Number(process.env.FAKE_DEVUELVE_HASTA || 0)) {
  console.log(JSON.stringify({ veredicto: "RETURNED", defectos: [{ archivo: "creado.txt", linea: 1, criterio: "A1", descripcion: "falta el contenido esperado" }] }));
} else {
  console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
}
`,
};

const dir = mkdtempSync(join(tmpdir(), "kit-run-prueba-"));
const bin = join(dir, "bin");
mkdirSync(bin);
for (const [nombre, cuerpo] of Object.entries(FALSOS)) {
  const ruta = join(bin, nombre);
  writeFileSync(ruta, cuerpo);
  chmodSync(ruta, 0o755);
}
const exe = (n) => join(bin, n);

function git(raiz, ...a) {
  const r = spawnSyncSeguro("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", ...a], { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

// Repo temporal con el plan commiteado. Corre kit-run con los falsos y devuelve la salida y el registro.
// codex: true no fija KIT_RUN_BUILDER ni KIT_RUN_REVIEWER; el script llama a `codex` del PATH (el falso).
// git: false deja el directorio sin repo (sin huellas). antes(raiz) corre tras el commit, antes de kit run.
function correr(nombre, { plan = PLAN, env = {}, codex = false, git: conGit = true, antes = null, kit = KIT, builder = "builder.mjs", opciones = raiz => ["--root", raiz] } = {}) {
  const raiz = join(dir, nombre);
  mkdirSync(join(raiz, "changes/prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN_REL), plan);
  if (conGit) {
    git(raiz, "init", "-q", "-b", "main");
    git(raiz, "add", "-A");
    git(raiz, "commit", "-q", "-m", "base");
  }
  if (antes) antes(raiz);
  const log = join(dir, `${nombre}.log`);
  writeFileSync(log, "");
  const entorno = {
    ...process.env,
    KIT_RUN_VERIFY: exe("verify.mjs"),
    KR_LOG: log,
    FAKE_VERIFY_FALLA: "0",
    FAKE_VERIFY_FALLA_HASTA: "0",
    FAKE_REVIEWER_ESCRIBE_SIEMPRE: "0",
    FAKE_DEVUELVE_HASTA: "0",
    FAKE_VEREDICTO: "",
    FAKE_CODEX_CUELGA: "0",
    FAKE_BUILDER_SIN_ARCHIVO: "0",
    FAKE_BUILDER_SIN_ARCHIVO_HASTA: "0",
    FAKE_BUILDER_FUERA: "0",
    ...env,
  };
  delete entorno.KIT_RUN_TOPE_MS;
  // Pegado y progreso: nada del entorno de quien corre la prueba; solo lo que pase el caso en env.
  for (const clave of Object.keys(entorno)) {
    if ((/^KIT_RUN_PEGADO/.test(clave) || clave === "KIT_PROGRESO") && !(clave in env)) delete entorno[clave];
  }
  if (!env.FLUCASTR_MODELOS) delete entorno.FLUCASTR_MODELOS;
  if (codex) {
    delete entorno.KIT_RUN_BUILDER;
    delete entorno.KIT_RUN_REVIEWER;
    entorno.PATH = `${bin}${delimiter}${process.env.PATH}`;
  } else {
    entorno.KIT_RUN_BUILDER = exe(builder);
    entorno.KIT_RUN_REVIEWER = exe("revisor.mjs");
  }
  if (env.KIT_RUN_TOPE_MS) entorno.KIT_RUN_TOPE_MS = env.KIT_RUN_TOPE_MS;
  const r = spawnSyncSeguro(process.execPath, [kit, PLAN_REL, ...opciones(raiz)], { encoding: "utf8", env: entorno });
  const registro = readFileSync(log, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  const cuenta = (rol) => registro.filter(x => x.rol === rol).length;
  const estado = readFileSync(join(raiz, PLAN_REL), "utf8").match(/^status: (.*)$/m)[1];
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, registro, cuenta, estado, raiz, plan: readFileSync(join(raiz, PLAN_REL), "utf8") };
}

const casos = [];
function caso(nombre, fn) { casos.push({ nombre, fn }); }

function resultadoComparable(r) {
  const normalizar = valor => JSON.parse(JSON.stringify(valor).replaceAll(r.raiz, "<raiz>")
    .replace(/[^"\\ ]*\/kit-run-[^"\\ ]+\.json/g, "<esquema>"));
  return normalizar({ status: r.status, stdout: r.stdout, stderr: r.stderr, estado: r.estado, registro: r.registro });
}

caso("las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada", () => {
  const referencia = correr("opciones inglesas", { opciones: raiz => ["--tool", "codex", "--root", raiz] });
  assert.equal(referencia.status, 0, referencia.stderr);
  assert.equal(referencia.cuenta("builder"), 1);
  assert.equal(referencia.cuenta("reviewer"), 1);
  const repetida = correr("opciones inglesas repetidas", { opciones: raiz => ["--tool", "codex", "--root", raiz] });
  assert.deepEqual(resultadoComparable(repetida), resultadoComparable(referencia));
});

caso("las opciones en español se rechazan con código 2", () => {
  for (const opcion of ["--herramienta", "--raiz"]) {
    const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, opcion, "codex"], { cwd: dir, encoding: "utf8" });
    assert.equal(r.status, 2, `${opcion} ya no debe aceptarse`);
    assert.match(r.stderr, /opción desconocida/);
  }
});

caso("las opciones en inglés conservan los errores con argumentos ausentes", () => {
  for (const opcion of ["--tool", "--root"]) {
    const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, opcion], { cwd: dir, encoding: "utf8" });
    assert.notEqual(r.status, 0);
  }
});

function comprobarPromptRevisor(prompt) {
  assert.ok(prompt.includes("Read only; do not write anything."));
  assert.ok(prompt.includes("Return ONLY JSON that conforms to this schema, with no surrounding text:"));
  assert.ok(prompt.includes("APPROVED") && prompt.includes("RETURNED") && prompt.includes("PAUSED"));
}

caso("prompts productivo y de evaluación coinciden y detectan instrucciones ausentes", () => {
  const fuente = readFileSync(new URL("../luna-reviewer/measure.mjs", import.meta.url), "utf8");
  const esquema = fuente.match(/const ESQUEMA_VEREDICTO = (\{[\s\S]*?\n\});/);
  const funcion = fuente.match(/function promptRevisor\(planRel, diff\) \{([\s\S]*?)\n\}/);
  assert.ok(esquema && funcion, "la evaluación debe conservar su esquema y prompt comparables");
  const esquemaEvaluacion = Function(`return (${esquema[1]})`)();
  assert.deepEqual(esquemaEvaluacion, ESQUEMA_VEREDICTO);
  const evaluacion = Function("planRel", "diff", "ESQUEMA_VEREDICTO", funcion[1]);
  const diff = "diff --git a/ejemplo b/ejemplo\n+contenido real";
  const productivo = promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO);
  assert.equal(evaluacion(PLAN_REL, diff, esquemaEvaluacion), productivo);
  comprobarPromptRevisor(productivo);
  assert.throws(() => comprobarPromptRevisor(productivo.replace("Read only; do not write anything.", "")));
});

// A1: ciclo completo con simulados.
caso("A1 ciclo completo: done, builder una vez, revisor en solo lectura", () => {
  const r = correr("a1");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
  assert.equal(r.estado, "done");
  assert.ok(existsSync(join(r.raiz, "creado.txt")), "el builder debió crear creado.txt");
  assert.equal(r.cuenta("builder"), 1);
  assert.equal(r.cuenta("verify"), 1);
  assert.equal(r.cuenta("reviewer"), 1);
  const rev = r.registro.find(x => x.rol === "reviewer");
  assert.ok(rev.args.includes("read-only") && rev.args.includes("--output-schema"), `argumentos del revisor: ${rev.args}`);
  // A1: el prompt exacto antepone el contrato (core/agents/builder.md sin su cabecera) a la línea de ejecución.
  const contrato = readFileSync(new URL("../../core/agents/builder.md", import.meta.url), "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  assert.equal(r.registro.find(x => x.rol === "builder").entrada, `Builder contract:\n${contrato}\n\n---\nExecute plan ${PLAN_REL} (segment: 1) using the execute-plan skill. Respond with the return line.`);
  comprobarPromptRevisor(rev.entrada);
  assert.ok(rev.entrada.includes(JSON.stringify(ESQUEMA_VEREDICTO)) && rev.entrada.includes(`Review plan ${PLAN_REL}`));
  assert.ok(rev.entrada.includes("--- diff ---\n"));
  assert.match(r.stderr, /kit-run: verificación/);
  assert.match(r.plan, /- kit run: revisión APPROVED/);
});

// A2: tope de relanzamientos. Verify siempre falla: 3 corridas del builder, partial.
caso("A2 verify que siempre falla: 2 corridas del builder, la segunda falla pide consejo y partial", () => {
  const r = correr("a2", { env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=verify;/);
  assert.equal(r.cuenta("builder"), 2, "1 + 1 relanzamiento (paso 1); la segunda falla pausa pidiendo consejo");
  assert.equal(r.cuenta("verify"), 2);
  assert.match(r.plan, /paso 2: escribe «Consejo \(tramo 1\): …» y vuelve a lanzar/);
  assert.equal(r.cuenta("reviewer"), 0, "sin verify verde no hay revisión");
  assert.equal(r.estado, "partial");
  const prompts = r.registro.filter(x => x.rol === "builder").map(x => x.entrada);
  assert.ok(!prompts[0].includes("Verification failed"));
  for (const prompt of prompts.slice(1)) assert.ok(prompt.includes("Verification failed (exit 1). Output:\nverify: fallo simulado"));
  // A1 también al relanzar: cada prompt lleva el contrato delante.
  for (const prompt of prompts) assert.ok(prompt.startsWith("Builder contract:\n# Builder\n"), "el relanzamiento también lleva el contrato");
});

// Continuidad: el builder cierra todos los tramos y kit run revisa solo al final.
caso("A7 continuidad completa: dos tramos antes de una verificación y revisión final", () => {
  const r = correr("a7", { plan: PLAN_CONTINUA });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.estado, "done");
  assert.match(r.plan, /segment: 2/);
  assert.match(r.plan, /- \[x\] crear primero\.txt/);
  assert.match(r.plan, /- \[x\] crear segundo\.txt/);
  assert.equal(r.cuenta("builder"), 1);
  assert.equal(r.cuenta("verify"), 1);
  assert.equal(r.cuenta("reviewer"), 1);
});

caso("A8 continuidad: segunda falla idéntica detiene relanzamientos y deja nota", () => {
  const r = correr("a8", { plan: PLAN_CONTINUA, env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /motivo=verify/);
  assert.match(r.plan, /PAUSED \(verify\): la verificación repitió la misma causa/);
  assert.equal(r.cuenta("builder"), 2);
  assert.equal(r.cuenta("verify"), 2);
  assert.equal(r.cuenta("reviewer"), 0);
  assert.equal(r.estado, "partial");
});

caso("M1 mutación sensible: quitar la parada por causa repetida es rechazado", () => {
  const mutado = join(fileURLToPath(new URL("../../scripts/", import.meta.url)), ".kit-run-sin-parada.mjs");
  const original = readFileSync(KIT, "utf8");
  const guardia = "if (continuidad && fallosVerificacion.has(causa)) {";
  assert.ok(original.includes(guardia), "la mutación debe encontrar la guarda de continuidad");
  writeFileSync(mutado, original.replace(guardia, "if (false && continuidad && fallosVerificacion.has(causa)) {"));
  try {
    const r = correr("m1", { plan: PLAN_CONTINUA, env: { FAKE_VERIFY_FALLA: "1" }, kit: mutado });
    // Con la guarda quitada, la segunda falla idéntica no se detiene por causa repetida: pasa al aviso de consejo.
    assert.equal(r.cuenta("builder"), 2);
    assert.equal(r.cuenta("verify"), 2);
    assert.doesNotMatch(r.plan, /PAUSED \(verify\): la verificación repitió la misma causa/);
    assert.throws(() => {
      assert.match(r.plan, /PAUSED \(verify\): la verificación repitió la misma causa/, "contrato A8: segunda causa idéntica debe detener");
    }, /segunda causa idéntica debe detener/);
  } finally {
    rmSync(mutado, { force: true });
  }
});

// A3: revisor de solo lectura.
caso("A3a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba", () => {
  const r = correr("a3a", { env: { FAKE_REVIEWER_ESCRIBE_SIEMPRE: "0" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = r.registro.find(x => x.rol === "reviewer");
  assert.equal(rev.escribio, false, "con read-only el revisor no escribe");
  assert.equal(existsSync(join(r.raiz, "revisor.txt")), false);
  assert.equal(r.estado, "done");
});
caso("A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, partial", () => {
  const r = correr("a3b", { env: { FAKE_REVIEWER_ESCRIBE_SIEMPRE: "1" } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /motivo=access/);
  assert.match(r.stdout, /modificó el árbol/);
  assert.equal(r.estado, "partial");
});
caso("A3c RETURNED una vez: vuelve al builder con los defectos y aprueba", () => {
  const r = correr("a3c", { env: { FAKE_DEVUELVE_HASTA: "1" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.cuenta("builder"), 2);
  assert.equal(r.cuenta("reviewer"), 2);
  const correccion = r.registro.filter(x => x.rol === "builder")[1].entrada;
  assert.ok(correccion.includes("The review returned these defects:\n" + JSON.stringify([{ archivo: "creado.txt", linea: 1, criterio: "A1", descripcion: "falta el contenido esperado" }], null, 2)));
  assert.equal(r.estado, "done");
});
caso("A3d RETURNED siempre: la segunda devolución pide consejo, partial sin más corridas", () => {
  const r = correr("a3d", { env: { FAKE_DEVUELVE_HASTA: "99" } });
  assert.equal(r.status, 1);
  assert.equal(r.cuenta("builder"), 2);
  assert.equal(r.cuenta("reviewer"), 2);
  assert.equal(r.estado, "partial");
});

// A5: sensibilidad. Veredicto inválido nunca aprueba.
caso("A5a revisor que devuelve texto no JSON: partial sin aprobar", () => {
  const r = correr("a5a", { env: { FAKE_VEREDICTO: "no es json" } });
  assert.equal(r.status, 1);
  assert.doesNotMatch(r.stdout, /DONE/);
  assert.match(r.stdout, /PAUSED/);
  assert.equal(r.estado, "partial");
});
caso("A5b APPROVED con defectos: viola el esquema, partial", () => {
  const malo = JSON.stringify({ veredicto: "APPROVED", defectos: [{ archivo: "a", linea: 1, criterio: "c", descripcion: "d" }] });
  const r = correr("a5b", { env: { FAKE_VEREDICTO: malo } });
  assert.equal(r.status, 1);
  assert.equal(r.estado, "partial");
});
caso("A5c veredicto con clave extra: viola el esquema, partial", () => {
  const malo = JSON.stringify({ veredicto: "APPROVED", defectos: [], nota: "extra" });
  const r = correr("a5c", { env: { FAKE_VEREDICTO: malo } });
  assert.equal(r.status, 1);
  assert.equal(r.estado, "partial");
});

// C1 (mapeo codex, A4 en el arnés): builder con workspace-write y revisor con read-only y esquema, ambos con -m.
caso("C1 mapeo codex: builder en workspace-write, revisor en read-only con esquema, modelo del agente", () => {
  const r = correr("c1", { codex: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const con = r.registro.find(x => x.rol === "builder");
  const rev = r.registro.find(x => x.rol === "reviewer");
  assert.ok(con.args.includes("exec") && con.args.includes("workspace-write"), `builder: ${con.args}`);
  assert.ok(!con.args.includes("--output-schema"), "el builder no lleva esquema");
  assert.ok(rev.args.includes("read-only") && rev.args.includes("--output-schema"), `revisor: ${rev.args}`);
  assert.deepEqual(rev.esquema, ["veredicto", "defectos"]);
  for (const x of [con, rev]) {
    const i = x.args.indexOf("-m");
    assert.ok(i >= 0 && /\S/.test(x.args[i + 1] ?? ""), `falta -m modelo: ${x.args}`);
    assert.ok(x.args.some(a => a.startsWith("model_reasoning_effort=")), `falta el effort: ${x.args}`);
  }
  assert.equal(r.estado, "done");
});

// C2 (tope de tiempo externo): un builder que no termina se corta; el tope es infraestructura y se repite con el mismo modelo (escalera, paso 0); al tercer corte pausa access.
caso("C2 tope de tiempo: el builder que no termina se repite y al tercer corte pausa access", () => {
  const r = correr("c2", { codex: true, env: { FAKE_CODEX_CUELGA: "1", KIT_RUN_TOPE_MS: "500" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=access;/);
  assert.match(r.stdout, /superó el tope de 500 ms/);
  assert.equal(r.cuenta("builder"), 3, "el tope es infra: 1 + 2 relanzamientos");
  assert.equal(r.estado, "partial");
});

// A6: el builder falso ve «approved» al arrancar en las 3 corridas (verify falla siempre).
caso("A6 el builder ve approved al arrancar en las 2 corridas", () => {
  const r = correr("a6", { env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(r.cuenta("builder"), 2, r.stdout);
  const estados = r.registro.filter(x => x.rol === "builder").map(x => x.estado);
  assert.deepEqual(estados, ["approved", "approved"], r.stdout);
});

// Uso: un plan que no está aprobado no se toca.
caso("uso: plan en curso se rechaza sin cambiarlo", () => {
  const r = correr("uso", { plan: PLAN.replace("status: approved", "status: in progress") });
  assert.equal(r.status, 2);
  assert.equal(r.estado, "in progress");
  assert.equal(r.cuenta("builder"), 0);
});

// Revisor configurable (kit_run.reviewer de models.json): V2 a V5. Cada models.json temporal es una copia del del repo.
const MODELOS_BASE = JSON.parse(readFileSync(fileURLToPath(new URL("../../models.json", import.meta.url)), "utf8"));
function modelosTemporal(nombre, mutar) {
  const c = structuredClone(MODELOS_BASE);
  mutar(c);
  const ruta = join(dir, nombre);
  writeFileSync(ruta, JSON.stringify(c, null, 2));
  return ruta;
}
// Modelo (-m) y esfuerzo (model_reasoning_effort) de una invocación del codex falso.
function modeloYEsfuerzo(args) {
  const m = args[args.indexOf("-m") + 1];
  const e = args.find(a => a.startsWith("model_reasoning_effort=")).split("=")[1].replace(/"/g, "");
  return { m, e };
}

// V2: con kit_run.reviewer en nivel bajo, el revisor va con Luna low y el builder no cambia.
caso("V2 revisor con nivel bajo: Luna low; el builder no cambia", () => {
  const ruta = modelosTemporal("v2.json", c => { c.kit_run.reviewer.level = "low"; });
  const r = correr("v2", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "reviewer").args);
  assert.deepEqual(rev, { m: "gpt-6-luna", e: "low" });
  const base = correr("v2base", { codex: true });
  const conBase = modeloYEsfuerzo(base.registro.find(x => x.rol === "builder").args);
  const con = modeloYEsfuerzo(r.registro.find(x => x.rol === "builder").args);
  assert.deepEqual(con, conBase);
});

// V3: sin kit_run, el revisor usa el modelo y el esfuerzo del planner (lo mismo que sin la clave en el repo).
caso("V3 sin kit_run el revisor usa el modelo y esfuerzo del planner", () => {
  const ruta = modelosTemporal("v3.json", c => { delete c.kit_run; });
  const r = correr("v3", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const base = correr("v3base", { codex: true });
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "reviewer").args);
  const revBase = modeloYEsfuerzo(base.registro.find(x => x.rol === "reviewer").args);
  // El modelo del revisor sin kit_run es el del planner, igual que con kit_run; el esfuerzo es el del planner (models.json).
  assert.equal(rev.m, revBase.m);
  assert.equal(rev.e, MODELOS_BASE.agents.planner.effort);
});

// V4: un nivel inválido sale con exit 2 antes de tocar el plan ni lanzar al builder.
caso("V4 nivel inválido en kit_run.reviewer: exit 2 y plan intacto", () => {
  const ruta = modelosTemporal("v4.json", c => { c.kit_run.reviewer.level = "inexistente"; });
  const r = correr("v4", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /inexistente/);
  assert.equal(r.cuenta("builder"), 0);
  assert.equal(r.plan, PLAN);
});

// V5: la nota del plan lleva revisor=<modelo>:<esfuerzo> del revisor que corrió.
caso("V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>", () => {
  const r = correr("v5", { codex: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "reviewer").args);
  assert.ok(r.plan.includes(`- kit run: revisión APPROVED`), r.plan);
  assert.ok(r.plan.includes(`revisor=${rev.m}:${rev.e}`), r.plan);
});

// Registro de intentos (changes/prueba/runs.jsonl): una línea por intento; solo el intento final tiene terminacion.
const CAMPOS_REGISTRO = ["plan", "tramo", "fecha", "herramienta", "builder_modelo", "builder_ms", "verify_ms", "puerta", "puerta_ms", "revisor_ms", "resultado", "motivo_relanzamiento", "relanzamientos", "huella_inicio", "huella_fin", "clase", "paso", "resuelto_por", "senal", "terminacion"];
function leerRuns(raiz) {
  const ruta = join(raiz, "changes/prueba/runs.jsonl");
  return existsSync(ruta) ? readFileSync(ruta, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l)) : null;
}

// R1: una corrida aprobada deja 1 línea con los campos del intento y su fecha de término.
caso("R1 registro: una corrida aprobada deja 1 línea con término y duraciones enteras ≥ 0", () => {
  const r = correr("r1");
  assert.equal(r.status, 0, r.stderr);
  const runs = leerRuns(r.raiz);
  assert.equal(runs.length, 1, `líneas: ${runs?.length}`);
  const x = runs[0];
  assert.deepEqual(Object.keys(x).sort(), [...CAMPOS_REGISTRO].sort());
  assert.equal(x.plan, PLAN_REL);
  assert.equal(x.tramo, 1);
  assert.match(x.fecha, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(x.herramienta, "codex");
  assert.match(x.builder_modelo, /^[^:\s]+:[^:\s]+$/);
  for (const k of ["builder_ms", "verify_ms", "revisor_ms", "puerta_ms"]) assert.ok(Number.isInteger(x[k]) && x[k] >= 0, `${k}=${x[k]}`);
  assert.equal(x.puerta, "pasa");
  assert.equal(x.resultado, "DONE");
  assert.equal(x.motivo_relanzamiento, null);
  assert.equal(x.relanzamientos, 0);
  assert.equal(x.clase, null);
  assert.equal(x.paso, 0);
  assert.equal(x.resuelto_por, 0);
  assert.deepEqual(x.terminacion, { fecha: x.terminacion.fecha, resultado: "DONE", hecho: "1/1" });
  assert.match(x.terminacion.fecha, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(typeof x.huella_inicio, "string");
  assert.equal(typeof x.huella_fin, "string");
});

// R2: verify rojo y luego verde: 2 líneas (devuelto/verify, DONE con relanzamientos 1).
caso("R2 verify rojo y luego verde: 2 líneas devuelto/verify y DONE con relanzamientos 1", () => {
  const r = correr("r2", { env: { FAKE_VERIFY_FALLA_HASTA: "1" } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^DONE:/);
  const runs = leerRuns(r.raiz);
  assert.equal(runs.length, 2, `líneas: ${runs?.length}`);
  assert.equal(runs[0].resultado, "devuelto");
  assert.equal(runs[0].terminacion, undefined, "un intento relanzado no se marca como final");
  assert.equal(runs[0].motivo_relanzamiento, "verify");
  assert.equal(runs[0].relanzamientos, 0);
  assert.equal(runs[1].resultado, "DONE");
  assert.equal(runs[1].terminacion.resultado, "DONE");
  assert.equal(runs[1].motivo_relanzamiento, null);
  assert.equal(runs[1].relanzamientos, 1);
});

// R3: el revisor devuelve una vez: la línea devuelta lleva motivo_relanzamiento revisor.
caso("R3 revisor RETURNED: la línea devuelta lleva motivo_relanzamiento revisor", () => {
  const r = correr("r3", { env: { FAKE_DEVUELVE_HASTA: "1" } });
  assert.equal(r.status, 0, r.stderr);
  const runs = leerRuns(r.raiz);
  assert.equal(runs.length, 2, `líneas: ${runs?.length}`);
  assert.equal(runs[0].resultado, "devuelto");
  assert.equal(runs[0].motivo_relanzamiento, "revisor");
  assert.equal(runs[1].resultado, "DONE");
  assert.equal(runs[1].relanzamientos, 1);
});

// R4: registro no escribible (directorio con ese nombre): mismo código y misma salida DONE, con aviso por stderr.
caso("R4 registro no escribible: mismo código y salida, con aviso por stderr", () => {
  const ref = correr("r4-ref");
  assert.equal(ref.status, 0, ref.stderr);
  const r = correr("r4", { antes: raiz => mkdirSync(join(raiz, "changes/prueba/runs.jsonl")) });
  assert.equal(r.status, ref.status, r.stderr);
  assert.equal(r.stdout, ref.stdout);
  assert.equal(r.estado, ref.estado);
  assert.match(r.stderr, /kit-run: no se pudo escribir el registro/);
});

// R5: huellas null sin git; cadenas distintas con git cuando el builder cambió archivos.
caso("R5 huellas: null sin git; cadenas distintas cuando el builder cambió archivos", () => {
  const sinGit = correr("r5-sin-git", { git: false });
  assert.equal(sinGit.status, 0, sinGit.stderr);
  const x = leerRuns(sinGit.raiz)[0];
  assert.equal(x.huella_inicio, null);
  assert.equal(x.huella_fin, null);
  const conGit = correr("r5-con-git");
  assert.equal(conGit.status, 0, conGit.stderr);
  const y = leerRuns(conGit.raiz)[0];
  assert.equal(typeof y.huella_inicio, "string");
  assert.equal(typeof y.huella_fin, "string");
  assert.notEqual(y.huella_inicio, y.huella_fin);
});

// Puerta mecánica (tools/run/puerta.mjs) con herramientas falsas inyectadas por dirHerramientas.
function herramientasFalsas(respuestas) {
  const d = mkdtempSync(join(tmpdir(), "kit-run-puerta-"));
  for (const [nombre, r] of Object.entries(respuestas)) {
    writeFileSync(join(d, nombre), `process.stdout.write(${JSON.stringify(r.stdout ?? "")});\nprocess.stderr.write(${JSON.stringify(r.stderr ?? "")});\nprocess.exit(${r.code ?? 0});\n`);
  }
  return d;
}
function conHerramientas(respuestas, fn) {
  const d = herramientasFalsas(respuestas);
  try {
    return fn(d);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}
function puertaCon(respuestas) {
  return conHerramientas(respuestas, dirHerramientas => ejecutarPuerta({ planPath: PLAN_REL, raiz: tmpdir(), dirHerramientas }));
}
const OK = { code: 0, stdout: "", stderr: "" };
const SCOPE_OK = { code: 0, stdout: JSON.stringify({ filas: [{ nivel: "ok", elemento: "src/a.js", mensaje: "dentro de Scope" }] }), stderr: "" };
const CLOSE_OK = { code: 0, stdout: JSON.stringify({ filas: [] }), stderr: "" };

caso("puerta-faltante: sin una herramienta es no verificable y no bloquea", () => {
  conHerramientas({ "kit-check.mjs": OK }, dirHerramientas => {
    const p = ejecutarPuerta({ planPath: PLAN_REL, raiz: tmpdir(), dirHerramientas });
    assert.equal(p.estado, "no_verificable");
    assert.equal(p.bloquea, false);
    assert.deepEqual(p.noAutomatizables, ["faltan: kit-scope.mjs, kit-close.mjs"]);
  });
  assert.deepEqual(herramientasFaltantes(), []);
});

caso("puerta-verde: las tres herramientas pasan sin lista", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 0, stdout: "A1 | ok | npm test | 12 pruebas\n", stderr: "" },
    "kit-scope.mjs": SCOPE_OK,
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.estado, "pasa");
  assert.equal(p.bloquea, false);
  assert.equal(p.motivo, null);
  assert.deepEqual(p.lista, []);
  assert.deepEqual(p.codigos, { "kit-check.mjs": 0, "kit-scope.mjs": 0, "kit-close.mjs": 0 });
});

caso("puerta-roja: falla de Scope y de verificación con lista exacta y motivo scope", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 1, stdout: "A1 | falla | npm test | exit 1 | motivo: boom\n", stderr: "" },
    "kit-scope.mjs": { code: 1, stdout: JSON.stringify({ filas: [{ nivel: "error", elemento: "src/x.js", mensaje: "fuera de Scope" }] }), stderr: "" },
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.estado, "falla");
  assert.equal(p.bloquea, true);
  assert.equal(p.motivo, "scope");
  assert.deepEqual(p.lista, ["A1: motivo: boom", "fuera de alcance: src/x.js"]);
  const texto = textoParaBuilder(p);
  assert.match(texto, /^La puerta mecánica \(kit-check, kit-scope, kit-close\) no pasó\./);
  assert.match(texto, /^- A1: motivo: boom$/m);
  assert.match(texto, /^- fuera de alcance: src\/x\.js$/m);
});

caso("puerta-roja-verify: solo kit-check falla y el motivo es verify", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 1, stdout: "A3 | falla | npm test | motivo: x\n", stderr: "" },
    "kit-scope.mjs": SCOPE_OK,
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.bloquea, true);
  assert.equal(p.motivo, "verify");
  assert.deepEqual(p.lista, ["A3: motivo: x"]);
});

caso("puerta-no-verificable: bloqueado no bloquea y va al revisor como no automatizable", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 3, stdout: "A2 | bloqueado | npm test | sin cola\n", stderr: "" },
    "kit-scope.mjs": SCOPE_OK,
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.estado, "no_verificable");
  assert.equal(p.bloquea, false);
  assert.deepEqual(p.lista, []);
  assert.deepEqual(p.noAutomatizables, ["A2: bloqueado"]);
  const texto = textoParaRevisor(p);
  assert.match(texto, /^Puerta mecánica: no_verificable\./);
  assert.match(texto, /^No automatizable \(revísalo tú\):$/m);
  assert.match(texto, /^- A2: bloqueado$/m);
  assert.match(texto, /Enfócate en diseño, riesgos y lo no automatizable\.$/);
});

caso("puerta-sin-detalle: salida 1 sin filas bloquea y lo dice", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 1, stdout: "", stderr: "" },
    "kit-scope.mjs": SCOPE_OK,
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.bloquea, true);
  assert.equal(p.motivo, "verify");
  assert.deepEqual(p.lista, ["kit-check.mjs: salió con 1 sin detalle"]);
});

caso("puerta-salida-2: uso o plan mal formado no bloquea y se nombra", () => {
  const p = puertaCon({
    "kit-check.mjs": SCOPE_OK,
    "kit-scope.mjs": { code: 2, stdout: "", stderr: "kit-scope: falta el plan\n" },
    "kit-close.mjs": CLOSE_OK,
  });
  assert.equal(p.bloquea, false);
  assert.equal(p.estado, "no_verificable");
  assert.deepEqual(p.noAutomatizables, ["kit-scope.mjs: salió con 2 (kit-scope: falta el plan)"]);
});

caso("A5 promptRevisor con el resultado de la puerta lo incluye; sin él no cambia", () => {
  const p = puertaCon({
    "kit-check.mjs": { code: 3, stdout: "A2 | bloqueado | npm test | sin cola\n", stderr: "" },
    "kit-scope.mjs": SCOPE_OK,
    "kit-close.mjs": CLOSE_OK,
  });
  const diff = "diff de prueba";
  const sin = promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO);
  const con = promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO, textoParaRevisor(p));
  assert.equal(sin, promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO, undefined));
  assert.ok(con.includes(textoParaRevisor(p)));
  assert.ok(con.indexOf("Puerta mecánica:") < con.indexOf("--- diff ---"));
  assert.ok(!sin.includes("Puerta mecánica:"));
});

// A6: la línea de decisiones solo aparece con el argumento o con decisions.md junto al plan.
const LINEA_DECISIONES = 'Decisions: changes/prueba/decisions.md. Read it; do not reopen active rows; a diff that contradicts one is a defect; cite its ID in criterio, e.g. "A# (D-NN)".';
caso("A6 promptRevisor con decisiones: la línea va tras el veredicto; sin ella es idéntico", () => {
  const diff = "diff de prueba";
  const sin = promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO);
  assert.equal(sin, promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO, undefined, undefined));
  const con = promptRevisor(PLAN_REL, diff, ESQUEMA_VEREDICTO, undefined, "changes/prueba/decisions.md");
  assert.ok(con.includes(LINEA_DECISIONES));
  assert.ok(con.indexOf("Use veredicto APPROVED") < con.indexOf(LINEA_DECISIONES));
  assert.ok(con.indexOf(LINEA_DECISIONES) < con.indexOf("--- diff ---"));
  assert.equal(con.replace(`${LINEA_DECISIONES}\n`, ""), sin);
  assert.ok(!sin.includes("Decisions:"));
});

caso("A6 kit run pasa decisions.md al revisor solo si el archivo existe", () => {
  const con = correr("a6-con", { antes: raiz => writeFileSync(join(raiz, "changes/prueba/decisions.md"), "# Decisiones\n") });
  assert.equal(con.status, 0, con.stderr);
  assert.ok(con.registro.find(x => x.rol === "reviewer").entrada.includes(LINEA_DECISIONES));
  const sin = correr("a6-sin");
  assert.equal(sin.status, 0, sin.stderr);
  assert.ok(!sin.registro.find(x => x.rol === "reviewer").entrada.includes("Decisions:"));
});

caso("filasCheck: el detalle va tras el último separador", () => {
  assert.deepEqual(filasCheck("A1 | falla | npm run x | a | b\nnada\n"), [{ id: "A1", estado: "falla", detalle: "b" }]);
});

// Puerta mecánica dentro de kit run: herramientas reales de scripts/ sobre el repo temporal.
caso("puerta-preflight: sin una herramienta de la puerta el kit sale con 2 antes de tocar el plan", () => {
  const copia = join(dir, "kit-sin-kit-close");
  mkdirSync(copia);
  cpSync(join(KIT_RAIZ, "scripts"), join(copia, "scripts"), { recursive: true });
  cpSync(join(KIT_RAIZ, "tools"), join(copia, "tools"), { recursive: true });
  cpSync(join(KIT_RAIZ, "adapters"), join(copia, "adapters"), { recursive: true });
  cpSync(join(KIT_RAIZ, "models.json"), join(copia, "models.json"));
  rmSync(join(copia, "scripts", "kit-close.mjs"));
  const r = correr("puerta-preflight", { kit: join(copia, "scripts", "kit-run.mjs") });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /faltan herramientas de la puerta mecánica en scripts\/: kit-close\.mjs/);
  assert.equal(r.cuenta("builder"), 0);
  assert.equal(r.estado, "approved");
});

caso("puerta-verde-revisor: con la puerta en verde el revisor recibe su resultado", () => {
  const r = correr("puerta-verde-revisor");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.cuenta("builder"), 1);
  assert.equal(r.cuenta("reviewer"), 1);
  const rev = r.registro.find(x => x.rol === "reviewer");
  assert.match(rev.entrada, /Puerta mecánica: pasa\./);
  assert.equal(r.estado, "done");
});

caso("puerta-roja-relanza: A# en rojo no llega al revisor y el builder recibe la lista exacta y el resumen", () => {
  const r = correr("puerta-roja-relanza", { env: { FAKE_BUILDER_SIN_ARCHIVO_HASTA: "1" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const builders = r.registro.filter(x => x.rol === "builder");
  assert.equal(builders.length, 2);
  assert.equal(r.cuenta("reviewer"), 1);
  const posicionSegundo = r.registro.indexOf(builders[1]);
  const posicionRevisor = r.registro.findIndex(x => x.rol === "reviewer");
  assert.ok(posicionRevisor > posicionSegundo, "el revisor solo se llama tras la segunda corrida verde");
  assert.match(builders[1].entrada, /La puerta mecánica \(kit-check, kit-scope, kit-close\) no pasó\./);
  assert.match(builders[1].entrada, /^- A1: /m);
  assert.match(builders[1].entrada, /Progress summary:/);
  const runs = leerRuns(r.raiz);
  assert.equal(runs[0].puerta, "falla");
  assert.equal(runs[0].resultado, "devuelto");
  assert.equal(runs[0].motivo_relanzamiento, "puerta");
  assert.equal(runs.at(-1).puerta, "pasa");
});

caso("puerta-fuera-de-alcance: un archivo fuera de Scope bloquea sin revisor y la segunda falla pide consejo con motivo scope", () => {
  const r = correr("puerta-fuera-de-alcance", { env: { FAKE_BUILDER_FUERA: "1" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /motivo=scope/);
  assert.equal(r.cuenta("builder"), 2);
  assert.equal(r.cuenta("reviewer"), 0);
  assert.equal(r.estado, "partial");
});

caso("puerta-tercer-fallo: la segunda corrida con la puerta en rojo pide consejo con exit 1 y sin revisor", () => {
  const r = correr("puerta-tercer-fallo", { env: { FAKE_BUILDER_SIN_ARCHIVO: "1" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /motivo=verify/);
  assert.equal(r.cuenta("builder"), 2);
  assert.equal(r.cuenta("reviewer"), 0);
  assert.equal(r.estado, "partial");
});

caso("runs-report-puerta: el informe acepta el motivo puerta y los campos nuevos", () => {
  const r = correr("runs-report-puerta", { env: { FAKE_BUILDER_SIN_ARCHIVO_HASTA: "1" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rep = spawnSyncSeguro(process.execPath, [join(KIT_RAIZ, "scripts", "runs-report.mjs"), "--raiz", r.raiz], { encoding: "utf8" });
  assert.equal(rep.status, 0, rep.stdout + rep.stderr);
});

// Builder pegado (changes/kit-run-pegado, segmento 3). Umbrales cortos solo para pruebas: arranque 1 s, mínimo de
// repetición 1 s, sin avance 2 s, 4 sondeos, intervalo 200 ms. El builder falso (builder-pegado.mjs) escribe su
// propia señal en changes/prueba/progress.jsonl.
const PEGADO_RAPIDO = {
  KIT_RUN_PEGADO_ARRANQUE_MS: "1000",
  KIT_RUN_PEGADO_MIN_REP_MS: "1000",
  KIT_RUN_PEGADO_SIN_AVANCE_MS: "2000",
  KIT_RUN_PEGADO_SONDEOS: "4",
  KIT_RUN_PEGADO_INTERVALO_MS: "200",
};
function leerProgreso(raiz) {
  const ruta = join(raiz, "changes/prueba/progress.jsonl");
  return existsSync(ruta) ? readFileSync(ruta, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l)) : [];
}
const bloqueosPegado = (raiz) => leerProgreso(raiz).filter(e => e.tipo === "bloqueo" && /pegado/.test(e.texto ?? ""));
const casillas = (texto) => texto.split("\n").filter(l => /^- \[[ x]\]/.test(l));

// D1 (A9): progreso normal no corta, aunque el modo sea cortar.
caso("D1 progreso normal: con avance cada 100 ms no hay corte aunque el modo sea cortar", () => {
  const r = correr("d1", { builder: "builder-pegado.mjs", env: { ...PEGADO_RAPIDO, KIT_RUN_PEGADO: "cortar", FAKE_PEGADO_ESCENARIO: "progreso", FAKE_PEGADO_SEGUNDOS: "4" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^DONE: /);
  assert.equal(r.cuenta("builder"), 1, "un solo intento: no hay corte ni relanzamiento");
  assert.equal(bloqueosPegado(r.raiz).length, 0, "ningún bloqueo por pegado");
  assert.equal(leerRuns(r.raiz).at(-1).pegado, undefined);
});

// D2 (A10): builder en bucle de sondeos sin cambios con cortar: PAUSED motivo=access, partial, sin relanzar,
// nota «kit run: builder pegado», casillas iguales antes y después.
caso("D2 cortar: bucle de sondeos sin avance deja PAUSED motivo=access, partial, nota y casillas intactas", () => {
  const plan = PLAN_CONTINUA;
  const r = correr("d2", { plan, builder: "builder-pegado.mjs", env: { ...PEGADO_RAPIDO, KIT_RUN_PEGADO: "cortar", FAKE_PEGADO_ESCENARIO: "sondeos", FAKE_PEGADO_SEGUNDOS: "20" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=access;/);
  assert.match(r.stdout, /builder pegado \(sondeos\)/);
  assert.equal(r.cuenta("builder"), 1, "el corte no relanza");
  assert.equal(r.estado, "partial");
  assert.match(r.plan, /^- kit run: builder pegado \(sondeos\); hecho=0\/2; falta=crear primero\.txt; causa=/m);
  assert.deepEqual(casillas(r.plan), casillas(plan), "las casillas no cambian");
  assert.equal(existsSync(join(r.raiz, "creado.txt")), false, "el builder se cortó antes de terminar");
  assert.ok(bloqueosPegado(r.raiz).some(e => e.texto === "pegado: sondeos"), "el corte queda en progress.jsonl");
});

// D3 (A11): observar no corta; registra el patrón en runs.jsonl y un bloqueo «pegado (observado)».
caso("D3 observar: el bucle de sondeos no corta y queda registrado en runs.jsonl y progress.jsonl", () => {
  const r = correr("d3", { builder: "builder-pegado.mjs", env: { ...PEGADO_RAPIDO, KIT_RUN_PEGADO: "observar", FAKE_PEGADO_ESCENARIO: "sondeos", FAKE_PEGADO_SEGUNDOS: "4" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^DONE: /);
  assert.equal(r.cuenta("builder"), 1, "observar no relanza ni corta");
  const pegado = leerRuns(r.raiz).at(-1).pegado;
  assert.ok(pegado, "runs.jsonl registra el pegado");
  assert.equal(pegado.modo, "observar");
  assert.equal(pegado.patron, "sondeos");
  assert.ok(bloqueosPegado(r.raiz).some(e => e.texto === "pegado (observado): sondeos"), "bloqueo observado en progress.jsonl");
});

// D4 (A12): un comando declarado largo (./verify) en curso sin escribir no se corta, aunque pase el umbral.
caso("D4 comando declarado largo: ./verify en curso sin escribir no se corta", () => {
  const r = correr("d4", { builder: "builder-pegado.mjs", env: { ...PEGADO_RAPIDO, KIT_RUN_PEGADO: "cortar", FAKE_PEGADO_ESCENARIO: "verify", FAKE_PEGADO_SEGUNDOS: "5" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^DONE: /);
  assert.equal(r.cuenta("builder"), 1);
  assert.equal(bloqueosPegado(r.raiz).length, 0, "la espera legítima no deja bloqueo");
});

// D5 (A13): KIT_RUN_PEGADO=0 no evalúa nada: aun con el bucle de sondeos no hay registro ni bloqueo.
caso("D5 KIT_RUN_PEGADO=0: no se evalúa nada aunque haya bucle de sondeos", () => {
  const r = correr("d5", { builder: "builder-pegado.mjs", env: { ...PEGADO_RAPIDO, KIT_RUN_PEGADO: "0", FAKE_PEGADO_ESCENARIO: "sondeos", FAKE_PEGADO_SEGUNDOS: "4" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^DONE: /);
  assert.equal(leerRuns(r.raiz).at(-1).pegado, undefined, "sin campo pegado en runs.jsonl");
  assert.equal(bloqueosPegado(r.raiz).length, 0, "sin bloqueo por pegado");
});

// M2: quitar la compuerta de la puerta hace que la roja no relance; puerta-roja-relanza debe fallar.
caso("M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla", () => {
  const mutado = join(KIT_RAIZ, "scripts", ".kit-run-sin-puerta.mjs");
  const original = readFileSync(KIT, "utf8");
  const guardia = "if (puerta.bloquea) {";
  assert.equal(original.split(guardia).length - 1, 1, "la mutación debe encontrar una sola guarda de la puerta");
  writeFileSync(mutado, original.replace(guardia, "if (false && puerta.bloquea) {"));
  try {
    const r = correr("m2", { env: { FAKE_BUILDER_SIN_ARCHIVO_HASTA: "1" }, kit: mutado });
    assert.throws(() => {
      assert.equal(r.cuenta("builder"), 2, "contrato puerta-roja-relanza: la puerta roja relanza al builder");
    }, /la puerta roja relanza al builder/);
  } finally {
    rmSync(mutado, { force: true });
  }
});

let fallos = 0;
try {
  for (const c of casos) {
    try {
      c.fn();
      console.log(`ok ${c.nombre}`);
    } catch (e) {
      fallos++;
      console.error(`FALLO ${c.nombre}\n${e.message}`);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (fallos) {
  console.error(`kit-run: ${fallos} caso(s) fallaron`);
  process.exit(1);
}
console.log(`kit-run: ${casos.length} casos pasaron`);
