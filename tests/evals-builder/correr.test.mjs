// Prueba de la corrida de una variante (A8, A9). El builder y el revisor son falsos: `kit` devuelve
// lo que `kit run` dejaría en runs.jsonl y en las sesiones, y `preparar` crea carpetas en un temporal.
// No se llama a Codex ni a la red. Los temporales se borran al salir, incluso si una prueba falla.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { hashCorpus, prepararTramo } from "../../evals/builder/lib/calibrar.mjs";
import { correr, main, permutar, versionCodex } from "../../evals/builder/lib/correr.mjs";

const IDS = Array.from({ length: 12 }, (_, i) => `K-${String(i + 1).padStart(2, "0")}`);
const CORPUS = IDS.map((id) => ({ id }));
const CORPUS_TEXTO = `${JSON.stringify(CORPUS)}\n`;
const CALIBRACION_OK = { corpus_sha256: hashCorpus(CORPUS_TEXTO), resultados: IDS.map((id) => ({ id, valido: true })) };
const VARIANTE = { huellas: { kit: "huella-1" }, modelos: { builder: { level: "low", effort: "high" } }, version: "codex-prueba" };
const ORIGINAL = "original\n";
const HASH_ORIGINAL = createHash("sha256").update(ORIGINAL).digest("hex");

