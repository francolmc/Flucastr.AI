// Ajuste autoCompactWindow de Claude Code en el proyecto (caso A5 de changes/ventana-por-agente/plan.md):
// cada resultado de fijar-compactacion claude, la simulación, las claves ajenas, el registro sin duplicados
// y el instalador (adapters/claude-code/install-compaction.sh) con tools/install/manifest.sh.
// Directorios temporales; no toca el proyecto ni el HOME reales.

import assert from "node:assert/strict";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESOLVER = join(raiz, "scripts", "resolver.mjs");
const creados = [];

function temporal(prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

// Entorno sin variables de compactación heredadas; FLUCASTR_MODELOS apunta al modelo de la prueba.
function entorno(extra = {}) {
  const base = { ...process.env };
  for (const k of ["FLUCASTR_MODELOS", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE", "PI_CODING_AGENT_DIR"]) {
    delete base[k];
  }
  return { ...base, ...extra };
}

// Copia de models.json del kit, con cambios opcionales; devuelve la ruta del archivo.
function modelosCon(cambios = () => {}) {
  const m = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  cambios(m);
  const archivo = join(temporal("settings-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

// Proyecto temporal con settings.local.json (si se da contenido) y la ruta de ese archivo.
function proyectoCon(contenido) {
  const dir = temporal("settings-proyecto-");
  const ruta = join(dir, ".claude", "settings.local.json");
  if (contenido !== undefined) {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify(contenido));
  }
  return { dir, ruta };
}

function resolver(args, modelos = modelosCon()) {
  return spawnSyncSeguro("node", [RESOLVER, ...args], {
    cwd: raiz,
    env: entorno({ FLUCASTR_MODELOS: modelos }),
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 60000,
  });
}

function leer(ruta) {
  return JSON.parse(readFileSync(ruta, "utf8"));
}

// Planner de Claude Code en models.json del kit: compact_at 267000 + 33000 = 300000.
const VENTANA_PLANNER = 300000;

describe("fijar-compactacion claude: resultados", () => {
  test("sin el campo lo fija a planner + 33000 y conserva las claves ajenas", () => {
    const { ruta } = proyectoCon({ x: 1 });
    const r = resolver(["fijar-compactacion", "claude", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), `fijado:${VENTANA_PLANNER}`);
    assert.deepEqual(leer(ruta), { x: 1, autoCompactWindow: VENTANA_PLANNER });
  });

  test("con el valor correcto responde ya-estaba y no reescribe", () => {
    const { ruta } = proyectoCon({ autoCompactWindow: VENTANA_PLANNER });
    const r = resolver(["fijar-compactacion", "claude", ruta]);
    assert.equal(r.stdout.trim(), "ya-estaba");
  });

  test("un valor que no escribió el kit se respeta (omitido-usuario)", () => {
    const { ruta } = proyectoCon({ autoCompactWindow: 150000 });
    const r = resolver(["fijar-compactacion", "claude", ruta]);
    assert.equal(r.stdout.trim(), "omitido-usuario");
    assert.equal(leer(ruta).autoCompactWindow, 150000);
  });

  test("133000 sin registrar se trata como del kit y se actualiza (actualizado)", () => {
    const { ruta } = proyectoCon({ x: 1, autoCompactWindow: 133000 });
    const r = resolver(["fijar-compactacion", "claude", ruta]);
    assert.equal(r.stdout.trim(), `actualizado:${VENTANA_PLANNER}:133000`);
    assert.deepEqual(leer(ruta), { x: 1, autoCompactWindow: VENTANA_PLANNER });
  });

  test("un valor pasado con --registrado se actualiza (actualizado)", () => {
    const { ruta } = proyectoCon({ autoCompactWindow: 150000 });
    const r = resolver(["fijar-compactacion", "claude", ruta, "--registrado", "150000"]);
    assert.equal(r.stdout.trim(), `actualizado:${VENTANA_PLANNER}:150000`);
    assert.equal(leer(ruta).autoCompactWindow, VENTANA_PLANNER);
  });

  test("--solo-actualizar no crea el campo si falta (sin-campo) y no crea el archivo", () => {
    const { ruta } = proyectoCon(undefined);
    const r = resolver(["fijar-compactacion", "claude", ruta, "--solo-actualizar"]);
    assert.equal(r.stdout.trim(), "sin-campo");
    assert.equal(existsSync(ruta), false);
  });

  test("--dry-run anuncia el valor pero no escribe", () => {
    const { ruta } = proyectoCon({ x: 1 });
    const r = resolver(["fijar-compactacion", "claude", ruta, "--dry-run"]);
    assert.equal(r.stdout.trim(), `fijado:${VENTANA_PLANNER}`);
    assert.deepEqual(leer(ruta), { x: 1 });
  });

  test("planner con compact_at fuera de 100000-1000000 queda omitido (omitido-rango)", () => {
    const { ruta } = proyectoCon(undefined);
    const modelos = modelosCon((m) => {
      m.agents.planner.compact_at = { "claude-code": 999000, codex: 200000 };
    });
    const r = resolver(["fijar-compactacion", "claude", ruta], modelos);
    assert.equal(r.stdout.trim(), "omitido-rango:1032000");
    assert.equal(existsSync(ruta), false);
  });

  test("sin compact_at válido para Claude Code queda omitido (omitido-umbral)", () => {
    const { ruta } = proyectoCon(undefined);
    const modelos = modelosCon((m) => {
      delete m.agents.planner.compact_at;
      for (const perfil of Object.values(m.profiles ?? {})) delete perfil.compact_at;
      delete m.compact_at;
    });
    const r = resolver(["fijar-compactacion", "claude", ruta], modelos);
    assert.equal(r.stdout.trim(), "omitido-umbral");
    assert.equal(existsSync(ruta), false);
  });

  test("quitar-compactacion borra solo el campo y conserva el resto", () => {
    const { ruta } = proyectoCon({ x: 1, autoCompactWindow: VENTANA_PLANNER });
    const r = resolver(["quitar-compactacion", "claude", ruta, String(VENTANA_PLANNER)]);
    assert.equal(r.stdout.trim(), "quitado");
    assert.deepEqual(leer(ruta), { x: 1 });
  });
});

// Instalador: carga manifest.sh y install-compaction.sh en un bash y llama a instalar_compactacion_claude.
let driverRuta;
function driver() {
  if (driverRuta) return driverRuta;
  const dir = temporal("settings-driver-");
  driverRuta = join(dir, "driver.sh");
  writeFileSync(
    driverRuta,
    [
      "set -u",
      `source "${join(raiz, "tools", "install", "manifest.sh")}"`,
      `source "${join(raiz, "adapters", "claude-code", "install-compaction.sh")}"`,
      'instalar_compactacion_claude "$@"',
      "",
    ].join("\n"),
  );
  return driverRuta;
}

// Ejecuta el instalador con un registro (NUEVO) y un manifiesto anterior (MANIFIESTO) dados.
function instalador({ proyecto, nuevo = "", manifiesto, simular = 0, resolverRuta = RESOLVER, modelos = modelosCon(), args = [] }) {
  const dir = temporal("settings-run-");
  const nuevoArchivo = join(dir, "nuevo.txt");
  const manifiestoArchivo = join(dir, "manifiesto.txt");
  writeFileSync(nuevoArchivo, nuevo);
  if (manifiesto !== undefined) writeFileSync(manifiestoArchivo, manifiesto);
  const r = spawnSyncSeguro("bash", [driver(), ...args], {
    cwd: raiz,
    env: entorno({
      PROYECTO: proyecto,
      RESOLVER: resolverRuta,
      NUEVO: nuevoArchivo,
      MANIFIESTO: manifiestoArchivo,
      SIMULAR: String(simular),
      FLUCASTR_MODELOS: modelos,
    }),
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 60000,
  });
  const registro = readFileSync(nuevoArchivo, "utf8").split("\n").filter((l) => l !== "");
  return { r, registro };
}

function lineasDe(registro, ruta) {
  return registro.filter((l) => l.split("\t")[1] === ruta);
}

describe("instalar_compactacion_claude: registro y salida", () => {
  test("fijado registra una sola línea claude:<valor> y quita la duplicada anterior", () => {
    const { dir, ruta } = proyectoCon(undefined);
    const previa = `compactacion\t${ruta}\tclaude:150000`;
    const { r, registro } = instalador({ proyecto: dir, nuevo: `${previa}\n${previa}\n` });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /fijada: autoCompactWindow=300000/);
    assert.deepEqual(lineasDe(registro, ruta), [`compactacion\t${ruta}\tclaude:${VENTANA_PLANNER}`]);
  });

  test("ya-estaba deja una sola línea de registro (dedupe)", () => {
    const { dir, ruta } = proyectoCon({ autoCompactWindow: VENTANA_PLANNER });
    const linea = `compactacion\t${ruta}\tclaude:${VENTANA_PLANNER}`;
    const { r, registro } = instalador({ proyecto: dir, nuevo: `${linea}\n${linea}\n` });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /ya estaba fijada/);
    assert.deepEqual(lineasDe(registro, ruta), [linea]);
  });

  test("omitido-usuario quita el registro de la ruta", () => {
    const { dir, ruta } = proyectoCon({ autoCompactWindow: 150000 });
    const { r, registro } = instalador({ proyecto: dir, nuevo: `compactacion\t${ruta}\tclaude:111111\n` });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /OMITIDO \(el proyecto ya define autoCompactWindow/);
    assert.deepEqual(lineasDe(registro, ruta), []);
  });

  test("actualizado toma el valor registrado en el manifiesto anterior y reemplaza la línea", () => {
    const { dir, ruta } = proyectoCon({ autoCompactWindow: 150000 });
    const manifiesto = `compactacion\t${ruta}\tclaude:150000\n`;
    const { r, registro } = instalador({ proyecto: dir, manifiesto });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /actualizada: 150000 → 300000/);
    assert.deepEqual(lineasDe(registro, ruta), [`compactacion\t${ruta}\tclaude:${VENTANA_PLANNER}`]);
  });

  test("las líneas de otras rutas se conservan", () => {
    const { dir, ruta } = proyectoCon(undefined);
    const otra = "compactacion\t/otro/proyecto/.claude/settings.local.json\tclaude:200000";
    const pi = "compactacion\t/otro/pi.json\tpi:openai/gpt-6.1-terra";
    const { r, registro } = instalador({ proyecto: dir, nuevo: `${otra}\n${pi}\n` });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(registro.includes(otra));
    assert.ok(registro.includes(pi));
    assert.deepEqual(lineasDe(registro, ruta), [`compactacion\t${ruta}\tclaude:${VENTANA_PLANNER}`]);
  });

  test("simulación no toca el registro ni el archivo", () => {
    const { dir, ruta } = proyectoCon({ x: 1 });
    const { r, registro } = instalador({ proyecto: dir, simular: 1 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /\(simulación\) compactación de Claude Code fijada/);
    assert.deepEqual(registro, []);
    assert.deepEqual(leer(ruta), { x: 1 });
  });

  test("--solo-actualizar sin campo no imprime nada y no registra", () => {
    const { dir, ruta } = proyectoCon(undefined);
    const { r, registro } = instalador({ proyecto: dir, args: ["--solo-actualizar"] });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), "");
    assert.deepEqual(lineasDe(registro, ruta), []);
  });

  test("si el resolver falla, avisa y devuelve 0", () => {
    const { dir } = proyectoCon(undefined);
    const { r } = instalador({ proyecto: dir, resolverRuta: join(dir, "no-existe.mjs") });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /AVISO: no se tocó/);
  });
});
