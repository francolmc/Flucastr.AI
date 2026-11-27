// Prueba de la calibración del corpus (A4). No ejecuta Docker, Codex ni repos privados: la corrida
// real la hace la persona. Los pasos de cada tramo se inyectan con resultados falsos. Los temporales
// se borran al salir, incluso si una prueba falla.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { calibrar, clasificar, ejecutarTramo, escribirCalibracion, hashCorpus, main, oraculoOcultas, prepararTramo } from "../../evals/builder/lib/calibrar.mjs";

const BENCH = fileURLToPath(new URL("../../evals/builder/bench.mjs", import.meta.url));
const CORPUS_TEXTO = '[{"id":"K-01"},{"id":"K-02"}]\n';

async function conTemporal(fn) {
  const dir = mkdtempSync(join(tmpdir(), "calibrar-prueba-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("calibrar: válido cuando la base falla, la referencia pasa y kit-check no falla", () => {
  assert.deepEqual(
    clasificar({ base: { pasa: false }, referencia: { pasa: true }, kitCheck: { falla: false } }),
    { valido: true },
  );
});

test("calibrar: base verde da motivo base-verde", () => {
  assert.deepEqual(
    clasificar({ base: { pasa: true }, referencia: { pasa: true }, kitCheck: { falla: false } }),
    { valido: false, motivo: "base-verde" },
  );
});

test("calibrar: referencia roja da motivo referencia-roja", () => {
  assert.deepEqual(
    clasificar({ base: { pasa: false }, referencia: { pasa: false }, kitCheck: { falla: false } }),
    { valido: false, motivo: "referencia-roja" },
  );
});

test("calibrar: kit-check en falla da motivo kit-check-falla", () => {
  assert.deepEqual(
    clasificar({ base: { pasa: false }, referencia: { pasa: true }, kitCheck: { falla: true } }),
    { valido: false, motivo: "kit-check-falla" },
  );
});

test("calibrar: calibracion.json lleva el hash del corpus y no contiene salida ni rutas", () =>
  conTemporal(async (dir) => {
    const entradas = [{ id: "K-01", tramo: 1 }, { id: "K-02", tramo: 1 }];
    const ejecutar = async (entrada) =>
      entrada.id === "K-01"
        ? { base: { pasa: false }, referencia: { pasa: true }, kitCheck: { falla: false }, salida: "/home/franco/secreto stdout" }
        : { base: { pasa: true }, referencia: { pasa: true }, kitCheck: { falla: false }, salida: "ruta /home/franco/x" };
    const resultado = await calibrar({ entradas, corpusTexto: CORPUS_TEXTO, ejecutar });
    const ruta = escribirCalibracion({ salida: dir, resultado });
    const texto = readFileSync(ruta, "utf8");
    const json = JSON.parse(texto);

    assert.equal(json.corpus_sha256, createHash("sha256").update(CORPUS_TEXTO).digest("hex"));
    assert.equal(json.corpus_sha256, hashCorpus(CORPUS_TEXTO));
    assert.deepEqual(json.resultados[0], { id: "K-01", valido: true });
    assert.deepEqual(json.resultados[1], { id: "K-02", valido: false, motivo: "base-verde" });
    for (const r of json.resultados) {
      for (const clave of Object.keys(r)) assert.ok(["id", "valido", "motivo"].includes(clave), `clave inesperada: ${clave}`);
    }
    assert.ok(!texto.includes("/home/"), "no debe tener rutas de proyectos");
    assert.ok(!texto.includes("stdout") && !texto.includes("secreto"), "no debe tener salida cruda");
  }));

test("calibrar: orden desconocida sale con código 2", () => {
  const r = spawnSyncSeguro("node", [BENCH, "no-existe"], { encoding: "utf8", timeout: 60000 });
  assert.equal(r.status, 2, r.stderr);
});

// Repos falsos en temporal: la raíz y, si hace falta, un repo hijo con su propio Git (A4).
function git(cwd, args, fecha = null) {
  const env = fecha ? { ...process.env, GIT_AUTHOR_DATE: fecha, GIT_COMMITTER_DATE: fecha } : process.env;
  const r = spawnSyncSeguro("git", args, { cwd, encoding: "utf8", env });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falló: ${r.stderr}`);
  return r.stdout.trim();
}

function repo(dir) {
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-b", "main", "--quiet"]);
  git(dir, ["config", "user.name", "prueba"]);
  git(dir, ["config", "user.email", "prueba@local.invalid"]);
}

function commit(dir, archivos, mensaje, fecha) {
  for (const [ruta, texto] of Object.entries(archivos)) {
    mkdirSync(join(dir, dirname(ruta)), { recursive: true });
    writeFileSync(join(dir, ruta), texto);
  }
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "--no-verify", "--quiet", "-m", mensaje], fecha);
  return git(dir, ["rev-parse", "HEAD"]);
}

// Plan ficticio del tramo 1: su Segment verification lee app.txt y pasa solo con «ok».
const VERIFICACION = `node -e "process.exit(require('fs').readFileSync('app.txt','utf8').includes('ok')?0:1)"`;
const PLAN = (files) => `---
status: done
branch: feature/x
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Plan de prueba

## Steps

### Segment 1 — Story: app
As persona I want app so that ok.
Scope: \`app.txt\`.
Files: ${files}
Segment verification: \`${VERIFICACION}\` — level 1; exit 0; covers A1.
TODO:
- [x] Hacer app.
- A1: app; check with \`node -e "process.exit(0)"\`; expect exit 0.

## Evidence
$ prueba
exit 0

## Notes
Consejo: nada.
`;

function entradaFalsa(extra) {
  return { alias: "T", tramo: 1, estado: "calibrado", preparacion: [], env: {}, manifiestos_referencia: false, ...extra };
}

test("calibrar: ejecutor real con raíz sola: base falla, referencia pasa, kit-check no falla y se borra la copia (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-01", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-01": { cambio: "cambio-x", repo_codigo: "." } } };
    const copias = join(dir, "copias");
    const r = await ejecutarTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: copias, topeMs: 60000 });

    assert.equal(r.base.pasa, false, "la base debe fallar");
    assert.equal(r.referencia.pasa, true, "la referencia debe pasar");
    assert.equal(r.kitCheck.falla, false, "kit-check no debe fallar");
    assert.deepEqual(clasificar(r), { valido: true });
    assert.ok(!existsSync(copias) || readdirSync(copias).length === 0, "la copia debe borrarse");
    assert.ok(readdirSync(join(dir, "salida", "logs")).length > 0, "los registros crudos van a <salida>/logs");
  }));

