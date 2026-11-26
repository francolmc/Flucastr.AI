// Escalera para el flujo por subagente (tramo 5, A8 de changes/escalera-recuperacion/plan.md): scripts/kit-escalera.mjs
// clasifica el retorno o el error de un subagente, decide la acción (paso 0 a 4), la imprime y la registra en runs.jsonl.
// Casos desde tests/escalera/fixtures/. Cada caso usa un proyecto temporal con su plan y su runs.jsonl; no lanza modelos.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const ESCALERA = join(RAIZ, "scripts", "kit-escalera.mjs");
const FIXTURES = join(RAIZ, "tests", "escalera", "fixtures");
const MODELOS = join(FIXTURES, "escalera-modelos.json");
const PLAN = "changes/prueba/plan.md";
const temporales = [];

after(() => {
  for (const dir of temporales) rmSync(dir, { recursive: true, force: true });
});

// Proyecto temporal con el plan del fixture en changes/prueba/plan.md.
function proyecto() {
  const raiz = mkdtempSync(join(tmpdir(), "kit-escalera-"));
  temporales.push(raiz);
  mkdirSync(join(raiz, "changes", "prueba"), { recursive: true });
  writeFileSync(join(raiz, PLAN), readFileSync(join(FIXTURES, "plan-subagente.md"), "utf8"));
  return raiz;
}

const fixture = (nombre) => join(FIXTURES, nombre);

// Agota la escalera de tarea: paso 1, consejo, paso 2 y la falla que devuelve con la propuesta de paso 3 (3 registros).
function agotarEscalera(raiz) {
  const verify = fixture("salida-verify.txt");
  escalera(raiz, ["--salida", verify]);
  escalera(raiz, ["--salida", verify]);
  const plan = join(raiz, PLAN);
  writeFileSync(plan, `${readFileSync(plan, "utf8")}\n- Consejo (tramo 1): corre primero la prueba mínima.\n`);
  escalera(raiz, ["--salida", verify]);
  return escalera(raiz, ["--salida", verify]);
}

// Una llamada a kit-escalera con la configuración de prueba (FLUCASTR_MODELOS).
function escalera(raiz, args) {
  const r = spawnSyncSeguro(process.execPath, [ESCALERA, PLAN, "--raiz", raiz, ...args], {
    encoding: "utf8",
    env: { ...process.env, FLUCASTR_MODELOS: MODELOS },
  });
  return { status: r.status, salida: r.stdout ?? "", error: r.stderr ?? "" };
}

const primeraLinea = (texto) => texto.split("\n")[0];