async function conTemporal(fn) {
  const dir = mkdtempSync(join(tmpdir(), "correr-prueba-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function contexto() {
  return { destinos: [], carpetas: [], llamadas: [], pasos: [] };
}

// Copia falsa: una carpeta con un archivo de oráculo. `reaplica(id)` dice si el hash coincide y
// `verifica(id)` si la verificación con las pruebas de referencia pasa (A16). Ambos reciben el ID del tramo.
function prepararFalso(log, { reaplica = () => true, verifica = () => true } = {}) {
  return async ({ entrada, carpeta, destinoBase }) => {
    const destino = join(destinoBase, carpeta);
    mkdirSync(destino, { recursive: true });
    writeFileSync(join(destino, "app.test.mjs"), ORIGINAL);
    log.destinos.push(destino);
    log.carpetas.push(carpeta);
    return {
      destino,
      oraculo: [{ ruta: "app.test.mjs", subcarpeta: "", sha256: HASH_ORIGINAL }],
      reaplicarOraculo: () => {
        writeFileSync(join(destino, "app.test.mjs"), ORIGINAL);
        return reaplica(entrada.id);
      },
      verificar: (paso) => {
        log.pasos.push({ id: entrada.id, paso });
        return verifica(entrada.id);
      },
      limpiar: () => rmSync(destino, { recursive: true, force: true }),
      id: entrada.id,
    };
  };
}

const DONE = (id) => ({ herramienta: "codex", resultado: "DONE", clase: null, senal: null, motivo_relanzamiento: null,
  builder_modelo: `modelo-a:low`, builder_ms: 1000, verify_ms: 100, revisor_ms: 200, puerta_ms: 5, relanzamientos: 0, tramo: id });

// Kit falso: `intentosPor(id, rep)` decide qué deja `kit run`.
function kitFalso(log, { intentosPor = (id) => [DONE(id)], textos = null } = {}) {
  return async ({ entrada }) => {
    log.llamadas.push(entrada.id);
    return {
      intentos: intentosPor(entrada.id),
      sesiones: [{ herramienta: "codex", modelo: "modelo-a", creditos: 1, compactaciones: 0 }],
      filas: [{ modelo: "modelo-a", rol: "main", entrada: 10, cache_leida: 0, salida: 2 }],
      revisorModelo: "modelo-b:medium",
      cambios: [{ ruta: "app.txt", lineas: 3 }],
      textos,
      rutasFuente: [],
      rutasCopia: [],
      rutasViva: [],
      referencia: null,
    };
  };
}

function opciones(dir, log, extra = {}) {
  const { ejecutor: ejecutorExtra, ...resto } = extra;
  return {
    salida: join(dir, "salida"),
    nombre: "base",
    semilla: 1,
    repeticiones: 1,
    entradas: CORPUS,
    corpusTexto: CORPUS_TEXTO,
    calibracion: CALIBRACION_OK,
    tramos: null,
    topeTokens: null,
    variante: VARIANTE,
    destinoBase: join(dir, "copias"),
    ejecutor: { preparar: prepararFalso(log), kit: kitFalso(log), ...ejecutorExtra },
    ...resto,
  };
}

function lineas(dir) {
  const ruta = join(dir, "salida", "resultados.jsonl");
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

test("correr: el orden lo fija la semilla y es el mismo al repetirla (A8)", () => {
  const a = permutar(IDS, 1);
  assert.deepEqual(permutar(IDS, 1), a);
  assert.deepEqual([...a].sort(), [...IDS].sort(), "el orden debe tener los mismos IDs");
  assert.notDeepEqual(permutar(IDS, 2), a, "otra semilla da otro orden");
});

test("correr: una línea por tramo, corrida.json completo y copias borradas (A8)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const codigo = await correr(opciones(dir, log));
    assert.equal(codigo.codigo, 0, codigo.motivo);
    const filas = lineas(dir);
    assert.equal(filas.length, IDS.length, "una línea por tramo");
    assert.deepEqual(filas.map((f) => f.id).sort(), [...IDS].sort());
    for (const f of filas) {
      assert.equal(f.resultado, "DONE");
      assert.equal(f.variante, "base");
      assert.equal(f.oraculo_pasa, true, "el oráculo se reaplica, su hash coincide y la verificación pasa");
      assert.ok(!("oraculo" in f) && !("pruebas_alteradas" in f), "los campos viejos ya no se publican");
    }
    assert.ok(log.pasos.every((p) => p.paso === "oraculo"), "la verificación usa el nombre de paso oraculo");
    const cabecera = JSON.parse(readFileSync(join(dir, "salida", "corrida.json"), "utf8"));
    assert.equal(cabecera.semilla, 1);
    assert.equal(cabecera.repeticiones, 1);
    assert.equal(cabecera.corpus_sha256, hashCorpus(CORPUS_TEXTO));
    assert.equal(cabecera.version, "codex-prueba");
    assert.deepEqual(cabecera.huellas, VARIANTE.huellas);
    assert.deepEqual(cabecera.modelos, VARIANTE.modelos);
    assert.deepEqual(cabecera.orden, permutar(IDS, 1).map((id) => `${id}-r1`));
    for (const carpeta of log.carpetas) assert.match(carpeta, /^bench-base-s1-K-\d{2}-r1$/);
    for (const destino of log.destinos) assert.ok(!existsSync(destino), `la copia ${basename(destino)} debe borrarse`);
  }));

test("correr: oraculo_pasa sale de la verificación con las pruebas reescritas; no cambia resultado (A16, D-37)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const codigo = await correr(opciones(dir, log, {
      ejecutor: {
        preparar: prepararFalso(log, {
          verifica: (id) => {
            if (id === "K-05") throw new Error("verificador roto");
            return id !== "K-03";
          },
          reaplica: (id) => id !== "K-04",
        }),
        kit: kitFalso(log),
      },
    }));
    assert.equal(codigo.codigo, 0);
    const filas = lineas(dir);
    const k3 = filas.find((f) => f.id === "K-03");
    assert.equal(k3.oraculo_pasa, false, "la verificación falla con las pruebas reescritas");
    assert.equal(k3.resultado, "DONE", "la señal no invalida la corrida");
    const k4 = filas.find((f) => f.id === "K-04");
    assert.equal(k4.oraculo_pasa, null, "si el hash no coincide no se verifica");
    assert.equal(k4.resultado, "DONE");
    assert.ok(!log.pasos.some((p) => p.id === "K-04"), "K-04 no llega a la verificación");
    const k5 = filas.find((f) => f.id === "K-05");
    assert.equal(k5.oraculo_pasa, null, "una verificación que lanza da null, no corta la corrida");
    assert.equal(k5.resultado, "DONE");
    assert.equal(filas.filter((f) => f.oraculo_pasa === true).length, IDS.length - 3);
    assert.equal(filas.length, IDS.length, "ninguna línea se pierde");
  }));

