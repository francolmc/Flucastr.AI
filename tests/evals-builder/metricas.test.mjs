// Prueba de las métricas por tramo (A7). Solo llama a funciones puras con sesiones, registros y cambios
// ficticios: no lee archivos, no llama a Codex ni a la red y no necesita temporales.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMetricas } from "../../evals/builder/lib/metricas.mjs";

const CAMPOS = [
  "id", "rep", "variante", "resultado", "done_sin_intervencion", "oraculo_pasa",
  "relanzamientos", "motivos", "muertes_proceso", "muertes_thrashing", "thrashing_verificable",
  "compactaciones", "tokens", "creditos", "sin_tarifa", "segundos", "lineas", "contaminado",
  "contrato_ok", "referencia",
];

// Dos intentos: el primero se devuelve por el revisor y el segundo queda DONE.
const INTENTOS_DONE = [
  { herramienta: "codex", resultado: "devuelto", clase: "tarea", senal: "RETURNED", motivo_relanzamiento: "revisor",
    builder_modelo: "modelo-a:high", builder_ms: 1000, verify_ms: 200, revisor_ms: 300, puerta_ms: 10, relanzamientos: 0 },
  { herramienta: "codex", resultado: "DONE", clase: null, senal: null, motivo_relanzamiento: null,
    builder_modelo: "modelo-a:high", builder_ms: 2000, verify_ms: 100, revisor_ms: 400, puerta_ms: 10, relanzamientos: 1 },
];
const CAMBIOS = [
  { ruta: "evals/builder/lib/metricas.mjs", lineas: 80 },
  { ruta: "tests/evals-builder/metricas.test.mjs", lineas: 20 },
  { ruta: "changes/evals-builder/plan.md", lineas: 500 },
  { ruta: "docs/kit-run.md", lineas: 9 },
  { ruta: "package-lock.json", lineas: 300 },
];
const SESIONES = [
  { herramienta: "codex", modelo: "modelo-a", creditos: 1.5, compactaciones: 1 },
  { herramienta: "codex", modelo: "modelo-b", creditos: 0.5, compactaciones: 0 },
];
const FILAS = [
  { modelo: "modelo-a", rol: "main", entrada: 100, cache_leida: 50, salida: 10 },
  { modelo: "modelo-b", rol: "main", entrada: 40, cache_leida: 0, salida: 4 },
];

function base(extra = {}) {
  return { id: "K-01", rep: 1, variante: "base", herramienta: "codex", intentos: INTENTOS_DONE, sesiones: SESIONES,
    filas: FILAS, revisorModelo: "modelo-b:medium", cambios: CAMBIOS, referencia: null, textos: null,
    rutasFuente: [], rutasCopia: [], rutasViva: [], oraculoPasa: null, ...extra };
}

test("metricas: dos intentos y DONE dan relanzamientos 1 y líneas 20/80 con razón 0.25 (A7)", () => {
  const m = calcularMetricas(base());
  assert.equal(m.resultado, "DONE");
  assert.equal(m.done_sin_intervencion, true);
  assert.equal(m.relanzamientos, 1);
  assert.deepEqual(m.motivos, ["revisor"]);
  assert.deepEqual(m.lineas, { prueba: 20, producto: 80, razon: 0.25 });
});

test("metricas: tiene todos los campos de «Métricas» (A7)", () => {
  const m = calcularMetricas(base());
  for (const c of CAMPOS) assert.ok(Object.hasOwn(m, c), `falta ${c}`);
  assert.equal(m.id, "K-01");
  assert.equal(m.rep, 1);
  assert.equal(m.variante, "base");
});

test("metricas: segundos, compactaciones, créditos y tokens salen de los datos sin inventar (A7)", () => {
  const m = calcularMetricas(base());
  assert.deepEqual(m.segundos, { total: 4, builder: 3, verify: 0.3, revisor: 0.7 });
  assert.equal(m.compactaciones, 1);
  assert.equal(m.creditos, 2);
  assert.equal(m.sin_tarifa, 0);
  assert.deepEqual(m.tokens, {
    entrada: 140, cache_leida: 50, salida: 14,
    por_modelo: { "modelo-a": { entrada: 100, cache_leida: 50, salida: 10 }, "modelo-b": { entrada: 40, cache_leida: 0, salida: 4 } },
    separacion: {
      builder: { entrada: 100, cache_leida: 50, salida: 10 },
      revisor: { entrada: 40, cache_leida: 0, salida: 4 },
    },
  });
  assert.equal(m.thrashing_verificable, false);
});

