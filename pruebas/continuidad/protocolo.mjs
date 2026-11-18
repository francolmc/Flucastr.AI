#!/usr/bin/env node
// Dos ejecuciones independientes del constructor real contra repos temporales.
// No usa fixtures de modelo: cada resultado procede de codex-constructor.

import assert from "node:assert/strict";
import { appendFileSync, chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const KIT_SKILL = join(homedir(), ".agents/skills/ejecutar-plan/SKILL.md");
const LANZADOR = process.argv[2] || "codex-constructor";
const TEMP = mkdtempSync(join(tmpdir(), "continuidad-real-"));
const SALIDAS = [];

function validarIdiomaAgente(texto, regla) {
  assert.ok(texto.includes(regla), `la instrucción adaptable debe contener: ${regla}`);
}

const PRINCIPAL = readFileSync(join(RAIZ, "core/agents/principal.md"), "utf8");
const CONSTRUCTOR = readFileSync(join(RAIZ, "core/agents/constructor.md"), "utf8");
validarIdiomaAgente(PRINCIPAL, "Always respond in the language the user is currently using.");
validarIdiomaAgente(PRINCIPAL, "switch languages whenever they do.");
validarIdiomaAgente(PRINCIPAL, "Program output remains Spanish.");
validarIdiomaAgente(CONSTRUCTOR, "Respond in the language the user is currently using.");
validarIdiomaAgente(CONSTRUCTOR, "switch whenever they do.");
validarIdiomaAgente(CONSTRUCTOR, "Messages emitted by commands remain Spanish.");
assert.throws(
  () => validarIdiomaAgente(PRINCIPAL.replace("Always respond in the language the user is currently using.", ""), "Always respond in the language the user is currently using."),
  /la instrucción adaptable debe contener/,
  "el protocolo de continuidad debe rechazar la eliminación de la regla de idioma",
);
console.log("ok contrato: ambos agentes adaptan el idioma y la mutación negativa se rechaza");

function ejecutar(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, ...opciones });
  if (r.error) throw new Error(`${comando} ${args.join(" ")}: ${r.error.message}`);
  return r;
}

function git(raiz, ...args) {
  const r = ejecutar("git", ["-c", "user.name=Protocolo continuidad", "-c", "user.email=continuidad@example.invalid", ...args], { cwd: raiz });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falló: ${r.stderr}`);
}

function preparar(nombre, falla) {
  const raiz = join(TEMP, nombre);
  mkdirSync(join(raiz, "cambios/prueba"), { recursive: true });
  mkdirSync(join(raiz, ".agents/skills/ejecutar-plan"), { recursive: true });
  const verify = `#!/usr/bin/env node\n${falla
    ? 'if (require("node:fs").existsSync("primero.txt")) { console.log("VERIFY_CHECK_FAILED"); process.exit(1); }\nconsole.log("verify: pasa"); process.exit(0);\n'
    : 'console.log("verify: pasa"); process.exit(0);\n'}`;
  writeFileSync(join(raiz, "verify"), verify);
  chmodSync(join(raiz, "verify"), 0o755);
  writeFileSync(join(raiz, "AGENTS.md"), [
    "# Proyecto temporal de protocolo",
    "El repositorio contiene solo fixtures temporales para comprobar el constructor.",
    "Sigue la skill ejecutar-plan disponible en tu contexto.",
    "No accedas a secretos ni a servicios externos; no hagas commits.",
    "El alcance de cada plan solo permite los archivos que enumera.",
    "El único comando de comprobación es `./verify`.",
  ].join("\n") + "\n");
  writeFileSync(join(raiz, "cambios/prueba/plan.md"), `---
estado: aprobado
rama: feature/protocolo-real
base: main
repos: [.]
ejecutor: constructor
tramo: 1
continuidad: continua
---
# Protocolo temporal

## Objetivo
Comprobar el avance autónomo entre dos tramos y una pausa por causa repetida.

## Alcance
Archivos: \`primero.txt\`, \`segundo.txt\`.

## Aceptación
- A1: completar ambos tramos y dejar ambos archivos.

## Verificación
\`./verify\`

## Condiciones de parada
Avanza mientras cada comprobación pase, el trabajo permanezca dentro del alcance y no falte una decisión. Ante un fallo, diagnostica y corrige dentro del alcance si hay una corrección posible; después comprueba de nuevo. Si no hay corrección dentro del alcance, confirma el resultado con otra comprobación sin cambios. Si la misma causa persiste en dos comprobaciones, deja una nota con lo hecho, lo que falta y el motivo, y detén el avance. Detente también si falta una decisión o no hay una duración medida válida. No empieces un tramo si una condición de parada sigue activa.

## Notas
Medición previa de \`./verify\` en este repositorio temporal: ${medir(raiz)} (mismo comando y entorno).

## Pasos
### Tramo 1 — Primer archivo
Archivos: \`primero.txt\`.
- [ ] Crear \`primero.txt\` con el texto \`primero\`.

### Tramo 2 — Segundo archivo
Archivos: \`segundo.txt\`.
- [ ] Crear \`segundo.txt\` con el texto \`segundo\`.

## Handoff
Ejecuta la historia continua sin intervención. Aplica las Condiciones de parada del plan, conserva el alcance declarado y registra evidencia real de cada comprobación.
`);
  const skill = readFileSync(KIT_SKILL, "utf8");
  writeFileSync(join(raiz, ".agents/skills/ejecutar-plan/SKILL.md"), skill);
  git(raiz, "init", "-q", "-b", "main");
  git(raiz, "add", "AGENTS.md", "verify", "cambios", ".agents");
  git(raiz, "commit", "-q", "-m", "base temporal");
  git(raiz, "switch", "-q", "-c", "feature/protocolo-real");
  return raiz;
}

