// Pasos 1 y 2 de la escalera (tramo 3): una falla de tarea sube de a un paso. Casos A4 y A5 de
// changes/escalera-recuperacion/plan.md. El primer relanzamiento lleva un handoff cronológico; la segunda falla
// pausa pidiendo consejo y el siguiente kit run exige una nota «Consejo (tramo N):» válida (≤ 2000 caracteres).
// Cada caso corre scripts/kit-run.mjs en un repo git temporal con builder, revisor y verify falsos (KIT_RUN_*).

import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const KIT = fileURLToPath(new URL("../../scripts/kit-run.mjs", import.meta.url));
const PLAN_REL = "changes/prueba/plan.md";
const PLAN = `---
status: approved
branch: feature/prueba
base: main
repos: [.]
executor: builder
segment: 1
---
# Prueba de los pasos 1 y 2

## Decisions already taken
- Resuelto: el archivo creado.txt es el único entregable.

## Scope
- \`creado.txt\`

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

// Falsos: cada turno lee la siguiente acción de su guion (la última se repite) y anota en KR_LOG el rol y el prompt.
const PRELUDIO = String.raw`#!${process.execPath}
import { appendFileSync, readFileSync } from "node:fs";
function turno(rol, guion, entrada) {
  appendFileSync(process.env.KR_LOG, JSON.stringify({ rol, entrada }) + "\n");
  const n = readFileSync(process.env.KR_LOG, "utf8").split("\n").filter((l) => l.includes('"rol":"' + rol + '"')).length;
  return guion[Math.min(n, guion.length) - 1];
}
`;

const FALSO_BUILDER = PRELUDIO + String.raw`
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const accion = turno("builder", JSON.parse(process.env.PASOS12_BUILDER), readFileSync(0, "utf8"));
if (accion === "done") {
  const planPath = join(process.cwd(), "changes/prueba/plan.md");
  writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
  writeFileSync("creado.txt", "hecho\n");
  console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
} else if (accion === "pausa-verify") {
  console.log("PAUSED: plan=changes/prueba/plan.md; segment=1; motivo=verify; hecho=0/1; siguiente=revisar; no_intentado=verify");
} else {
  console.log("PAUSED: plan=changes/prueba/plan.md; segment=1; motivo=access; hecho=0/1; siguiente=revisar; no_intentado=prueba");
}
`;

const FALSO_REVISOR = PRELUDIO + String.raw`
turno("reviewer", ["aprobado"], "");
console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
`;

const FALSO_VERIFY = PRELUDIO + String.raw`
const accion = turno("verify", JSON.parse(process.env.PASOS12_VERIFY), "");
if (accion === "ok") {
  console.log("verify: ok");
} else {
  console.log("verify: fallo simulado");
  process.exit(1);
}
`;

const base = mkdtempSync(join(tmpdir(), "escalera-pasos12-"));
after(() => rmSync(base, { recursive: true, force: true }));
const bin = join(base, "bin");
mkdirSync(bin);
for (const [nombre, fuente] of Object.entries({ "builder.mjs": FALSO_BUILDER, "revisor.mjs": FALSO_REVISOR, "verify.mjs": FALSO_VERIFY })) {
  writeFileSync(join(bin, nombre), fuente);
  chmodSync(join(bin, nombre), 0o755);
}

let numeroCaso = 0;

function git(raiz, ...a) {
  const r = spawnSyncSeguro("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", ...a], { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`);
}