test("metricas: el tiempo suma las fases registradas de cada intento; sin revisor, esa fase no cuenta (A7, D-32)", () => {
  const m = calcularMetricas(base({
    intentos: [
      { resultado: "PAUSED", clase: "decision", senal: "motivo=design", motivo_relanzamiento: "revisor", builder_modelo: "m:h",
        builder_ms: 1000, verify_ms: 10, revisor_ms: null, puerta_ms: null },
      { resultado: "DONE", clase: null, senal: null, motivo_relanzamiento: null, builder_modelo: "m:h",
        builder_ms: 2000, verify_ms: 10, revisor_ms: 500, puerta_ms: null },
    ],
  }));
  assert.deepEqual(m.segundos, { total: 3.52, builder: 3, verify: 0.02, revisor: 0.5 });
});

test("metricas: un PAUSED sin revisor da total con builder y verify (A7, D-32)", () => {
  const m = calcularMetricas(base({
    intentos: [{ resultado: "PAUSED", clase: "decision", senal: "motivo=design", motivo_relanzamiento: null, builder_modelo: "m:h",
      builder_ms: 4000, verify_ms: 250, revisor_ms: null, puerta_ms: null }],
  }));
  assert.equal(m.resultado, "PAUSED");
  assert.deepEqual(m.segundos, { total: 4.25, builder: 4, verify: 0.25, revisor: null });
});

test("metricas: dato ausente da null, nunca 0 (A7)", () => {
  const m = calcularMetricas(base({
    intentos: [{ resultado: "DONE", clase: null, senal: null, motivo_relanzamiento: null, builder_modelo: "m:h",
      builder_ms: null, verify_ms: 5, revisor_ms: 6 }],
    sesiones: [], filas: null, revisorModelo: null, cambios: [{ ruta: "tests/x.test.mjs", lineas: 4 }],
  }));
  assert.equal(m.segundos.builder, null);
  assert.equal(m.segundos.total, 0.011, "suma verify y revisor, las fases registradas (D-32)");
  assert.equal(m.segundos.verify, 0.005);
  assert.equal(m.creditos, null);
  assert.equal(m.sin_tarifa, null);
  assert.equal(m.compactaciones, null);
  assert.equal(m.tokens, null);
  assert.equal(m.tokens === null ? null : m.tokens.separacion, null);
  assert.equal(m.contaminado, null);
  assert.equal(m.contrato_ok, null);
  assert.equal(m.referencia, null);
  assert.equal(m.oraculo_pasa, null);
  assert.deepEqual(m.lineas, { prueba: 4, producto: 0, razon: null });
});

test("metricas: una sesión sin tarifa deja créditos null y cuenta sin_tarifa (A7)", () => {
  const m = calcularMetricas(base({
    sesiones: [{ herramienta: "codex", modelo: "desconocido", creditos: null, compactaciones: 2 },
      { herramienta: "codex", modelo: "modelo-a", creditos: 1, compactaciones: 0 }],
  }));
  assert.equal(m.creditos, null);
  assert.equal(m.sin_tarifa, 1);
  assert.equal(m.compactaciones, 2);
});

test("metricas: muertes por infraestructura y thrashing; claude verifica la firma, codex no (A7)", () => {
  const muertos = [
    { clase: "infra", senal: "thrashing", resultado: null, builder_ms: 10 },
    { clase: "infra", senal: "thrashing", resultado: null, builder_ms: 10 },
    { clase: "entorno", senal: "tope", resultado: null, builder_ms: 10 },
  ].map(x => ({ verify_ms: null, revisor_ms: null, puerta_ms: null, builder_modelo: "m:h", motivo_relanzamiento: null, ...x }));
  const cod = calcularMetricas(base({ herramienta: "codex", intentos: muertos }));
  assert.equal(cod.muertes_proceso, 2);
  assert.equal(cod.muertes_thrashing, 2);
  assert.equal(cod.thrashing_verificable, false);
  assert.equal(cod.resultado, "entorno");
  const cla = calcularMetricas(base({ herramienta: "claude", intentos: muertos }));
  assert.equal(cla.thrashing_verificable, true);
});

