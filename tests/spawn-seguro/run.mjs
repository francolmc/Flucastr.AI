// Pruebas de tools/spawn/sync-seguro.mjs (A1–A3) y un control con spawnSync crudo.
// Sin red; el archivo temporal vive en tmpdir() y el caso comprueba que no queda ningún resto.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSyncSeguro, spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const restosTemporales = () =>
  readdirSync(tmpdir()).filter((nombre) => nombre.startsWith("spawn-seguro-"));

const casos = [];
const caso = (nombre, fn) => casos.push({ nombre, fn });

// A1: sin stdio ni input, el hijo ve stdin cerrado y no cuelga.
caso("A1 sin stdio ni input: stdin cerrado, cat termina con stdout vacío", () => {
  const r = spawnSyncSeguro("bash", ["-c", "cat"]);
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.toString(), "");
});

// A2: con input, el hijo lee el texto desde el archivo y no queda archivo temporal.
caso("A2 con input: el hijo recibe el texto y no quedan restos temporales", () => {
  const antes = restosTemporales().length;
  const r = spawnSyncSeguro("bash", ["-c", "cat"], { input: "hola" });
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.toString(), "hola");
  assert.equal(restosTemporales().length, antes);
});

caso("A2 execFileSyncSeguro con input devuelve el texto y no deja restos", () => {
  const antes = restosTemporales().length;
  const salida = execFileSyncSeguro("bash", ["-c", "cat"], { input: "hola" });
  assert.equal(salida.toString(), "hola");
  assert.equal(restosTemporales().length, antes);
});

caso("A2 execFileSyncSeguro sin input: stdin cerrado", () => {
  const salida = execFileSyncSeguro("bash", ["-c", "cat"]);
  assert.equal(salida.toString(), "");
});

// A3: un stdio explícito se respeta tal cual.
caso("A3 stdio explícito: el helper no lo cambia (stdout null con inherit)", () => {
  const r = spawnSyncSeguro("bash", ["-c", "exit 0"], { stdio: "inherit" });
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, null);
});

// Control: spawnSync crudo con input, sin helper. Fuera del sandbox de Codex no reproduce EPERM;
// el caso fija que el resultado del helper coincide con el del camino normal.
caso("control: spawnSync crudo con input coincide con el helper", () => {
  const crudo = spawnSync("bash", ["-c", "cat"], { input: "hola" }); // estatico: control-crudo
  const ayudante = spawnSyncSeguro("bash", ["-c", "cat"], { input: "hola" });
  assert.equal(crudo.error, undefined, "el control crudo no debe dar error fuera del sandbox");
  assert.equal(crudo.stdout.toString(), ayudante.stdout.toString());
  console.log(`control: spawnSync crudo status=${crudo.status} stdout="${crudo.stdout}" (sin helper)`);
});

let fallos = 0;
for (const { nombre, fn } of casos) {
  try {
    fn();
    console.log(`ok - ${nombre}`);
  } catch (error) {
    fallos += 1;
    console.log(`not ok - ${nombre}\n  ${error.message}`);
  }
}

if (fallos > 0) {
  console.log(`${fallos} caso(s) fallaron`);
  process.exit(1);
}
console.log(`${casos.length} casos pasaron`);
