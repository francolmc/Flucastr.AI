// Paso 0 de la escalera (tramo 2): la infraestructura se repite con el mismo modelo; entorno, plan y decisión
// pausan con diagnóstico y sin relevo. Casos A2 y A3 de changes/escalera-recuperacion/plan.md.
// Cada caso corre scripts/kit-run.mjs en un repo git temporal con builder, revisor y verify falsos (KIT_RUN_*).
// Los falsos siguen un guion por turno (PASO0_BUILDER, PASO0_REVISOR, PASO0_VERIFY) y anotan cada turno en KR_LOG.

import assert from "node:assert/strict";
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
# Prueba de la escalera, paso 0

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

// Prelude común de los falsos: un turno por invocación; la acción n del guion es la del turno n (la última se repite).
const PRELUDIO = String.raw`#!${process.execPath}
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
function turno(rol, guion) {
  appendFileSync(process.env.KR_LOG, JSON.stringify({ rol, args: process.argv.slice(2) }) + "\n");
  const n = readFileSync(process.env.KR_LOG, "utf8").split("\n").filter((l) => l.includes('"rol":"' + rol + '"')).length;
  return guion[Math.min(n, guion.length) - 1];
}
`;

const FALSO_BUILDER = PRELUDIO + String.raw`
const accion = turno("builder", JSON.parse(process.env.PASO0_BUILDER));
const planPath = join(process.cwd(), "changes/prueba/plan.md");
if (accion === "done") {
  writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
  writeFileSync(join(process.cwd(), "creado.txt"), "hecho\n");
  console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
} else if (accion === "cuelga") {
  setTimeout(() => {}, 60000);
} else if (accion.startsWith("pausa:")) {
  console.log("PAUSED: plan=changes/prueba/plan.md; segment=1; motivo=" + accion.slice(6) + "; hecho=0/1; siguiente=revisar; no_intentado=prueba");
} else {
  const texto = { thrashing: "Autocompact is thrashing", invalid: "API Error: invalid_request_error", enospc: "ENOSPC: No space left on device" }[accion];
  console.error(texto);
  process.exit(1);
}
`;

const FALSO_REVISOR = PRELUDIO + String.raw`
const accion = turno("reviewer", JSON.parse(process.env.PASO0_REVISOR));
if (accion === "aprobado") {
  console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
} else if (accion === "devuelve") {
  console.log(JSON.stringify({ veredicto: "RETURNED", defectos: [{ archivo: "creado.txt", linea: 1, criterio: "A1", descripcion: "falta" }] }));
} else if (accion === "invalido") {
  console.log("no es un veredicto JSON");
} else if (accion === "modifica") {
  writeFileSync(join(process.cwd(), "tocado-por-revisor.txt"), "cambio\n");
  console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
} else {
  console.error("Autocompact is thrashing");
  process.exit(1);
}
`;

const FALSO_VERIFY = PRELUDIO + String.raw`
const accion = turno("verify", JSON.parse(process.env.PASO0_VERIFY));
if (accion === "ok") {
  console.log("verify: ok");
} else if (accion === "docker") {
  console.error("Cannot connect to the Docker daemon at unix:///var/run/docker.sock");
  process.exit(1);
} else {
  console.log("verify: fallo simulado");
  process.exit(1);
}
`;

const base = mkdtempSync(join(tmpdir(), "escalera-paso0-"));
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

