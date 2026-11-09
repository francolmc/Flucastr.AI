#!/usr/bin/env node
// Pruebas del medidor scripts/uso.mjs sobre fixtures con totales conocidos (A1 a A7).
// Uso: node pruebas/uso/probar.mjs [--script <ruta>] [--fixtures <dir>]
// --script y --fixtures sirven solo para la comprobación de sensibilidad (copias modificadas);
// por defecto prueban el medidor del repo y los fixtures de esta carpeta.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..", "..");
let script = join(raiz, "scripts", "uso.mjs");
let fixtures = join(aqui, "fixtures");
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--script" && argv[i + 1]) script = resolve(argv[++i]);
  else if (argv[i] === "--fixtures" && argv[i + 1]) fixtures = resolve(argv[++i]);
  else { console.error(`opción desconocida o sin valor: ${argv[i]}`); process.exit(2); }
}

const SECRETO = "SECRETO-NO-LEER";
const CAMPOS = ["herramienta", "fecha", "proyecto", "modelo", "rol", "sesiones", "llamadas", "entrada", "cache_leida", "cache_escrita", "salida"];

// Totales calculados a mano a partir de los fixtures.
const ESPERADO = [
  { herramienta: "claude", fecha: "2026-11-08", proyecto: "proyecto-a", modelo: "claude-sonnet-fixture", rol: "main", sesiones: 1, llamadas: 2, entrada: 130, cache_leida: 1500, cache_escrita: 200, salida: 70 },
  { herramienta: "claude", fecha: "2026-11-08", proyecto: "proyecto-a", modelo: "claude-haiku-fixture", rol: "sub", sesiones: 1, llamadas: 1, entrada: 10, cache_leida: 0, cache_escrita: 0, salida: 5 },
  { herramienta: "codex", fecha: "2026-11-08", proyecto: "proyecto-c", modelo: "gpt-codex-fixture", rol: "main", sesiones: 1, llamadas: 3, entrada: 1500, cache_leida: 1500, cache_escrita: 0, salida: 450 },
  { herramienta: "pi", fecha: "2026-11-08", proyecto: "proyecto-b", modelo: "modelo-pi-fixture", rol: "main", sesiones: 1, llamadas: 2, entrada: 600, cache_leida: 300, cache_escrita: 10, salida: 180 },
];

const clave = (f) => `${f.herramienta}|${f.modelo}|${f.rol}`;
const ordenar = (lista) => [...lista].map((f) => Object.fromEntries(CAMPOS.map((c) => [c, f[c]]))).sort((a, b) => (clave(a) < clave(b) ? -1 : clave(a) > clave(b) ? 1 : 0));
const deHerramienta = (lista, herr) => lista.filter((f) => f.herramienta === herr);
const esperado = (herr) => ordenar(ESPERADO.filter((f) => f.herramienta === herr));

const tmp = mkdtempSync(join(tmpdir(), "probar-uso-"));

function correr(args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  if (r.error) throw r.error;
  return r;
}

function base() {
  return ["--desde", "2026-01-01", "--claude-dir", join(fixtures, "claude"), "--codex-dir", join(fixtures, "codex"), "--pi-dir", join(fixtures, "pi")];
}

// Ejecuta con --json sobre los fixtures (o con sobrescrituras posteriores, que ganan) y devuelve el JSON y el texto crudo.
function medir(extra = []) {
  const r = correr([...base(), ...extra, "--json"]);
  assert.equal(r.status, 0, `exit ${r.status}: ${r.stderr}`);
  return { json: JSON.parse(r.stdout), crudo: r.stdout };
}

const pruebas = [];
const prueba = (id, descripcion, fn) => pruebas.push({ id, descripcion, fn });

prueba("A1", "Claude: mensaje duplicado contado una vez y subagente con rol sub", () => {
  const { json } = medir();
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "claude")), esperado("claude"));
});

prueba("A2", "Codex: último total acumulado, llamadas = eventos con info, filtro por herramienta", () => {
  const { json } = medir();
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "codex")), esperado("codex"));
  const solo = medir(["--herramienta", "codex"]).json.filas;
  assert.ok(solo.length > 0 && solo.every((f) => f.herramienta === "codex"), "--herramienta codex debe dejar solo filas de Codex");
});

