// Pruebas del intérprete de Scope y del informe común (segmento 1, A1–A4). Sin red, sin escribir en el repo.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { clasificarRuta, parsearAlcance } from "../../tools/check/alcance.mjs";
import { codigoSalida, crearInforme, tabla } from "../../tools/check/informe.mjs";

// Envuelve un cuerpo de Scope en un plan mínimo con otra sección después.
const plan = cuerpo => `# Plan\n\n## Goal\nx\n\n## Scope\n${cuerpo}\n\n## Verification\n\`./verify\`\n`;

// --- A1: Scope bien formado ---

test("A1: el ejemplo del contrato da incluidas, excluida y clasificación correctas", () => {
  const a = parsearAlcance(plan("Producto: `a/b.mjs` (nuevo), `t/**`. Fuera: `core/`."));
  assert.equal(a.estado, "ok");
  assert.deepEqual(a.incluidas.map(i => i.ruta), ["a/b.mjs", "t/**"]);
  assert.deepEqual(a.excluidas.map(e => e.ruta), ["core/"]);
  assert.equal(clasificarRuta("a/b.mjs", a), "dentro");
  assert.equal(clasificarRuta("core/x.md", a), "excluida");
  assert.equal(clasificarRuta("z.txt", a), "fuera");
});

test("A1: ruta exacta, carpeta, glob y ./ normalizado", () => {
  const a = parsearAlcance(plan("`src/x.mjs`, `docs/`, `tests/kit/**`, `*.md`, `./sub/z.mjs`, `./verify`"));
  assert.equal(a.estado, "ok");
  assert.equal(clasificarRuta("src/x.mjs", a), "dentro");
  assert.equal(clasificarRuta("src/y.mjs", a), "fuera");
  assert.equal(clasificarRuta("docs/a/b.txt", a), "dentro");
  assert.equal(clasificarRuta("tests/kit/caso/a.test.mjs", a), "dentro");
  assert.equal(clasificarRuta("README.md", a), "dentro");
  assert.equal(clasificarRuta("docs/a.md", a), "dentro");
  assert.equal(clasificarRuta("sub/z.mjs", a), "dentro");
  assert.ok(!a.incluidas.some(i => i.ruta === "verify" || i.ruta === "./verify"), "./verify no es ruta");
});

test("A1: la exclusión más específica gana y el empate excluye", () => {
  const ancha = parsearAlcance(plan("`tests/**`. Fuera: `tests/kit-check/`."));
  assert.equal(clasificarRuta("tests/kit-check/a.mjs", ancha), "excluida");
  assert.equal(clasificarRuta("tests/otro/a.mjs", ancha), "dentro");
  const empate = parsearAlcance(plan("`a/b.mjs`, `c/d.mjs`. Fuera: `a/b.mjs`."));
  assert.equal(empate.estado, "ok");
  assert.equal(clasificarRuta("a/b.mjs", empate), "excluida");
  assert.equal(clasificarRuta("c/d.mjs", empate), "dentro");
});

// --- A2: sin Scope o sin rutas nunca es ok ---

test("A2: sin sección Scope da no_verificable, nunca ok", () => {
  const r = parsearAlcance("# Plan\n\n## Goal\nx\n");
  assert.equal(r.estado, "no_verificable");
  assert.equal(r.motivo, "sin Scope");
});

test("A2: sección sin rutas da no_verificable", () => {
  const r = parsearAlcance(plan("Solo prosa, sin rutas. Ver `./verify` y `npm test`."));
  assert.equal(r.estado, "no_verificable");
  assert.equal(r.motivo, "Scope sin rutas");
});

test("A2: si la exclusión cubre todo lo incluido, no_verificable", () => {
  const r = parsearAlcance(plan("`core/a.md`. Fuera: `core/a.md`."));
  assert.equal(r.estado, "no_verificable");
  assert.equal(r.motivo, "la exclusión cubre todo lo incluido");
});

// --- A3: rutas peligrosas o no expandibles ---

test("A3: rutas con .., absolutas o con llaves dan no_verificable con motivo", () => {
  for (const [cuerpo, patron] of [
    ["`../fuera/a.mjs`", /«\.\.»/],
    ["`/etc/x.mjs`", /absoluta/],
    ["`src/{a,b}.mjs`", /llaves/],
  ]) {
    const r = parsearAlcance(plan(cuerpo));
    assert.equal(r.estado, "no_verificable", cuerpo);
    assert.match(r.motivo, patron);
  }
});

