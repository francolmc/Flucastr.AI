// Pasos 3 y 4 de la escalera (tramo 4): --paso 3 sube el nivel del builder una sola vez (A6); si ese paso falla,
// la nota paso 4 trae créditos estimados y el relevo, o «sin tarifa» / «sin tokens medidos», sin correr nada más (A7).
// Casos de changes/escalera-recuperacion/plan.md. Cada caso de kit run corre en un repo git temporal con falsos (KIT_RUN_*).

import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { conNivelSuperior, nivelSuperior } from "../../tools/run/nivel.mjs";
import { estimar, leerTokens } from "../../tools/run/estimar.mjs";

const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const KIT = join(RAIZ, "scripts", "kit-run.mjs");
const KIT_MODELOS = join(RAIZ, "models.json");
const TARIFAS = JSON.parse(readFileSync(join(RAIZ, "scripts", "rates.json"), "utf8")).modelos;
const PLAN_REL = "changes/prueba/plan.md";
const PLAN = `---
status: approved
branch: feature/prueba
base: main
repos: [.]
executor: builder
segment: 1
---
# Prueba de los pasos 3 y 4

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

// Historiales de runs.jsonl. AGOTADA: dos relanzamientos y dos fallas de tarea (escalera agotada).
const AGOTADA = [
  { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "tarea", relanzamientos: 1, paso: 1 },
  { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "tarea", relanzamientos: 2, paso: 2 },
];
// INFRA_CONSUMIDA: infraestructura gastó el cupo, pero hubo una falla de tarea: --paso 3 vale igual.
const INFRA_CONSUMIDA = [
  { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "tarea", relanzamientos: 1, paso: 1 },
  { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "infra", relanzamientos: 2, paso: 1 },
];
// SOLO_INFRA: cupo gastado sin ninguna falla de tarea: --paso 3 no vale.
const SOLO_INFRA = [
  { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "infra", relanzamientos: 2, paso: 0 },
];

// Falsos: cada turno anota en KR_LOG su rol y los datos extra; la acción sale del guion (la última se repite).
const PRELUDIO = String.raw`#!${process.execPath}
import { appendFileSync, readFileSync } from "node:fs";
function turno(rol, guion, entrada, extra = {}) {
  appendFileSync(process.env.KR_LOG, JSON.stringify({ rol, entrada, ...extra }) + "\n");
  const n = readFileSync(process.env.KR_LOG, "utf8").split("\n").filter((l) => l.includes('"rol":"' + rol + '"')).length;
  return guion[Math.min(n, guion.length) - 1];
}
`;

// El builder anota el nivel que ve en la copia de FLUCASTR_MODELOS (si la hay) y si la copia existe mientras corre.
const FALSO_BUILDER = PRELUDIO + String.raw`
import { existsSync, writeFileSync } from "node:fs";
const copia = process.env.FLUCASTR_MODELOS ?? null;
const nivel = copia && existsSync(copia) ? (JSON.parse(readFileSync(copia, "utf8")).agents?.builder?.level ?? null) : null;
turno("builder", ["done"], readFileSync(0, "utf8"), { copia, nivel, existe: copia ? existsSync(copia) : null });
writeFileSync("creado.txt", "hecho\n");
const planPath = "changes/prueba/plan.md";
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
`;

const FALSO_REVISOR = PRELUDIO + String.raw`
turno("reviewer", ["aprobado"], "", { copia: process.env.FLUCASTR_MODELOS ?? null });
console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
`;

const FALSO_VERIFY = PRELUDIO + String.raw`
const accion = turno("verify", JSON.parse(process.env.PASOS34_VERIFY), "");
if (accion === "ok") {
  console.log("verify: ok");
} else if (accion === "espacio") {
  console.log("Error: ENOSPC: no space left on device");
  process.exit(1);
} else {
  console.log("verify: fallo simulado");
  process.exit(1);
}
`;

const base = mkdtempSync(join(tmpdir(), "escalera-pasos34-"));
after(() => rmSync(base, { recursive: true, force: true }));
const bin = join(base, "bin");
mkdirSync(bin);
for (const [nombre, fuente] of Object.entries({ "builder.mjs": FALSO_BUILDER, "revisor.mjs": FALSO_REVISOR, "verify.mjs": FALSO_VERIFY })) {
  writeFileSync(join(bin, nombre), fuente);
  chmodSync(join(bin, nombre), 0o755);
}

// Configuración de prueba: copia de models.json con el builder en low (o high) y, opcionalmente, codex medium = gpt-6-luna
// (tarifa conocida en scripts/rates.json). Solo se lee models.json; la copia vive en el directorio temporal.
function origen(nombre, { nivel = "low", medio } = {}) {
  const c = JSON.parse(readFileSync(KIT_MODELOS, "utf8"));
  c.agents.builder.level = nivel;
  if (medio) c.profiles["codex-openai"].models.medium = medio;
  const ruta = join(base, `${nombre}.json`);
  writeFileSync(ruta, JSON.stringify(c, null, 2));
  return ruta;
}
const ORIGEN_LUNA = origen("luna", { medio: "gpt-6-luna" });
const ORIGEN_ALTO = origen("alto", { nivel: "high" });

let numeroCaso = 0;

function git(raiz, ...a) {
  const r = spawnSyncSeguro("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.com", ...a], { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`);
}

