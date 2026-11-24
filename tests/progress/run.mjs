#!/usr/bin/env node
// Pruebas offline del log de progreso y del cálculo de estado (segmento 1, A1–A4).
// Sin red, sin CLIs reales. Escribe solo en un directorio temporal que se borra al salir.

import assert from "node:assert/strict";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { anexar, evento, leerEventos, redactar, truncar, LIMITE_COMANDO, LIMITE_TEXTO } from "../../tools/progress/eventos.mjs";
import { calcularEstado } from "../../tools/progress/estado.mjs";
import { ENCABEZADO_CORTE, escribirResumen, generarResumen } from "../../tools/progress/resumen.mjs";
import { fingerprintTree } from "../../tools/run/tree-fingerprint.mjs";
import { capturar } from "../../tools/progress/captura.mjs";
import { leerSesionCodex } from "../../tools/progress/lector-codex.mjs";
import { leerSesionPi } from "../../tools/progress/lector-pi.mjs";

const dir = mkdtempSync(join(tmpdir(), "progreso-"));
const casos = [];
function caso(nombre, fn) { casos.push({ nombre, fn }); }

// A1: redacción y truncado
caso("A1 redacta Bearer, password=, sk-, ghp_, AKIA, URL con clave, --password y hex de 40", () => {
  assert.equal(
    redactar("curl -H 'Authorization: Bearer abc123def456ghi789jkl012mno345' http://x"),
    "curl -H 'Authorization: [redactado]' http://x",
  );
  assert.doesNotMatch(redactar("DB_PASSWORD=supersecreto123 npm test"), /supersecreto123/);
  assert.doesNotMatch(redactar("export api_key: hunter2hunter2"), /hunter2hunter2/);
  assert.doesNotMatch(redactar("usa sk-abcdefghijklmnop1234 para llamar"), /sk-abcdefghijklmnop1234/);
  assert.doesNotMatch(redactar("token ghp_abcdefghijklmnop1234 en uso"), /ghp_abcdefghijklmnop1234/);
  assert.doesNotMatch(redactar("id AKIAABCDEFGHIJKLMNOP fin"), /AKIAABCDEFGHIJKLMNOP/);
  assert.doesNotMatch(redactar("git clone https://usuario:clavesecreta@host.example/repo"), /clavesecreta/);
  assert.doesNotMatch(redactar("cmd --password hunter99 otra"), /hunter99/);
  assert.doesNotMatch(redactar("hash 0123456789abcdef0123456789abcdef01234567 fin"), /0123456789abcdef0123456789abcdef01234567/);
});

caso("A1 un comando de 500 caracteres queda en 200 o menos y los textos en 160 o menos", () => {
  const e = evento("comando_iniciado", { seg: 1, id: "a", cmd: "x".repeat(500) });
  assert.ok(e.cmd.length <= LIMITE_COMANDO, `cmd mide ${e.cmd.length}`);
  const t = evento("nota", { seg: 1, texto: "y".repeat(500) });
  assert.ok(t.texto.length <= LIMITE_TEXTO, `texto mide ${t.texto.length}`);
  assert.equal(truncar("abcdef", 4), "abc…");
});

// A2: anexar no lanza si la ruta no es escribible
caso("A2 anexar no lanza si la ruta es un directorio y avisa", () => {
  const ruta = join(dir, "bloqueado", "progress.jsonl");
  mkdirSync(ruta, { recursive: true });
  let ok;
  assert.doesNotThrow(() => { ok = anexar(ruta, evento("nota", { seg: 1, texto: "hola" })); });
  assert.equal(ok, false);
});

// A3: lectura tolerante
caso("A3 leerEventos devuelve las válidas y cuenta dos corruptas", () => {
  const ruta = join(dir, "corrupto.jsonl");
  const buena = JSON.stringify(evento("nota", { seg: 1, texto: "ok" }));
  writeFileSync(ruta, buena + "\n" + '{"t":"2026-11-23T10:00:00Z","tipo":"nota"' + "\n" + "basura no json\n" + buena + "\n");
  const r = leerEventos(ruta);
  assert.equal(r.eventos.length, 2);
  assert.equal(r.corruptas, 2);
});

caso("A3 un archivo inexistente devuelve lista vacía sin lanzar", () => {
  assert.deepEqual(leerEventos(join(dir, "no-existe.jsonl")), { eventos: [], corruptas: 0 });
});

caso("anexar escribe una línea JSON que leerEventos recupera", () => {
  const ruta = join(dir, "ida-y-vuelta", "progress.jsonl");
  assert.equal(anexar(ruta, evento("comando_iniciado", { seg: 1, id: "c1", cmd: "npm test" })), true);
  const r = leerEventos(ruta);
  assert.equal(r.eventos[0].cmd, "npm test");
  assert.equal(r.corruptas, 0);
  assert.ok(existsSync(ruta));
  assert.equal(readFileSync(ruta, "utf8").split("\n").length, 2);
});

// A4: estado
const AHORA = Date.parse("2026-11-23T12:00:00Z");
const hace = (seg) => new Date(AHORA - seg * 1000).toISOString();
const ev = (tipo, segAtras, campos = {}) => ({ t: hace(segAtras), tipo, seg: 1, o: "automatico", ...campos });

caso("A4 comando iniciado sin terminar hace 10 min da esperando comando, nunca sin actividad", () => {
  const eventos = [ev("comando_iniciado", 600, { id: "c1", cmd: "./verify" })];
  const e = calcularEstado(eventos, { ahora: AHORA, umbralSeg: 120 });
  assert.equal(e.senal, "esperando comando");
  assert.equal(e.ultimoComando.enCurso, true);
  assert.equal(e.ultimoComando.ms, 600000);
});

caso("A4 sin comando en curso y último evento hace más del umbral da sin actividad", () => {
  const eventos = [ev("archivo_editado", 300, { archivo: "a.mjs" })];
  const e = calcularEstado(eventos, { ahora: AHORA, umbralSeg: 120 });
  assert.equal(e.senal, "sin actividad");
  assert.equal(e.ultimoArchivo, "a.mjs");
});

caso("A4 actividad dentro del umbral da avanzando", () => {
  const eventos = [ev("archivo_editado", 30, { archivo: "b.mjs" })];
  const e = calcularEstado(eventos, { ahora: AHORA, umbralSeg: 120 });
  assert.equal(e.senal, "avanzando");
  assert.equal(e.segundosDesdeActividad, 30);
});

