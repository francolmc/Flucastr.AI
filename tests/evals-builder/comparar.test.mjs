// Prueba de la comparación pareada de corridas (A10). Usa carpetas de corrida ficticias en un temporal
// que se borra al salir, incluso si una prueba falla. No llama a Codex ni a la red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compararCorridas, leerCorrida, main } from "../../evals/builder/lib/comparar.mjs";
import { ErrorVariante, leerVariante } from "../../evals/builder/lib/variante.mjs";

const RAIZ_BANCO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTRATO_B = join(RAIZ_BANCO, "evals", "builder", "variantes", "contrato-b.json");

const CABECERA = {
  nombre: "base", semilla: 1, repeticiones: 1, corpus_sha256: "aaaa",
  huellas: { kit: "k1", contrato: "c1", modelos: "m1" }, modelos: { builder: "modelo-x:high" }, version: "codex-1",
};

function conTemporal(fn) {
  const raiz = mkdtempSync(join(tmpdir(), "comparar-prueba-"));
  try {
    return fn(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}

const clave = (f) => `${f.id}-r${f.rep}`;

// Línea de resultados.jsonl con los campos que calcularMetricas deja (valores por defecto de una corrida sana).
function fila(id, rep = 1, extra = {}) {
  return {
    id, rep, variante: "base", resultado: "DONE", done_sin_intervencion: true, oraculo_pasa: true,
    relanzamientos: 0, motivos: [], muertes_proceso: 0, muertes_thrashing: 0, thrashing_verificable: false,
    compactaciones: 0, tokens: { entrada: 100, cache_leida: 0, salida: 10, por_modelo: {}, separacion: null },
    creditos: 1, sin_tarifa: 0, segundos: { total: 100, builder: 80, verify: 10, revisor: 10 },
    lineas: { prueba: 20, producto: 80, razon: 0.25 }, contaminado: false, contrato_ok: true,
    referencia: { archivos: 1, lineas: 40 }, ...extra,
  };
}

const entorno = (id, rep = 1) => ({ id, rep, variante: "base", resultado: "entorno", motivo: "sin-intentos" });

// Carpeta de corrida: corrida.json (cabecera) y resultados.jsonl. El orden por defecto son las filas dadas.
function crearCorrida(dir, { cabecera = {}, filas = [] } = {}) {
  mkdirSync(dir, { recursive: true });
  const datos = { ...CABECERA, orden: filas.map(clave), ...cabecera };
  writeFileSync(join(dir, "corrida.json"), JSON.stringify(datos));
  writeFileSync(join(dir, "resultados.jsonl"), filas.map((f) => `${JSON.stringify(f)}\n`).join(""));
  return dir;
}

function ejecutar(argv) {
  const salida = [];
  const error = [];
  const codigo = main(argv, { escribir: (t) => salida.push(t), error: (t) => error.push(t) });
  return { codigo, salida: salida.join(""), error: error.join("") };
}

test("comparar: semilla, orden, repeticiones, corpus, huella kit o versión distintas dan 2 (A10)", () => {
  const filas = [fila("K-01"), fila("K-02")];
  const casos = {
    semilla: { semilla: 2 },
    orden: { orden: ["K-02-r1", "K-01-r1"] },
    repeticiones: { repeticiones: 3 },
    corpus: { corpus_sha256: "bbbb" },
    "huella kit": { huellas: { kit: "k2", contrato: "c1", modelos: "m1" } },
    "versión de Codex": { version: "codex-2" },
    "versión de Codex sin dato": { version: null },
  };
  for (const [motivo, cambio] of Object.entries(casos)) {
    conTemporal((raiz) => {
      const a = crearCorrida(join(raiz, "a"), { filas });
      const b = crearCorrida(join(raiz, "b"), { cabecera: cambio, filas });
      const r = ejecutar([a, b]);
      assert.equal(r.codigo, 2, motivo);
      assert.match(r.error, /no pareables/, motivo);
    });
  }
});

test("comparar: contrato y modelos distintos son la variante; se informan y no bloquean (A10)", () => {
  const filas = [fila("K-01"), fila("K-02")];
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas });
    const b = crearCorrida(join(raiz, "b"), {
      cabecera: { huellas: { kit: "k1", contrato: "c2", modelos: "m2" } }, filas,
    });
    const r = ejecutar([a, b]);
    assert.equal(r.codigo, 0);
    assert.match(r.salida, /difieren.*contrato.*modelos/);
  });
});