// Repo temporal con el plan commiteado y, si se da, el historial de runs.jsonl del tramo.
function repo(historia = []) {
  numeroCaso++;
  const raiz = join(base, `caso-${numeroCaso}`);
  mkdirSync(join(raiz, "changes/prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN_REL), PLAN);
  if (historia.length) writeFileSync(join(raiz, "changes/prueba/runs.jsonl"), historia.map((r) => JSON.stringify(r)).join("\n") + "\n");
  git(raiz, "init", "-q", "-b", "main");
  git(raiz, "add", "-A");
  git(raiz, "commit", "-q", "-m", "base");
  return raiz;
}

// Una invocación de kit run. `origenModelos` fija FLUCASTR_MODELOS para la corrida; si no, la configuración es la del kit.
function correr(raiz, { guiones = {}, args = [], origenModelos = null } = {}) {
  const log = join(base, `${basename(raiz)}.log`);
  if (!existsSync(log)) writeFileSync(log, "");
  const entorno = { ...process.env };
  for (const clave of Object.keys(entorno)) {
    if (/^KIT_RUN_PEGADO/.test(clave) || clave === "KIT_PROGRESO" || clave === "KIT_RUN_TOPE_MS" || clave === "FLUCASTR_MODELOS") delete entorno[clave];
  }
  if (origenModelos) entorno.FLUCASTR_MODELOS = origenModelos;
  Object.assign(entorno, {
    KR_LOG: log,
    KIT_RUN_BUILDER: join(bin, "builder.mjs"),
    KIT_RUN_REVIEWER: join(bin, "revisor.mjs"),
    KIT_RUN_VERIFY: join(bin, "verify.mjs"),
    PASOS34_VERIFY: JSON.stringify(guiones.verify ?? ["ok"]),
  });
  const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, "--root", raiz, ...args], { encoding: "utf8", env: entorno });
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
    cuenta: (rol) => registro.filter((x) => x.rol === rol).length,
    plan,
    estado: plan.match(/^status: (.*)$/m)[1],
  };
}

// --- A6: subir de nivel un solo tramo ---