caso("A4 un comando terminado deja de estar en curso y reporta exit y duración", () => {
  const eventos = [ev("comando_iniciado", 20, { id: "c2", cmd: "npm test" }), ev("comando_terminado", 5, { id: "c2", exit: 0, ms: 15000 })];
  const e = calcularEstado(eventos, { ahora: AHORA, umbralSeg: 120 });
  assert.equal(e.senal, "avanzando");
  assert.equal(e.ultimoComando.enCurso, false);
  assert.equal(e.ultimoComando.exit, 0);
  assert.equal(e.ultimoComando.ms, 15000);
});

caso("A4 reporta segmento, paso, huellas en el último intervalo y casillas", () => {
  const eventos = [
    ev("paso_iniciado", 200, { texto: "Paso 2" }),
    ev("fingerprint_cambió", 30),
    ev("fingerprint_cambió", 200),
  ];
  const e = calcularEstado(eventos, { ahora: AHORA, umbralSeg: 120, intervaloSeg: 60, casillas: "2/5" });
  assert.equal(e.segmento, 1);
  assert.equal(e.paso, "Paso 2");
  assert.equal(e.cambiosHuella, 1);
  assert.equal(e.casillas, "2/5");
});

// Segmento 2: kit-status y kit-nota (A1–A7). Todo sincrónico y con reloj fijo (KIT_PROGRESO_AHORA).
const KIT_STATUS = fileURLToPath(new URL("../../scripts/kit-status.mjs", import.meta.url));
const KIT_NOTA = fileURLToPath(new URL("../../scripts/kit-nota.mjs", import.meta.url));
const FIXTURES = fileURLToPath(new URL("./fixtures/", import.meta.url));
const AHORA_ISO = "2026-11-23T12:00:00.000Z";

// Crea changes/prueba/plan.md con 2 de 4 casillas y, si se pide, copia un fixture como progress.jsonl.
function proyecto(nombre, fixture) {
  const d = join(dir, nombre, "changes", "prueba");
  mkdirSync(d, { recursive: true });
  const plan = join(d, "plan.md");
  writeFileSync(plan, "---\nstatus: in progress\nsegment: 2\n---\n# Prueba\n\n## Steps\n- [x] uno\n- [ ] dos\n- [x] tres\n- [ ] cuatro\n");
  if (fixture) copyFileSync(join(FIXTURES, fixture), join(d, "progress.jsonl"));
  return plan;
}

// Ejecuta kit-status con el reloj fijo y sin variables de entorno del usuario.
function kit(args, env = {}) {
  const base = { ...process.env };
  for (const k of ["KIT_PROGRESO_UMBRAL", "KIT_PROGRESO_INTERVALO", "KIT_PROGRESO_CICLOS"]) delete base[k];
  return spawnSync(process.execPath, [KIT_STATUS, ...args], {
    encoding: "utf8",
    timeout: 20000,
    env: { ...base, KIT_PROGRESO_AHORA: AHORA_ISO, ...env },
  });
}

const lineasDe = (r) => r.stdout.trimEnd().split("\n");

// A1: progreso normal, ≤ 8 líneas con los siete datos y la señal
caso("A1 kit-status con progreso normal imprime ≤ 8 líneas con los siete datos, exit 0", () => {
  const r = kit([proyecto("normal", "normal.jsonl")]);
  assert.equal(r.status, 0, r.stderr);
  const l = lineasDe(r);
  assert.ok(l.length <= 8, `líneas: ${l.length}`);
  assert.deepEqual(l, [
    "segmento 2 · paso: Crear scripts/kit-status.mjs",
    "última actividad: hace 14 s",
    "último archivo: scripts/kit-status.mjs",
    "último comando: node tests/progress/run.mjs — exit 0 (5 s)",
    "casillas: 2/4",
    "huella: cambió 1 vez en el último intervalo",
    "señal: avanzando",
  ]);
});

// A2: comando en curso nunca es «sin actividad», aunque lleve mucho tiempo
caso("A2 comando iniciado sin terminar da esperando comando con su duración, nunca sin actividad", () => {
  const plan = proyecto("largo", "comando-largo.jsonl");
  const r = kit([plan]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /último comando: node tests\/progress\/run\.mjs — en curso \(38 s\)/);
  assert.match(r.stdout, /señal: esperando comando \(38 s\)/);
  assert.doesNotMatch(r.stdout, /sin actividad/);
  const tarde = kit([plan], { KIT_PROGRESO_AHORA: "2026-11-23T12:10:00.000Z" });
  assert.equal(tarde.status, 0, tarde.stderr);
  assert.match(tarde.stdout, /señal: esperando comando \(10 min\)/);
  assert.doesNotMatch(tarde.stdout, /sin actividad/);
});

