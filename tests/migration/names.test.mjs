// Prueba del migrador de vocabulario (`bash install.sh --migrate-names <ruta> [--dry-run]`).
// Crea un proyecto temporal con claves y carpetas viejas, y afirma: la simulación no escribe,
// la aplicación renombra y una segunda corrida no cambia nada.
// Correr: node --test tests/migration/names.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path, { join } from "node:path";

const RAIZ = fileURLToPath(new URL("../..", import.meta.url));
const INSTALAR = join(RAIZ, "install.sh");

function proyectoViejo() {
  const p = mkdtempSync(join(tmpdir(), "migrar-nombres-"));
  mkdirSync(join(p, "cambios", "en-curso"), { recursive: true });
  mkdirSync(join(p, "cambios", "hechos", "archivado"), { recursive: true });
  mkdirSync(join(p, ".claude"), { recursive: true });
  writeFileSync(join(p, "cambios", "en-curso", "plan.md"), [
    "---",
    "estado: aprobado",
    "rama: feature/x",
    "tramo: 2",
    "ejecutor: constructor",
    "continuidad: continua",
    "tipo: codigo",
    "---",
    "# Plan de prueba",
    "",
    "## Objetivo",
    "Algo.",
    "",
    "## Alcance",
    "Puede cambiar: nada.",
    "",
    "## Pasos",
    "",
    "### Tramo 1 — Historia: primera",
    "Dependencias: ninguna.",
    "",
    "## Evidencia",
    "Sin datos.",
    "",
    "## Notas",
    "Nota.",
    "",
  ].join("\n"));
  writeFileSync(join(p, "cambios", "hechos", "archivado", "plan.md"), "---\nestado: listo\n---\n## Alcance\nviejo\n");
  writeFileSync(join(p, "cambios", "HISTORY.md"), "# Historial\n");
  writeFileSync(join(p, ".claude", "settings.local.json"), '{\n  "agent": "constructor"\n}\n');
  return p;
}

function correr(args) {
  return spawnSync("bash", [INSTALAR, "--migrate-names", ...args], { cwd: RAIZ, encoding: "utf8", timeout: 120000 });
}

function instantanea(dir) {
  const salida = {};
  const recorrer = (d) => {
    for (const e of readdirSync(d)) {
      const f = join(d, e);
      if (statSync(f).isDirectory()) recorrer(f);
      else salida[path.relative(dir, f)] = readFileSync(f, "utf8");
    }
  };
  recorrer(dir);
  return salida;
}

test("migrar-nombres: la simulación lista los cambios y no escribe", () => {
  const p = proyectoViejo();
  try {
    const antes = instantanea(p);
    const r = correr([p, "--dry-run"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /movería: cambios\/en-curso -> changes\/en-curso/);
    assert.deepEqual(instantanea(p), antes, "la simulación no debe escribir");
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test("migrar-nombres: aplica el renombre, es idempotente y no reescribe changes/done/", () => {
  const p = proyectoViejo();
  try {
    const r = correr([p]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(join(p, "cambios")), false, "cambios/ debe desaparecer");
    assert.ok(existsSync(join(p, "changes", "en-curso", "plan.md")), "el plan debe estar en changes/");
    assert.ok(existsSync(join(p, "changes", "done", "archivado", "plan.md")), "hechos/ pasa a done/");

    const plan = readFileSync(join(p, "changes", "en-curso", "plan.md"), "utf8");
    assert.match(plan, /^status: approved$/m);
    assert.match(plan, /^branch: feature\/x$/m);
    assert.match(plan, /^segment: 2$/m);
    assert.match(plan, /^executor: builder$/m);
    assert.match(plan, /^continuity: continuous$/m);
    assert.match(plan, /^type: code$/m);
    assert.match(plan, /^## Goal$/m);
    assert.match(plan, /^## Scope$/m);
    assert.match(plan, /^### Segment 1 — Story: primera$/m);
    assert.match(plan, /^Dependencies: ninguna\.$/m);
    assert.match(plan, /^## Evidence$/m);
    assert.match(plan, /^## Notes$/m);

    const hechos = readFileSync(join(p, "changes", "done", "archivado", "plan.md"), "utf8");
    assert.match(hechos, /^estado: listo$/m, "el texto de done/ no se reescribe");

    const ajustes = readFileSync(join(p, ".claude", "settings.local.json"), "utf8");
    assert.match(ajustes, /"agent": "builder"/);

    const despues = instantanea(p);
    const segunda = correr([p]);
    assert.equal(segunda.status, 0, segunda.stderr);
    assert.match(segunda.stdout, /sin cambios/);
    assert.deepEqual(instantanea(p), despues, "una segunda corrida no debe cambiar nada");
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test("migrar-nombres: no se combina con --agent ni con --migrate", () => {
  const p = proyectoViejo();
  try {
    const conAgente = spawnSync("bash", [INSTALAR, "--migrate-names", p, "--agent", "planner"], { cwd: RAIZ, encoding: "utf8" });
    assert.equal(conAgente.status, 1);
    assert.match(conAgente.stderr, /no se combina/);
    assert.ok(existsSync(join(p, "cambios")), "un rechazo no debe mover nada");
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});