// Repo temporal con el plan commiteado; guiones por rol y variables extra. Devuelve salida, registro y plan.
function correr(guiones = {}, extra = {}) {
  numeroCaso++;
  const raiz = join(base, `caso-${numeroCaso}`);
  mkdirSync(join(raiz, "changes/prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN_REL), PLAN);
  git(raiz, "init", "-q", "-b", "main");
  git(raiz, "add", "-A");
  git(raiz, "commit", "-q", "-m", "base");
  const log = join(base, `caso-${numeroCaso}.log`);
  writeFileSync(log, "");
  const entorno = { ...process.env };
  for (const clave of Object.keys(entorno)) {
    if (/^KIT_RUN_PEGADO/.test(clave) || clave === "KIT_PROGRESO" || clave === "KIT_RUN_TOPE_MS" || clave === "FLUCASTR_MODELOS") delete entorno[clave];
  }
  Object.assign(entorno, {
    KR_LOG: log,
    KIT_RUN_BUILDER: join(bin, "builder.mjs"),
    KIT_RUN_REVIEWER: join(bin, "revisor.mjs"),
    KIT_RUN_VERIFY: join(bin, "verify.mjs"),
    PASO0_BUILDER: JSON.stringify(guiones.builder ?? ["done"]),
    PASO0_REVISOR: JSON.stringify(guiones.revisor ?? ["aprobado"]),
    PASO0_VERIFY: JSON.stringify(guiones.verify ?? ["ok"]),
    ...extra,
  });
  const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, "--root", raiz], { encoding: "utf8", env: entorno });
  const rutaRuns = join(raiz, "changes/prueba/runs.jsonl");
  const runs = existsSync(rutaRuns) ? readFileSync(rutaRuns, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const cuenta = (rol) => readFileSync(log, "utf8").split("\n").filter((l) => l.includes(`"rol":"${rol}"`)).length;
  const plan = readFileSync(join(raiz, PLAN_REL), "utf8");
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, runs, cuenta, plan, estado: plan.match(/^status: (.*)$/m)[1] };
}

const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("A2: la infraestructura se repite con el mismo modelo", () => {
  test("thrashing una vez y luego DONE: dos líneas, la primera clase infra, la segunda resuelta por el paso 0", () => {
    const r = correr({ builder: ["thrashing", "done"] });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^DONE: plan=changes\/prueba\/plan\.md; segment=1; verify=pasa/);
    assert.equal(r.cuenta("builder"), 2);
    assert.equal(r.runs.length, 2);
    const [primera, ultima] = r.runs;
    assert.equal(primera.clase, "infra");
    assert.equal(primera.motivo_relanzamiento, "infra");
    assert.equal(primera.resultado, "devuelto");
    assert.equal(primera.relanzamientos, 0);
    assert.equal(primera.resuelto_por, null);
    assert.equal(ultima.clase, null);
    assert.equal(ultima.resultado, "DONE");
    assert.equal(ultima.relanzamientos, 1);
    assert.equal(ultima.paso, 0);
    assert.equal(ultima.resuelto_por, 0);
    assert.equal(ultima.motivo_relanzamiento, null);
    assert.equal(primera.builder_modelo, ultima.builder_modelo, "el modelo no cambia");
    assert.equal(r.estado, "done");
  });

  test("invalid_request en las tres corridas: al tercer fallo pausa access con el mismo modelo", () => {
    const r = correr({ builder: ["invalid"] });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /^PAUSED: plan=changes\/prueba\/plan\.md; segment=1; motivo=access;/);
    assert.equal(r.cuenta("builder"), 3, "1 + 2 relanzamientos");
    assert.deepEqual(r.runs.map((x) => x.clase), ["infra", "infra", "infra"]);
    assert.deepEqual(r.runs.slice(0, 2).map((x) => x.motivo_relanzamiento), ["infra", "infra"]);
    assert.equal(r.runs[2].motivo_relanzamiento, null);
    assert.equal(r.runs[2].resultado, "PAUSED");
    assert.equal(r.runs[2].relanzamientos, 2);
    assert.equal(new Set(r.runs.map((x) => x.builder_modelo)).size, 1, "el modelo no cambia");
    assert.equal(r.estado, "partial");
  });

  test("tope de tiempo en las tres corridas: pausa access, tres corridas y clase infra", () => {
    const r = correr({ builder: ["cuelga"] }, { KIT_RUN_TOPE_MS: "300" });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=access;/);
    assert.match(r.stdout, /superó el tope de 300 ms/);
    assert.equal(r.cuenta("builder"), 3);
    assert.equal(r.runs.length, 3);
    assert.ok(r.runs.every((x) => x.clase === "infra"));
  });

  test("revisor con thrashing: se repite solo el revisor y el builder corre una vez", () => {
    const r = correr({ revisor: ["thrashing", "aprobado"] });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.cuenta("builder"), 1);
    assert.equal(r.cuenta("reviewer"), 2);
    assert.equal(r.runs.length, 2);
    assert.equal(r.runs[0].clase, "infra");
    assert.equal(r.runs[0].motivo_relanzamiento, "infra");
    assert.equal(r.runs[0].resultado, "devuelto");
    assert.equal(r.runs[1].clase, null);
    assert.equal(r.runs[1].resultado, "DONE");
    assert.equal(r.runs[1].builder_ms, null, "la línea del revisor no lleva builder");
    assert.equal(r.runs[1].relanzamientos, 1);
    assert.equal(r.estado, "done");
  });

  test("una corrida DONE sin fallos: clase null, paso 0 y resuelto_por 0", () => {
    const r = correr();
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.runs.length, 1);
    assert.equal(r.runs[0].clase, null);
    assert.equal(r.runs[0].paso, 0);
    assert.equal(r.runs[0].resuelto_por, 0);
  });
});