// Líneas de runs.jsonl del proyecto temporal.
function registros(raiz) {
  const ruta = join(raiz, "changes", "prueba", "runs.jsonl");
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

describe("A8: escalera del flujo por subagente", () => {
  test("infra relanza en paso 0 y, agotado el cupo, devuelve con diagnóstico", () => {
    const raiz = proyecto();
    const infra = fixture("salida-infra.txt");

    const primera = escalera(raiz, ["--salida", infra]);
    assert.equal(primera.status, 0, primera.error);
    assert.equal(primeraLinea(primera.salida), "clase=infra; accion=relanzar; paso=0");
    const r1 = registros(raiz)[0];
    assert.equal(r1.plan, PLAN);
    assert.equal(r1.tramo, 1);
    assert.equal(r1.resultado, "devuelto");
    assert.equal(r1.clase, "infra");
    assert.equal(r1.paso, 0);
    assert.equal(r1.relanzamientos, 1);
    assert.equal(r1.builder_ms, null);

    assert.equal(primeraLinea(escalera(raiz, ["--salida", infra]).salida), "clase=infra; accion=relanzar; paso=0");

    const tercera = escalera(raiz, ["--salida", infra]);
    assert.equal(tercera.status, 0, tercera.error);
    assert.equal(primeraLinea(tercera.salida), "clase=infra; accion=devolver; paso=0");
    assert.match(tercera.salida, /Diagnóstico: clase=infra/);
    assert.doesNotMatch(tercera.salida, /relevo/i);
    assert.equal(registros(raiz)[2].resultado, "PAUSED");
  });

  test("entorno, plan y decisión devuelven con diagnóstico y sin mencionar relevo", () => {
    const casos = [
      ["salida-entorno.txt", "entorno"],
      ["salida-scope.txt", "plan"],
      ["salida-ambigua.txt", "decision"],
    ];
    for (const [nombre, clase] of casos) {
      const raiz = proyecto();
      const r = escalera(raiz, ["--salida", fixture(nombre)]);
      assert.equal(r.status, 0, r.error);
      assert.equal(primeraLinea(r.salida), `clase=${clase}; accion=devolver; paso=0`);
      assert.match(r.salida, new RegExp(`Diagnóstico: clase=${clase}`));
      assert.doesNotMatch(r.salida, /relevo/i);
    }
  });

  test("tarea: paso 1 con handoff, paso 2 con consejo, paso 3 con modelo superior, paso 4 con estimación y --resuelto", () => {
    const raiz = proyecto();
    const verify = fixture("salida-verify.txt");

    // Primera falla: relanza en paso 1 con handoff cronológico.
    const uno = escalera(raiz, ["--salida", verify]);
    assert.equal(uno.status, 0, uno.error);
    assert.equal(primeraLinea(uno.salida), "clase=tarea; accion=relanzar; paso=1");
    assert.match(uno.salida, /^Handoff \(cronológico\):/m);
    assert.match(uno.salida, /Próxima acción: completar «Paso dos»/);

    // Segunda falla sin consejo: pide el consejo y no registra intento.
    const dos = escalera(raiz, ["--salida", verify]);
    assert.equal(primeraLinea(dos.salida), "clase=tarea; accion=consejo; paso=2");
    assert.equal(registros(raiz).length, 1);

    // Con el consejo escrito en el plan, la misma falla relanza en paso 2 con el consejo.
    const plan = join(raiz, PLAN);
    writeFileSync(plan, `${readFileSync(plan, "utf8")}\n- Consejo (tramo 1): corre primero la prueba mínima.\n`);
    const enDos = escalera(raiz, ["--salida", verify]);
    assert.equal(primeraLinea(enDos.salida), "clase=tarea; accion=relanzar; paso=2");
    assert.match(enDos.salida, /Consejo del planner:\ncorre primero la prueba mínima\./);

    // Tercera falla tras el paso 2: la escalera se agota y propone el paso 3 con el nivel superior.
    const tres = escalera(raiz, ["--salida", verify]);
    assert.equal(primeraLinea(tres.salida), "clase=tarea; accion=devolver; paso=2");
    assert.match(tres.salida, /propuesta: paso 3 con el nivel high \(modelo gpt-6-astra\)/);
    assert.doesNotMatch(tres.salida, /paso 4:/);

    // Paso 3 con el nivel superior: su falla de tarea imprime la nota paso 4 con créditos estimados y la pregunta.
    const cuatro = escalera(raiz, ["--paso", "3", "--salida", verify, "--tokens", "1000000,0,0"]);
    assert.equal(cuatro.status, 0, cuatro.error);
    assert.equal(primeraLinea(cuatro.salida), "clase=tarea; accion=devolver; paso=3");
    assert.match(cuatro.salida, /paso 4: el paso 3 \(nivel high, modelo gpt-6-astra\) no terminó/);
    assert.match(cuatro.salida, /Créditos del paso 3: 250 \(estimación\)\. Relevo al planner \(modelo gpt-6-luna\): 2\.5 \(estimación\)/);
    assert.match(cuatro.salida, /Pregunta de relevo/);

    // Un segundo paso 3 tras una falla de tarea no se permite.
    const otra = escalera(raiz, ["--paso", "3", "--salida", verify]);
    assert.equal(otra.status, 2);
    assert.match(otra.error, /--paso 3 solo vale/);

    // Resuelto a mano: la línea DONE cierra el tramo y atribuye la solución al paso 3.
    const resuelto = escalera(raiz, ["--resuelto"]);
    assert.equal(resuelto.status, 0, resuelto.error);
    assert.equal(primeraLinea(resuelto.salida), "accion=resuelto; resuelto_por=3");
    const ultimo = registros(raiz).at(-1);
    assert.equal(ultimo.resultado, "DONE");
    assert.equal(ultimo.resuelto_por, 3);
  });

  test("--paso 3 exige la escalera agotada", () => {
    const raiz = proyecto();
    const r = escalera(raiz, ["--paso", "3", "--salida", fixture("salida-verify.txt")]);
    assert.equal(r.status, 2);
    assert.match(r.error, /--paso 3 solo vale/);
    assert.equal(registros(raiz).length, 0);
  });

  test("--resuelto --paso 3 cierra el tramo con el paso 3 y exige la escalera agotada", () => {
    const raiz = proyecto();
    // Sin escalera agotada no se cierra con --paso 3 ni se registra nada.
    assert.equal(escalera(raiz, ["--resuelto", "--paso", "3"]).status, 2);
    assert.equal(registros(raiz).length, 0);

    // Paso 3 hecho por la persona: su DONE se cierra con --resuelto --paso 3 y queda como resuelto_por 3.
    agotarEscalera(raiz);
    const tres = escalera(raiz, ["--resuelto", "--paso", "3"]);
    assert.equal(tres.status, 0, tres.error);
    assert.equal(primeraLinea(tres.salida), "accion=resuelto; resuelto_por=3");
    const ultimo = registros(raiz).at(-1);
    assert.equal(ultimo.resultado, "DONE");
    assert.equal(ultimo.resuelto_por, 3);
    assert.equal(ultimo.paso, 3);
  });

  test("--resuelto --paso 4 cierra el relevo tras un paso 3 que falló por tarea", () => {
    const raiz = proyecto();
    const verify = fixture("salida-verify.txt");
    agotarEscalera(raiz);
    // Sin paso 3 fallido por tarea no hay relevo que cerrar.
    assert.equal(escalera(raiz, ["--resuelto", "--paso", "4"]).status, 2);
    assert.equal(registros(raiz).length, 3);

    // El paso 3 falla por tarea: la nota paso 4 dice cómo cerrar el relevo.
    const tres = escalera(raiz, ["--paso", "3", "--salida", verify]);
    assert.equal(tres.status, 0, tres.error);
    assert.match(tres.salida, /Pregunta de relevo/);
    assert.match(tres.salida, /si el relevo termina DONE, cierra con `--resuelto --paso 4`/);

    // Con ese paso 3 fallido, otro --resuelto --paso 3 no se permite; el relevo exitoso sí se cierra con 4.
    assert.equal(escalera(raiz, ["--resuelto", "--paso", "3"]).status, 2);
    const cuatro = escalera(raiz, ["--resuelto", "--paso", "4"]);
    assert.equal(cuatro.status, 0, cuatro.error);
    assert.equal(primeraLinea(cuatro.salida), "accion=resuelto; resuelto_por=4");
    const ultimo = registros(raiz).at(-1);
    assert.equal(ultimo.resultado, "DONE");
    assert.equal(ultimo.resuelto_por, 4);
  });

  test("--paso 4 solo vale con --resuelto", () => {
    const raiz = proyecto();
    const r = escalera(raiz, ["--paso", "4", "--salida", fixture("salida-verify.txt")]);
    assert.equal(r.status, 2);
    assert.equal(registros(raiz).length, 0);
  });

  test("DONE en la salida se rechaza; la salida sin DONE ni PAUSED es proceso muerto", () => {
    const raiz = proyecto();
    const done = escalera(raiz, ["--salida", fixture("salida-done.txt")]);
    assert.equal(done.status, 2);
    assert.match(done.error, /DONE/);
    assert.equal(registros(raiz).length, 0);
  });

  test("uso: opciones incompatibles o valores inválidos salen con 2", () => {
    const raiz = proyecto();
    const infra = fixture("salida-infra.txt");
    assert.equal(escalera(raiz, []).status, 2);
    assert.equal(escalera(raiz, ["--salida", infra, "--resuelto"]).status, 2);
    assert.equal(escalera(raiz, ["--salida", infra, "--herramienta", "otra"]).status, 2);
    assert.equal(escalera(raiz, ["--resuelto", "--paso", "3"]).status, 2);
    assert.equal(escalera(raiz, ["--salida", infra, "--tokens", "1,2"]).status, 2);
    assert.equal(registros(raiz).length, 0);
  });
});
