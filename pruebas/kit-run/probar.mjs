#!/usr/bin/env node
// Arnés de kit run con constructor, verificación y revisor simulados (A1, A2, A3, A5).
// Cada caso corre scripts/kit-run.mjs en un repo git temporal con ejecutables falsos.
// Los falsos anotan cada invocación en un registro JSON-lines; el caso lo lee y compara.
// Sin red, sin CLIs reales, sin escribir fuera de un temporal que se borra al salir.

import assert from "node:assert/strict";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KIT = fileURLToPath(new URL("../../scripts/kit-run.mjs", import.meta.url));
const PLAN_REL = "cambios/prueba/plan.md";
const PLAN = `---
estado: aprobado
rama: feature/prueba
base: main
repos: [.]
ejecutor: constructor
tramo: 1
---
# Prueba de kit run

## Aceptación
| ID | Resultado |
| --- | --- |
| A1 | creado.txt existe |

## Verificación
\`./verify\`

## Pasos
### Tramo 1 — Prueba
- [x] crear creado.txt
`;

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
  // Constructor: crea creado.txt en la raíz del repo y devuelve COMPLETADO.
  "constructor.mjs": `${CABECERA}${REGISTRO}
import { writeFileSync } from "node:fs";
import { join } from "node:path";
// Como ejecutar-plan (paso 1): solo arranca con estado aprobado; lo pasa a en curso al empezar.
const planPath = join(process.cwd(), "cambios/prueba/plan.md");
const estado = readFileSync(planPath, "utf8").match(/^estado: (.*)$/m)[1];
anotar("constructor", { estado });
if (estado !== "aprobado") {
  console.log("PAUSA: plan=cambios/prueba/plan.md; tramo=1; motivo=ambiguo; hecho=0/1; siguiente=arrancar con el plan aprobado; no_intentado=el plan llegó con estado " + estado);
  process.exit(0);
}
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^estado: .*$/m, "estado: en curso"));
writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
console.log("COMPLETADO: plan=cambios/prueba/plan.md; tramo=1; verify=pasa");
`,
  // Verificación: falla si FAKE_VERIFY_FALLA=1.
  "verify.mjs": `${CABECERA}${REGISTRO}
anotar("verify");
if (process.env.FAKE_VERIFY_FALLA === "1") { console.log("verify: fallo simulado"); process.exit(1); }
console.log("verify: ok");
`,
  // codex falso (en el PATH, sin KIT_RUN_CONSTRUCTOR/REVISOR): registra argumentos y el esquema del --output-schema.
  // Constructor: crea creado.txt y devuelve COMPLETADO; con FAKE_CODEX_CUELGA=1 no termina (prueba el tope).
  // Revisor (con --output-schema): APROBADO.
  "codex": `${CABECERA}${REGISTRO}
import { readFileSync as leer, writeFileSync } from "node:fs";
import { join } from "node:path";
const rev = args.includes("--output-schema");
const esquema = rev ? JSON.parse(leer(args[args.indexOf("--output-schema") + 1], "utf8")) : null;
anotar(rev ? "revisor" : "constructor", { esquema: esquema ? Object.keys(esquema.properties) : null });
if (rev) {
  console.log(JSON.stringify({ veredicto: "APROBADO", defectos: [] }));
} else if (process.env.FAKE_CODEX_CUELGA === "1") {
  setTimeout(() => {}, 60000);
} else {
  writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
  console.log("COMPLETADO: plan=cambios/prueba/plan.md; tramo=1; verify=pasa");
}
`,
  // Revisor: en read-only no escribe (el sandbox rechaza la escritura); con FAKE_REVISOR_ESCRIBE_SIEMPRE=1 escribe
  // igual (sandbox roto). Devuelve DEVUELTO las primeras FAKE_DEVUELVE_HASTA veces, luego FAKE_VEREDICTO o APROBADO.
  "revisor.mjs": `${CABECERA}${REGISTRO}
import { writeFileSync, readFileSync as leer } from "node:fs";
import { join } from "node:path";
const lectura = args.includes("read-only");
const previas = leer(process.env.KR_LOG, "utf8").split("\\n").filter(l => l.includes('"rol":"revisor"')).length;
const escribe = !lectura || process.env.FAKE_REVISOR_ESCRIBE_SIEMPRE === "1";
if (escribe) writeFileSync(join(process.cwd(), "revisor.txt"), "escrito por el revisor\\n");
anotar("revisor", { escribio: escribe });
const n = previas + 1;
if (process.env.FAKE_VEREDICTO) { console.log(process.env.FAKE_VEREDICTO); process.exit(0); }
if (n <= Number(process.env.FAKE_DEVUELVE_HASTA || 0)) {
  console.log(JSON.stringify({ veredicto: "DEVUELTO", defectos: [{ archivo: "creado.txt", linea: 1, criterio: "A1", descripcion: "falta el contenido esperado" }] }));
} else {
  console.log(JSON.stringify({ veredicto: "APROBADO", defectos: [] }));
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
  const r = spawnSync("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", ...a], { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

// Repo temporal con el plan commiteado. Corre kit-run con los falsos y devuelve la salida y el registro.
// codex: true no fija KIT_RUN_CONSTRUCTOR ni KIT_RUN_REVISOR; el script llama a `codex` del PATH (el falso).
function correr(nombre, { plan = PLAN, env = {}, codex = false } = {}) {
  const raiz = join(dir, nombre);
  mkdirSync(join(raiz, "cambios/prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN_REL), plan);
  git(raiz, "init", "-q");
  git(raiz, "add", "-A");
  git(raiz, "commit", "-q", "-m", "base");
  const log = join(dir, `${nombre}.log`);
  writeFileSync(log, "");
  const entorno = {
    ...process.env,
    KIT_RUN_VERIFY: exe("verify.mjs"),
    KR_LOG: log,
    FAKE_VERIFY_FALLA: "0",
    FAKE_REVISOR_ESCRIBE_SIEMPRE: "0",
    FAKE_DEVUELVE_HASTA: "0",
    FAKE_VEREDICTO: "",
    FAKE_CODEX_CUELGA: "0",
    ...env,
  };
  delete entorno.KIT_RUN_TOPE_MS;
  if (!env.FLUCASTR_MODELOS) delete entorno.FLUCASTR_MODELOS;
  if (codex) {
    delete entorno.KIT_RUN_CONSTRUCTOR;
    delete entorno.KIT_RUN_REVISOR;
    entorno.PATH = `${bin}${delimiter}${process.env.PATH}`;
  } else {
    entorno.KIT_RUN_CONSTRUCTOR = exe("constructor.mjs");
    entorno.KIT_RUN_REVISOR = exe("revisor.mjs");
  }
  if (env.KIT_RUN_TOPE_MS) entorno.KIT_RUN_TOPE_MS = env.KIT_RUN_TOPE_MS;
  const r = spawnSync(process.execPath, [KIT, PLAN_REL, "--raiz", raiz], { encoding: "utf8", env: entorno });
  const registro = readFileSync(log, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  const cuenta = (rol) => registro.filter(x => x.rol === rol).length;
  const estado = readFileSync(join(raiz, PLAN_REL), "utf8").match(/^estado: (.*)$/m)[1];
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, registro, cuenta, estado, raiz, plan: readFileSync(join(raiz, PLAN_REL), "utf8") };
}

const casos = [];
function caso(nombre, fn) { casos.push({ nombre, fn }); }

// A1: ciclo completo con simulados.
caso("A1 ciclo completo: listo, constructor una vez, revisor en solo lectura", () => {
  const r = correr("a1");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^COMPLETADO: plan=cambios\/prueba\/plan\.md; tramo=1; verify=pasa/);
  assert.equal(r.estado, "listo");
  assert.ok(existsSync(join(r.raiz, "creado.txt")), "el constructor debió crear creado.txt");
  assert.equal(r.cuenta("constructor"), 1);
  assert.equal(r.cuenta("verify"), 1);
  assert.equal(r.cuenta("revisor"), 1);
  const rev = r.registro.find(x => x.rol === "revisor");
  assert.ok(rev.args.includes("read-only") && rev.args.includes("--output-schema"), `argumentos del revisor: ${rev.args}`);
  assert.match(r.plan, /- kit run: revisión APROBADO/);
});

// A2: tope de relanzamientos. Verify siempre falla: 3 corridas del constructor, parcial.
caso("A2 verify que siempre falla: 3 corridas del constructor y parcial", () => {
  const r = correr("a2", { env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^PAUSA: plan=cambios\/prueba\/plan\.md; tramo=1; motivo=verify;/);
  assert.equal(r.cuenta("constructor"), 3, "1 + 2 relanzamientos");
  assert.equal(r.cuenta("verify"), 3);
  assert.equal(r.cuenta("revisor"), 0, "sin verify verde no hay revisión");
  assert.equal(r.estado, "parcial");
  const prompts = r.registro.filter(x => x.rol === "constructor").map(x => x.entrada);
  assert.ok(!prompts[0].includes("La verificación falló"));
  assert.ok(prompts[1].includes("La verificación falló") && prompts[2].includes("La verificación falló"));
});

// A3: revisor de solo lectura.
caso("A3a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba", () => {
  const r = correr("a3a", { env: { FAKE_REVISOR_ESCRIBE_SIEMPRE: "0" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = r.registro.find(x => x.rol === "revisor");
  assert.equal(rev.escribio, false, "con read-only el revisor no escribe");
  assert.equal(existsSync(join(r.raiz, "revisor.txt")), false);
  assert.equal(r.estado, "listo");
});
caso("A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, parcial", () => {
  const r = correr("a3b", { env: { FAKE_REVISOR_ESCRIBE_SIEMPRE: "1" } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /motivo=acceso/);
  assert.match(r.stdout, /modificó el árbol/);
  assert.equal(r.estado, "parcial");
});
caso("A3c DEVUELTO una vez: vuelve al constructor con los defectos y aprueba", () => {
  const r = correr("a3c", { env: { FAKE_DEVUELVE_HASTA: "1" } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.cuenta("constructor"), 2);
  assert.equal(r.cuenta("revisor"), 2);
  assert.ok(r.registro.filter(x => x.rol === "constructor")[1].entrada.includes("falta el contenido esperado"));
  assert.equal(r.estado, "listo");
});
caso("A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas", () => {
  const r = correr("a3d", { env: { FAKE_DEVUELVE_HASTA: "99" } });
  assert.equal(r.status, 1);
  assert.equal(r.cuenta("constructor"), 3);
  assert.equal(r.cuenta("revisor"), 3);
  assert.equal(r.estado, "parcial");
});

// A5: sensibilidad. Veredicto inválido nunca aprueba.
caso("A5a revisor que devuelve texto no JSON: parcial sin aprobar", () => {
  const r = correr("a5a", { env: { FAKE_VEREDICTO: "no es json" } });
  assert.equal(r.status, 1);
  assert.doesNotMatch(r.stdout, /COMPLETADO/);
  assert.match(r.stdout, /PAUSA/);
  assert.equal(r.estado, "parcial");
});
caso("A5b APROBADO con defectos: viola el esquema, parcial", () => {
  const malo = JSON.stringify({ veredicto: "APROBADO", defectos: [{ archivo: "a", linea: 1, criterio: "c", descripcion: "d" }] });
  const r = correr("a5b", { env: { FAKE_VEREDICTO: malo } });
  assert.equal(r.status, 1);
  assert.equal(r.estado, "parcial");
});
caso("A5c veredicto con clave extra: viola el esquema, parcial", () => {
  const malo = JSON.stringify({ veredicto: "APROBADO", defectos: [], nota: "extra" });
  const r = correr("a5c", { env: { FAKE_VEREDICTO: malo } });
  assert.equal(r.status, 1);
  assert.equal(r.estado, "parcial");
});

// C1 (mapeo codex, A4 en el arnés): constructor con workspace-write y revisor con read-only y esquema, ambos con -m.
caso("C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente", () => {
  const r = correr("c1", { codex: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const con = r.registro.find(x => x.rol === "constructor");
  const rev = r.registro.find(x => x.rol === "revisor");
  assert.ok(con.args.includes("exec") && con.args.includes("workspace-write"), `constructor: ${con.args}`);
  assert.ok(!con.args.includes("--output-schema"), "el constructor no lleva esquema");
  assert.ok(rev.args.includes("read-only") && rev.args.includes("--output-schema"), `revisor: ${rev.args}`);
  assert.deepEqual(rev.esquema, ["veredicto", "defectos"]);
  for (const x of [con, rev]) {
    const i = x.args.indexOf("-m");
    assert.ok(i >= 0 && /\S/.test(x.args[i + 1] ?? ""), `falta -m modelo: ${x.args}`);
    assert.ok(x.args.some(a => a.startsWith("model_reasoning_effort=")), `falta el esfuerzo: ${x.args}`);
  }
  assert.equal(r.estado, "listo");
});

// C2 (tope de tiempo externo): un constructor que no termina se corta; sin relanzar y deja parcial.
caso("C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar", () => {
  const r = correr("c2", { codex: true, env: { FAKE_CODEX_CUELGA: "1", KIT_RUN_TOPE_MS: "500" } });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^PAUSA: plan=cambios\/prueba\/plan\.md; tramo=1; motivo=acceso;/);
  assert.match(r.stdout, /superó el tope de 500 ms/);
  assert.equal(r.cuenta("constructor"), 1, "el tope no relanza");
  assert.equal(r.estado, "parcial");
});

// A6: el constructor falso ve «aprobado» al arrancar en las 3 corridas (verify falla siempre).
caso("A6 el constructor ve aprobado al arrancar en las 3 corridas", () => {
  const r = correr("a6", { env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(r.cuenta("constructor"), 3, r.stdout);
  const estados = r.registro.filter(x => x.rol === "constructor").map(x => x.estado);
  assert.deepEqual(estados, ["aprobado", "aprobado", "aprobado"], r.stdout);
});

// Uso: un plan que no está aprobado no se toca.
caso("uso: plan en curso se rechaza sin cambiarlo", () => {
  const r = correr("uso", { plan: PLAN.replace("estado: aprobado", "estado: en curso") });
  assert.equal(r.status, 2);
  assert.equal(r.estado, "en curso");
  assert.equal(r.cuenta("constructor"), 0);
});

// Revisor configurable (kit_run.revisor de modelos.json): V2 a V5. Cada modelos.json temporal es una copia del del repo.
const MODELOS_BASE = JSON.parse(readFileSync(fileURLToPath(new URL("../../modelos.json", import.meta.url)), "utf8"));
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

// V2: con kit_run.revisor en nivel bajo, el revisor va con Luna low y el constructor no cambia.
caso("V2 revisor con nivel bajo: Luna low; el constructor no cambia", () => {
  const ruta = modelosTemporal("v2.json", c => { c.kit_run.revisor.nivel = "bajo"; });
  const r = correr("v2", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "revisor").args);
  assert.deepEqual(rev, { m: "gpt-6-luna", e: "low" });
  const base = correr("v2base", { codex: true });
  const conBase = modeloYEsfuerzo(base.registro.find(x => x.rol === "constructor").args);
  const con = modeloYEsfuerzo(r.registro.find(x => x.rol === "constructor").args);
  assert.deepEqual(con, conBase);
});

// V3: sin kit_run, el revisor usa el modelo y el esfuerzo del principal (lo mismo que sin la clave en el repo).
caso("V3 sin kit_run el revisor usa el modelo y esfuerzo del principal", () => {
  const ruta = modelosTemporal("v3.json", c => { delete c.kit_run; });
  const r = correr("v3", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const base = correr("v3base", { codex: true });
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "revisor").args);
  const revBase = modeloYEsfuerzo(base.registro.find(x => x.rol === "revisor").args);
  assert.deepEqual(rev, revBase);
  assert.equal(rev.e, "low");
});

// V4: un nivel inválido sale con exit 2 antes de tocar el plan ni lanzar al constructor.
caso("V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto", () => {
  const ruta = modelosTemporal("v4.json", c => { c.kit_run.revisor.nivel = "inexistente"; });
  const r = correr("v4", { codex: true, env: { FLUCASTR_MODELOS: ruta } });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /inexistente/);
  assert.equal(r.cuenta("constructor"), 0);
  assert.equal(r.plan, PLAN);
});

// V5: la nota del plan lleva revisor=<modelo>:<esfuerzo> del revisor que corrió.
caso("V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>", () => {
  const r = correr("v5", { codex: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rev = modeloYEsfuerzo(r.registro.find(x => x.rol === "revisor").args);
  assert.ok(r.plan.includes(`- kit run: revisión APROBADO`), r.plan);
  assert.ok(r.plan.includes(`revisor=${rev.m}:${rev.e}`), r.plan);
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