test("comparar: excluye y lista entorno, invalida, contaminado y pares sin pareja; cuenta n y tasas (A10)", () => {
  const datosA = [
    fila("K-01"),
    fila("K-02"),
    entorno("K-03"),
    fila("K-04", 1, { resultado: "invalida", contrato_ok: false, done_sin_intervencion: false }),
    fila("K-05", 1, { resultado: "invalida", contaminado: true }),
    fila("K-06"),
  ];
  const datosB = [
    fila("K-01", 1, { resultado: "PAUSED", done_sin_intervencion: false, relanzamientos: 2, segundos: { total: 300 } }),
    fila("K-02", 1, { relanzamientos: 1, segundos: { total: 200 } }),
    fila("K-03"), fila("K-04"), fila("K-05"), fila("K-06", 1, { relanzamientos: 3 }),
  ];
  const orden = ["K-01", "K-02", "K-03", "K-04", "K-05", "K-06", "K-07"].map((id) => `${id}-r1`);
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { cabecera: { orden }, filas: datosA });
    // B no tiene línea para K-07 (corrida incompleta): ese par queda sin pareja.
    const b = crearCorrida(join(raiz, "b"), { cabecera: { orden }, filas: datosB });
    const r = compararCorridas(leerCorrida(a), leerCorrida(b));
    assert.equal(r.codigo, 0);
    assert.equal(r.n, 3, "pares K-01, K-02 y K-06");
    const motivos = Object.fromEntries(r.excluidos.map((x) => [x.par, x.motivo]));
    assert.deepEqual(motivos, {
      "K-03-r1": "entorno", "K-04-r1": "invalida", "K-05-r1": "contaminado", "K-07-r1": "sin-pareja",
    });
    assert.equal(r.a.tasas.done, 1);
    assert.equal(r.b.tasas.done, 0.6667);
    assert.equal(r.b.tasas.done_sin_intervencion, 0.6667);
    assert.equal(r.b.medianas.relanzamientos, 2);
    assert.equal(r.b.medianas.segundos, 200);
    const salida = ejecutar([a, b]).salida;
    assert.match(salida, /pareadas n=3/);
    assert.match(salida, /K-05-r1 .*contaminado/);
  });
});

test("comparar: informa desglose por tamaño de referencia (hasta 60, 61-150, más de 150) (A10)", () => {
  const filas = [
    fila("K-01", 1, { referencia: { archivos: 1, lineas: 60 } }),
    fila("K-02", 1, { referencia: { archivos: 1, lineas: 61 }, resultado: "PAUSED" }),
    fila("K-03", 1, { referencia: { archivos: 2, lineas: 151 } }),
    fila("K-04", 1, { referencia: null }),
  ];
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas });
    const r = compararCorridas(leerCorrida(a), leerCorrida(a));
    assert.equal(r.codigo, 0);
    assert.equal(r.a.por_tamano["hasta-60"].n, 1);
    assert.equal(r.a.por_tamano["61-150"].n, 1);
    assert.equal(r.a.por_tamano["61-150"].done, 0);
    assert.equal(r.a.por_tamano["mas-de-150"].n, 1);
    assert.equal(r.a.por_tamano["sin-referencia"].n, 1);
  });
});

