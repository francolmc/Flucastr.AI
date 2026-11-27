// Prueba del corpus del banco de pruebas del builder (A1).
// Lee evals/builder/corpus.json y comprueba IDs, conteos, forma y valores frente a
// changes/evals-builder/corpus.md. No llama a Codex ni a la red.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RUTA = fileURLToPath(new URL("../../evals/builder/corpus.json", import.meta.url));
const LOCAL = fileURLToPath(new URL("../../evals/builder/local.json", import.meta.url));

const CLAVES_PERMITIDAS = new Set([
  "id", "alias", "tramo", "base", "referencia", "archivos", "lineas", "estado",
  "verificacion_en", "preparacion", "env", "manifiestos_referencia", "cambio",
]);
const ALIAS = new Set(["K", "P1", "P2", "P3"]);
const ESTADOS = new Set(["calibrado", "reserva", "excluido"]);

const PNPM = ["pnpm install --ignore-scripts"];
const PNPM_PRISMA = [...PNPM, "npx --no-install prisma generate"];
const DB = { DATABASE_URL: "postgresql://prueba:prueba@localhost:5432/prueba" };
const SIN_ENV = {};

// [id, tramo, base, referencia, archivos, lineas, estado, preparacion, env, manifiestos_referencia, verificacion_en]
const ESPERADO = [
  ["K-01", 1, "83700f1ddb", "0f123c4a63", 3, 37, "calibrado", [], SIN_ENV, false, "raiz"],
  ["K-02", 1, "015d31413c", "9f1ede7ce4", 3, 61, "calibrado", [], SIN_ENV, false, "raiz"],
  ["K-03", 4, "0693be5364", "da4b52d722", 3, 115, "excluido", [], SIN_ENV, false, "raiz"],
  ["K-04", 2, "644cf38021", "2eed88dd0a", 1, 96, "calibrado", [], SIN_ENV, false, "raiz"],
  ["K-05", 2, "b5676c6f7a", "60c4a75a81", 2, 51, "excluido", [], SIN_ENV, false, "raiz"],
  ["P1-01", 2, "97cb43dcf5", "54f074e48a", 3, 188, "calibrado", PNPM, SIN_ENV, true, "codigo"],
  ["P1-02", 7, "57474db5c2", "5b0f3141b9", 3, 350, "calibrado", PNPM_PRISMA, DB, true, "raiz"],
  ["P2-01", 1, "398882ff4e", "51f58a9c69", 1, 129, "calibrado", [], SIN_ENV, false, "raiz"],
  ["P2-02", 1, "5a0e457579", "3c861c20c3", 3, 104, "calibrado", [], SIN_ENV, false, "raiz"],
  ["P2-03", 4, "9f461e6e8a", "e999c2e676", 2, 354, "calibrado", [], SIN_ENV, false, "raiz"],
  ["P1-03", 6, "23bd2f2341", "0e432974e7", 1, 65, "reserva", PNPM_PRISMA, DB, true, "raiz"],
  ["P1-04", 6, "57474db5c2", "5b0f3141b9", 2, 83, "reserva", PNPM_PRISMA, DB, true, "raiz"],
  ["P1-05", 1, "cd59260522", "7b32e042ba", 3, 202, "reserva", [], SIN_ENV, false, "raiz"],
  ["P3-01", 1, "e66c5dc921", "6ab6eebf08", 2, 147, "reserva", [], SIN_ENV, false, "raiz"],
  ["P3-02", 1, "7414e0a82a", "fcbb4a2a26", 2, 92, "reserva", PNPM, SIN_ENV, true, "raiz"],
  ["P3-03", 1, "cfc624cd1e", "47d6d9fa15", 3, 29, "reserva", PNPM, SIN_ENV, true, "raiz"],
];

function cargar() {
  const texto = readFileSync(RUTA, "utf8");
  return { texto, corpus: JSON.parse(texto) };
}

test("corpus: 16 tramos, 8 calibrados, 6 reservas y 2 excluidos, IDs únicos y los del corpus", () => {
  const { corpus } = cargar();
  assert.ok(Array.isArray(corpus), "corpus.json debe ser una lista");
  assert.equal(corpus.length, 16);
  const ids = corpus.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "IDs duplicados");
  assert.deepEqual([...ids].sort(), ESPERADO.map((f) => f[0]).sort());
  assert.equal(corpus.filter((e) => e.estado === "calibrado").length, 8);
  assert.equal(corpus.filter((e) => e.estado === "reserva").length, 6);
  assert.equal(corpus.filter((e) => e.estado === "excluido").length, 2);
});