prueba("A3", "Pi: suma de 2 mensajes, error por límite fuera de los tokens y 1 aviso", () => {
  const { json } = medir();
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "pi")), esperado("pi"));
  const limites = json.avisos.filter((a) => /límite/.test(a));
  assert.equal(limites.length, 1, `avisos de límite: ${JSON.stringify(json.avisos)}`);
  const filtrado = medir(["--proyecto", "PROYECTO-B"]).json.filas;
  assert.deepStrictEqual(ordenar(filtrado), esperado("pi"), "--proyecto debe ignorar mayúsculas y dejar solo el proyecto");
});

prueba("A4a", "Robustez: línea corrupta (en el fixture) y archivo con mtime antiguo ignorados", () => {
  const copia = join(tmp, "claude-con-viejo");
  cpSync(join(fixtures, "claude"), copia, { recursive: true });
  const viejo = join(copia, "-home-test-Codes-proyecto-a", "viejo.jsonl");
  writeFileSync(viejo, JSON.stringify({
    type: "assistant", requestId: "req_viejo", timestamp: "2026-11-08T10:05:00.000Z",
    message: { id: "msg_viejo", role: "assistant", model: "claude-sonnet-fixture",
      usage: { input_tokens: 999999, output_tokens: 999999, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  }) + "\n");
  const antiguo = new Date("2020-01-01T00:00:00Z");
  utimesSync(viejo, antiguo, antiguo);
  const { json } = medir(["--claude-dir", copia]);
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "claude")), esperado("claude"));
});

prueba("A4b", "Robustez: carpeta de Claude ausente avisa y el resto se suma", () => {
  const { json } = medir(["--claude-dir", join(tmp, "no-existe")]);
  assert.equal(deHerramienta(json.filas, "claude").length, 0);
  assert.ok(json.avisos.some((a) => /no existe la carpeta de Claude Code/.test(a)), `avisos: ${JSON.stringify(json.avisos)}`);
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "codex")), esperado("codex"));
  assert.deepStrictEqual(ordenar(deHerramienta(json.filas, "pi")), esperado("pi"));
});

prueba("A4c", "Robustez: con todas las carpetas ausentes sale con código 1", () => {
  const r = correr(["--claude-dir", join(tmp, "a"), "--codex-dir", join(tmp, "b"), "--pi-dir", join(tmp, "c"), "--json"]);
  assert.equal(r.status, 1, `exit ${r.status}`);
  assert.match(r.stderr, /ninguna carpeta de sesiones existe/);
});

prueba("A4d", "Opciones inválidas salen con código 2", () => {
  assert.equal(correr(["--desde", "2026-13-01"]).status, 2);
  assert.equal(correr(["--herramienta", "otra"]).status, 2);
});

prueba("A5", "Credenciales de Codex: no se leen ni aparecen en texto ni en JSON", () => {
  assert.ok(existsSync(join(fixtures, "codex", "auth.json")), "falta el fixture auth.json");
  const texto = correr(base());
  assert.equal(texto.status, 0, `exit ${texto.status}: ${texto.stderr}`);
  assert.ok(!texto.stdout.includes(SECRETO) && !texto.stderr.includes(SECRETO), "el texto muestra el secreto");
  const { crudo } = medir();
  assert.ok(!crudo.includes(SECRETO), "el JSON muestra el secreto");
});

// Calibración de cuota (fixtures/codex-cuota, 6 sesiones): 4 exclusivas y sin baja, puntos 3 + 2,5 + 1 + 4 = 10,5,
// tokens 5000 + 3000 + 1000 + 8000 = 17000. La que baja (50 a 45) y la cruzada (13:10 a 13:40, se cruza con la que baja) no entran.
const CUOTA_ESPERADA = [{ modelo: "gpt-cuota-fixture", puntos: 10.5, tokens: 17000, sesiones: 4 }];

prueba("A6", "Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña", () => {
  const { json } = medir(["--codex-dir", join(fixtures, "codex-cuota")]);
  assert.deepStrictEqual(json.cuota, CUOTA_ESPERADA);
  assert.ok(json.avisos.some((a) => /muestra pequeña/.test(a)), `avisos: ${JSON.stringify(json.avisos)}`);
});

prueba("A6b", "Calibración: la sesión que baja queda fuera también sin la cruzada", () => {
  const copia = join(tmp, "codex-cuota-sin-cruzada");
  cpSync(join(fixtures, "codex-cuota"), copia, { recursive: true });
  rmSync(join(copia, "sessions", "2026", "11", "08", "rollout-2026-11-08T13-10-00-cuota-cruzada.jsonl"));
  const { json } = medir(["--codex-dir", copia]);
  assert.deepStrictEqual(json.cuota, CUOTA_ESPERADA);
});