describe("A6: nivelSuperior y conNivelSuperior", () => {
  test("low sube a medium, medium a high, y high o un nivel desconocido no suben", () => {
    assert.equal(nivelSuperior("low"), "medium");
    assert.equal(nivelSuperior("medium"), "high");
    assert.equal(nivelSuperior("high"), null);
    assert.equal(nivelSuperior("extra"), null);
  });

  test("durante fn la copia trae el nivel superior; al terminar se restaura FLUCASTR_MODELOS y se borra la copia", async () => {
    const previo = process.env.FLUCASTR_MODELOS;
    const antes = readFileSync(ORIGEN_LUNA, "utf8");
    process.env.FLUCASTR_MODELOS = ORIGEN_LUNA;
    let dentro;
    try {
      await conNivelSuperior(RAIZ, async ({ nivel, copia }) => {
        dentro = { nivel, copia, apuntada: process.env.FLUCASTR_MODELOS, existe: existsSync(copia), lvl: JSON.parse(readFileSync(copia, "utf8")).agents.builder.level };
      });
    } finally {
      if (previo === undefined) delete process.env.FLUCASTR_MODELOS; else process.env.FLUCASTR_MODELOS = previo;
    }
    assert.equal(dentro.nivel, "medium");
    assert.equal(dentro.lvl, "medium");
    assert.equal(dentro.apuntada, dentro.copia);
    assert.equal(dentro.existe, true);
    assert.equal(existsSync(dentro.copia), false, "la copia temporal se borra");
    assert.equal(readFileSync(ORIGEN_LUNA, "utf8"), antes, "la configuración original queda igual");
    assert.equal(process.env.FLUCASTR_MODELOS, previo);
  });

  test("si fn falla, la copia se borra igual y el error sale", async () => {
    const previo = process.env.FLUCASTR_MODELOS;
    process.env.FLUCASTR_MODELOS = ORIGEN_LUNA;
    let copia;
    try {
      await assert.rejects(conNivelSuperior(RAIZ, async (x) => { copia = x.copia; throw new Error("fallo simulado"); }), /fallo simulado/);
    } finally {
      if (previo === undefined) delete process.env.FLUCASTR_MODELOS; else process.env.FLUCASTR_MODELOS = previo;
    }
    assert.equal(existsSync(copia), false);
  });

  test("con el builder en high no hay nivel superior y conNivelSuperior se niega", async () => {
    const previo = process.env.FLUCASTR_MODELOS;
    process.env.FLUCASTR_MODELOS = ORIGEN_ALTO;
    try {
      await assert.rejects(conNivelSuperior(RAIZ, async () => {}), /nivel/);
    } finally {
      if (previo === undefined) delete process.env.FLUCASTR_MODELOS; else process.env.FLUCASTR_MODELOS = previo;
    }
  });

  test("kit run --paso 3 con la escalera agotada: una corrida en medium, el revisor con la original, copia borrada y models.json igual", () => {
    const raiz = repo(AGOTADA);
    const antes = readFileSync(KIT_MODELOS, "utf8");
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_LUNA });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 1, "una sola corrida del builder");
    const builder = r.registro.find((x) => x.rol === "builder");
    assert.equal(builder.nivel, "medium");
    assert.equal(builder.existe, true);
    assert.equal(existsSync(builder.copia), false, "la copia temporal se borra");
    const revisor = r.registro.find((x) => x.rol === "reviewer");
    assert.equal(revisor.copia, ORIGEN_LUNA, "el revisor usa la configuración original");
    assert.equal(r.runs.at(-1).paso, 3);
    assert.equal(readFileSync(KIT_MODELOS, "utf8"), antes, "models.json no cambia");
  });

  test("--paso 3 vale con infraestructura que consumió el cupo, si hubo una falla de tarea", () => {
    const raiz = repo(INFRA_CONSUMIDA);
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_LUNA });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 1);
  });

  test("--paso 3 sin escalera agotada sale con 2 sin correr el builder ni tocar el estado", () => {
    const raiz = repo([]);
    const r = correr(raiz, { args: ["--paso", "3"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 0);
    assert.equal(r.estado, "approved");
  });

  test("--paso 3 con cupo gastado solo por infraestructura sale con 2", () => {
    const raiz = repo(SOLO_INFRA);
    const r = correr(raiz, { args: ["--paso", "3"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 0);
  });

  test("--paso 3 con el builder en high sale con 2 y nombra el nivel", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_ALTO });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /nivel/);
    assert.equal(r.cuenta("builder"), 0);
  });

  test("--paso 3 vuelve a correr tras un paso 3 que falló por entorno (A6)", () => {
    const raiz = repo([...AGOTADA, { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "entorno", relanzamientos: 3, paso: 3 }]);
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_LUNA });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 1);
  });

  test("--paso 3 se niega tras un paso 3 que falló por tarea (A6)", () => {
    const raiz = repo([...AGOTADA, { plan: PLAN_REL, tramo: 1, resultado: "PAUSED", clase: "tarea", relanzamientos: 3, paso: 3 }]);
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_LUNA });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 0);
  });

  test("--paso solo admite 3", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "2"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 0);
  });
});

