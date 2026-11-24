#!/usr/bin/env node
// Pruebas de kit-close (A1–A5): casillas, evidencia por paso, A# con corrida, status y «no escribe».
// Fixtures de plan en un directorio temporal bajo $TMPDIR; nada se escribe en el repo.
// Uso: node tests/kit-close/run.mjs
import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { revisarCierre } from "../../tools/check/cierre.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = resolve(RAIZ, "scripts", "kit-close.mjs");
const temporales = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "kit-close-"));
after(() => rmSync(temporales, { recursive: true, force: true }));

const PASOS_COMPLETOS = [
  "- [x] Crear `tools/a.mjs`. Check: `node --test tests/a.test.mjs`; expect exit 0 (A1).",
  "- [x] Crear `tools/b.mjs`. Check: `node tests/b.mjs`; expect exit 0 (A2).",
];
const CRITERIOS = "- A1: la cosa A funciona.\n- A2: la cosa B funciona.";
const EVIDENCIA_COMPLETA = [
  "Paso 1 (A1):",
  "$ node --test tests/a.test.mjs",
  "ℹ pass 3",
  "exit 0",
  "",
  "Paso 2 (A2):",
  "$ node tests/b.mjs",
  "exit 0",
].join("\n");

// Plan de prueba. `evidencia: null` omite la sección Evidence; `notas` vacío deja Notes sin contenido.
function plan({
  status = "done",
  segment,
  pasos = PASOS_COMPLETOS,
  criterios = CRITERIOS,
  evidencia = EVIDENCIA_COMPLETA,
  notas = "- Sin novedades.",
} = {}) {
  const fm = [
    "---",
    `status: ${status}`,
    "branch: feature/prueba",
    "base: main",
    "repos: [.]",
    "executor: builder",
    ...(segment !== undefined ? [`segment: ${segment}`] : []),
    "type: code",
    "---",
  ].join("\n");
  const partes = [
    `${fm}\n# Plan de prueba\n`,
    "## Goal\nPrueba.\n",
    `## Steps\n${pasos.join("\n")}\n`,
    `## Acceptance\n${criterios}\n`,
  ];
  if (evidencia !== null) partes.push(`## Evidence\n${evidencia}\n`);
  partes.push(`## Notes\n${notas}\n`);
  return partes.join("\n");
}

