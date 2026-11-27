// Prueba de la reconstrucción del plan de un tramo (A3). Usa un plan ficticio segmentado y un
// repo falso en un temporal que se borra al salir, incluso si una prueba falla. Los comprobadores
// del kit corren con un comando trivial de comprobación, para no llamar a esta misma prueba.
// No llama a Codex ni a la red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { bloqueDe, escribirPlanEnCopia, leerFuente, reconstruirPlan } from "../../evals/builder/lib/plan.mjs";
import { comandoVerificacion } from "../../tools/run/plan.mjs";

const KIT = fileURLToPath(new URL("../..", import.meta.url));

const TEXTO = `---
status: done
branch: feature/original
base: develop
repos: [.]
executor: builder
segment: 3
continuity: continuous
type: code
---
# Plan ficticio

## Goal
Objetivo ficticio.

## Steps

### Segment 1 — Story: primera
As persona I want uno so that A.
Scope: \`uno/a.mjs\`.
Files: uno/a.mjs
Segment verification: \`node -e "process.exit(0)"\` — level 1; exit 0; covers A1.
TODO:
- [x] Hacer uno.
Handoff: ninguno.
- A1: uno; check with \`node -e "process.exit(0)"\`; expect exit 0.

### Segment 2 — Story: segunda
As persona I want dos so that B.
Scope: \`dos/b.mjs\` y su prueba.
Files: dos/b.mjs, tests/dos.test.mjs
Segment verification: \`node -e "process.exit(0)"\` — level 1; exit 0; covers A2.
TODO:
- [x] Hacer dos.
Handoff: usar el contrato del tramo 1.
- A2: dos; check with \`node -e "process.exit(0)"\`; expect exit 0.
Devuelto: defecto — tramo 2 — dos/b.mjs, A2: algo que no debe pasar.
Resuelto: D-99 respondido.

### Segment 3 — Story: tercera
Files: tres/c.mjs
Segment verification: \`node -e "process.exit(0)"\` — level 1; exit 0; covers A3.
- A3: tres; check with \`node -e "process.exit(0)"\`; expect exit 0.

## Evidence
$ node --test uno.test.mjs
exit 0

## Notes
Consejo: no uses esto.
`;