test("calibrar: ejecutor real con repo hijo: la verificación entra con cd y la base sale del hijo (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    commit(raiz, { "LEEME.md": "x\n" }, "inicio", "2020-01-15T10:00:00Z");
    const hijo = join(raiz, "Sub");
    repo(hijo);
    const base = commit(hijo, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(hijo, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    appendFileSync(join(raiz, ".git", "info", "exclude"), "\n/Sub/\n");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("Sub/app.txt") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-02", base, referencia, verificacion_en: "codigo" });
    const local = { repos: { T: raiz }, tramos: { "T-02": { cambio: "cambio-x", repo_codigo: "Sub" } } };
    const copias = join(dir, "copias");
    const r = await ejecutarTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: copias, topeMs: 60000 });

    assert.equal(r.base.pasa, false, "la base del hijo debe fallar");
    assert.equal(r.referencia.pasa, true, "la referencia debe pasar tras aplicar Files: sin el prefijo del hijo");
    assert.equal(r.kitCheck.falla, false);
    assert.ok(!existsSync(copias) || readdirSync(copias).length === 0, "la copia debe borrarse");
  }));

test("calibrar: prepararTramo deja la copia lista con el plan y la base, sin Files de la referencia (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-03", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-03": { cambio: "cambio-x", repo_codigo: "." } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias") });
    try {
      assert.ok(existsSync(copia.planPath), "el plan debe estar escrito en la copia");
      assert.equal(readFileSync(join(copia.destino, "app.txt"), "utf8"), "no\n", "la copia parte de la base");
      assert.equal(copia.verificar("verificacion-base"), false);
    } finally {
      copia.limpiar();
    }
    assert.ok(!existsSync(copia.destino), "limpiar borra la copia");
  }));