test("A3: una ruta tramo con .. también da no_verificable", () => {
  const tramos = [{ n: 1, texto: "Scope: `../x.mjs`" }];
  const r = parsearAlcance(plan("`src/a.mjs`"), { segmento: 1, tramos });
  assert.equal(r.estado, "no_verificable");
});

// --- Anotaciones y tramos ---

test("anotación (solo …) deja aviso parcial y cuenta la ruta completa", () => {
  const r = parsearAlcance(plan("`scripts/x.mjs` (solo exportar `main`), `tests/**`"));
  assert.equal(r.estado, "ok");
  assert.deepEqual(r.incluidas.map(i => i.ruta), ["scripts/x.mjs", "tests/**"]);
  assert.equal(r.avisos.length, 1);
  assert.equal(r.avisos[0].ruta, "scripts/x.mjs");
  assert.match(r.avisos[0].mensaje, /parcial/);
});

test("las líneas Scope:/Files: de tramos hasta segmento se suman; los posteriores no", () => {
  const tramos = [
    { n: 1, texto: "Scope: `x/uno.mjs`, `x/dos.mjs` (nuevo)\nFiles: x/tres.mjs, x/cuatro.mjs" },
    { n: 2, texto: "Scope: `x/cinco.mjs`" },
  ];
  const r = parsearAlcance(plan("`src/a.mjs`"), { segmento: 1, tramos });
  assert.equal(r.estado, "ok");
  const rutas = r.incluidas.map(i => i.ruta);
  assert.deepEqual(rutas, ["src/a.mjs", "x/uno.mjs", "x/dos.mjs", "x/tres.mjs", "x/cuatro.mjs"]);
  assert.equal(clasificarRuta("x/cinco.mjs", r), "fuera");
});

test("sin segmento no se suman tramos", () => {
  const tramos = [{ n: 1, texto: "Scope: `x/uno.mjs`" }];
  const r = parsearAlcance(plan("`src/a.mjs`"), { tramos });
  assert.deepEqual(r.incluidas.map(i => i.ruta), ["src/a.mjs"]);
});

// --- A1 con texto real: Scope de un plan archivado (leído, no copiado) ---

test("A1: el Scope real de changes/done/kit-check/plan.md se interpreta", () => {
  const ruta = fileURLToPath(new URL("../../changes/done/kit-check/plan.md", import.meta.url));
  const r = parsearAlcance(readFileSync(ruta, "utf8"));
  assert.equal(r.estado, "ok");
  assert.equal(clasificarRuta("tests/kit-check/run.mjs", r), "dentro");
  assert.equal(clasificarRuta("core/agents/planner.md", r), "fuera");
  assert.ok(r.avisos.some(a => a.ruta === "scripts/permissions-hook.mjs"));
});

// --- A4: informe común ---

test("A4: el código sale 0, 1 o 3 según las filas y la tabla lo repite", () => {
  const limpio = crearInforme([{ nivel: "ok", elemento: "A1", mensaje: "bien" }]);
  assert.equal(limpio.codigo, 0);
  assert.equal(codigoSalida(limpio), 0);

  const aviso = crearInforme([{ nivel: "ok" }, { nivel: "aviso", elemento: "x", mensaje: "parcial" }]);
  assert.equal(aviso.codigo, 0, "un aviso no cambia el código");

  const verificable = crearInforme([{ nivel: "ok" }, { nivel: "no_verificable", elemento: "Scope", mensaje: "sin Scope" }]);
  assert.equal(verificable.codigo, 3);

  const error = crearInforme([{ nivel: "error", elemento: "src/a.mjs", mensaje: "fuera de Scope" }, { nivel: "no_verificable", mensaje: "x" }]);
  assert.equal(error.codigo, 1, "error gana a no verificable");
});

test("A4: la tabla y el JSON salen del mismo objeto con las mismas filas", () => {
  const informe = crearInforme([
    { nivel: "error", elemento: "src/a.mjs", mensaje: "fuera de Scope" },
    { nivel: "aviso", elemento: "scripts/p.mjs", mensaje: "parcial" },
  ]);
  const json = JSON.parse(JSON.stringify(informe));
  assert.deepEqual(json.filas, informe.filas);
  assert.equal(json.codigo, 1);
  const texto = tabla(informe);
  assert.match(texto, /src\/a\.mjs/);
  assert.match(texto, /scripts\/p\.mjs/);
  assert.match(texto, /codigo: 1$/);
});

test("A4: un nivel desconocido se rechaza", () => {
  assert.throws(() => crearInforme([{ nivel: "pasa", mensaje: "x" }]), /nivel no válido/);
});