// A3: sin eventos recientes ni comando en curso
caso("A3 sin eventos recientes ni comando en curso da sin actividad desde hace N min", () => {
  const r = kit([proyecto("sin-actividad", "sin-actividad.jsonl")]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(lineasDe(r).length <= 8);
  assert.match(r.stdout, /señal: sin actividad desde hace 15 min/);
  assert.doesNotMatch(r.stdout, /esperando comando/);
});

// A4: líneas corruptas o truncadas no rompen la salida y se cuentan
caso("A4 líneas corruptas o truncadas se ignoran, se avisa cuántas y sale 0", () => {
  const r = kit([proyecto("corrupto", "corrupto.jsonl")]);
  assert.equal(r.status, 0, r.stderr);
  const l = lineasDe(r);
  assert.ok(l.length <= 8, `líneas: ${l.length}`);
  assert.match(r.stdout, /señal: avanzando/);
  assert.match(r.stdout, /última actividad: hace 10 s/);
  assert.equal(l[l.length - 1], "líneas ignoradas: 2 (corruptas o truncadas)");
});

// A5: sin progress.jsonl, mensaje claro y casillas del plan
caso("A5 sin progress.jsonl imprime «sin progress.jsonl» con las casillas del plan, exit 0", () => {
  const r = kit([proyecto("sin-log", null)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^sin progress\.jsonl: /);
  assert.match(r.stdout, /casillas: 2\/4/);
  assert.ok(lineasDe(r).length <= 8);
});

// A6: --watch repite con el intervalo y termina al llegar al límite de prueba
caso("A6 --watch repite la salida con --intervalo hasta el límite de prueba y no usa modelo", () => {
  const r = kit([proyecto("watch", "normal.jsonl"), "--watch", "--intervalo", "1"], { KIT_PROGRESO_CICLOS: "2" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal((r.stdout.match(/^señal: /gm) || []).length, 2);
});

// A7: kit-nota solo anexa una línea válida, redactada y truncada
caso("A7 kit-nota anexa líneas válidas y deja intactas las anteriores byte a byte", () => {
  const plan = proyecto("nota", "normal.jsonl");
  const log = join(dirname(plan), "progress.jsonl");
  const antes = readFileSync(log, "utf8");
  const bloqueo = spawnSync(process.execPath, [KIT_NOTA, plan, "blocked", "falla con token=abc123def456 en el paso"], { encoding: "utf8" });
  assert.equal(bloqueo.status, 0, bloqueo.stderr);
  const nota = spawnSync(process.execPath, [KIT_NOTA, plan, "doing", "Crear kit-status"], { encoding: "utf8" });
  assert.equal(nota.status, 0, nota.stderr);
  const invalida = spawnSync(process.execPath, [KIT_NOTA, plan, "otra", "x"], { encoding: "utf8" });
  assert.equal(invalida.status, 2);
  const despues = readFileSync(log, "utf8");
  assert.ok(despues.startsWith(antes), "las líneas anteriores cambiaron");
  const nuevos = despues.slice(antes.length).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(nuevos.map((e) => e.tipo), ["bloqueo", "nota"]);
  assert.equal(nuevos[0].o, "builder");
  assert.equal(nuevos[0].seg, 2);
  assert.doesNotMatch(nuevos[0].texto, /abc123def456/);
  assert.equal(leerEventos(log).corruptas, 0);
});

// A10 (revisión del planner, segmento 2): en un plan índice, las casillas son las del tramo activo
function indice(nombre, conLog) {
  const d = join(dir, nombre, "changes", "prueba");
  mkdirSync(d, { recursive: true });
  const plan = join(d, "plan.md");
  writeFileSync(plan, "---\nstatus: in progress\nsegment: 2\n---\n# Prueba índice\n\n## Steps\n- Segment 1 — Story: uno → tramo-1.md (pendiente)\n- Segment 2 — Story: dos → tramo-2.md (pendiente)\n");
  writeFileSync(join(d, "tramo-2.md"), "---\nplan: plan.md\nsegment: 2\n---\n\n## Steps\n- [x] uno\n- [ ] dos\n- [x] tres\n- [ ] cuatro\n");
  if (conLog) copyFileSync(join(FIXTURES, "normal.jsonl"), join(d, "progress.jsonl"));
  return plan;
}

caso("A10 plan índice con tramo-2.md muestra las casillas del tramo activo, no 0/0", () => {
  const r = kit([indice("indice", true)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /casillas: 2\/4/);
  assert.doesNotMatch(r.stdout, /casillas: 0\/0/);
});

caso("A10 plan índice sin progress.jsonl muestra las casillas del tramo activo, no 0/0", () => {
  const r = kit([indice("indice-sin-log", false)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^sin progress\.jsonl: /);
  assert.match(r.stdout, /casillas: 2\/4/);
  assert.doesNotMatch(r.stdout, /casillas: 0\/0/);
});

// Segmento 3: hook de progreso en Claude Code (A1–A4). Nunca bloquea: sale 0 y no escribe por stdout.
const HOOK = fileURLToPath(new URL("../../adapters/claude-code/progress-hook.mjs", import.meta.url));
const INSTALA_HOOK = fileURLToPath(new URL("../../adapters/claude-code/install-progress-hook.sh", import.meta.url));
const HOOK_PERMISOS = fileURLToPath(new URL("../../scripts/permissions-hook.mjs", import.meta.url));

// Proyecto temporal con planes bajo changes/<carpeta>/plan.md.
function hookProyecto(nombre, planes = [{ carpeta: "tarea", status: "approved", segment: 3 }]) {
  const raiz = join(dir, nombre);
  for (const p of planes) {
    const d = join(raiz, "changes", p.carpeta);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "plan.md"), `---\nstatus: ${p.status}\nsegment: ${p.segment}\n---\n# ${p.carpeta}\n`);
  }
  return raiz;
}

// Ejecuta el hook con un payload (objeto o texto crudo).
function hook(payload) {
  const input = typeof payload === "string" ? payload : JSON.stringify(payload);
  return spawnSync(process.execPath, [HOOK], { input, encoding: "utf8", timeout: 10000 });
}

const logDe = (raiz, carpeta = "tarea") => join(raiz, "changes", carpeta, "progress.jsonl");
const eventosDe = (raiz, carpeta) =>
  existsSync(logDe(raiz, carpeta))
    ? readFileSync(logDe(raiz, carpeta), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : [];

// A1: cada herramienta registra su evento; Read no registra nada
caso("A1 el hook registra archivo_editado, comando_iniciado y comando_terminado con exit y ms, sin salida", () => {
  const raiz = hookProyecto("a1");
  const pre = (tool, input, id) => ({ hook_event_name: "PreToolUse", tool_name: tool, tool_input: input, tool_use_id: id, cwd: raiz });
  const post = (input, id, resp) => ({ hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: input, tool_use_id: id, tool_response: resp, cwd: raiz });
  const r1 = hook(pre("Edit", { file_path: join(raiz, "a", "b.mjs") }, "e1"));
  assert.equal(r1.status, 0, r1.stderr);
  assert.equal(r1.stdout, "");
  assert.equal(hook(pre("Bash", { command: "npm test" }, "b1")).status, 0);
  assert.equal(hook(post({ command: "npm test" }, "b1", { exit_code: 0 })).status, 0);
  hook(pre("Write", { file_path: join(raiz, "c.mjs") }, "w1"));
  hook(pre("MultiEdit", { file_path: join(raiz, "d.mjs") }, "m1"));
  hook(pre("Read", { file_path: join(raiz, "e.mjs") }, "r1"));
  hook(pre("Edit", { file_path: join(raiz, "a", "b.mjs") }, "e1"));
  const e = eventosDe(raiz);
  assert.deepEqual(e.map((x) => x.tipo), ["archivo_editado", "comando_iniciado", "comando_terminado", "archivo_editado", "archivo_editado"]);
  assert.equal(e[0].archivo, "a/b.mjs");
  assert.equal(e[0].o, "hook");
  assert.equal(e[2].exit, 0);
  assert.equal(typeof e[2].ms, "number");
});

// A2: nada de lo que falle o sea ambiguo bloquea ni escribe
caso("A2 el hook sale 0 y no escribe ante stdin inválido, 0 o 2 planes activos o escritura imposible", () => {
  const invalido = hook("{no json");
  assert.equal(invalido.status, 0);
  assert.equal(invalido.stdout, "");
  const sinPlan = hookProyecto("a2-sin-plan", []);
  const r0 = hook({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: "a.mjs" }, tool_use_id: "x", cwd: sinPlan });
  assert.equal(r0.status, 0);
  assert.equal(r0.stdout, "");
  const dos = hookProyecto("a2-dos", [
    { carpeta: "uno", status: "approved", segment: 3 },
    { carpeta: "dos", status: "in progress", segment: 1 },
  ]);
  const r2 = hook({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: "a.mjs" }, tool_use_id: "y", cwd: dos });
  assert.equal(r2.status, 0);
  assert.equal(r2.stdout, "");
  assert.equal(existsSync(logDe(dos, "uno")), false);
  assert.equal(existsSync(logDe(dos, "dos")), false);
  const bloqueado = hookProyecto("a2-imposible");
  mkdirSync(logDe(bloqueado), { recursive: true });
  const rb = hook({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: "a.mjs" }, tool_use_id: "z", cwd: bloqueado });
  assert.equal(rb.status, 0);
  assert.equal(rb.stdout, "");
});

// A3: secretos redactados; .env y claves registran solo el nombre
caso("A3 el hook redacta comandos con secretos y registra solo el nombre de un .env o una clave", () => {
  const raiz = hookProyecto("a3");
  hook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "DB_PASSWORD=supersecreto123 npm test" }, tool_use_id: "b2", cwd: raiz });
  hook({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: join(raiz, ".env.local") }, tool_use_id: "e2", cwd: raiz });
  hook({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: "certs/key.pem" }, tool_use_id: "e3", cwd: raiz });
  assert.doesNotMatch(readFileSync(logDe(raiz), "utf8"), /supersecreto123/);
  const e = eventosDe(raiz);
  assert.equal(e.find((x) => x.id === "e2").archivo, ".env.local");
  assert.equal(e.find((x) => x.id === "e3").archivo, "key.pem");
});