test("calibrar: el contrato solo reemplaza el de copias K; en P queda el de la base; sin contrato explícito, el del kit (A15, D-35)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n", "core/skills/execute-plan/SKILL.md": "viejo\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt") }, "plan", "2020-03-01T10:00:00Z");
    const origen = join(dir, "SKILL-nuevo.md");
    writeFileSync(origen, "nuevo\n");
    const contrato = [{ ruta: "core/skills/execute-plan/SKILL.md", origen }];
    const local = { repos: { K: raiz, P1: raiz }, tramos: { "K-01": { cambio: "cambio-x", repo_codigo: "." }, "P1-01": { cambio: "cambio-x", repo_codigo: "." } } };
    const SKILL_KIT = fileURLToPath(new URL("../../core/skills/execute-plan/SKILL.md", import.meta.url));
    const casos = [
      { id: "K-01", alias: "K", contrato, esperado: "nuevo\n" },
      { id: "P1-01", alias: "P1", contrato, esperado: "viejo\n" },
      { id: "K-01", alias: "K", contrato: undefined, esperado: readFileSync(SKILL_KIT, "utf8") },
    ];
    for (const { id, alias, contrato: c, esperado } of casos) {
      const entrada = entradaFalsa({ id, alias, base, referencia, verificacion_en: "raiz" });
      const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), ...(c ? { contrato: c } : {}) });
      try {
        assert.equal(readFileSync(join(copia.destino, "core/skills/execute-plan/SKILL.md"), "utf8"), esperado, `${id} con alias ${alias}`);
        // El plan del tramo se escribe después del commit sintético y queda sin seguir en changes/ (D-39).
        assert.equal(git(copia.destino, ["status", "--porcelain", "--", ".", ":!changes"]), "", "el contrato no queda sin commit fuera de changes/");
      } finally {
        copia.limpiar();
      }
    }
  }));

test("calibrar: --local falso con un repo inexistente da motivo fijo y sale con 0 (A4)", () =>
  conTemporal(async (dir) => {
    const local = join(dir, "local.json");
    writeFileSync(local, JSON.stringify({ repos: { K: join(dir, "no-existe") }, tramos: { "K-01": { cambio: "x", repo_codigo: "." } } }));
    const salida = join(dir, "salida");
    const codigo = await main(["--salida", salida, "--local", local, "--tramos", "K-01"]);
    assert.equal(codigo, 0);
    const json = JSON.parse(readFileSync(join(salida, "calibracion.json"), "utf8"));
    assert.deepEqual(json.resultados, [{ id: "K-01", valido: false, motivo: "error-copia" }]);
  }));

test("calibrar: --tramos con un ID desconocido sale con código 2", async () => {
  const codigo = await main(["--salida", "/dev/null/x", "--tramos", "ZZ-99", "--local", "/dev/null/x"]);
  assert.equal(codigo, 2);
});

test("calibrar: Files: con punto final aplica la referencia de esa ruta (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt.") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-04", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-04": { cambio: "cambio-x", repo_codigo: "." } } };
    const r = await ejecutarTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), topeMs: 60000 });
    assert.equal(r.referencia.pasa, true, "la referencia debe aplicarse a app.txt sin el punto final");
  }));

test("calibrar: ruta propia sin base ni referencia da error-preparacion (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt, no-existe.txt") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-05", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-05": { cambio: "cambio-x", repo_codigo: "." } } };
    await assert.rejects(
      ejecutarTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), topeMs: 60000 }),
      (e) => e.motivo === "error-preparacion",
    );
    assert.ok(!existsSync(join(dir, "copias")) || readdirSync(join(dir, "copias")).length === 0, "la copia debe borrarse");
  }));