test("comparar: medianas de compactaciones y razón, totales de muertes; thrashing no verificable se marca y sin dato es - (A10)", () => {
  const filasA = [
    fila("K-01", 1, { compactaciones: 1, lineas: { prueba: 10, producto: 40, razon: 0.25 }, muertes_proceso: 1, muertes_thrashing: 0, thrashing_verificable: false }),
    fila("K-02", 1, { compactaciones: 3, lineas: { prueba: 30, producto: 60, razon: 0.5 }, muertes_proceso: 0, muertes_thrashing: 2, thrashing_verificable: false }),
    fila("K-03", 1, { compactaciones: null, lineas: null, muertes_proceso: 2, muertes_thrashing: 0, thrashing_verificable: false }),
  ];
  const sinDato = { compactaciones: null, lineas: null, muertes_proceso: null, muertes_thrashing: null, thrashing_verificable: null };
  const filasB = [fila("K-01", 1, sinDato), fila("K-02", 1, sinDato), fila("K-03", 1, sinDato)];
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas: filasA });
    const b = crearCorrida(join(raiz, "b"), { filas: filasB });
    const r = compararCorridas(leerCorrida(a), leerCorrida(b));
    assert.equal(r.a.medianas.compactaciones, 2);
    assert.equal(r.a.medianas.razon_prueba_producto, 0.375);
    assert.equal(r.a.totales.muertes_proceso, 3);
    assert.deepEqual(r.a.totales.muertes_thrashing, { total: 2, verificable: false });
    assert.equal(r.b.medianas.compactaciones, null);
    assert.equal(r.b.medianas.razon_prueba_producto, null);
    assert.equal(r.b.totales.muertes_proceso, null);
    assert.deepEqual(r.b.totales.muertes_thrashing, { total: null, verificable: null });
    const salida = ejecutar([a, b]).salida;
    assert.match(salida, /mediana_compactaciones=2 mediana_razon_prueba_producto=0\.375 muertes_proceso=3 muertes_thrashing=2 \(no verificable\)/);
    assert.match(salida, /mediana_compactaciones=- mediana_razon_prueba_producto=- muertes_proceso=- muertes_thrashing=-/);
  });
});

test("comparar: con una sola carpeta resume esa corrida (A10)", () => {
  const filas = [fila("K-01"), fila("K-02", 1, { resultado: "PAUSED" }), entorno("K-03")];
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas });
    const r = ejecutar([a]);
    assert.equal(r.codigo, 0);
    assert.match(r.salida, /n=2/);
    assert.match(r.salida, /K-03-r1 .*entorno/);
  });
});

test("comparar: la tasa de oraculo_pasa cuenta solo los pares con dato y la columna muestra - sin dato (A16, D-37)", () => {
  const orden = ["K-01", "K-02", "K-03"].map((id) => `${id}-r1`);
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { cabecera: { orden }, filas: [
      fila("K-01", 1, { oraculo_pasa: true }), fila("K-02", 1, { oraculo_pasa: false }), fila("K-03", 1, { oraculo_pasa: null }),
    ] });
    const b = crearCorrida(join(raiz, "b"), { cabecera: { orden }, filas: [
      fila("K-01", 1, { oraculo_pasa: null }), fila("K-02", 1, { oraculo_pasa: null }), fila("K-03", 1, { oraculo_pasa: null }),
    ] });
    const r = compararCorridas(leerCorrida(a), leerCorrida(b));
    assert.equal(r.n, 3, "los tres pares entran: la señal no excluye");
    assert.equal(r.a.tasas.oraculo_pasa, 0.5, "1 de 2 pares con dato");
    assert.equal(r.a.con_oraculo, 2);
    assert.equal(r.b.tasas.oraculo_pasa, null, "sin dato en B: null, no 0");
    const salida = ejecutar([a, b]).salida;
    assert.match(salida, /oraculo_pasa=0\.5 \(con_dato=2\)/);
    assert.match(salida, /^K-02-r1 .* false\s+-$/m, "true, false o - por lado");
    assert.match(salida, /^K-03-r1\s+DONE\s+DONE\s+0\s+0\s+-\s+-$/m, "sin dato: -");
  });
});

test("comparar: la salida solo lleva IDs, números y motivos fijos, nunca rutas (A10)", () => {
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas: [fila("K-01"), fila("K-02")] });
    const b = crearCorrida(join(raiz, "b"), { filas: [fila("K-01", 1, { resultado: "PAUSED" }), fila("K-02")] });
    const salida = ejecutar([a, b]).salida;
    assert.ok(!salida.includes(raiz), "no imprime la carpeta");
    assert.ok(!/[\\/]/.test(salida), "no imprime separadores de ruta");
  });
});

test("comparar: argumentos inválidos o carpeta sin corrida dan 2 (A10)", () => {
  conTemporal((raiz) => {
    const a = crearCorrida(join(raiz, "a"), { filas: [fila("K-01")] });
    assert.equal(ejecutar([]).codigo, 2);
    assert.equal(ejecutar([a, a, a]).codigo, 2);
    assert.equal(ejecutar([join(raiz, "no-existe")]).codigo, 2);
  });
});

test("contrato-b.json trae las dos rutas en null y la variante se rechaza con 2 (A10)", () => {
  assert.throws(() => leerVariante(CONTRATO_B), (e) => e instanceof ErrorVariante && e.codigo === 2);
});