function medir(raiz) {
  const inicio = performance.now();
  const r = ejecutar("./verify", [], { cwd: raiz });
  const ms = (performance.now() - inicio).toFixed(2);
  return `${ms} ms; exit ${r.status}`;
}

function sesion(nombre, falla) {
  const raiz = preparar(nombre, falla);
  const plan = join(raiz, "cambios/prueba/plan.md");
  const prompt = `Ejecuta con la skill ejecutar-plan el plan cambios/prueba/plan.md. Rama: feature/protocolo-real. Es una ejecución de protocolo autorizada y aislada; sigue el Handoff, registra evidencia y responde con tu línea de retorno. No crees commits.`;
  const inicio = performance.now();
  const r = ejecutar(LANZADOR, ["exec", "-C", raiz, "-"], { cwd: raiz, input: prompt, timeout: 30 * 60 * 1000 });
  const duracion = ((performance.now() - inicio) / 1000).toFixed(2);
  const texto = readFileSync(plan, "utf8");
  const estado = texto.match(/^estado: (.*)$/m)?.[1] ?? "ausente";
  const tramos = [...texto.matchAll(/^- \[([ x])\]/gm)].map(m => m[1] === "x");
  const retorno = (r.stdout || "").trim().split("\n").find(l => /^(COMPLETADO|PAUSA):/.test(l)) ?? "sin línea de retorno";
  const observacion = {
    nombre,
    fallaProvocada: falla,
    exit: r.status,
    duracionSegundos: duracion,
    retorno,
    estado,
    tramos,
    primeroCreado: existsSync(join(raiz, "primero.txt")),
    segundoCreado: existsSync(join(raiz, "segundo.txt")),
    plan: texto,
    stdout: r.stdout,
    stderr: r.stderr,
  };
  SALIDAS.push(observacion);
  return observacion;
}

try {
  const completa = sesion("completa", false);
  assert.equal(completa.exit, 0, completa.stderr || completa.stdout);
  assert.equal(completa.estado, "listo", completa.plan);
  assert.deepEqual(completa.tramos, [true, true], completa.plan);
  assert.deepEqual([completa.primeroCreado, completa.segundoCreado], [true, true]);
  assert.match(completa.plan, /tramo: 2/);
  assert.match(completa.retorno, /^COMPLETADO:/);

  const pausada = sesion("falla-provocada", true);
  assert.equal(pausada.estado, "parcial", pausada.plan);
  assert.match(pausada.plan, /misma causa|dos veces/i);
  assert.match(pausada.plan, /primero\.txt/);
  assert.match(pausada.plan, /VERIFY_CHECK_FAILED/);
  assert.match(pausada.plan, /no se marca el paso|pendiente|falta|retomar/i);
  assert.doesNotMatch(pausada.plan, /fallo provocado de causa fija|repite exactamente una vez|repite una vez el mismo comando/i);
  const evidenciaFallo = pausada.plan.split("## Evidencia")[1]?.split("## Pasos")[0] ?? "";
  const resultadosFallo = evidenciaFallo || pausada.plan.split("## Notas")[1]?.split("## Pasos")[0] || "";
  assert.equal((resultadosFallo.match(/VERIFY_CHECK_FAILED/g) || []).length, 2, resultadosFallo);
  assert.match(pausada.retorno, /motivo=verify/);
  assert.deepEqual(pausada.tramos, [false, false], pausada.plan);
  assert.deepEqual([pausada.primeroCreado, pausada.segundoCreado], [true, false]);
  assert.doesNotMatch(pausada.plan, /Punto de control Tramo 2/);
  assert.match(pausada.retorno, /^PAUSA:/);

  const evidencia = SALIDAS.map(s => [
    `## Sesión ${s.nombre}`,
    `- Lanzador: \`${LANZADOR} exec -C <repo-temporal> -\``,
    `- Exit real: ${s.exit}; duración: ${s.duracionSegundos} s; estado del plan: ${s.estado}; casillas: ${s.tramos.map(x => x ? "[x]" : "[ ]").join(", ")}`,
    `- Retorno: \`${s.retorno}\``,
    "- Salida final observada:",
    "```text",
    (s.stdout + s.stderr).trim().split("\n").slice(-12).join("\n").replaceAll(TEMP, "<repo-temporal>"),
    "```",
    "- Nota y estado observados en el plan temporal:",
    "```text",
    s.plan.split("\n").filter(l => /^estado:|^tramo:|^- \[[ x]\]|PAUSA|punto de control|verify/.test(l)).join("\n").replaceAll(TEMP, "<repo-temporal>"),
    "```",
  ].join("\n")).join("\n\n");
  const archivoEvidencia = join(RAIZ, "pruebas/continuidad/evidencia-real.md");
  const existeEvidencia = existsSync(archivoEvidencia);
  appendFileSync(archivoEvidencia, `${existeEvidencia ? "\n\n## Corrida añadida\n\n" : "# Evidencia del protocolo real\n\n"}Fecha: ${new Date().toISOString()}\n\n${evidencia}\n`);
  console.log("ok sesión real: continuidad completó dos tramos en una invocación independiente");
  console.log("ok sesión real: fallo provocado dejó plan parcial, nota y tramo 2 intacto");
  console.log("evidencia: pruebas/continuidad/evidencia-real.md");
} finally {
  rmSync(TEMP, { recursive: true, force: true });
}