test("correr: sin calibración o con menos de 10 válidos (sin --tramos) sale con 1 sin lanzar nada (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const sin = await correr(opciones(dir, log, { calibracion: null }));
    assert.equal(sin.codigo, 1);
    const pocos = { ...CALIBRACION_OK, resultados: IDS.map((id, i) => ({ id, valido: i < 9 })) };
    const pocosRes = await correr(opciones(dir, log, { calibracion: pocos }));
    assert.equal(pocosRes.codigo, 1);
    assert.equal(log.llamadas.length, 0, "no debe lanzar ningún tramo");
    assert.ok(!existsSync(join(dir, "salida", "resultados.jsonl")));
  }));

test("correr: con --tramos se corren esos IDs aunque no haya diez válidos (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const r = await correr(opciones(dir, log, { calibracion: null, tramos: ["K-02"] }));
    assert.equal(r.codigo, 0);
    assert.deepEqual(log.llamadas, ["K-02"]);
  }));

test("correr: contrato_ok false detiene la corrida y deja la línea del tramo (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const r = await correr(opciones(dir, log, {
      ejecutor: {
        preparar: prepararFalso(log),
        kit: kitFalso(log, { textos: ["leyó /viva/core/agents/builder.md"] }),
      },
    }));
    assert.equal(r.codigo, 3);
    assert.equal(log.llamadas.length, 1, "no lanza más tramos");
    assert.equal(lineas(dir).length, 1);
  }));

test("correr: límite de uso corta sin línea y reanudar salta los terminados (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const limite = (id) => (id === "K-03"
      ? [{ ...DONE(id), resultado: "PAUSED", clase: "entorno", senal: "limite_uso" }]
      : [DONE(id)]);
    const primera = await correr(opciones(dir, log, {
      ejecutor: { preparar: prepararFalso(log), kit: kitFalso(log, { intentosPor: limite }) },
    }));
    assert.equal(primera.codigo, 3);
    const hechos = lineas(dir).map((f) => f.id);
    assert.ok(!hechos.includes("K-03"), "el tramo cortado no deja línea");
    assert.equal(hechos.length, log.llamadas.indexOf("K-03"), "solo quedan los tramos anteriores al corte");

    const reanudo = contexto();
    const segunda = await correr(opciones(dir, reanudo));
    assert.equal(segunda.codigo, 0);
    assert.ok(!reanudo.llamadas.some((id) => hechos.includes(id)), "no relanza los terminados");
    assert.ok(reanudo.llamadas.includes("K-03"), "el cortado sí se relanza");
    assert.equal(lineas(dir).length, IDS.length);
  }));

test("correr: --tope-tokens detiene tras superar el total de tokens (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const r = await correr(opciones(dir, log, { topeTokens: 20 }));
    assert.equal(r.codigo, 3);
    assert.equal(lineas(dir).length, 2, "cada tramo gasta 12 tokens; el tope se supera al segundo");
  }));

test("correr: al repetir se reintentan entorno e invalida y se conservan los DONE (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const entorno = (id) => (id === "K-01" ? [{ ...DONE(id), resultado: "PAUSED", clase: "infra", senal: "thrashing" }] : [DONE(id)]);
    await correr(opciones(dir, log, { ejecutor: { preparar: prepararFalso(log), kit: kitFalso(log, { intentosPor: entorno }) } }));
    assert.equal(lineas(dir).find((f) => f.id === "K-01").resultado, "entorno");

    const reintento = contexto();
    const r = await correr(opciones(dir, reintento));
    assert.equal(r.codigo, 0);
    assert.deepEqual(reintento.llamadas, ["K-01"], "solo se relanza el entorno");
    const filas = lineas(dir);
    assert.equal(filas.length, IDS.length, "una línea por tramo, sin duplicados");
    assert.equal(filas.find((f) => f.id === "K-01").resultado, "DONE");
  }));

test("correr: reanudar con otra semilla o cabecera distinta sale con 2 (A8)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    await correr(opciones(dir, log));
    const otra = await correr(opciones(dir, contexto(), { semilla: 2 }));
    assert.equal(otra.codigo, 2);
  }));