// A4: instalar es idempotente, conserva el hook de permisos y quitar deja el estado inicial
caso("A4 instalar dos veces deja una entrada por evento, conserva el hook de permisos y quitar deja el estado inicial", () => {
  const raiz = hookProyecto("a4");
  const permisos = spawnSync(process.execPath, [HOOK_PERMISOS, "instalar", raiz], { encoding: "utf8" });
  assert.equal(permisos.status, 0, permisos.stderr);
  const ajustes = join(raiz, ".claude", "settings.local.json");
  const inicial = JSON.parse(readFileSync(ajustes, "utf8"));
  const bash = (accion) => spawnSync("bash", [INSTALA_HOOK, accion, raiz], { encoding: "utf8" });
  assert.equal(bash("instalar").status, 0);
  assert.equal(bash("instalar").status, 0);
  assert.equal(bash("comprobar").stdout, "instalado\n");
  const con = JSON.parse(readFileSync(ajustes, "utf8"));
  assert.equal(con.hooks.PreToolUse.filter((e) => JSON.stringify(e).includes("progress-hook.mjs")).length, 1);
  assert.equal(con.hooks.PostToolUse.filter((e) => JSON.stringify(e).includes("progress-hook.mjs")).length, 1);
  assert.equal(spawnSync(process.execPath, [HOOK_PERMISOS, "comprobar", raiz], { encoding: "utf8" }).stdout, "instalado\n");
  assert.equal(bash("quitar").status, 0);
  assert.deepEqual(JSON.parse(readFileSync(ajustes, "utf8")), inicial);
  assert.equal(bash("comprobar").stdout, "ausente\n");
});

// Segmento 4: captura de Codex y Pi por lectura de logs (A1–A5). Fixtures con estructura ficticia;
// `__RAIZ__` se sustituye por la raíz temporal del proyecto de prueba.
const SESIONES_FIXTURE = { codex: "codex-rollout.jsonl", pi: "pi-session.jsonl" };
const ARCHIVO_SESION = { codex: "rollout-2026-01-01.jsonl", pi: "pi-session.jsonl" };
const LECTOR = { codex: leerSesionCodex, pi: leerSesionPi };

function proyectoCaptura(nombre) {
  const raizProyecto = join(dir, nombre);
  const plan = join(raizProyecto, "changes", "tarea", "plan.md");
  mkdirSync(dirname(plan), { recursive: true });
  writeFileSync(plan, "---\nstatus: in progress\nsegment: 4\n---\n# tarea\n");
  return { raiz: raizProyecto, plan, log: join(dirname(plan), "progress.jsonl") };
}

// Escribe la sesión ficticia con la raíz indicada y, opcionalmente, líneas corruptas al final.
function sesionCopia(herramienta, nombre, raizSesion, { extra = "" } = {}) {
  const raizSesiones = join(dir, `${nombre}-sesiones`);
  mkdirSync(raizSesiones, { recursive: true });
  const texto = readFileSync(join(FIXTURES, SESIONES_FIXTURE[herramienta]), "utf8").replaceAll(
    "__RAIZ__",
    JSON.stringify(raizSesion).slice(1, -1),
  );
  writeFileSync(join(raizSesiones, ARCHIVO_SESION[herramienta]), texto + extra);
  return { raizSesiones, ruta: join(raizSesiones, ARCHIVO_SESION[herramienta]) };
}

const porTipoId = (eventos, tipo, id) => eventos.find((e) => e.tipo === tipo && e.id === id);

// A1 Codex: comando con exit 0 y ms por diferencia de timestamps; cell de exec + wait; sin exit → null
caso("A1 Codex: exec_command da comando_iniciado y comando_terminado con exit 0 y ms; cell cerrada por wait; sin exit → null", async () => {
  const p = proyectoCaptura("a1-codex");
  const s = sesionCopia("codex", "a1-codex", p.raiz);
  const r = await LECTOR.codex(s.ruta, { seg: 4 });
  assert.equal(r.cwd, p.raiz);
  assert.equal(porTipoId(r.eventos, "comando_iniciado", "call-1").cmd, "comando-ficticio --marca");
  const t1 = porTipoId(r.eventos, "comando_terminado", "call-1");
  assert.equal(t1.exit, 0);
  assert.equal(t1.ms, 1500);
  const t2 = porTipoId(r.eventos, "comando_terminado", "call-2");
  assert.equal(t2.exit, 1, "la celda 7 se cierra con el wait call-3");
  assert.equal(t2.ms, 2400);
  const t4 = porTipoId(r.eventos, "comando_terminado", "call-4");
  assert.equal(t4.exit, null);
  assert.equal(t4.ms, 500);
});