// Repo temporal con el plan commiteado. Devuelve la raíz; las corridas se hacen con `correr`.
function repo() {
  numeroCaso++;
  const raiz = join(base, `caso-${numeroCaso}`);
  mkdirSync(join(raiz, "changes/prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN_REL), PLAN);
  git(raiz, "init", "-q", "-b", "main");
  git(raiz, "add", "-A");
  git(raiz, "commit", "-q", "-m", "base");
  return raiz;
}

// Una invocación de kit run sobre el repo. Los guiones son los del repo entero: cada turno consume la siguiente acción.
// Devuelve salida, prompts de builder acumulados, registro y plan.
function correr(raiz, guiones = {}) {
  const log = join(base, `${basename(raiz)}.log`);
  if (!existsSync(log)) writeFileSync(log, "");
  const entorno = { ...process.env };
  for (const clave of Object.keys(entorno)) {
    if (/^KIT_RUN_PEGADO/.test(clave) || clave === "KIT_PROGRESO" || clave === "KIT_RUN_TOPE_MS" || clave === "FLUCASTR_MODELOS") delete entorno[clave];
  }
  Object.assign(entorno, {
    KR_LOG: log,
    KIT_RUN_BUILDER: join(bin, "builder.mjs"),
    KIT_RUN_REVIEWER: join(bin, "revisor.mjs"),
    KIT_RUN_VERIFY: join(bin, "verify.mjs"),
    PASOS12_BUILDER: JSON.stringify(guiones.builder ?? ["done"]),
    PASOS12_VERIFY: JSON.stringify(guiones.verify ?? ["ok"]),
  });
  const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, "--root", raiz], { encoding: "utf8", env: entorno });
  const registro = readFileSync(log, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const rutaRuns = join(raiz, "changes/prueba/runs.jsonl");
  const runs = existsSync(rutaRuns) ? readFileSync(rutaRuns, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const plan = readFileSync(join(raiz, PLAN_REL), "utf8");
  return {
    status: r.status,
    stdout: r.stdout,
    stderr: r.stderr,
    runs,
    registro,
    prompts: registro.filter((x) => x.rol === "builder").map((x) => x.entrada),
    cuenta: (rol) => registro.filter((x) => x.rol === rol).length,
    plan,
    estado: plan.match(/^status: (.*)$/m)[1],
  };
}

// Simula al planner: vuelve a aprobar el plan y, si se da, añade una línea a Notas.
function reaprobar(raiz, nota) {
  const ruta = join(raiz, PLAN_REL);
  let texto = readFileSync(ruta, "utf8").replace(/^status: .*$/m, "status: approved");
  if (nota !== undefined) texto = `${texto.trimEnd()}\n- ${nota}\n`;
  writeFileSync(ruta, texto);
}

const CONSEJO_TEXTO = "usa solo creado.txt y no toques el resto del repo";
// Verify falla en las dos primeras corridas; la tercera, cuando la hay, pasa.
const FALLA_DOS_Y_PASA = { verify: ["falla", "falla", "ok"] };

describe("A4: el primer relanzamiento lleva un handoff cronológico", () => {
  test("verificación roja una vez: el segundo prompt trae las secciones en orden y Último error ≤ 10 líneas", () => {
    const raiz = repo();
    const r = correr(raiz, { verify: ["falla", "ok"] });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 2);
    const segundo = r.prompts[1];
    const inicio = segundo.indexOf("Handoff (cronológico):");
    assert.ok(inicio >= 0, "el segundo prompt trae el handoff");
    const handoff = segundo.slice(inicio);
    const etiquetas = ["Hecho:", "Pendiente:", "Decisiones usadas:", "Archivos tocados:", "Último error:", "Próxima acción:"];
    const posiciones = etiquetas.map((t) => handoff.indexOf(t));
    assert.ok(posiciones.every((p) => p >= 0), `faltan secciones: ${etiquetas.filter((t, i) => posiciones[i] < 0)}`);
    assert.deepEqual([...posiciones].sort((a, b) => a - b), posiciones, "orden cronológico de las secciones");
    assert.match(handoff, /Hecho:\n- crear creado\.txt/);
    assert.match(handoff, /Decisiones usadas:\n- Resuelto: el archivo creado\.txt es el único entregable\./);
    assert.match(handoff, /- \?\? creado\.txt/);
    const error = handoff.slice(handoff.indexOf("Último error:") + "Último error:".length, handoff.indexOf("Próxima acción:"));
    assert.ok(error.split("\n").filter((l) => l.trim()).length <= 10, "Último error ≤ 10 líneas");
    assert.match(error, /verify: fallo simulado/);
    assert.ok(r.prompts[1].includes("Verification failed (exit 1)"), "el texto del error se conserva");
    assert.equal(r.runs[0].paso, 0);
    assert.equal(r.runs[1].paso, 1);
    assert.equal(r.runs[1].resuelto_por, 1);
  });
});

describe("A5: la segunda falla pide consejo y el siguiente kit run exige una nota válida", () => {
  test("segunda falla: pausa motivo=verify y deja en la nota la instrucción de consejo", () => {
    const raiz = repo();
    const r = correr(raiz, { verify: ["falla"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=verify;/);
    assert.equal(r.cuenta("builder"), 2);
    assert.match(r.plan, /paso 2: escribe «Consejo \(tramo 1\): …» y vuelve a lanzar/);
    assert.equal(r.estado, "partial");
  });

  test("sin consejo: exit 2 y el plan no cambia", () => {
    const raiz = repo();
    correr(raiz, { verify: ["falla"] });
    reaprobar(raiz);
    const antes = readFileSync(join(raiz, PLAN_REL), "utf8");
    const r = correr(raiz, { verify: ["falla"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(readFileSync(join(raiz, PLAN_REL), "utf8"), antes);
    assert.equal(r.cuenta("builder"), 2, "no corre ningún builder nuevo");
  });

  test("consejo de más de 2000 caracteres: exit 2 y el plan no cambia", () => {
    const raiz = repo();
    correr(raiz, { verify: ["falla"] });
    reaprobar(raiz, `Consejo (tramo 1): ${"x".repeat(2001)}`);
    const antes = readFileSync(join(raiz, PLAN_REL), "utf8");
    const r = correr(raiz, { verify: ["falla"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(readFileSync(join(raiz, PLAN_REL), "utf8"), antes);
    assert.equal(r.cuenta("builder"), 2);
  });

  test("con consejo válido: una corrida paso 2 que lo incluye; si verifica, DONE", () => {
    const raiz = repo();
    correr(raiz, FALLA_DOS_Y_PASA);
    reaprobar(raiz, `Consejo (tramo 1): ${CONSEJO_TEXTO}`);
    const r = correr(raiz, FALLA_DOS_Y_PASA);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 3);
    assert.ok(r.prompts[2].includes(CONSEJO_TEXTO), "la corrida paso 2 recibe el consejo");
    const ultima = r.runs.at(-1);
    assert.equal(ultima.paso, 2);
    assert.equal(ultima.relanzamientos, 2);
    assert.equal(ultima.resultado, "DONE");
    assert.equal(ultima.resuelto_por, 2);
    assert.equal(r.estado, "done");
  });

  test("con consejo válido y falla de nuevo: pausa ofreciendo --paso 3", () => {
    const raiz = repo();
    correr(raiz, { verify: ["falla"] });
    reaprobar(raiz, `Consejo (tramo 1): ${CONSEJO_TEXTO}`);
    const r = correr(raiz, { verify: ["falla"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=verify;/);
    assert.match(r.plan, /--paso 3/);
    assert.equal(r.cuenta("builder"), 3);
    assert.equal(r.cuenta("reviewer"), 0);
    assert.equal(r.estado, "partial");
  });
});

// Escribe runs.jsonl previo del tramo 1 (fixture de la escalera; los campos no usados por historial se omiten).
function escribirRuns(raiz, registros) {
  writeFileSync(join(raiz, "changes/prueba/runs.jsonl"), registros.map((r) => JSON.stringify({ plan: PLAN_REL, tramo: 1, ...r })).join("\n") + "\n");
}

describe("Corrección (a): PAUSED motivo=verify del builder entra en la escalera", () => {
  test("primera pausa por verify relanza con handoff (paso 1) y verifica", () => {
    const raiz = repo();
    const r = correr(raiz, { builder: ["pausa-verify", "done"] });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 2);
    assert.equal(r.runs[0].clase, "tarea");
    assert.equal(r.runs[0].motivo_relanzamiento, "verify");
    assert.equal(r.runs[1].paso, 1);
    assert.equal(r.runs[1].resuelto_por, 1);
    assert.ok(r.prompts[1].includes("Builder paused (motivo=verify)"), "el segundo prompt trae la pausa");
    assert.ok(r.prompts[1].includes("Handoff (cronológico):"), "el segundo prompt trae el handoff");
  });

  test("segunda pausa por verify sin consejo: pide consejo y deja la nota", () => {
    const raiz = repo();
    const r = correr(raiz, { builder: ["pausa-verify"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=verify;/);
    assert.equal(r.cuenta("builder"), 2);
    assert.match(r.plan, /paso 2: escribe «Consejo \(tramo 1\): …» y vuelve a lanzar/);
    assert.equal(r.cuenta("reviewer"), 0);
  });

  test("con consejo, una pausa más por verify agota la escalera", () => {
    const raiz = repo();
    correr(raiz, { builder: ["pausa-verify"] });
    reaprobar(raiz, `Consejo (tramo 1): ${CONSEJO_TEXTO}`);
    const r = correr(raiz, { builder: ["pausa-verify"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=verify;/);
    assert.equal(r.cuenta("builder"), 3);
    assert.equal(r.runs.at(-1).paso, 2);
    assert.match(r.plan, /escalera agotada/);
  });
});

describe("Corrección (b): dos fallas de tarea sin relanzamientos previos piden consejo", () => {
  test("dos fallas y 0 usados: exit 2 sin builder; con consejo, relanza en paso 2", () => {
    const raiz = repo();
    escribirRuns(raiz, [
      { clase: "tarea", relanzamientos: 0, paso: 0, resultado: "PAUSED" },
      { clase: "tarea", relanzamientos: 0, paso: 0, resultado: "PAUSED" },
    ]);
    const antes = readFileSync(join(raiz, PLAN_REL), "utf8");
    const r = correr(raiz);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /pide consejo/);
    assert.equal(readFileSync(join(raiz, PLAN_REL), "utf8"), antes);
    assert.equal(r.cuenta("builder"), 0, "no corre ningún builder");
    reaprobar(raiz, `Consejo (tramo 1): ${CONSEJO_TEXTO}`);
    const s = correr(raiz);
    assert.equal(s.status, 0, s.stdout + s.stderr);
    assert.equal(s.cuenta("builder"), 1);
    assert.ok(s.prompts[0].includes(CONSEJO_TEXTO), "la corrida paso 2 recibe el consejo");
    assert.equal(s.runs.at(-1).paso, 2);
  });
});

describe("Corrección (c): cupo gastado solo por infraestructura corre una vez sin relanzar", () => {
  test("dos reintentos por infra y ninguna falla de tarea: corre una vez y no relanza", () => {
    const raiz = repo();
    escribirRuns(raiz, [
      { clase: "infra", relanzamientos: 0, paso: 0, resultado: "devuelto", motivo_relanzamiento: "infra" },
      { clase: "infra", relanzamientos: 1, paso: 0, resultado: "devuelto", motivo_relanzamiento: "infra" },
      { clase: "infra", relanzamientos: 2, paso: 0, resultado: "PAUSED" },
    ]);
    const r = correr(raiz);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 1, "corre una sola vez");
    assert.equal(r.runs.at(-1).relanzamientos, 2);
  });
});