test("prepararTramo: la carpeta lleva el nombre de la corrida y devuelve oráculo con hashes (A8)", () =>
  conTemporal(async (dir) => {
    const raiz = join(dir, "raiz");
    repo(raiz);
    const base = commit(raiz, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    const referencia = commit(raiz, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": PLAN }, "plan", "2020-03-01T10:00:00Z");
    const entrada = { id: "T-01", alias: "T", tramo: 1, base, referencia, verificacion_en: "raiz", estado: "calibrado", preparacion: [], env: {}, manifiestos_referencia: false };
    const local = { repos: { T: raiz }, tramos: { "T-01": { cambio: "cambio-x", repo_codigo: "." } } };
    const copia = prepararTramo({ entrada, local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), carpeta: "bench-base-s1-T-01-r1" });
    try {
      assert.equal(basename(copia.destino), "bench-base-s1-T-01-r1");
      assert.ok(Array.isArray(copia.oraculo), "devuelve la lista de oráculo");
      assert.equal(typeof copia.reaplicarOraculo, "function");
      for (const o of copia.oraculo) assert.match(o.sha256, /^[0-9a-f]{64}$/);
      assert.equal(copia.reaplicarOraculo(), true);
    } finally {
      copia.limpiar();
    }
    assert.ok(!existsSync(copia.destino));
  }));

// Repos falsos en temporal (mismos ayudantes que calibrar.test.mjs).
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

const PLAN = `---
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
Files: app.txt
Segment verification: \`node -e "process.exit(require('fs').readFileSync('app.txt','utf8').includes('ok')?0:1)"\` — level 1; exit 0; covers A1.
TODO:
- [x] Hacer app.
- A1: app; check with \`node -e "process.exit(0)"\`; expect exit 0.

## Evidence

## Notes
Consejo: nada.
`;

// Ejecutor real (A8, D-24): `main` con kit run de verdad sobre una copia, y builder, verificación y
// revisor falsos (KIT_RUN_*). Los fixtures son repos temporales; el builder falso escribe la sesión de
// Codex en HOME/.codex (enlazado a la carpeta falsa de CODEX_HOME), con la mención del contrato.
const CABECERA_SH = `#!${process.execPath}\n`;
const BUILDER_FALSO = CABECERA_SH + [
  'import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";',
  'import { dirname, join } from "node:path";',
  'const plan = process.env.FAKE_PLAN;',
  'const texto = readFileSync(plan, "utf8").replace(/^status: .*$/m, "status: done").replace(/- \\[ \\]/g, "- [x]");',
  'writeFileSync(plan, texto.replace(/^## Evidence\\s*$/m, () => "## Evidence\\n\\nA1 (builder falso):\\n$ node -e \\"process.exit(0)\\"\\nexit 0\\n"));',
  'writeFileSync(process.env.FAKE_ARCHIVO, "ok\\n");',
  'if (process.env.FAKE_LOG) appendFileSync(process.env.FAKE_LOG, process.env.FAKE_ARCHIVO + "\\n");',
  // A17: registra si la prueba oculta existe al arrancar y luego la escribe (dentro de Scope).
  'if (process.env.FAKE_PRUEBA) {',
  '  appendFileSync(process.env.FAKE_LOG, "previa:" + existsSync(process.env.FAKE_PRUEBA) + "\\n");',
  '  mkdirSync(dirname(process.env.FAKE_PRUEBA), { recursive: true });',
  '  writeFileSync(process.env.FAKE_PRUEBA, "prueba del builder\\n");',
  '}',
  'const dirSesion = join(process.env.HOME, ".codex", "sessions", "2026", "11", "26");',
  'mkdirSync(dirSesion, { recursive: true });',
  'const skill = process.env.FAKE_MENCION === "relativa" ? "core/skills/execute-plan/SKILL.md" : join(process.env.FAKE_MENCION === "viva" ? process.env.FAKE_HOME_REAL : process.env.HOME, ".agents", "skills", "execute-plan", "SKILL.md");',
  'if (process.env.FAKE_CONTRATO) writeFileSync(process.env.FAKE_CONTRATO, readFileSync("core/skills/execute-plan/SKILL.md", "utf8"));',
  'const lineas = [',
  '  { timestamp: new Date().toISOString(), type: "session_meta", payload: { cwd: process.cwd() } },',
  '  { timestamp: new Date().toISOString(), type: "turn_context", payload: { model: "modelo-a" } },',
  '  { timestamp: new Date().toISOString(), type: "response_item", payload: { type: "message", content: [{ type: "input_text", text: "lee " + skill }] } },',
  '  { timestamp: new Date().toISOString(), type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 100, cached_input_tokens: 0, output_tokens: 10 }, last_token_usage: { input_tokens: 100 } } } },',
  '];',
  'writeFileSync(join(dirSesion, "rollout-" + process.pid + ".jsonl"), lineas.map((l) => JSON.stringify(l)).join("\\n") + "\\n");',
  'console.log("DONE: plan=" + plan + "; segment=1; verify=pasa");',
  '',
].join("\n");

const VERIFY_FALSO = `${CABECERA_SH}console.log("verify: ok");\n`;
const REVISOR_FALSO = `${CABECERA_SH}console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));\n`;

function planReal(archivo) {
  return `---
status: approved
branch: feature/x
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Plan de prueba

## Scope
- \`${archivo}\`

## Steps

### Segment 1 — Story: app
As persona I want app so that ok.
Scope: \`${archivo}\`.
Files: ${archivo}
Segment verification: \`node -e "process.exit(0)"\` — level 1; exit 0; covers A1.
TODO:
- [ ] Hacer app.
- A1: app; check with \`node -e "process.exit(0)"\`; expect exit 0.

## Verification
\`node -e "process.exit(0)"\`

## Evidence

## Notes
`;
}

// Raíz con changes/cambio-x/plan.md y app.txt (base «no», referencia «ok»). Con `hijo`, el código vive en
// app/, un repo propio dentro de la raíz (ignorado por la raíz), y el plan lista app/app.txt.
function fixtureReal(dir, { hijo = false, id = "K-01", contrato = false, prueba = false } = {}) {
  const raiz = join(dir, "raiz");
  repo(raiz);
  let base;
  let referencia;
  // Con `contrato`, la base del kit trae un contrato histórico (A15): la copia debe recibir el de la variante.
  const contratoBase = contrato ? { "core/skills/execute-plan/SKILL.md": "contrato historico\n" } : {};
  if (hijo) {
    const codigo = join(raiz, "app");
    repo(codigo);
    base = commit(codigo, { "app.txt": "no\n" }, "base", "2020-01-01T10:00:00Z");
    referencia = commit(codigo, { "app.txt": "ok\n" }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { ".gitignore": "app/\n", "changes/cambio-x/plan.md": planReal("app/app.txt") }, "plan", "2020-01-01T09:00:00Z");
  } else {
    base = commit(raiz, { "app.txt": "no\n", ...contratoBase }, "base", "2020-01-01T10:00:00Z");
    // A17: con `prueba`, la referencia trae una prueba que el tramo nombra y la verificación la exige.
    const pruebaRef = prueba ? { "tests/app.test.mjs": "prueba\n" } : {};
    const planTexto = prueba
      ? planReal("app.txt")
        .replace("As persona I want app so that ok.", "As persona I want app so that ok. Prueba: `tests/app.test.mjs`.")
        .replace("process.exit(0)", "process.exit(require('fs').existsSync('tests/app.test.mjs')?0:1)")
      : planReal("app.txt");
    referencia = commit(raiz, { "app.txt": "ok\n", ...pruebaRef }, "solucion", "2020-02-01T10:00:00Z");
    commit(raiz, { "changes/cambio-x/plan.md": planTexto }, "plan", "2020-03-01T10:00:00Z");
  }
  const local = { repos: { K: raiz }, tramos: { [id]: { cambio: "cambio-x", repo_codigo: hijo ? "app" : "." } } };
  const corpus = [{ id, alias: "K", tramo: 1, base, referencia, archivos: 1, lineas: 2, estado: "calibrado",
    verificacion_en: hijo ? "codigo" : "raiz", preparacion: [], env: {}, manifiestos_referencia: false }];
  return { raiz, local, corpus };
}

function ejecutablesFalsos(dir, extra = {}) {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  for (const [nombre, texto] of [["builder.mjs", BUILDER_FALSO], ["verify.mjs", VERIFY_FALSO], ["revisor.mjs", REVISOR_FALSO], ...Object.entries(extra)]) {
    writeFileSync(join(bin, nombre), texto);
    chmodSync(join(bin, nombre), 0o755);
  }
  return bin;
}

// Cambia process.env solo mientras corre fn y lo restaura, también si falla.
async function conEntorno(vars, fn) {
  const previo = {};
  for (const clave of Object.keys(vars)) {
    previo[clave] = process.env[clave];
    process.env[clave] = vars[clave];
  }
  try {
    return await fn();
  } finally {
    for (const clave of Object.keys(vars)) {
      if (previo[clave] === undefined) delete process.env[clave];
      else process.env[clave] = previo[clave];
    }
  }
}

// Corre `main` con kit run real sobre el fixture. Devuelve código, líneas de resultados, cabecera y el log del builder.
async function correrReal(dir, { hijo = false, mencion = "copia", env = {}, contrato = false, prueba = false } = {}) {
  const f = fixtureReal(dir, { hijo, contrato, prueba });
  const bin = ejecutablesFalsos(dir);
  mkdirSync(join(dir, "codex"), { recursive: true });
  const archivos = { local: join(dir, "local.json"), corpus: join(dir, "corpus.json"), variante: join(dir, "variante.json") };
  writeFileSync(archivos.local, JSON.stringify(f.local));
  writeFileSync(archivos.corpus, JSON.stringify(f.corpus));
  writeFileSync(archivos.variante, JSON.stringify({ nombre: "prueba" }));
  const salida = join(dir, "salida");
  const vars = {
    KIT_PROGRESO: "0",
    KIT_RUN_BUILDER: join(bin, "builder.mjs"),
    KIT_RUN_VERIFY: join(bin, "verify.mjs"),
    KIT_RUN_REVIEWER: join(bin, "revisor.mjs"),
    FAKE_ARCHIVO: hijo ? "app/app.txt" : "app.txt",
    FAKE_PLAN: `changes/${f.corpus[0].id}/plan.md`,
    FAKE_LOG: join(dir, "log.txt"),
    FAKE_MENCION: mencion,
    FAKE_HOME_REAL: homedir(),
    CODEX_HOME: join(dir, "codex"),
    ...env,
  };
  const codigo = await conEntorno(vars, () => main(
    ["--variante", archivos.variante, "--semilla", "1", "--salida", salida, "--tramos", f.corpus[0].id, "--local", archivos.local],
    { corpus: archivos.corpus },
  ));
  const ruta = join(salida, "resultados.jsonl");
  const lineasRes = existsSync(ruta) ? readFileSync(ruta, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const cabecera = existsSync(join(salida, "corrida.json")) ? JSON.parse(readFileSync(join(salida, "corrida.json"), "utf8")) : null;
  const log = existsSync(vars.FAKE_LOG) ? readFileSync(vars.FAKE_LOG, "utf8") : "";
  return { codigo, lineas: lineasRes, cabecera, log };
}

test("main: raíz sola corre el ejecutor real y deja una línea DONE (A8, D-24)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir);
    assert.equal(r.codigo, 0);
    assert.equal(r.lineas.length, 1, "una línea por tramo");
    assert.equal(r.lineas[0].id, "K-01");
    assert.equal(r.lineas[0].resultado, "DONE");
  }));