describe("A3: entorno, plan y decisión pausan con diagnóstico y sin relevo", () => {
  const casos = [
    { nombre: "entorno (ENOSPC del builder)", builder: ["enospc"], motivo: "access", clase: "entorno", senal: "ENOSPC" },
    { nombre: "plan (PAUSED scope)", builder: ["pausa:scope"], motivo: "scope", clase: "plan", senal: "motivo=scope" },
    { nombre: "decisión (PAUSED ambiguous)", builder: ["pausa:ambiguous"], motivo: "ambiguous", clase: "decision", senal: "motivo=ambiguous" },
  ];
  for (const c of casos) {
    test(`${c.nombre}: una corrida, clase en runs.jsonl y Diagnóstico en la nota`, () => {
      const r = correr({ builder: c.builder });
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stdout, new RegExp(`^PAUSED: plan=changes/prueba/plan\\.md; segment=1; motivo=${c.motivo};`));
      assert.equal(r.cuenta("builder"), 1, "sin relanzar");
      assert.equal(r.runs.length, 1);
      assert.equal(r.runs[0].clase, c.clase);
      assert.equal(r.runs[0].resultado, "PAUSED");
      assert.equal(r.runs[0].relanzamientos, 0);
      assert.match(r.plan, new RegExp(`Diagnóstico: clase=${c.clase}; señal=${escapar(c.senal)}; qué hacer=`));
      assert.doesNotMatch(r.stdout + r.plan, /relevo/i);
    });
  }

  test("verify con entorno (Docker): pausa verify sin relanzar y con Diagnóstico", () => {
    const r = correr({ verify: ["docker"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=verify;/);
    assert.equal(r.cuenta("builder"), 1);
    assert.equal(r.cuenta("verify"), 1);
    assert.equal(r.runs.length, 1);
    assert.equal(r.runs[0].clase, "entorno");
    assert.match(r.plan, /Diagnóstico: clase=entorno; señal=docker; qué hacer=/);
    assert.doesNotMatch(r.stdout + r.plan, /relevo/i);
  });

  test("veredicto del revisor inválido: pausa verify sin relanzar, clase entorno y Diagnóstico", () => {
    const r = correr({ revisor: ["invalido"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=verify;/);
    assert.equal(r.cuenta("builder"), 1, "sin relanzar al builder");
    assert.equal(r.cuenta("reviewer"), 1, "sin repetir el revisor");
    assert.equal(r.runs.length, 1);
    assert.equal(r.runs[0].clase, "entorno");
    assert.equal(r.runs[0].resultado, "PAUSED");
    assert.match(r.plan, /Diagnóstico: clase=entorno; señal=veredicto_invalido; qué hacer=/);
    assert.doesNotMatch(r.stdout + r.plan, /relevo/i);
  });

  test("revisor que modifica el árbol: pausa access sin relanzar, clase entorno y Diagnóstico", () => {
    const r = correr({ revisor: ["modifica"] });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /motivo=access;/);
    assert.equal(r.cuenta("builder"), 1, "sin relanzar al builder");
    assert.equal(r.cuenta("reviewer"), 1, "sin repetir el revisor");
    assert.equal(r.runs.length, 1);
    assert.equal(r.runs[0].clase, "entorno");
    assert.equal(r.runs[0].resultado, "PAUSED");
    assert.match(r.plan, /Diagnóstico: clase=entorno; señal=arbol_modificado; qué hacer=/);
    assert.doesNotMatch(r.stdout + r.plan, /relevo/i);
  });
});