test("corpus: solo claves permitidas y estados válidos", () => {
  const { corpus } = cargar();
  for (const e of corpus) {
    for (const clave of Object.keys(e)) {
      assert.ok(CLAVES_PERMITIDAS.has(clave), `${e.id}: clave no permitida «${clave}»`);
    }
    assert.ok(ALIAS.has(e.alias), `${e.id}: alias inválido`);
    assert.ok(ESTADOS.has(e.estado), `${e.id}: estado inválido`);
    assert.equal(e.id.split("-")[0], e.alias, `${e.id}: el alias no coincide con el ID`);
  }
});

test("corpus: «cambio» aparece solo en alias K", () => {
  const { corpus } = cargar();
  for (const e of corpus) {
    if ("cambio" in e) assert.equal(e.alias, "K", `${e.id}: cambio fuera de K`);
  }
});

test("corpus: sin rutas absolutas", () => {
  const { texto, corpus } = cargar();
  for (const prohibido of ["/home/", "/Users/", "/tmp/", "/mnt/", "\\\\"]) {
    assert.ok(!texto.toLowerCase().includes(prohibido.toLowerCase()), `aparece «${prohibido}»`);
  }
  for (const e of corpus) {
    for (const valor of Object.values(e)) {
      if (typeof valor === "string") {
        assert.ok(!valor.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(valor), `${e.id}: ruta absoluta`);
      }
    }
  }
});

// Los nombres privados salen del mapa local (ignorado por git), nunca de este archivo (D-05, D-09).
function nombresPrivados() {
  const local = JSON.parse(readFileSync(LOCAL, "utf8"));
  const nombres = new Set();
  for (const ruta of Object.values(local.repos)) {
    for (const segmento of ruta.split(/[\\/]+/)) if (segmento.length >= 3) nombres.add(segmento);
  }
  for (const tramo of Object.values(local.tramos)) {
    if (tramo.cambio) nombres.add(tramo.cambio);
    if (tramo.repo_codigo && tramo.repo_codigo !== ".") nombres.add(tramo.repo_codigo);
  }
  return [...nombres];
}

test("corpus: sin nombres de proyectos privados del mapa local", { skip: existsSync(LOCAL) ? false : "sin evals/builder/local.json" }, () => {
  const { texto } = cargar();
  for (const nombre of nombresPrivados()) {
    assert.ok(!texto.toLowerCase().includes(nombre.toLowerCase()), `aparece un nombre privado del mapa local`);
  }
});

test("corpus: tipos, hashes de 10 hex y conteos enteros", () => {
  const { corpus } = cargar();
  for (const e of corpus) {
    assert.match(e.base, /^[0-9a-f]{10}$/, `${e.id}: base`);
    assert.match(e.referencia, /^[0-9a-f]{10}$/, `${e.id}: referencia`);
    assert.ok(Number.isInteger(e.tramo) && e.tramo >= 1 && e.tramo <= 7, `${e.id}: tramo`);
    assert.ok(Number.isInteger(e.archivos) && e.archivos > 0, `${e.id}: archivos`);
    assert.ok(Number.isInteger(e.lineas) && e.lineas > 0, `${e.id}: lineas`);
    assert.ok(Array.isArray(e.preparacion) && e.preparacion.every((p) => typeof p === "string"), `${e.id}: preparacion`);
    assert.ok(e.env && typeof e.env === "object" && !Array.isArray(e.env), `${e.id}: env`);
    assert.equal(typeof e.manifiestos_referencia, "boolean", `${e.id}: manifiestos_referencia`);
    assert.ok(["raiz", "codigo"].includes(e.verificacion_en), `${e.id}: verificacion_en`);
  }
});

test("corpus: cada tramo coincide con changes/evals-builder/corpus.md", () => {
  const { corpus } = cargar();
  for (const [id, tramo, base, referencia, archivos, lineas, estado, preparacion, env, manifiestos, verificacion] of ESPERADO) {
    const e = corpus.find((x) => x.id === id);
    assert.ok(e, `falta ${id}`);
    assert.deepEqual(
      { tramo: e.tramo, base: e.base, referencia: e.referencia, archivos: e.archivos, lineas: e.lineas, estado: e.estado,
        preparacion: e.preparacion, env: e.env, manifiestos_referencia: e.manifiestos_referencia, verificacion_en: e.verificacion_en },
      { tramo, base, referencia, archivos, lineas, estado, preparacion, env, manifiestos_referencia: manifiestos, verificacion_en: verificacion },
      `${id} no coincide`,
    );
  }
});