test("main: cada par deja runs.jsonl y la salida de kit run en logs, sin rutas en resultados (A13, D-33)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir);
    assert.equal(r.codigo, 0);
    const logs = join(dir, "salida", "logs");
    // El paso oraculo (A16) deja su salida en logs también cuando el par termina con intentos.
    assert.deepEqual(readdirSync(logs).sort(), ["K-01-r1-kit-run.log", "K-01-r1-runs.jsonl", "bench-variante-s1-K-01-r1-oraculo.log"]);
    const intentos = readFileSync(join(logs, "K-01-r1-runs.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    assert.equal(intentos.at(-1).resultado, "DONE");
    assert.match(readFileSync(join(logs, "K-01-r1-kit-run.log"), "utf8"), /exit \S+\n$/);
    assert.ok(!JSON.stringify(r.lineas).includes("logs"), "resultados.jsonl no lleva rutas de logs");
  }));

test("main: un kit run que falla (builder inexistente) deja su intento entorno y la salida en logs (A13, D-33)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir, { env: { KIT_RUN_BUILDER: join(dir, "no-existe.mjs") } });
    assert.equal(r.lineas.length, 1, `el par queda registrado aunque kit run falle (codigo ${r.codigo})`);
    const logs = join(dir, "salida", "logs");
    // El paso oraculo (A16) deja su salida en logs también cuando el par termina con intentos.
    assert.deepEqual(readdirSync(logs).sort(), ["K-01-r1-kit-run.log", "K-01-r1-runs.jsonl", "bench-variante-s1-K-01-r1-oraculo.log"]);
    const intentos = readFileSync(join(logs, "K-01-r1-runs.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    assert.equal(intentos.at(-1).clase, "entorno");
  }));