test("calibrar: prueba citada presente en la referencia se toma de ella, no de HEAD; la ausente sí de HEAD (A4)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n", "tests/x.test.mjs": "base\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "tests/x.test.mjs": "head\n", "tests/solo-head.test.mjs": "solo-head\n" }, "posterior", "2020-02-15T10:00:00Z");
    const verificacion = `node -e "require('fs').readFileSync('tests/x.test.mjs');require('fs').readFileSync('tests/solo-head.test.mjs');process.exit(require('fs').readFileSync('app.txt','utf8').includes('ok')?0:1)"`;
    commit(raiz, { "changes/cambio-x/plan.md": PLAN("app.txt").replace(VERIFICACION, verificacion) }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-06", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-06": { cambio: "cambio-x", repo_codigo: "." } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias") });
    try {
      assert.equal(readFileSync(join(copia.destino, "tests", "x.test.mjs"), "utf8"), "base\n", "la citada en la referencia no se pisa con HEAD");
      assert.equal(readFileSync(join(copia.destino, "tests", "solo-head.test.mjs"), "utf8"), "solo-head\n", "la ausente en la referencia sí viene de HEAD");
    } finally {
      copia.limpiar();
    }
  }));

test("calibrar: un tramo excluido se reporta sin ejecutarlo (A14, D-36)", async () => {
  const avisos = [];
  const llamadas = [];
  const entradas = [{ id: "K-03", estado: "excluido" }, { id: "K-01", estado: "calibrado" }];
  const ejecutar = async (entrada) => {
    llamadas.push(entrada.id);
    return { base: { pasa: false }, referencia: { pasa: true }, kitCheck: { falla: false } };
  };
  const resultado = await calibrar({ entradas, corpusTexto: CORPUS_TEXTO, ejecutar, progreso: (linea) => avisos.push(linea) });
  assert.deepEqual(llamadas, ["K-01"]);
  assert.deepEqual(resultado.resultados, [
    { id: "K-03", valido: false, motivo: "excluido" },
    { id: "K-01", valido: true },
  ]);
  assert.deepEqual(avisos, [
    "[1/2] K-03",
    "[1/2] K-03 descartado: excluido",
    "[2/2] K-01",
    "[2/2] K-01 válido",
  ]);
});

test("calibrar: avisa inicio y resultado de cada tramo, también con error (A12)", async () => {
  const avisos = [];
  const entradas = [{ id: "K-01" }, { id: "K-02" }, { id: "K-03" }];
  const ejecutar = async (entrada) => {
    if (entrada.id === "K-02") throw Object.assign(new Error("copia"), { motivo: "error-copia" });
    const base = { pasa: entrada.id === "K-03" };
    return { base, referencia: { pasa: true }, kitCheck: { falla: false } };
  };
  await calibrar({ entradas, corpusTexto: CORPUS_TEXTO, ejecutar, progreso: (linea) => avisos.push(linea) });
  assert.deepEqual(avisos, [
    "[1/3] K-01",
    "[1/3] K-01 válido",
    "[2/3] K-02",
    "[2/3] K-02 descartado: error-copia",
    "[3/3] K-03",
    "[3/3] K-03 descartado: base-verde",
  ]);
});