// A1 Pi: bash da iniciado y terminado; edit da archivo_editado con solo la ruta
caso("A1 Pi: bash da comando_iniciado y comando_terminado con exit y ms; edit da archivo_editado; sin exit → null", async () => {
  const p = proyectoCaptura("a1-pi");
  const s = sesionCopia("pi", "a1-pi", p.raiz);
  const r = await LECTOR.pi(s.ruta, { seg: 4 });
  assert.equal(r.cwd, p.raiz);
  assert.equal(porTipoId(r.eventos, "comando_iniciado", "tc-1").cmd, "comando-ficticio --marca");
  const t1 = porTipoId(r.eventos, "comando_terminado", "tc-1");
  assert.equal(t1.exit, 0);
  assert.equal(t1.ms, 1000);
  assert.equal(porTipoId(r.eventos, "archivo_editado", "tc-2").archivo, "ruta/ficticia/archivo.txt");
  const t3 = porTipoId(r.eventos, "comando_terminado", "tc-3");
  assert.equal(t3.exit, null);
  assert.equal(t3.ms, 300);
});

// A2: dos capturas sobre el mismo log no duplican (dedupe por tipo|id leyendo progress.jsonl)
for (const herramienta of ["codex", "pi"]) {
  caso(`A2 ${herramienta}: capturar dos veces sobre el mismo log no duplica eventos`, async () => {
    const p = proyectoCaptura(`a2-${herramienta}`);
    const s = sesionCopia(herramienta, `a2-${herramienta}`, p.raiz);
    const esperados = (await LECTOR[herramienta](s.ruta, { seg: 4 })).eventos.length;
    const uno = await capturar({ herramienta, raiz: p.raiz, plan: p.plan, desde: 0, raizSesiones: s.raizSesiones });
    assert.equal(uno.anadidos, esperados);
    const dos = await capturar({ herramienta, raiz: p.raiz, plan: p.plan, desde: 0, raizSesiones: s.raizSesiones });
    assert.equal(dos.anadidos, 0);
    const claves = leerEventos(p.log).eventos.map((e) => `${e.tipo}|${e.id ?? ""}`);
    assert.equal(claves.length, esperados);
    assert.equal(new Set(claves).size, claves.length, "no hay claves tipo|id repetidas");
  });
}

// A3: líneas truncadas o corruptas se saltan y la captura sigue con el resto
for (const herramienta of ["codex", "pi"]) {
  caso(`A3 ${herramienta}: líneas truncadas o corruptas se saltan y la captura cuenta solo las válidas`, async () => {
    const limpia = sesionCopia(herramienta, `a3-limpia-${herramienta}`, join(dir, "a3-limpia"));
    const esperados = (await LECTOR[herramienta](limpia.ruta, { seg: 4 })).eventos.length;
    const p = proyectoCaptura(`a3-${herramienta}`);
    const sucia = sesionCopia(herramienta, `a3-${herramienta}`, p.raiz, {
      extra: '\n{"type":"response_item","payload":{"type":"function_call"\nbasura no json\n',
    });
    const r = await capturar({ herramienta, raiz: p.raiz, plan: p.plan, desde: 0, raizSesiones: sucia.raizSesiones });
    assert.equal(r.anadidos, esperados);
    assert.equal(r.motivo, null);
  });
}

// A4: un exit que no se puede extraer queda en null; nunca se inventa un valor
caso("A4 exit no extraíble queda en null, nunca inventado (Codex call-4 y Pi tc-3)", async () => {
  const p = proyectoCaptura("a4");
  const c = sesionCopia("codex", "a4-codex", p.raiz);
  const cr = await LECTOR.codex(c.ruta, { seg: 4 });
  assert.equal(porTipoId(cr.eventos, "comando_terminado", "call-4").exit, null);
  const q = sesionCopia("pi", "a4-pi", p.raiz);
  const pr = await LECTOR.pi(q.ruta, { seg: 4 });
  assert.equal(porTipoId(pr.eventos, "comando_terminado", "tc-3").exit, null);
  const r = await capturar({ herramienta: "codex", raiz: p.raiz, plan: p.plan, desde: 0, raizSesiones: c.raizSesiones });
  const ev = leerEventos(p.log).eventos;
  assert.equal(ev.find((e) => e.id === "call-4" && e.tipo === "comando_terminado").exit, null);
  assert.ok(r.anadidos > 0);
});

// A5: sin lector, sin sesión coincidente o sin directorio de sesiones: 0 eventos y un motivo, sin lanzar
caso("A5 sin lector, sin sesión coincidente o sin directorio devuelve 0 eventos y un motivo sin lanzar", async () => {
  const p = proyectoCaptura("a5");
  const sinLector = await capturar({ herramienta: "cursor", raiz: p.raiz, plan: p.plan, desde: 0 });
  assert.equal(sinLector.anadidos, 0);
  assert.match(sinLector.motivo, /sin lector/);
  const otra = sesionCopia("codex", "a5-otra", join(dir, "otro-proyecto"));
  const noCoincide = await capturar({ herramienta: "codex", raiz: p.raiz, plan: p.plan, desde: 0, raizSesiones: otra.raizSesiones });
  assert.equal(noCoincide.anadidos, 0);
  assert.match(noCoincide.motivo, /sin sesión/);
  const vacio = await capturar({
    herramienta: "pi",
    raiz: p.raiz,
    plan: p.plan,
    desde: 0,
    raizSesiones: join(dir, "no-existe"),
  });
  assert.equal(vacio.anadidos, 0);
  assert.match(vacio.motivo, /sin sesión/);
  assert.equal(existsSync(p.log), false, "sin eventos no se crea el log");
});

// Segmento 5: resumen de corrida (progress-resumen.md). Eventos explícitos con tiempos fijos.
const seccion = (texto, titulo) => {
  const m = texto.split(`## ${titulo}\n`)[1];
  return m === undefined ? "" : m.split("\n## ")[0];
};
const evS5 = (tipo, segundo, campos = {}) => ({ t: new Date(Date.UTC(2026, 0, 1, 0, 0, segundo)).toISOString(), tipo, o: "automatico", ...campos });