let contador = 0;
// Escribe plan.md (y tramos si se pasan) en un directorio nuevo y devuelve la ruta del plan.
function escribirPlan(texto, tramos = {}) {
  const dir = join(temporales, `caso-${contador++}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "plan.md"), texto);
  for (const [n, t] of Object.entries(tramos)) writeFileSync(join(dir, `tramo-${n}.md`), t);
  return join(dir, "plan.md");
}

function cli(planPath, args = []) {
  const r = spawnSync(process.execPath, [CLI, planPath, ...args], { encoding: "utf8" });
  return { codigo: r.status, salida: r.stdout, error: r.stderr };
}

function hay(informe, nivel, re) {
  return informe.filas.some(f => f.nivel === nivel && (re.test(f.mensaje) || re.test(f.elemento ?? "")));
}

// Conteo de pendientes que da el awk canónico sobre plan.md y los tramos indicados.
function awkPendientes(planPath, tramosPaths) {
  const salida = execFileSync("awk", ['/^- \\[ \\]/ {n++} END {print n+0}', planPath, ...tramosPaths], {
    encoding: "utf8",
  });
  return Number(salida.trim());
}

describe("A1: casillas pendientes", () => {
  test("pendientes dan error con el conteo", () => {
    const texto = plan({
      status: "in progress",
      pasos: [...PASOS_COMPLETOS, "- [ ] Pendiente uno. Check: `node x.mjs`", "- [ ] Pendiente dos."],
    });
    const inf = revisarCierre(texto, [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /2 casillas pendientes/));
    assert.equal(inf.codigo, 1);
  });

  test("el conteo coincide con el awk canónico sobre el mismo fixture en disco", () => {
    const texto = plan({
      status: "in progress",
      pasos: [...PASOS_COMPLETOS, "- [ ] Pendiente uno.", "- [ ] Pendiente dos.", "- [ ] Pendiente tres."],
    });
    const tramo1 = "## Steps\n- [ ] Tramo uno pendiente. Check: `node tests/t.mjs`\n";
    const tramo2 = "## Steps\n- [ ] Tramo dos pendiente. Check: `node tests/t.mjs`\n";
    const planPath = escribirPlan(texto, { 1: tramo1, 2: tramo2 });
    const dir = dirname(planPath);
    const archivos = readdirSync(dir).filter(f => /^tramo-\d+\.md$/.test(f)).map(f => join(dir, f));
    const esperado = awkPendientes(planPath, archivos);
    assert.equal(esperado, 5);

    const r = cli(planPath, ["--resultado", "DONE", "--json"]);
    const informe = JSON.parse(r.salida);
    const fila = informe.filas.find(f => f.nivel === "error" && f.elemento === "casillas");
    assert.ok(fila, "debe haber una fila de casillas");
    assert.equal(Number(fila.mensaje.match(/^(\d+) casillas/)[1]), esperado);
  });

  test("con segment, solo cuentan los tramos N ≤ segment", () => {
    const texto = plan({ status: "in progress", segment: 1, pasos: [...PASOS_COMPLETOS, "- [ ] En el plan."] });
    const tramos = [
      { n: 1, texto: "## Steps\n- [ ] Del tramo 1.\n" },
      { n: 2, texto: "## Steps\n- [ ] Del tramo 2, fuera de segment.\n" },
    ];
    const inf = revisarCierre(texto, tramos, { resultado: "DONE" });
    assert.ok(hay(inf, "error", /2 casillas pendientes/));
  });
});

describe("A2: paso marcado con evidencia", () => {
  test("paso [x] sin $ <cmd> en Evidence da error con el paso", () => {
    const texto = plan({
      pasos: [...PASOS_COMPLETOS, "- [x] Paso sin evidencia. Check: `node tests/c.mjs`; expect exit 0 (A1)."],
    });
    const inf = revisarCierre(texto, [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /paso marcado sin evidencia: `node tests\/c\.mjs`/));
    assert.equal(inf.codigo, 1);
  });

  test("formato antiguo «evidencia:» sin $ no cuenta como evidencia", () => {
    const antigua = [
      "Paso 1 (A1):",
      "evidencia: node --test tests/a.test.mjs pasa",
      "Paso 2 (A2):",
      "evidencia: node tests/b.mjs pasa",
    ].join("\n");
    const inf = revisarCierre(plan({ evidencia: antigua }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /paso marcado sin evidencia/));
    assert.equal(inf.codigo, 1);
  });

  test("$ <cmd> sin exit N da error", () => {
    const sinExit = EVIDENCIA_COMPLETA.replace("exit 0\n\nPaso 2", "\nPaso 2");
    const inf = revisarCierre(plan({ evidencia: sinExit }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /sin exit N/));
  });

  test("exit distinto de 0 es aviso, no error", () => {
    const conExit1 = EVIDENCIA_COMPLETA.replace("$ node tests/b.mjs\nexit 0", "$ node tests/b.mjs\nexit 1");
    const inf = revisarCierre(plan({ evidencia: conExit1 }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "aviso", /exit 1/));
    assert.ok(!hay(inf, "error", /paso/));
  });

  test("una corrida posterior sin exit N no oculta la anterior con exit 0", () => {
    const evidencia = [
      "Paso 1 (A1):",
      "$ node --test tests/a.test.mjs",
      "exit 0",
      "",
      "Paso 2 (A2):",
      "$ node tests/b.mjs",
      "exit 0",
      "",
      "Paso 1 (A1), nueva corrida:",
      "$ node --test tests/a.test.mjs; echo \"x exit $?\"",
      "ℹ pass 3",
    ].join("\n");
    const inf = revisarCierre(plan({ evidencia }), [], { resultado: "DONE" });
    assert.ok(!hay(inf, "error", /sin exit N/));
    assert.ok(hay(inf, "ok", /paso: Crear `tools\/a\.mjs`/));
    assert.equal(inf.codigo, 0);
  });

  test("sensibilidad: si ninguna corrida del comando tiene exit N, da error", () => {
    const evidencia = [
      "Paso 1 (A1):",
      "$ node --test tests/a.test.mjs; echo \"x exit $?\"",
      "ℹ pass 3",
      "",
      "Paso 2 (A2):",
      "$ node tests/b.mjs",
      "exit 0",
    ].join("\n");
    const inf = revisarCierre(plan({ evidencia }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /paso sin exit N tras `\$ node --test tests\/a\.test\.mjs`/));
    assert.equal(inf.codigo, 1);
  });
});

describe("A3: criterios A# con corrida", () => {
  test("A# sin corrida da error con el A#", () => {
    const texto = plan({ criterios: `${CRITERIOS}\n- A3: la cosa C funciona.` });
    const inf = revisarCierre(texto, [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /A3 sin corrida/));
    assert.equal(inf.codigo, 1);
  });

  test("un rango «A1–A3» con exit cubre A3", () => {
    const evidencia = [
      "Paso 1 (A1–A3):",
      "$ node --test tests/a.test.mjs",
      "exit 0",
      "",
      "Paso 2 (A2):",
      "$ node tests/b.mjs",
      "exit 0",
    ].join("\n");
    const texto = plan({ criterios: `${CRITERIOS}\n- A3: la cosa C funciona.`, evidencia });
    const inf = revisarCierre(texto, [], { resultado: "DONE" });
    assert.ok(!hay(inf, "error", /A3/));
  });
});

describe("A4: status frente al resultado del builder", () => {
  test("DONE con status in progress da error", () => {
    const inf = revisarCierre(plan({ status: "in progress" }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /el builder devolvió DONE/));
    assert.equal(inf.codigo, 1);
  });

  test("PAUSED con status done da error", () => {
    const inf = revisarCierre(plan({ status: "done" }), [], { resultado: "PAUSED" });
    assert.ok(hay(inf, "error", /el builder devolvió PAUSED/));
    assert.equal(inf.codigo, 1);
  });

  test("status draft o approved con casillas marcadas da error", () => {
    const inf = revisarCierre(plan({ status: "approved" }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /approved con 2 casillas marcadas/));
  });

  test("status no reconocido da error", () => {
    const inf = revisarCierre(plan({ status: "cerrado" }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /status no reconocido/));
  });

  test("sin resultado da no_verificable en la coherencia y exit 3", () => {
    const inf = revisarCierre(plan({ status: "done" }));
    assert.ok(hay(inf, "no_verificable", /coherencia no verificable/));
    assert.equal(inf.codigo, 3);
  });

  test("PAUSED con status partial y nota de reanudación es coherente", () => {
    const texto = plan({
      status: "partial",
      pasos: [PASOS_COMPLETOS[0], "- [ ] Paso dos pendiente. Check: `node tests/b.mjs`"],
      notas: "- Blocked: falta la fixture b. Reanudar en el paso 2.",
    });
    const inf = revisarCierre(texto, [], { resultado: "PAUSED" });
    assert.ok(hay(inf, "ok", /PAUSED con nota de reanudación/));
    assert.ok(!hay(inf, "error", /status/));
  });

  test("PAUSED sin nota en Notes da error", () => {
    const texto = plan({ status: "partial", notas: "" });
    const inf = revisarCierre(texto, [], { resultado: "PAUSED" });
    assert.ok(hay(inf, "error", /sin nota de reanudación/));
  });
});

describe("A5: plan completo y no escribe", () => {
  test("plan completo con DONE da exit 0 y sin errores", () => {
    const inf = revisarCierre(plan(), [], { resultado: "DONE" });
    assert.equal(inf.resumen.error, 0);
    assert.equal(inf.codigo, 0);
  });

  test("CLI sobre el plan completo sale con 0 y no escribe nada", () => {
    const planPath = escribirPlan(plan());
    const dir = dirname(planPath);
    const antes = createHash("sha256").update(readFileSync(planPath)).digest("hex");
    const listaAntes = readdirSync(dir).sort().join(",");

    const r = cli(planPath, ["--resultado", "DONE"]);
    assert.equal(r.codigo, 0, r.error);
    assert.match(r.salida, /codigo: 0/);

    const despues = createHash("sha256").update(readFileSync(planPath)).digest("hex");
    assert.equal(despues, antes, "el plan debe quedar byte a byte igual");
    assert.equal(readdirSync(dir).sort().join(","), listaAntes);
  });

  test("sensibilidad: un [x] sin evidencia en el caso completo pasa a error", () => {
    const mutado = plan({
      pasos: [...PASOS_COMPLETOS, "- [x] Paso marcado sin evidencia. Check: `node tests/d.mjs`; expect exit 0 (A2)."],
    });
    const inf = revisarCierre(mutado, [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /paso marcado sin evidencia: `node tests\/d\.mjs`/));
    assert.equal(inf.codigo, 1);
  });
});

describe("casos de no verificable", () => {
  test("plan sin Evidence parseable da no_verificable y exit 3", () => {
    const inf = revisarCierre(plan({ evidencia: null }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "no_verificable", /sin sección Evidence/));
    assert.equal(inf.codigo, 3);
  });

  test("plan sin casillas da no_verificable y exit 3", () => {
    const inf = revisarCierre(plan({ pasos: [] }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "no_verificable", /sin casillas/));
    assert.equal(inf.codigo, 3);
  });
});

describe("formato: etiqueta antes de $ y plan v1 sin status:", () => {
  test("«etiqueta: $ cmd» cuenta como evidencia con exit 0", () => {
    const evidencia = [
      "Paso 1 (A1):",
      "solo-lee: $ node --test tests/a.test.mjs",
      "exit 0",
      "",
      "Paso 2 (A2):",
      "solo-lee: $ node tests/b.mjs",
      "exit 0",
    ].join("\n");
    const inf = revisarCierre(plan({ evidencia }), [], { resultado: "DONE" });
    const pasosOk = inf.filas.filter(f => f.nivel === "ok" && f.elemento.startsWith("paso:"));
    assert.equal(pasosOk.length, 2);
    assert.ok(!hay(inf, "error", /paso marcado sin evidencia/));
    assert.equal(inf.codigo, 0);
  });

  test("sensibilidad: la etiqueta no oculta un comando distinto al del Check", () => {
    const evidencia = [
      "Paso 1 (A1):",
      "solo-lee: $ node otra-cosa.mjs",
      "exit 0",
      "",
      "Paso 2 (A2):",
      "solo-lee: $ node tests/b.mjs",
      "exit 0",
    ].join("\n");
    const inf = revisarCierre(plan({ evidencia }), [], { resultado: "DONE" });
    assert.ok(hay(inf, "error", /paso marcado sin evidencia: `node --test tests\/a\.test\.mjs`/));
    assert.equal(inf.codigo, 1);
  });

  test("plan v1 sin status: da no_verificable global y exit 3", () => {
    const v1 = plan().replace("status: done\n", "");
    const inf = revisarCierre(v1, [], { resultado: "DONE" });
    assert.equal(inf.filas.length, 1);
    assert.equal(inf.filas[0].nivel, "no_verificable");
    assert.equal(inf.codigo, 3);
    const r = cli(escribirPlan(v1), ["--resultado", "DONE"]);
    assert.equal(r.codigo, 3);
  });

  test("sensibilidad: el mismo plan con status: done no se trata como v1", () => {
    const inf = revisarCierre(plan(), [], { resultado: "DONE" });
    assert.ok(!hay(inf, "no_verificable", /formato v1/));
  });
});

describe("CLI: uso y códigos de salida", () => {
  test("--help sale con 0", () => {
    const r = spawnSync(process.execPath, [CLI, "--help"], { encoding: "utf8" });
    assert.equal(r.status, 0);
  });

  test("--resultado no válido sale con 2", () => {
    const r = cli(escribirPlan(plan()), ["--resultado", "QUIZA"]);
    assert.equal(r.codigo, 2);
  });

  test("plan inexistente sale con 2", () => {
    const r = cli(join(temporales, "no-existe", "plan.md"));
    assert.equal(r.codigo, 2);
  });

  test("pendientes por CLI salen con 1", () => {
    const r = cli(escribirPlan(plan({ status: "in progress", pasos: ["- [ ] Pendiente."] })), ["--resultado", "DONE"]);
    assert.equal(r.codigo, 1);
  });
});
