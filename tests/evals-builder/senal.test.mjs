// Prueba de la señal de cada intento (A6). Corre scripts/kit-run.mjs en un repo temporal con builder,
// verificación y revisor falsos; el temporal se borra al salir, incluso si una prueba falla.
// No llama a Codex ni a la red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const KIT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", "kit-run.mjs");
const PLAN_REL = "changes/prueba/plan.md";
const CABECERA = `#!${process.execPath}\n`;
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

// Builder falso: FAKE_MODO=thrashing muere con la firma de Claude Code; cualquier otro valor termina en DONE.
const BUILDER = `${CABECERA}import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
if (process.env.FAKE_MODO === "thrashing") {
  process.stderr.write("API Error: Autocompact is thrashing: the context refilled to the limit\\n");
  process.exit(1);
}
const planPath = join(process.cwd(), "changes/prueba/plan.md");
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
writeFileSync(join(process.cwd(), "creado.txt"), "hecho\\n");
console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
`;

const VERIFY = `${CABECERA}console.log("verify: ok");\n`;
const REVISOR = `${CABECERA}console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));\n`;

function git(raiz, args) {
  const r = spawnSyncSeguro("git", args, {
    cwd: raiz,
    encoding: "utf8",
    env: { ...process.env, GIT_AUTHOR_NAME: "prueba", GIT_AUTHOR_EMAIL: "prueba@example.com", GIT_COMMITTER_NAME: "prueba", GIT_COMMITTER_EMAIL: "prueba@example.com" },
  });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falló: ${r.stderr}`);
}

// Corre kit run y devuelve su código y los intentos de changes/prueba/runs.jsonl. El temporal se borra siempre.
function correrKit(modo) {
  const temporal = mkdtempSync(join(tmpdir(), "senal-prueba-"));
  try {
    const bin = join(temporal, "bin");
    mkdirSync(bin);
    for (const [nombre, texto] of [["builder.mjs", BUILDER], ["verify.mjs", VERIFY], ["revisor.mjs", REVISOR]]) {
      writeFileSync(join(bin, nombre), texto);
      chmodSync(join(bin, nombre), 0o755);
    }
    const raiz = join(temporal, "repo");
    mkdirSync(join(raiz, "changes/prueba"), { recursive: true });
    writeFileSync(join(raiz, PLAN_REL), PLAN);
    git(raiz, ["init", "-q", "-b", "main"]);
    git(raiz, ["add", "-A"]);
    git(raiz, ["commit", "-q", "-m", "base"]);
    const entorno = { ...process.env, KIT_PROGRESO: "0", KIT_RUN_BUILDER: join(bin, "builder.mjs"), KIT_RUN_VERIFY: join(bin, "verify.mjs"), KIT_RUN_REVIEWER: join(bin, "revisor.mjs"), FAKE_MODO: modo };
    for (const clave of Object.keys(entorno)) if (/^KIT_RUN_PEGADO/.test(clave)) delete entorno[clave];
    const r = spawnSyncSeguro(process.execPath, [KIT, PLAN_REL, "--root", raiz], { encoding: "utf8", env: entorno });
    const intentos = readFileSync(join(raiz, "changes/prueba/runs.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    return { status: r.status, intentos };
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
}

test("senal: un builder que muere con thrashing deja senal thrashing y clase infra en cada intento (A6)", () => {
  const r = correrKit("thrashing");
  assert.ok(r.intentos.length >= 1, "runs.jsonl registra los intentos");
  for (const intento of r.intentos) {
    assert.equal(intento.clase, "infra");
    assert.equal(intento.senal, "thrashing");
  }
});

test("senal: un intento DONE deja senal null y clase null (A6)", () => {
  const r = correrKit("done");
  assert.equal(r.status, 0);
  const ultimo = r.intentos.at(-1);
  assert.equal(ultimo.resultado, "DONE");
  assert.equal(ultimo.clase, null);
  assert.equal(ultimo.senal, null);
});
