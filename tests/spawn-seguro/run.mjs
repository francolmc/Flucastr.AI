// Pruebas de tools/spawn/sync-seguro.mjs (A1–A3) y un control con spawnSync crudo.
// Sin red; el archivo temporal vive en tmpdir() y el caso comprueba que no queda ningún resto.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { correrVigilado } from "../../tools/run/process.mjs";
import { execFileSyncSeguro, spawnSyncSeguro, spawnSyncMediado, capturaNativaDisponible } from "../../tools/spawn/sync-seguro.mjs";

const restosTemporales = () =>
  readdirSync(tmpdir()).filter((nombre) => nombre.startsWith("spawn-seguro-"));

const casos = [];
const caso = (nombre, fn) => casos.push({ nombre, fn });

// A1: sin stdio ni input, el hijo ve stdin cerrado y no cuelga.
caso("A1 sin stdio ni input: stdin cerrado, el hijo termina con stdout vacío", () => {
  const r = spawnSyncSeguro(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"]);
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.toString(), "");
});

// A2: con input, el hijo lee el texto desde el archivo y no queda archivo temporal.
caso("A2 con input: el hijo recibe el texto y no quedan restos temporales", () => {
  const antes = restosTemporales().length;
  const r = spawnSyncSeguro(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { input: "hola" });
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.toString(), "hola");
  assert.equal(restosTemporales().length, antes);
});

caso("A2 execFileSyncSeguro con input devuelve el texto y no deja restos", () => {
  const antes = restosTemporales().length;
  const salida = execFileSyncSeguro(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { input: "hola" });
  assert.equal(salida.toString(), "hola");
  assert.equal(restosTemporales().length, antes);
});

caso("A2 execFileSyncSeguro sin input: stdin cerrado", () => {
  const salida = execFileSyncSeguro(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"]);
  assert.equal(salida.toString(), "");
});

// A3: un stdio explícito se respeta tal cual.
caso("A3 stdio explícito: el helper no lo cambia (stdout null con inherit)", () => {
  const r = spawnSyncSeguro(process.execPath, ["-e", "process.exit(0)"], { stdio: "inherit" });
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, null);
});

// Control: spawnSync crudo con input, sin helper. Fuera del sandbox de Codex no reproduce EPERM;
// el caso fija que el resultado del helper coincide con el del camino normal.
caso("control: spawnSync crudo solo se usa donde la sonda confirmó pipes", () => {
  if (!capturaNativaDisponible()) { console.log("control crudo omitido: sonda detectó pérdida de pipes"); return; }
  const crudo = spawnSync(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { input: "hola" }); // estatico: control-crudo
  const ayudante = spawnSyncSeguro(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { input: "hola" });
  assert.equal(crudo.error, undefined, "control crudo fuera del sandbox");
  assert.equal(crudo.stdout.toString(), ayudante.stdout.toString());
  console.log(`control: spawnSync crudo status=${crudo.status} stdout="${crudo.stdout}" (sin helper)`);
});


caso("control de transporte identifica disponibilidad nativa por dos marcas", () => {
  console.log(`transporte nativo disponible=${capturaNativaDisponible()}`);
  assert.equal(typeof capturaNativaDisponible(), "boolean");
});

caso("sync captura stdout y stderr simultáneos y conserva utf8 y estado", () => {
  const r = spawnSyncMediado(process.execPath, ["-e", "process.stdout.write('ñ');process.stderr.write('aviso');process.exitCode=7"], { encoding: "utf8" });
  assert.equal(r.stdout, "ñ"); assert.equal(r.stderr, "aviso"); assert.equal(r.status, 7); assert.equal(r.error, undefined);
});


caso("execFileSync mediado conserva error de comando y salida", () => {
  assert.throws(() => execFileSyncSeguro(process.execPath, ["-e", "process.stdout.write('out');process.stderr.write('err');process.exit(4)"]), (error) => {
    assert.equal(error.status, 4); assert.equal(error.code, undefined); assert.equal(error.stdout.toString(), "out"); assert.equal(error.stderr.toString(), "err"); return true;
  });
});