test("main: repo hijo cuenta las líneas del cambio en el hijo (A7, A8)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir, { hijo: true });
    assert.equal(r.codigo, 0);
    assert.equal(r.lineas[0].resultado, "DONE");
    assert.equal(r.lineas[0].lineas.producto, 2, "una línea cambiada y otra borrada en app/app.txt");
    assert.equal(r.lineas[0].tokens?.entrada, 100, "entrada de la sesión de la copia, filtrada por su carpeta");
    assert.equal(r.lineas[0].tokens?.salida, 10);
  }));

test("main: el entorno mezcla process.env y no deja temporales al salir (A8)", () =>
  conTemporal(async (dir) => {
    const tmp = join(dir, "tmp");
    mkdirSync(tmp);
    const r = await correrReal(dir, { env: { TMPDIR: tmp } });
    assert.equal(r.codigo, 0);
    assert.ok(r.log.includes("app.txt"), "el builder falso se lanzó");
    assert.deepEqual(readdirSync(tmp), [], "la copia y el HOME temporal se borran");
  }));

test("main: el builder que lee la copia del contrato deja contrato_ok true (A8)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir, { mencion: "copia" });
    assert.equal(r.codigo, 0);
    assert.equal(r.lineas[0].contrato_ok, true);
    assert.equal(r.lineas[0].contaminado, false);
  }));

