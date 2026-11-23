#!/usr/bin/env node
// Pruebas del informe de kit run (scripts/runs-report.mjs) sobre fixtures con cifras conocidas (A6 a A9).
// Uso: node tests/runs-report/run.mjs [--cli <ruta>]
// --cli sirve solo para la comprobación de sensibilidad (una copia que ignora las líneas corruptas debe fallar el caso corrupto).

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { leerDevueltos, mediana, percentil } from "../../tools/run/informe.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..", "..");
let cli = join(raiz, "scripts", "runs-report.mjs");
const fixtures = join(aqui, "fixtures");
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cli" && argv[i + 1]) cli = resolve(argv[++i]);
  else {
    console.error(`opción desconocida o sin valor: ${argv[i]}`);
    process.exit(2);
  }
}

function correr(args) {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

const casos = [];
function caso(nombre, fn) {
  casos.push({ nombre, fn });
}

caso("funciones puras: mediana y percentil por rango más cercano", () => {
  assert.equal(mediana([10, 20, 30, 100]), 25);
  assert.equal(percentil([10, 20, 30, 100], 90), 100);
  assert.equal(mediana([5]), 5);
  assert.equal(percentil([5], 90), 5);
  assert.equal(mediana([]), null);
  assert.equal(percentil([], 90), null);
});

caso("A6: fixture con 4 intentos da mediana 25, p90 100, tasa 25 % y motivo verify 1", () => {
  const r = correr(["--raiz", join(fixtures, "relanzamientos")]);
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /builder_ms\s+4\s+25\s+100/);
  assert.match(r.out, /1 de 4 intentos \(25 %\)/);
  assert.match(r.out, /motivos: verify 1, revisor 0/);
  assert.match(r.out, /revisor_ms\s+2\s+600\s+700/);
});

caso("A7: log vacío dice «sin registros» y sale con 0", () => {
  const r = correr(["--raiz", join(fixtures, "vacio")]);
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /sin registros/);
});

caso("A8: línea corrupta sale con 1, da archivo:línea en stderr y estadísticas de las válidas", () => {
  const r = correr(["--raiz", join(fixtures, "corrupto")]);
  assert.equal(r.status, 1);
  assert.match(r.err, /changes\/corrupto\/runs\.jsonl:2: /);
  assert.match(r.out, /builder_ms\s+2\s+50\s+60/);
});

caso("A9: devoluciones manuales cuentan 2 defecto y 1 omision; Evidence no cuenta; mal formada se avisa", () => {
  const r = correr(["--raiz", join(fixtures, "manual")]);
  assert.equal(r.status, 0, r.err);
  assert.match(r.out, /sin registros/);
  assert.match(r.out, /defecto 2, omision 1, verify 0, otro 0/);
  const texto = readFileSync(join(fixtures, "manual", "changes", "manual", "plan.md"), "utf8").split("\n");
  const linea = texto.findIndex((l) => l.includes("categoría inventada")) + 1;
  assert.ok(linea > 0);
  assert.match(r.err, new RegExp(`aviso: changes/manual/plan\\.md:${linea}: `));
});

caso("lectura de Devuelto: solo cuenta dentro de ## Notes y rechaza categorías inventadas", () => {
  const { conteos, avisos } = leerDevueltos("## Evidence\n- Devuelto: otro — x\n## Notes\n- Devuelto: verify — a\n- Devuelto: defectos — b\n");
  assert.equal(conteos.verify, 1);
  assert.equal(conteos.otro, 0);
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].linea, 5);
});

caso("sin changes/ sale con 2", () => {
  const vacio = mkdtempSync(join(tmpdir(), "runs-report-"));
  try {
    const r = correr(["--raiz", vacio]);
    assert.equal(r.status, 2);
  } finally {
    rmSync(vacio, { recursive: true, force: true });
  }
});

let fallos = 0;
for (const { nombre, fn } of casos) {
  try {
    fn();
    console.log(`ok ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`FALLO ${nombre}: ${e.message.split("\n").slice(0, 6).join(" | ")}`);
  }
}
console.log(fallos ? `${fallos} caso(s) fallaron` : `${casos.length} casos ok`);
process.exit(fallos ? 1 : 0);