caso("mediador rechaza timeout, maxBuffer y killSignal inválidos antes de lanzar", () => {
  assert.throws(() => spawnSyncMediado(process.execPath, ["-e", "process.exit(3)"], { timeout: "5" }), { code: "ERR_OUT_OF_RANGE" });
  assert.throws(() => spawnSyncMediado(process.execPath, ["-e", "process.exit(3)"], { maxBuffer: -1 }), { code: "ERR_OUT_OF_RANGE" });
  assert.throws(() => spawnSyncMediado(process.execPath, ["-e", "process.exit(3)"], { killSignal: "SIGFOO" }), { code: "ERR_INVALID_ARG_VALUE" });
});

caso("sync codifica input string como utf8 cuando encoding es buffer", () => {
  const r = spawnSyncMediado(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { input: "ñ", encoding: "buffer" });
  assert.equal(r.stdout.toString("utf8"), "ñ");
});

caso("sync mediado conserva cwd URL, env y salida Buffer", () => {
  const r = spawnSyncMediado(process.execPath, ["-e", "process.stdout.write(process.env.FLUCASTR_TEST+'|'+process.cwd())"], { cwd: new URL(`file://${process.cwd()}/`), env: { FLUCASTR_TEST: "env-ok" } });
  assert.equal(r.status, 0); assert.ok(Buffer.isBuffer(r.stdout)); assert.equal(r.stdout.toString(), `env-ok|${process.cwd()}`);
});

caso("sync aplica maxBuffer total, detiene exceso y limpia temporales", () => {
  const antes = restosTemporales().length;
  const r = spawnSyncMediado(process.execPath, ["-e", "process.stdout.write(Buffer.alloc(700));process.stderr.write(Buffer.alloc(700))"], { maxBuffer: 1024 });
  assert.equal(r.error.code, "ENOBUFS"); assert.equal(r.status, null); assert.ok(r.stdout.length + r.stderr.length <= 1025);
  assert.equal(restosTemporales().length, antes);
});


caso("falta Python devuelve ENOENT y limpia el temporal", () => {
  const antes = restosTemporales().length;
  const r = spawnSyncMediado(process.execPath, ["-e", "process.exit(0)"], { env: { ...process.env, FLUCASTR_PYTHON: "flucastr-python-inexistente" } });
  assert.equal(r.error.code, "ENOENT"); assert.equal(r.status, null); assert.equal(restosTemporales().length, antes);
});

caso("overflow descarta salida posterior aunque el hijo atienda SIGTERM", () => {
  const antes = restosTemporales().length;
  const r = spawnSyncMediado(process.execPath, ["-e", "process.on('SIGTERM',()=>setTimeout(()=>process.exit(0),200));const t=setInterval(()=>{process.stdout.write(Buffer.alloc(8192));process.stderr.write(Buffer.alloc(8192))},2)"], { maxBuffer: 1024, timeout: 5000 });
  assert.equal(r.error.code, "ENOBUFS"); assert.ok(r.stdout.length + r.stderr.length <= 1025); assert.equal(restosTemporales().length, antes);
});


caso("sync maxBuffer permite exactamente el límite y rechaza un byte más", () => {
  const exacto = spawnSyncMediado(process.execPath, ["-e", "process.stdout.write(Buffer.alloc(1024))"], { maxBuffer: 1024 });
  assert.equal(exacto.status, 0); assert.equal(exacto.error, undefined); assert.equal(exacto.stdout.length, 1024);
  const excedido = spawnSyncMediado(process.execPath, ["-e", "process.stdout.write(Buffer.alloc(1025))"], { maxBuffer: 1024 });
  assert.equal(excedido.error.code, "ENOBUFS"); assert.equal(excedido.stdout.length, 1025);
});