test("main: el builder que lee el contrato vivo corta con contrato_ok false (A9)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir, { mencion: "viva" });
    assert.equal(r.codigo, 3);
    assert.equal(r.lineas.length, 1);
    assert.equal(r.lineas[0].contrato_ok, false);
  }));

test("main: en K el builder lee el contrato con ruta relativa: contrato_ok true y la copia trae el de la variante (A15, D-35)", () =>
  conTemporal(async (dir) => {
    const leido = join(dir, "contrato-leido.md");
    const r = await correrReal(dir, { mencion: "relativa", contrato: true, env: { FAKE_CONTRATO: leido } });
    assert.equal(r.codigo, 0);
    assert.equal(r.lineas[0].contrato_ok, true);
    assert.equal(readFileSync(leido, "utf8"), readFileSync(new URL("../../core/skills/execute-plan/SKILL.md", import.meta.url), "utf8"),
      "el contrato que lee el builder en la copia es el de la variante, no el histórico");
  }));

test("main: la prueba de referencia que el tramo nombra queda oculta al builder y su línea sale con oraculo_pasa true (A17)", () =>
  conTemporal(async (dir) => {
    const r = await correrReal(dir, { prueba: true, env: { FAKE_PRUEBA: "tests/app.test.mjs" } });
    assert.equal(r.codigo, 0);
    assert.match(r.log, /^previa:false$/m, "al arrancar el builder la prueba oculta no existe en la copia");
    const [fila] = r.lineas;
    assert.equal(fila.resultado, "DONE", "escribir la prueba dentro de Scope no es falla de alcance");
    assert.equal(fila.oraculo_pasa, true, "reaplicada la referencia y con su hash, la verificación pasa");
    assert.ok(fila.lineas.prueba > 0, "las líneas medidas de prueba son mayores que 0: se miden antes de reaplicar la referencia");
  }));