// --- A7: nota paso 4 y estimación ---

describe("A7: estimación de créditos y nota paso 4", () => {
  test("leerTokens acepta tres enteros «entrada,caché,salida» y rechaza el resto", () => {
    assert.deepEqual(leerTokens("1,2,3"), { entrada: 1, cache: 2, salida: 3 });
    assert.equal(leerTokens("1,2"), null);
    assert.equal(leerTokens("a,b,c"), null);
    assert.equal(leerTokens(undefined), null);
  });

  test("estimar da créditos por millón con el mismo volumen, «sin tarifa» si no hay tarifa y «sin tokens medidos» sin tokens", () => {
    const tokens = { entrada: 1_000_000, cache: 0, salida: 0 };
    assert.deepEqual(
      estimar({ tokens, modelos: ["gpt-6-luna", "openai/gpt-6-luna", "gpt-6.1-terra"], tarifas: TARIFAS }),
      [
        { modelo: "gpt-6-luna", valor: 2.5 },
        { modelo: "openai/gpt-6-luna", valor: 2.5 },
        { modelo: "gpt-6.1-terra", valor: "sin tarifa" },
      ],
    );
    assert.deepEqual(
      estimar({ tokens: { entrada: 0, cache: 1_000_000, salida: 1_000_000 }, modelos: ["gpt-6-luna"], tarifas: TARIFAS }),
      [{ modelo: "gpt-6-luna", valor: 12.75 }],
    );
    assert.deepEqual(estimar({ tokens: null, modelos: ["gpt-6-luna"], tarifas: TARIFAS }), [{ modelo: "gpt-6-luna", valor: "sin tokens medidos" }]);
  });

  test("paso 3 fallido: pausa con la nota paso 4 («sin tokens medidos»), sin corrida extra y sin relevo ejecutado", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3"], guiones: { verify: ["falla"] } });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=verify;/);
    assert.equal(r.cuenta("builder"), 1, "ninguna corrida extra del builder");
    assert.equal(r.cuenta("verify"), 1, "ninguna verificación extra");
    assert.equal(r.estado, "partial");
    assert.match(r.plan, /^- kit run: paso 4: .*Créditos del paso 3: «sin tokens medidos» \(estimación\)\. Relevo al planner \(modelo gpt-6\.1-terra\): «sin tokens medidos» \(estimación\)\. Pregunta de relevo/m);
  });

  test("paso 3 fallido con --tokens y tarifa conocida: la nota trae el crédito del paso 3 y del relevo", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3", "--tokens", "1000000,0,0"], guiones: { verify: ["falla"] }, origenModelos: ORIGEN_LUNA });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.plan, /- kit run: paso 4: .*Créditos del paso 3: 2\.5 \(estimación\)\. Relevo al planner \(modelo gpt-6-luna\): 2\.5 \(estimación\)/);
  });

  test("paso 3 fallido con --tokens y sin tarifa: la nota dice «sin tarifa»", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3", "--tokens", "1000,0,0"], guiones: { verify: ["falla"] } });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.plan, /Créditos del paso 3: «sin tarifa» \(estimación\)\. Relevo al planner \(modelo gpt-6\.1-terra\): «sin tarifa»/);
  });

  test("paso 3 que falla por entorno: diagnóstico sin nota paso 4 ni relevo, y sin corrida extra (A7)", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3"], origenModelos: ORIGEN_LUNA, guiones: { verify: ["espacio"] } });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 1, "una sola corrida del builder");
    assert.match(r.plan, /Diagnóstico: clase=entorno/);
    assert.doesNotMatch(r.plan, /paso 4|relevo/i);
  });

  test("--tokens mal formado sale con 2 sin tocar el plan", () => {
    const raiz = repo(AGOTADA);
    const r = correr(raiz, { args: ["--paso", "3", "--tokens", "1,2"] });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 0);
    assert.equal(r.estado, "approved");
  });
});