function git(cwd, args, env = {}) {
  const r = spawnSyncSeguro("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falló: ${r.stderr}`);
  return r.stdout.trim();
}

async function conTemporal(fn) {
  const raiz = mkdtempSync(join(tmpdir(), "plan-prueba-"));
  try {
    return await fn(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}

test("plan: reconstruye solo la historia N, sin resultados ni líneas de devolución", () => {
  const plan = reconstruirPlan({ texto: TEXTO, n: 2 });
  assert.match(plan, /^---\nstatus: approved\nbranch: feature\/bench\nbase: main\n/);
  assert.match(plan, /\nsegment: 2\n/);
  assert.ok(!plan.includes("continuity"), "no debe llevar continuity");
  assert.ok(!plan.includes("feature/original"), "no debe conservar la rama original");
  assert.ok(!plan.includes("status: done"));
  assert.ok(plan.includes("### Segment 2"));
  assert.ok(!plan.includes("### Segment 1") && !plan.includes("### Segment 3"));
  assert.ok(!plan.includes("Devuelto:") && !plan.includes("Resuelto:") && !plan.includes("Consejo"));
  assert.ok(plan.includes("- A2: dos; check with"), "el criterio A2 debe seguir parseable");
  assert.ok(plan.includes("## Scope\n`dos/b.mjs`, `tests/dos.test.mjs`\n"));
  assert.ok(plan.includes("## Verification\n`node -e \"process.exit(0)\"`\n"));
  assert.match(plan, /## Evidence\n\n## Notes\n$/);
  assert.ok(!plan.includes("$ node --test uno.test.mjs"));
});

test("plan: todas las casillas quedan vacías aunque la fuente las marque (A3)", () => {
  const plan = reconstruirPlan({ texto: TEXTO, n: 2 });
  assert.ok(!/^\s*-\s*\[[xX]\]/m.test(plan), "ninguna casilla debe quedar marcada");
  assert.ok(plan.includes("- [ ] Hacer dos."), "la casilla del tramo debe quedar vacía");
});

test("plan: en el repo hijo, Verification entra con cd a la subcarpeta", () => {
  const plan = reconstruirPlan({ texto: TEXTO, n: 2, subcarpeta: "Sub" });
  assert.ok(plan.includes("## Verification\n`cd Sub && node -e \"process.exit(0)\"`\n"));
});

test("plan: tools/run lee el comando de Verification del plan reconstruido (A3)", () => {
  assert.equal(comandoVerificacion(reconstruirPlan({ texto: TEXTO, n: 2 })), 'node -e "process.exit(0)"');
  assert.equal(comandoVerificacion(reconstruirPlan({ texto: TEXTO, n: 2, subcarpeta: "Sub" })), 'cd Sub && node -e "process.exit(0)"');
});

test("plan: quita el punto final de la última ruta de Files: (A3)", () => {
  const conPunto = TEXTO.replace("Files: dos/b.mjs, tests/dos.test.mjs\n", "Files: dos/b.mjs, tests/dos.test.mjs.\n");
  const plan = reconstruirPlan({ texto: conPunto, n: 2 });
  assert.ok(plan.includes("## Scope\n`dos/b.mjs`, `tests/dos.test.mjs`\n"), plan);
  assert.ok(!plan.includes("dos.test.mjs.`"));
});

test("plan: kit-check y kit-scope no salen con 2 sobre el plan reconstruido", () =>
  conTemporal((raiz) => {
    const ruta = join(raiz, "plan.md");
    writeFileSync(ruta, reconstruirPlan({ texto: TEXTO, n: 2 }));
    const check = spawnSyncSeguro("node", [join(KIT, "scripts/kit-check.mjs"), ruta, "--segment", "2"], { cwd: KIT, encoding: "utf8", timeout: 60000 });
    const scope = spawnSyncSeguro("node", [join(KIT, "scripts/kit-scope.mjs"), ruta], { cwd: KIT, encoding: "utf8", timeout: 60000 });
    assert.notEqual(check.status, 2, `kit-check: ${check.stderr}`);
    assert.notEqual(scope.status, 2, `kit-scope: ${scope.stderr}`);
  }));

test("plan: escribe el plan en la copia y copia decisions.md solo si existe", () =>
  conTemporal((raiz) => {
    const plan = reconstruirPlan({ texto: TEXTO, n: 2 });
    const copia = join(raiz, "copia");
    mkdirSync(copia);
    const sinDecisiones = escribirPlanEnCopia({ copia, cambio: "mi-cambio", plan, decisiones: null });
    assert.equal(readFileSync(sinDecisiones, "utf8"), plan);
    assert.ok(!existsSync(join(copia, "changes/mi-cambio/decisions.md")));
    escribirPlanEnCopia({ copia, cambio: "otro", plan, decisiones: "| D-01 | x |\n" });
    assert.equal(readFileSync(join(copia, "changes/otro/decisions.md"), "utf8"), "| D-01 | x |\n");
  }));

test("plan: la fuente se lee del HEAD del repo raíz", () =>
  conTemporal((raiz) => {
    const repoRaiz = join(raiz, "repo");
    mkdirSync(join(repoRaiz, "changes/x"), { recursive: true });
    git(repoRaiz, ["init", "-b", "main", "--quiet"]);
    git(repoRaiz, ["config", "user.name", "prueba"]);
    git(repoRaiz, ["config", "user.email", "prueba@local.invalid"]);
    writeFileSync(join(repoRaiz, "changes/x/plan.md"), TEXTO);
    git(repoRaiz, ["add", "-A"]);
    git(repoRaiz, ["commit", "--no-verify", "--quiet", "-m", "plan"]);
    assert.equal(leerFuente({ raiz: repoRaiz, ruta: "changes/x/plan.md" }), TEXTO);
  }));

test("plan: extra añade rutas al Scope sin tocar Files y sin repetir las que ya están (A17)", () => {
  const plan = reconstruirPlan({ texto: TEXTO, n: 2, extra: ["tests/dos.test.mjs", "dos/extra.mjs"] });
  const scope = plan.match(/## Scope\n(.*)/)[1];
  assert.equal(scope, "`dos/b.mjs`, `tests/dos.test.mjs`, `dos/extra.mjs`", "Scope: Files primero, luego extras no repetidos");
  assert.match(plan, /^Files: dos\/b\.mjs, tests\/dos\.test\.mjs$/m, "el bloque del tramo conserva Files: como estaba");
});

test("plan: con extra vacío el Scope no cambia respecto de Files (A17)", () => {
  const sin = reconstruirPlan({ texto: TEXTO, n: 2 });
  const vacio = reconstruirPlan({ texto: TEXTO, n: 2, extra: [] });
  assert.equal(vacio, sin);
  assert.equal(sin.match(/## Scope\n(.*)/)[1], "`dos/b.mjs`, `tests/dos.test.mjs`");
});

test("plan: bloqueDe devuelve solo el segmento pedido y falla si no existe (A17)", () => {
  const bloque = bloqueDe(TEXTO, 3);
  assert.match(bloque, /^### Segment 3 — Story: tercera/);
  assert.ok(!bloque.includes("Segment 2"), "no incluye el tramo siguiente o anterior");
  assert.throws(() => bloqueDe(TEXTO, 99), /no hay Segment 99/);
});