// Diagnóstico por sesión (fixtures/codex-sesiones). La sesión con esperas tiene 5 llamadas de espera (wait_agent, wait,
// send_message, sleep, wait_agent) y contexto 20000, 50000, 80000, 30000, 45000: mediana 45000, máximo 80000, y una caída
// del 40 % o más (80000 a 30000) = 1 compactación. La otra sesión no tiene esperas: 0, con contexto 10000 y 12000.
const SESIONES_ESPERADAS = [
  { fecha: "2026-11-08", proyecto: "proyecto-d", sesion: "rollout-2026-11-08T12-00-00-sesion-con-esperas.jsonl", modelo: "gpt-sesiones-fixture", llamadas: 5, esperas: 5, contexto_mediana: 45000, contexto_max: 80000, compactaciones: 1 },
  { fecha: "2026-11-08", proyecto: "proyecto-d", sesion: "rollout-2026-11-08T15-00-00-sesion-sin-esperas.jsonl", modelo: "gpt-sesiones-fixture", llamadas: 2, esperas: 0, contexto_mediana: 11000, contexto_max: 12000, compactaciones: 0 },
];

prueba("A3s", "Sesiones de Codex: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0", () => {
  const { json } = medir(["--codex-dir", join(fixtures, "codex-sesiones"), "--sesiones"]);
  assert.deepStrictEqual(json.sesiones, SESIONES_ESPERADAS);
  const texto = correr([...base(), "--codex-dir", join(fixtures, "codex-sesiones"), "--sesiones"]);
  assert.equal(texto.status, 0, `exit ${texto.status}: ${texto.stderr}`);
  assert.match(texto.stdout, /esperas\s+contexto_mediana\s+contexto_max\s+compactaciones/);
  assert.equal(correr(["--sesiones", "--herramienta", "claude"]).status, 2, "--sesiones con otra herramienta debe salir con código 2");
});

// Alerta de cuota (fixtures codex-alerta-85 y codex-alerta-40): la última sesión con dato de cuota semanal decide.
prueba("A7", "Cuota de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia", () => {
  const con85 = medir(["--codex-dir", join(fixtures, "codex-alerta-85")]).json;
  assert.ok(con85.avisos.some((a) => a.includes("Cuota semanal de Codex en 85 %")), `avisos: ${JSON.stringify(con85.avisos)}`);
  const con40 = medir(["--codex-dir", join(fixtures, "codex-alerta-40")]).json;
  assert.ok(!con40.avisos.some((a) => /Cuota semanal/.test(a)), `avisos: ${JSON.stringify(con40.avisos)}`);
  const sinDato = join(tmp, "codex-sin-cuota", "sessions", "2026", "11", "08");
  mkdirSync(sinDato, { recursive: true });
  writeFileSync(join(sinDato, "rollout-2026-11-08T12-00-00-sin-cuota.jsonl"), [
    { timestamp: "2026-11-08T12:00:00.000Z", type: "session_meta", payload: { cwd: "/home/test/Codes/proyecto-e" } },
    { timestamp: "2026-11-08T12:01:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 } } } },
  ].map((l) => JSON.stringify(l)).join("\n") + "\n");
  const sin = medir(["--codex-dir", join(tmp, "codex-sin-cuota")]).json;
  assert.ok(!sin.avisos.some((a) => /Cuota semanal/.test(a)), `sin dato no debe avisar: ${JSON.stringify(sin.avisos)}`);
  const umbral = medir(["--codex-dir", join(fixtures, "codex-alerta-40"), "--umbral", "30"]).json;
  assert.ok(umbral.avisos.some((a) => a.includes("Cuota semanal de Codex en 40 %")), `avisos con umbral 30: ${JSON.stringify(umbral.avisos)}`);
});

let fallos = 0;
try {
  for (const p of pruebas) {
    try {
      p.fn();
      console.log(`ok ${p.id}: ${p.descripcion}`);
    } catch (e) {
      fallos++;
      console.log(`FALLO ${p.id}: ${p.descripcion}`);
      console.log(`  ${String(e.message).split("\n").slice(0, 8).join("\n  ")}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (fallos > 0) {
  console.log(`FALLO: ${fallos} de ${pruebas.length} pruebas del medidor no pasaron`);
  process.exit(1);
}
console.log(`pruebas del medidor: ${pruebas.length} de ${pruebas.length} ok`);