// S5-A1: fin normal (DONE): tiempo por paso, espera larga, reintentos y casillas
caso("S5-A1 resumen DONE: encabezado, tiempo entre casillas, espera ≥ 30 s y reintentos agrupados", () => {
  const eventos = [
    evS5("paso_iniciado", 0, { texto: "paso 1" }),
    evS5("comando_iniciado", 1, { id: "c1", cmd: "npm test" }),
    evS5("comando_terminado", 40, { id: "c1", exit: 0, ms: 39000 }),
    evS5("casilla_marcada", 41, { texto: "Paso 1" }),
    evS5("casilla_marcada", 100, { texto: "Paso 2" }),
    evS5("comando_iniciado", 101, { id: "c2", cmd: "node x" }),
    evS5("comando_terminado", 102, { id: "c2", exit: 0, ms: 1000 }),
    evS5("comando_iniciado", 103, { id: "c3", cmd: "node x" }),
    evS5("comando_terminado", 104, { id: "c3", exit: 0, ms: 1000 }),
    evS5("comando_iniciado", 105, { id: "c4", cmd: "node x" }),
    evS5("comando_terminado", 106, { id: "c4", exit: 0, ms: 1000 }),
  ];
  const plan = { nombre: "demo", resultado: "DONE", casillas: [{ texto: "Paso 1", marcada: true }, { texto: "Paso 2", marcada: true }] };
  const r = generarResumen(eventos, plan);
  for (const t of ["Hecho", "Tiempo por paso", "Dónde esperó", "Dónde reintentó", "Falta"]) assert.match(r, new RegExp(`## ${t}\\n`));
  assert.match(r, /## Estado\nDONE\n/);
  assert.match(seccion(r, "Tiempo por paso"), /- Paso 1: 41 s\n- Paso 2: 59 s/);
  assert.match(seccion(r, "Dónde esperó"), /- npm test: 39 s/);
  assert.match(seccion(r, "Dónde reintentó"), /- node x ×3/);
  assert.doesNotMatch(seccion(r, "Dónde reintentó"), /npm test/);
  assert.match(seccion(r, "Falta"), /\(ninguno\)/);
  assert.match(seccion(r, "Hecho"), /- \[x\] Paso 1/);
});

// S5-A1: resultado PAUSED de producto lleva su motivo en el encabezado
caso("S5-A1 resumen PAUSED de producto lleva PAUSED: motivo=… y no el encabezado de corte", () => {
  const r = generarResumen([evS5("paso_iniciado", 0, { texto: "x" })], { nombre: "demo", resultado: "PAUSED", motivo: "verify", casillas: [{ texto: "Paso 1", marcada: false }] });
  assert.match(r, /## Estado\nPAUSED: motivo=verify\n/);
  assert.doesNotMatch(r, /CORTE POR TOPE/);
});

// S5-A2: corte por tope: encabezado propio, último paso, archivo, comando y primera casilla pendiente
caso("S5-A2 corte por tope: encabezado de corte, último paso, archivo, comando y primera casilla pendiente", () => {
  const eventos = [
    evS5("paso_iniciado", 0, { texto: "paso 2" }),
    evS5("archivo_editado", 10, { archivo: "tools/x.mjs" }),
    evS5("comando_iniciado", 11, { id: "c1", cmd: "npm test" }),
  ];
  const plan = {
    nombre: "demo",
    corte: true,
    casillas: [{ texto: "Paso 1", marcada: true }, { texto: "Paso 2", marcada: false }, { texto: "Paso 3", marcada: false }],
  };
  const r = generarResumen(eventos, plan);
  assert.match(r, new RegExp(`## Estado\\n${ENCABEZADO_CORTE}\\n`));
  const falta = seccion(r, "Falta");
  assert.match(falta, /último paso paso 2/);
  assert.match(falta, /archivo tools\/x\.mjs/);
  assert.match(falta, /comando npm test/);
  assert.match(falta, /Primera casilla pendiente: Paso 2\./);
  assert.match(falta, /- \[ \] Paso 2/);
});

// S5-A1: escritura best effort: escribe el archivo y, ante ruta imposible, devuelve false sin lanzar
caso("S5-A1 escribirResumen escribe el archivo y devuelve false sin lanzar ante ruta imposible", () => {
  const ruta = join(dir, "resumen-s5", "progress-resumen.md");
  assert.equal(escribirResumen(ruta, [evS5("paso_iniciado", 0, { texto: "x" })], { nombre: "demo", casillas: [] }), true);
  assert.match(readFileSync(ruta, "utf8"), /# Resumen de corrida/);
  writeFileSync(join(dir, "archivo-plano"), "x");
  assert.equal(escribirResumen(join(dir, "archivo-plano", "r.md"), [], {}), false);
});

// S5-A3/A4: la huella ignora changes/ (log y resumen) pero sí cuenta cambios fuera de changes/.
// Repo temporal con HEAD de árbol vacío (commit-tree, sin tocar ramas del proyecto).
function repoTemporal(nombre) {
  const raiz = join(dir, nombre);
  mkdirSync(raiz, { recursive: true });
  const git = (...args) => spawnSync("git", args, { cwd: raiz, encoding: "utf8" });
  git("init", "-q");
  writeFileSync(join(raiz, "README.md"), "base\n");
  const vacio = spawnSync("git", ["hash-object", "-t", "tree", "-w", "--stdin"], { cwd: raiz, encoding: "utf8", input: "" }).stdout.trim();
  const commit = spawnSync("git", ["-c", "user.name=prueba", "-c", "user.email=prueba@example.invalid", "commit-tree", vacio, "-m", "base"], { cwd: raiz, encoding: "utf8" }).stdout.trim();
  git("update-ref", "HEAD", commit);
  git("add", "README.md");
  return raiz;
}

caso("S5-A3 cambiar progress.jsonl y progress-resumen.md no cambia la huella", () => {
  const raiz = repoTemporal("repo-huella-a3");
  mkdirSync(join(raiz, "changes", "x"), { recursive: true });
  writeFileSync(join(raiz, "changes", "x", "progress.jsonl"), "{\"tipo\":\"paso_iniciado\"}\n");
  writeFileSync(join(raiz, "changes", "x", "progress-resumen.md"), "# Resumen\n");
  const antes = fingerprintTree(raiz);
  assert.ok(antes, "con git la huella no es null");
  writeFileSync(join(raiz, "changes", "x", "progress.jsonl"), "{\"tipo\":\"paso_iniciado\"}\n{\"tipo\":\"casilla_marcada\"}\n");
  writeFileSync(join(raiz, "changes", "x", "progress-resumen.md"), "# Resumen distinto\n");
  assert.equal(fingerprintTree(raiz), antes, "los archivos de harness en changes/ no entran en la huella");
});

caso("S5-A4 cambiar un archivo fuera de changes/ cambia la huella", () => {
  const raiz = repoTemporal("repo-huella-a4");
  const antes = fingerprintTree(raiz);
  writeFileSync(join(raiz, "README.md"), "base cambiada\n");
  assert.notEqual(fingerprintTree(raiz), antes, "un cambio de producto en README.md cambia la huella");
  const tras = fingerprintTree(raiz);
  writeFileSync(join(raiz, "nuevo.txt"), "nuevo\n");
  assert.notEqual(fingerprintTree(raiz), tras, "un archivo nuevo fuera de changes/ cambia la huella");
});

// Segmento 6: vigilante de `kit run` (scripts/progress-watch.mjs), A1–A6.
const VIGILANTE = fileURLToPath(new URL("../../scripts/progress-watch.mjs", import.meta.url));
const KIT_RUN = fileURLToPath(new URL("../../scripts/kit-run.mjs", import.meta.url));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function planVigilado(nombre) {
  const raiz = join(dir, `vigila-${nombre}`);
  const carpeta = join(raiz, "changes", "tarea");
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, "plan.md"), "---\nstatus: in progress\nsegment: 3\n---\n# Plan\n");
  writeFileSync(join(carpeta, "tramo-3.md"), "- [ ] primero\n- [ ] segundo\n");
  return { raiz, plan: join(carpeta, "plan.md"), tramo: join(carpeta, "tramo-3.md"), log: join(carpeta, "progress.jsonl") };
}

caso("A2 progress-watch imprime líneas de estado, registra la casilla marcada y sale 0 con SIGTERM sin escribir en stdout", async () => {
  const p = planVigilado("a2");
  const hijo = spawn(process.execPath, [VIGILANTE, "--plan", p.plan, "--herramienta", "none", "--raiz", p.raiz], {
    env: { ...process.env, KIT_PROGRESO_INTERVALO: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  let err = "";
  hijo.stdout.on("data", (d) => { out += d; });
  hijo.stderr.on("data", (d) => { err += d; });
  const cierre = new Promise((r) => hijo.on("close", (codigo) => r(codigo)));
  await esperar(300);
  writeFileSync(p.tramo, "- [x] primero\n- [ ] segundo\n");
  await esperar(2300);
  hijo.kill("SIGTERM");
  const codigo = await cierre;
  const lineas = err.split("\n").filter((l) => l.startsWith("[progreso] "));
  assert.ok(lineas.length >= 2, `esperaba ≥ 2 líneas de estado, hubo ${lineas.length}: ${err}`);
  for (const l of lineas) {
    assert.match(l, /^\[progreso\] (avanzando|esperando comando|sin actividad) · paso .+ · (última actividad hace \d+ s|sin actividad registrada)$/);
  }
  assert.equal(out, "");
  assert.equal(codigo, 0);
  const { eventos } = leerEventos(p.log);
  assert.ok(eventos.some((e) => e.tipo === "casilla_marcada" && e.id === "casilla|3|1"), "falta casilla_marcada de la casilla 1");
});

// Integración con kit run (A1, A3, A4, A5, A6): builder, verify y revisor falsos; cada caso corre
// scripts/kit-run.mjs en un temporal con HOME propio, para que el vigilante no lea sesiones reales.
const KR_BIN = join(dir, "kr-bin");
mkdirSync(KR_BIN);
const CABECERA_NODE = `#!${process.execPath}\n`;
const FALSOS_KR = {
  "builder.mjs": `${CABECERA_NODE}
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const planPath = join(process.cwd(), "changes/prueba/plan.md");
const espera = Number(process.env.FAKE_BUILDER_ESPERA_MS || 0);
if (espera > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, espera);
writeFileSync(planPath, readFileSync(planPath, "utf8").replace(/^status: .*$/m, "status: done"));
writeFileSync(join(process.cwd(), "creado.txt"), "hecho");
console.log("DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa");
`,
  "verify.mjs": `${CABECERA_NODE}
console.log(process.env.FAKE_VERIFY_FALLA === "1" ? "verify: fallo simulado" : "verify: ok");
process.exit(process.env.FAKE_VERIFY_FALLA === "1" ? 1 : 0);
`,
  "revisor.mjs": `${CABECERA_NODE}
console.log(JSON.stringify({ veredicto: "APPROVED", defectos: [] }));
`,
};
for (const [nombre, cuerpo] of Object.entries(FALSOS_KR)) {
  const ruta = join(KR_BIN, nombre);
  writeFileSync(ruta, cuerpo);
  chmodSync(ruta, 0o755);
}

const PLAN_KR = `---
status: approved
branch: feature/prueba
base: main
repos: [.]
executor: builder
segment: 1
---
# Prueba de kit run con vigilante

## Scope
- creado.txt

## Acceptance
| ID | Resultado |
| --- |
| A1 | creado.txt existe |

## Verification
\`./verify\`

## Steps
### Segment 1 — Story: prueba
- [x] crear creado.txt
  Check: \`test -f creado.txt\`

## Evidence
A1, crear creado.txt:
$ test -f creado.txt
exit 0

## Notes
- Fixture de prueba.
`;

function kitRun(nombre, { env = {}, argsKit = null } = {}) {
  const raiz = join(dir, `kr-${nombre}`);
  const carpeta = join(raiz, "changes", "prueba");
  mkdirSync(carpeta, { recursive: true });
  mkdirSync(join(raiz, "home"), { recursive: true });
  writeFileSync(join(carpeta, "plan.md"), PLAN_KR);
  const base = { ...process.env };
  delete base.KIT_RUN_TOPE_MS;
  delete base.KIT_PROGRESO;
  const entorno = {
    ...base,
    HOME: join(raiz, "home"),
    KIT_RUN_BUILDER: join(KR_BIN, "builder.mjs"),
    KIT_RUN_REVIEWER: join(KR_BIN, "revisor.mjs"),
    KIT_RUN_VERIFY: join(KR_BIN, "verify.mjs"),
    KIT_PROGRESO_INTERVALO: "1",
    FAKE_BUILDER_ESPERA_MS: "0",
    FAKE_VERIFY_FALLA: "0",
    ...env,
  };
  const args = argsKit ?? ["changes/prueba/plan.md", "--root", raiz];
  const r = spawnSync(process.execPath, [KIT_RUN, ...args], { encoding: "utf8", env: entorno, timeout: 60000 });
  return {
    status: r.status,
    error: r.error,
    stdout: (r.stdout ?? "").replaceAll(raiz, "<raiz>"),
    stderr: r.stderr ?? "",
    raiz,
    resumen: join(carpeta, "progress-resumen.md"),
    progreso: join(carpeta, "progress.jsonl"),
  };
}

caso("A1 kit run lanza el vigilante alrededor del builder: un builder de 3 s deja ≥ 2 líneas de estado y el run termina", () => {
  const r = kitRun("a1", { env: { FAKE_BUILDER_ESPERA_MS: "3000" } });
  assert.equal(r.error, undefined, `kit run no terminó (¿vigilante sin detener?): ${r.error}`);
  assert.equal(r.status, 0, r.stderr);
  const lineas = r.stderr.split("\n").filter((l) => l.startsWith("[progreso] "));
  assert.ok(lineas.length >= 2, `esperaba ≥ 2 líneas de estado, hubo ${lineas.length}: ${r.stderr}`);
});

caso("A3 kit run escribe progress-resumen.md antes de salir: con el encabezado de corte solo si corta por tope", () => {
  const done = kitRun("a3-done");
  assert.equal(done.status, 0, done.stderr);
  const textoDone = readFileSync(done.resumen, "utf8");
  assert.match(textoDone, /# Resumen de corrida/);
  assert.ok(!textoDone.includes(ENCABEZADO_CORTE), "un DONE no lleva el encabezado de corte");

  const pausa = kitRun("a3-verify", { env: { FAKE_VERIFY_FALLA: "1" } });
  assert.equal(pausa.status, 1, pausa.stderr);
  assert.match(pausa.stdout, /^PAUSED: /);
  assert.ok(existsSync(pausa.resumen), "PAUSED por verify debe dejar el resumen");
  assert.ok(!readFileSync(pausa.resumen, "utf8").includes(ENCABEZADO_CORTE));

  const corte = kitRun("a3-tope", { env: { FAKE_BUILDER_ESPERA_MS: "3000", KIT_RUN_TOPE_MS: "500" } });
  assert.equal(corte.status, 1, corte.stderr);
  assert.ok(existsSync(corte.resumen), "un corte por tope debe dejar el resumen");
  assert.ok(readFileSync(corte.resumen, "utf8").includes(ENCABEZADO_CORTE), "el corte por tope lleva el encabezado");
});

caso("A4 si el vigilante no arranca, kit run deja la salida y el código y avisa por stderr", () => {
  const base = kitRun("a4-base", { env: { KIT_PROGRESO: "0" } });
  const roto = kitRun("a4-roto", { env: { KIT_PROGRESO_INTERVALO: "abc" } });
  assert.equal(roto.error, undefined, `kit run no terminó: ${roto.error}`);
  assert.equal(roto.status, base.status, roto.stderr);
  assert.equal(roto.stdout, base.stdout);
  assert.match(roto.stderr, /progress-watch: --intervalo/, "el fallo del hijo se ve en stderr");
  assert.match(roto.stderr, /progreso: la captura final falló/, "kit run avisa que la señal falló");
  assert.ok(existsSync(roto.resumen), "aun sin vigilante, kit run escribe el resumen");
});

caso("A5 stdout y código de salida son idénticos con y sin vigilante en DONE, PAUSED por verify, PAUSED por tope y exit 2", () => {
  const escenarios = [
    ["DONE", {}, 0],
    ["verify", { FAKE_VERIFY_FALLA: "1" }, 1],
    ["tope", { FAKE_BUILDER_ESPERA_MS: "1500", KIT_RUN_TOPE_MS: "300" }, 1],
  ];
  for (const [nombre, env, esperado] of escenarios) {
    const con = kitRun(`a5-${nombre}-con`, { env });
    const sin = kitRun(`a5-${nombre}-sin`, { env: { ...env, KIT_PROGRESO: "0" } });
    assert.equal(con.status, esperado, `${nombre} con vigilante: ${con.stderr}`);
    assert.equal(sin.status, esperado, `${nombre} sin vigilante: ${sin.stderr}`);
    assert.equal(con.stdout, sin.stdout, `${nombre}: la salida estándar cambia con el vigilante`);
  }
  const usoCon = kitRun("a5-uso-con", { argsKit: ["changes/prueba/plan.md", "--opcion-rara"] });
  const usoSin = kitRun("a5-uso-sin", { argsKit: ["changes/prueba/plan.md", "--opcion-rara"], env: { KIT_PROGRESO: "0" } });
  assert.equal(usoCon.status, 2);
  assert.equal(usoSin.status, 2);
  assert.equal(usoCon.stdout, usoSin.stdout);
});

caso("A6 un corte por tope anexa bloqueo con origen kitrun y texto corte por tope; un DONE no lo anexa", () => {
  const corte = kitRun("a6-tope", { env: { FAKE_BUILDER_ESPERA_MS: "1500", KIT_RUN_TOPE_MS: "300" } });
  const { eventos: deCorte } = leerEventos(corte.progreso);
  assert.ok(
    deCorte.some((e) => e.tipo === "bloqueo" && e.o === "kitrun" && e.texto === "corte por tope"),
    `falta el bloqueo por tope: ${JSON.stringify(deCorte)}`,
  );
  const done = kitRun("a6-done");
  const { eventos: deDone } = leerEventos(done.progreso);
  assert.ok(!deDone.some((e) => e.tipo === "bloqueo"), "un DONE no anexa bloqueo");
});

let fallos = 0;
try {
  for (const c of casos) {
    try {
      await c.fn();
      console.log(`ok ${c.nombre}`);
    } catch (err) {
      fallos++;
      console.error(`FALLO ${c.nombre}\n${err.message}`);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (fallos) {
  console.error(`progress: ${fallos} caso(s) fallaron`);
  process.exit(1);
}
console.log(`progress: ${casos.length} casos pasaron`);