// A17: la prueba de referencia que el bloque nombra no entra en la copia, sí en Scope y en el registro.
const scopeDe = (ruta) => readFileSync(ruta, "utf8").match(/## Scope\n(.*)/)[1];
const PLAN_CON_PRUEBA = (files, prueba) =>
  PLAN(files).replace("As persona I want app so that ok.", `As persona I want app so that ok. Prueba: \`${prueba}\`.`);

test("oraculoOcultas: por ruta completa, por nombre único del oráculo, nunca por subcadena (A17)", () => {
  assert.deepEqual(
    oraculoOcultas({ bloque: "Files: x.mjs\nRevisa `tests/a.test.mjs`.", oraculoRutas: ["tests/a.test.mjs", "tests/b.test.mjs"] }),
    ["tests/a.test.mjs"],
  );
  assert.deepEqual(oraculoOcultas({ bloque: "Revisa b.test.mjs.", oraculoRutas: ["x/b.test.mjs", "y/c.test.mjs"] }), ["x/b.test.mjs"]);
  assert.deepEqual(oraculoOcultas({ bloque: "Revisa b.test.mjs.", oraculoRutas: ["x/b.test.mjs", "y/b.test.mjs"] }), []);
  assert.deepEqual(oraculoOcultas({ bloque: "Revisa data.test.mjs", oraculoRutas: ["a.test.mjs"] }), []);
});

test("calibrar: ocultarOraculo deja la prueba de referencia fuera de la copia, en Scope y en el registro, y reaplicarOraculo la escribe (A17)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n", "tests/app.test.mjs": "prueba\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN_CON_PRUEBA("app.txt", "tests/app.test.mjs") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-04", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-04": { cambio: "cambio-x", repo_codigo: "." } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), ocultarOraculo: true });
    try {
      assert.ok(!existsSync(join(copia.destino, "tests", "app.test.mjs")), "la prueba oculta no se escribe en la copia");
      assert.match(scopeDe(copia.planPath), /`tests\/app\.test\.mjs`/, "la prueba oculta entra en Scope");
      const registro = copia.oraculo.find((o) => o.ruta === "tests/app.test.mjs");
      assert.ok(registro, "la prueba oculta queda en el registro");
      assert.equal(registro.sha256, createHash("sha256").update("prueba\n").digest("hex"), "con el hash de la referencia");
      assert.equal(copia.reaplicarOraculo(), true, "al reaplicar, el hash coincide");
      assert.equal(readFileSync(join(copia.destino, "tests", "app.test.mjs"), "utf8"), "prueba\n", "al reaplicar se escribe desde la referencia");
    } finally {
      copia.limpiar();
    }
    assert.ok(!existsSync(copia.destino), "limpiar borra la copia");
  }));

test("calibrar: sin ocultarOraculo la prueba de referencia sí se escribe en la copia y no entra en Scope (A17, calibración)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n", "tests/app.test.mjs": "prueba\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN_CON_PRUEBA("app.txt", "tests/app.test.mjs") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-04", base, referencia, verificacion_en: "raiz" });
    const local = { repos: { T: raiz }, tramos: { "T-04": { cambio: "cambio-x", repo_codigo: "." } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias") });
    try {
      assert.ok(existsSync(join(copia.destino, "tests", "app.test.mjs")), "la calibración conserva la prueba del oráculo en la copia");
      assert.doesNotMatch(scopeDe(copia.planPath), /tests\/app\.test\.mjs/, "sin ocultar, Scope no cambia");
    } finally {
      copia.limpiar();
    }
  }));

test("calibrar: ocultarOraculo con repo hijo: la prueba va a Scope con el prefijo del hijo y no se escribe (A17)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    commit(raiz, { "LEEME.md": "x\n" }, "inicio", "2020-01-15T10:00:00Z");
    const hijo = join(raiz, "Sub");
    repo(hijo);
    const base = commit(hijo, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(hijo, { "app.txt": "ok\n", "tests/app.test.mjs": "prueba\n" }, "solucion", "2020-02-01T10:00:00Z");
    appendFileSync(join(raiz, ".git", "info", "exclude"), "\n/Sub/\n");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN_CON_PRUEBA("Sub/app.txt", "Sub/tests/app.test.mjs") }, "plan", "2020-03-01T10:00:00Z");
    const entrada = entradaFalsa({ id: "T-05", base, referencia, verificacion_en: "codigo" });
    const local = { repos: { T: raiz }, tramos: { "T-05": { cambio: "cambio-x", repo_codigo: "Sub" } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), ocultarOraculo: true });
    try {
      assert.ok(!existsSync(join(copia.destino, "Sub", "tests", "app.test.mjs")), "la prueba oculta del hijo no se escribe");
      assert.match(scopeDe(copia.planPath), /`Sub\/tests\/app\.test\.mjs`/, "Scope lleva el prefijo del repo hijo");
      const registro = copia.oraculo.find((o) => o.ruta === "tests/app.test.mjs" && o.subcarpeta === "Sub");
      assert.equal(registro?.sha256, createHash("sha256").update("prueba\n").digest("hex"), "el registro usa el hash de la referencia del hijo");
      assert.equal(copia.reaplicarOraculo(), true);
      assert.equal(readFileSync(join(copia.destino, "Sub", "tests", "app.test.mjs"), "utf8"), "prueba\n");
    } finally {
      copia.limpiar();
    }
  }));
