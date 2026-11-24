// Pruebas de extremo a extremo de scripts/kit-check.mjs (segmento 3, A1–A6).
// Cada caso corre el CLI sobre un fixture sintético y compara código de salida y filas de la tabla.
// Uso: node tests/kit-check/run.mjs [--caso=verde|rojo|bloqueado|ambiguo|malformada|verify-verde|typecheck]
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CLI = join(AQUI, "..", "..", "scripts", "kit-check.mjs");
const FIX = join(AQUI, "fixtures");
const TESTIGO = join(FIX, "testigo-operador.txt");

function correr(plan, extra = []) {
  const r = spawnSync(process.execPath, [CLI, join(FIX, plan), ...extra], {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return { codigo: r.status, salida: r.stdout ?? "", error: r.stderr ?? "" };
}

// Mapa A# → estado, a partir de las filas `A# | estado | comando | motivo`.
function estados(salida) {
  const m = {};
  for (const linea of salida.split("\n")) {
    const r = /^(A\d+) \| ([^|]+?) \| /.exec(linea);
    if (r) m[r[1]] = r[2].trim();
  }
  return m;
}

const casos = {
  // A1: todo verde da 0 y ninguna fila queda sin estado.
  verde() {
    const r = correr("verde.md");
    assert.equal(r.codigo, 0, `código ${r.codigo}, se esperaba 0\n${r.salida}${r.error}`);
    assert.deepEqual(estados(r.salida), { A1: "pasa", A2: "pasa" });
  },

  // A2: un criterio falla da 1 y la fila dice falla.
  rojo() {
    const r = correr("rojo.md");
    assert.equal(r.codigo, 1, `código ${r.codigo}, se esperaba 1\n${r.salida}${r.error}`);
    const e = estados(r.salida);
    assert.equal(e.A1, "pasa");
    assert.equal(e.A2, "falla");
  },

  // A3: bloqueado da 3 sin ejecutar (testigo ausente), también con --revisado, que no lo excusa.
  bloqueado() {
    const r = correr("bloqueado.md");
    const sinTestigo = !existsSync(TESTIGO);
    if (existsSync(TESTIGO)) rmSync(TESTIGO, { force: true });
    assert.equal(r.codigo, 3, `código ${r.codigo}, se esperaba 3\n${r.salida}${r.error}`);
    assert.deepEqual(estados(r.salida), { A1: "bloqueado", A2: "bloqueado" });
    assert.equal(sinTestigo, true, "el operador de shell creó el testigo: se ejecutó");
    const rv = correr("bloqueado.md", ["--revisado", "A1,A2"]);
    assert.equal(rv.codigo, 3, `con --revisado, código ${rv.codigo}, se esperaba 3`);
  },

  // A3: no automatizable sin revisar da 3; con --revisado no cuenta y sale 0.
  ambiguo() {
    const r = correr("ambiguo.md");
    assert.equal(r.codigo, 3, `código ${r.codigo}, se esperaba 3\n${r.salida}${r.error}`);
    assert.equal(estados(r.salida).A1, "no-automatizable");
    const rv = correr("ambiguo.md", ["--revisado", "A1"]);
    assert.equal(rv.codigo, 0, `con --revisado A1, código ${rv.codigo}, se esperaba 0`);
  },

  // A4: tabla mal formada da 2 sin ejecutar ninguna fila.
  malformada() {
    const r = correr("malformada.md");
    assert.equal(r.codigo, 2, `código ${r.codigo}, se esperaba 2\n${r.salida}${r.error}`);
    assert.deepEqual(estados(r.salida), {});
    assert.match(r.error, /kit-check/);
  },

  // A5: verify verde con un A# incumplido no sale 0.
  "verify-verde"() {
    const r = correr("verify-verde.md");
    assert.notEqual(r.codigo, 0, "verify verde con un A# incumplido no debe salir 0");
    assert.equal(r.codigo, 1, `código ${r.codigo}, se esperaba 1`);
    const e = estados(r.salida);
    assert.equal(e.A1, "pasa");
    assert.equal(e.A2, "falla");
  },

  // A6: typecheck rojo con tramo verde: la fila de typecheck da falla y no sale 0.
  typecheck() {
    const r = correr("typecheck.md");
    assert.notEqual(r.codigo, 0, "typecheck rojo no debe salir 0");
    const e = estados(r.salida);
    assert.equal(e.A1, "pasa");
    assert.equal(e.A2, "falla");
  },
};

const pedido = process.argv.find(a => a.startsWith("--caso="))?.slice("--caso=".length);
const nombres = pedido ? [pedido] : Object.keys(casos);
let fallos = 0;
for (const nombre of nombres) {
  if (!casos[nombre]) {
    process.stderr.write(`caso desconocido: ${nombre}\n`);
    process.exit(2);
  }
  try {
    casos[nombre]();
    console.log(`ok ${nombre}`);
  } catch (error) {
    fallos++;
    console.error(`FALLA ${nombre}: ${error.message}`);
  }
}
process.exit(fallos ? 1 : 0);