test("main: corrida.json lleva los modelos resueltos y la versión de Codex (A8)", () =>
  conTemporal(async (dir) => {
    const bin = join(dir, "bin-codex");
    mkdirSync(bin);
    writeFileSync(join(bin, "codex"), `${CABECERA_SH}console.log("codex-cli 9.9.9");\n`);
    chmodSync(join(bin, "codex"), 0o755);
    const r = await correrReal(dir, { env: { PATH: `${bin}:${process.env.PATH}` } });
    assert.equal(r.cabecera.version, "codex-cli 9.9.9");
    assert.equal(typeof r.cabecera.modelos.builder, "string");
    assert.ok(r.cabecera.modelos.builder.length > 0, "nombre de modelo del builder");
  }));

test("correr: un tramo que deja cero intentos queda entorno con motivo sin-intentos (A9)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const sinIntentos = (id) => (id === "K-01" ? [] : [DONE(id)]);
    const r = await correr(opciones(dir, log, { ejecutor: { preparar: prepararFalso(log), kit: kitFalso(log, { intentosPor: sinIntentos }) } }));
    assert.equal(r.codigo, 0);
    const k1 = lineas(dir).find((f) => f.id === "K-01");
    assert.equal(k1.resultado, "entorno");
    assert.equal(k1.motivo, "sin-intentos");
  }));

test("prepararTramo: devuelve la referencia de Files: con sus líneas (A8)", () =>
  conTemporal(async (dir) => {
    const f = fixtureReal(dir);
    const copia = prepararTramo({ entrada: f.corpus[0], local: f.local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), carpeta: "bench-base-s1-K-01-r1" });
    try {
      assert.deepEqual(copia.referencia, [{ ruta: "app.txt", lineas: 2 }]);
      assert.deepEqual(copia.carpetas, [copia.destino]);
    } finally {
      copia.limpiar();
    }
  }));

test("prepararTramo: con repo hijo devuelve una carpeta por repo (A8)", () =>
  conTemporal(async (dir) => {
    const f = fixtureReal(dir, { hijo: true });
    const copia = prepararTramo({ entrada: f.corpus[0], local: f.local, salida: join(dir, "salida"), destinoBase: join(dir, "copias"), carpeta: "bench-base-s1-K-01-r1" });
    try {
      assert.equal(copia.carpetas.length, 2);
      assert.equal(copia.carpetas[1], join(copia.destino, "app"));
      assert.deepEqual(copia.referencia, [{ ruta: "app.txt", lineas: 2 }]);
    } finally {
      copia.limpiar();
    }
  }));

test("correr: avisa posición, total, ID y repetición; al reanudar, los terminados se marcan como saltados (A12)", () =>
  conTemporal(async (dir) => {
    const log = contexto();
    const entradas = [{ id: "K-01" }, { id: "K-02" }];
    const primera = [];
    const r1 = await correr(opciones(dir, log, { entradas, progreso: (l) => primera.push(l) }));
    assert.equal(r1.codigo, 0, r1.motivo);
    assert.equal(primera.length, 4, "dos líneas por par: al empezar y al terminar");
    for (const k of [1, 2]) {
      const [inicio, fin] = [primera[2 * k - 2], primera[2 * k - 1]];
      assert.match(inicio, new RegExp(`^\\[${k}/2\\] K-0[12] r1$`), `línea de inicio ${k}: ${inicio}`);
      assert.equal(fin, `${inicio} DONE`, `línea de fin ${k}`);
    }
    assert.deepEqual(primera.filter((l) => l.endsWith(" DONE")).map((l) => l.replace(/ DONE$/, "")), [primera[0], primera[2]]);

    const reanudada = [];
    const r2 = await correr(opciones(dir, log, { entradas, progreso: (l) => reanudada.push(l) }));
    assert.equal(r2.codigo, 0, r2.motivo);
    assert.equal(reanudada.length, 2, "un aviso por par, sin copias nuevas");
    for (const l of reanudada) assert.match(l, /^\[[12]\/2\] K-0[12] r1 saltado \(ya terminado\)$/);
    assert.deepEqual(log.llamadas.length, 2, "al reanudar no se vuelve a correr ningún tramo");
  }));

test("versionCodex: sin binario codex en el PATH devuelve null (A8)", () =>
  conTemporal((dir) => {
    const vacio = join(dir, "vacio");
    mkdirSync(vacio);
    assert.equal(versionCodex({ ...process.env, PATH: vacio }), null);
  }));