caso("async conserva código real de handler tras recibir SIGTERM", async () => {
  const dir = mkdtempSync(join(tmpdir(), "spawn-seguro-ready-"));
  const ready = join(dir, "ready");
  const script = "const fs=require('fs'),p=process.argv[1];process.on('SIGTERM',()=>setTimeout(()=>process.exit(7),200));fs.writeFileSync(p,'ready');setInterval(()=>{},1000)";
  try {
    const r = await correrVigilado({ exe: process.execPath, args: ["-e", script, ready] }, "", process.cwd(), { intervaloMs: 20, vigilar: () => existsSync(ready) ? ({ cortar: true, motivo: "prueba-handler" }) : null });
    assert.equal(r.status, 7); assert.equal(r.error, "cortado: prueba-handler");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

caso("sync conserva timeout y espera la salida tras la señal", () => {
  const inicio = Date.now();
  const r = spawnSyncSeguro(process.execPath, ["-e", "process.on('SIGTERM',()=>setTimeout(()=>process.exit(0),250));setInterval(()=>{},1000)"], { timeout: 100, killSignal: "SIGTERM" });
  assert.equal(r.error.code, "ETIMEDOUT"); assert.equal(r.status, 0); assert.ok(Date.now() - inicio >= 250);
});

caso("async captura ambos flujos y conserva exit no cero", async () => {
  const r = await correrVigilado({ exe: process.execPath, args: ["-e", "process.stdout.write('out');process.stderr.write('err');process.exitCode=5"] }, "", process.cwd(), { tope: 5000 });
  assert.equal(r.status, 5); assert.equal(r.error, null); assert.equal(r.stdout, "out"); assert.equal(r.stderr, "err");
});

caso("async timeout propaga señal y elimina temporales", async () => {
  const antes = restosTemporales().filter((x) => x.startsWith("kit-run-vigilado-")).length;
  const r = await correrVigilado({ exe: process.execPath, args: ["-e", "setInterval(()=>{},1000)"] }, "", process.cwd(), { tope: 100 });
  assert.equal(r.status, null); assert.match(r.error, /superó el tope/);
  assert.equal(restosTemporales().filter((x) => x.startsWith("kit-run-vigilado-")).length, antes);
});

(async () => {

caso("stdio mixto mantiene captura de pipe y hereda el flujo solicitado", () => {
  const r = spawnSyncSeguro(process.execPath, ["-e", "process.stdout.write('pipe-out');process.stderr.write('ignore-err')"], { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" });
  assert.equal(r.status, 0); assert.equal(r.stdout, "pipe-out"); assert.equal(r.stderr, null);
});


caso("async escala a SIGKILL a los 10 s y el hijo deja de escribir", async () => {
  const dir = mkdtempSync(join(tmpdir(), "spawn-seguro-hijo-"));
  const marca = join(dir, "salida");
  const source = "const fs=require('fs');const p=process.argv[1];process.on('SIGTERM',()=>fs.appendFileSync(p,'TERM\\n'));setInterval(()=>fs.appendFileSync(p,'x'),30)";
  const inicio = Date.now();
  try {
    const r = await correrVigilado({ exe: process.execPath, args: ["-e", source, marca] }, "", process.cwd(), { tope: 100 });
    assert.equal(r.status, null); assert.match(r.error, /superó el tope/); assert.ok(Date.now() - inicio >= 9500);
    assert.equal(existsSync(marca), true);
    const estable = readFileSync(marca, "utf8");
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(readFileSync(marca, "utf8"), estable, "no debe quedar un hijo escribiendo tras la limpieza");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

caso("async conserva el corte de vigilancia", async () => {
  const r = await correrVigilado({ exe: process.execPath, args: ["-e", "setInterval(()=>{},1000)"] }, "", process.cwd(), { intervaloMs: 5, vigilar: () => ({ cortar: true, motivo: "prueba" }) });
  assert.equal(r.status, null); assert.equal(r.error, "cortado: prueba");
});

let fallos = 0;
for (const { nombre, fn } of casos) {
  try {
    await fn();
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

})();