test("metricas: resultado distingue DONE, PAUSED, entorno e invalida (A7)", () => {
  const pausado = [{ clase: "decision", senal: "motivo=design", resultado: "PAUSED", builder_ms: 1, verify_ms: 1,
    revisor_ms: 1, builder_modelo: "m:h", motivo_relanzamiento: null, senal_x: null }];
  assert.equal(calcularMetricas(base({ intentos: pausado })).resultado, "PAUSED");
  const contaminado = calcularMetricas(base({
    textos: ["lee /fuente/repo/core/skills/x.md"], rutasFuente: ["/fuente/repo"],
  }));
  assert.equal(contaminado.contaminado, true);
  assert.equal(contaminado.resultado, "invalida");
  // La señal de la referencia no invalida: un DONE con oraculo_pasa false sigue siendo DONE (A16, D-37).
  const falla = calcularMetricas(base({ oraculoPasa: false }));
  assert.equal(falla.oraculo_pasa, false);
  assert.equal(falla.resultado, "DONE");
  assert.equal(calcularMetricas(base({ oraculoPasa: true })).oraculo_pasa, true);
});

test("metricas: contrato_ok exige citar la copia y no la instalación viva (A7)", () => {
  const copia = "/copia/core/agents/builder.md";
  const viva = "/viva/core/agents/builder.md";
  const ok = calcularMetricas(base({ textos: [`lee ${copia}`], rutasCopia: [copia], rutasViva: [viva] }));
  assert.equal(ok.contrato_ok, true);
  assert.equal(ok.resultado, "DONE");
  const mezcla = calcularMetricas(base({ textos: [`lee ${copia}`, `lee ${viva}`], rutasCopia: [copia], rutasViva: [viva] }));
  assert.equal(mezcla.contrato_ok, false);
  assert.equal(mezcla.resultado, "invalida");
});

test("metricas: lineas excluye changes/, docs/, .md y lockfiles; prueba es tests y *.test.*", () => {
  const m = calcularMetricas(base({
    cambios: [
      { ruta: "core/lib/a.mjs", lineas: 10 },
      { ruta: "src/a.test.ts", lineas: 5 },
      { ruta: "tests/b.mjs", lineas: 7 },
      { ruta: "evals/builder/lib/__tests__/c.mjs", lineas: 2 },
      { ruta: "changes/evals-builder/plan.md", lineas: 100 },
      { ruta: "docs/a.md", lineas: 9 },
      { ruta: "README.md", lineas: 1 },
      { ruta: "yarn.lock", lineas: 50 },
    ],
  }));
  assert.deepEqual(m.lineas, { prueba: 14, producto: 10, razon: 1.4 });
});

test("metricas: referencia suma archivos y líneas; sin intentos, lo que depende de ellos es null (A7)", () => {
  const m = calcularMetricas(base({ referencia: [{ ruta: "a.mjs", lineas: 3 }, { ruta: "b.mjs", lineas: 4 }] }));
  assert.deepEqual(m.referencia, { archivos: 2, lineas: 7 });
  const vacio = calcularMetricas(base({ intentos: [] }));
  assert.equal(vacio.resultado, null);
  assert.equal(vacio.relanzamientos, null);
  assert.equal(vacio.done_sin_intervencion, null);
  assert.equal(vacio.segundos, null);
});

test("metricas: el resultado no incluye rutas de los cambios (D-05)", () => {
  const salida = JSON.stringify(calcularMetricas(base({ rutasFuente: ["/fuente/repo"] })));
  for (const c of CAMBIOS) assert.ok(!salida.includes(c.ruta), `aparece ${c.ruta}`);
  assert.ok(!salida.includes("/fuente/repo"));
});
