// Compactación automática de Pi (caso A7 de changes/ventana-por-agente/plan.md): reserva por compact_reserve del perfil,
// reemplazo del 172000 antiguo, respeto de los overrides de la persona usuaria, cálculo anterior sin compact_reserve
// y simulación sin escritura. Vía scripts/resolver.mjs fijar-compactacion pi. Directorios temporales; no toca el HOME ni el proyecto reales.

import assert from "node:assert/strict";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESOLVER = join(raiz, "scripts", "resolver.mjs");
const SOL = "openai/gpt-6.1-sol";
const TERRA = "openai/gpt-6.1-terra";
const LUNA = "openai/gpt-6-luna";
// Modelos de Pi del perfil pi-openai del kit, en orden del archivo.
const MODELOS_PI = [SOL, TERRA, LUNA];
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
  const archivo = join(temporal("pi-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

// settings.json de Pi en un directorio temporal; si contenido es undefined, el archivo no existe.
function settingsCon(contenido) {
  const ruta = join(temporal("pi-settings-"), "settings.json");
  if (contenido !== undefined) writeFileSync(ruta, JSON.stringify(contenido));
  return ruta;
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

function lineas(r) {
  return r.stdout.trim().split("\n");
}

describe("fijar-compactacion pi: reserva por compact_reserve", () => {
  test("archivo nuevo: los tres modelos fijan 92000 (272000 − 92000 = disparo 180000) y el archivo queda creado", () => {
    const ruta = settingsCon(undefined);
    const r = resolver(["fijar-compactacion", "pi", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), [`fijado:${SOL}=92000:creado`, `fijado:${TERRA}=92000:creado`, `fijado:${LUNA}=92000:creado`]);
    assert.deepEqual(leer(ruta), {
      compaction: { modelOverrides: { [SOL]: { reserveTokens: 92000 }, [TERRA]: { reserveTokens: 92000 }, [LUNA]: { reserveTokens: 92000 } } },
    });
  });

  test("16384 es el mínimo aceptado para compact_reserve", () => {
    const ruta = settingsCon(undefined);
    const r = resolver(["fijar-compactacion", "pi", ruta], modelosCon(m => { m.profiles["pi-openai"].compact_reserve = 16384; }));
    assert.equal(r.status, 0, r.stderr);
    assert.equal(lineas(r)[0], `fijado:${SOL}=16384:creado`);
  });

  test("compact_reserve igual a la ventana o menor que 16384 se omite por umbral y no escribe", () => {
    for (const valor of [272000, 16383]) {
      const ruta = settingsCon({ x: 1 });
      const r = resolver(["fijar-compactacion", "pi", ruta], modelosCon(m => { m.profiles["pi-openai"].compact_reserve = valor; }));
      assert.equal(r.status, 0, r.stderr);
      assert.deepEqual(lineas(r), MODELOS_PI.map(m => `omitido-umbral:${m}`), `compact_reserve ${valor}`);
      assert.deepEqual(leer(ruta), { x: 1 }, `compact_reserve ${valor}`);
    }
  });

  test("sin compact_reserve vale el cálculo anterior: ventana − compact_at del perfil (272000 − 200000 = 72000)", () => {
    const ruta = settingsCon(undefined);
    const r = resolver(["fijar-compactacion", "pi", ruta], modelosCon(m => {
      delete m.profiles["pi-openai"].compact_reserve;
      m.profiles["pi-openai"].compact_at = 200000;
    }));
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), [`fijado:${SOL}=72000:creado`, `fijado:${TERRA}=72000:creado`, `fijado:${LUNA}=72000:creado`]);
  });

  test("sin compact_reserve y con compact_at que deja menos de 16384 se omite por umbral", () => {
    const ruta = settingsCon(undefined);
    const r = resolver(["fijar-compactacion", "pi", ruta], modelosCon(m => {
      delete m.profiles["pi-openai"].compact_reserve;
      m.profiles["pi-openai"].compact_at = 260000;
    }));
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), MODELOS_PI.map(m => `omitido-umbral:${m}`));
    assert.equal(existsSync(ruta), false);
  });
});

describe("fijar-compactacion pi: reemplazo del 172000 antiguo y overrides de la persona usuaria", () => {
  test("un override exactamente { reserveTokens: 172000 } se reemplaza y sale la línea «reemplazado»", () => {
    const ruta = settingsCon({ compaction: { modelOverrides: { [SOL]: { reserveTokens: 172000 } } } });
    const r = resolver(["fijar-compactacion", "pi", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), [
      `reemplazado 172000 en ${SOL}`,
      `fijado:${SOL}=92000`,
      `fijado:${TERRA}=92000`,
      `fijado:${LUNA}=92000`,
    ]);
    assert.equal(leer(ruta).compaction.modelOverrides[SOL].reserveTokens, 92000);
  });

  test("un 172000 con más claves no es del kit: omitido-usuario y no se toca", () => {
    const ruta = settingsCon({ compaction: { modelOverrides: { [SOL]: { reserveTokens: 172000, keepRecentTokens: 5 } } } });
    const r = resolver(["fijar-compactacion", "pi", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), [`omitido-usuario:${SOL}`, `fijado:${TERRA}=92000`, `fijado:${LUNA}=92000`]);
    assert.deepEqual(leer(ruta).compaction.modelOverrides[SOL], { reserveTokens: 172000, keepRecentTokens: 5 });
  });

  test("un override de la persona usuaria con otro valor (150000) no cambia y no se avisa de reemplazo", () => {
    const ruta = settingsCon({ compaction: { modelOverrides: { [SOL]: { reserveTokens: 150000 } } } });
    const r = resolver(["fijar-compactacion", "pi", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(lineas(r)[0], `omitido-usuario:${SOL}`);
    assert.ok(!r.stdout.includes("reemplazado"), r.stdout);
    assert.equal(leer(ruta).compaction.modelOverrides[SOL].reserveTokens, 150000);
  });

  test("un 172000 no se reemplaza si la reserva no se puede fijar (sin aviso de reemplazo)", () => {
    const ruta = settingsCon({ compaction: { modelOverrides: { [SOL]: { reserveTokens: 172000 } } } });
    const r = resolver(["fijar-compactacion", "pi", ruta], modelosCon(m => { m.profiles["pi-openai"].compact_reserve = 272000; }));
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!r.stdout.includes("reemplazado"), r.stdout);
    assert.equal(leer(ruta).compaction.modelOverrides[SOL].reserveTokens, 172000);
  });

  test("una preferencia global del usuario (compaction.reserveTokens) omite todo", () => {
    const ruta = settingsCon({ compaction: { reserveTokens: 5000 } });
    const r = resolver(["fijar-compactacion", "pi", ruta]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lineas(r), ["omitido-usuario:*"]);
    assert.deepEqual(leer(ruta), { compaction: { reserveTokens: 5000 } });
  });
});

describe("fijar-compactacion pi --dry-run: simulación sin escritura", () => {
  test("con 172000 antiguo muestra el reemplazo y no escribe", () => {
    const original = { compaction: { modelOverrides: { [SOL]: { reserveTokens: 172000 } } } };
    const ruta = settingsCon(original);
    const r = resolver(["fijar-compactacion", "pi", ruta, "--dry-run"]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(lineas(r)[0], `reemplazado 172000 en ${SOL}`);
    assert.equal(lineas(r)[1], `fijado:${SOL}=92000`);
    assert.deepEqual(leer(ruta), original);
  });

  test("sin archivo, la simulación no lo crea", () => {
    const ruta = settingsCon(undefined);
    const r = resolver(["fijar-compactacion", "pi", ruta, "--dry-run"]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(lineas(r)[0], `fijado:${SOL}=92000:creado`);
    assert.equal(existsSync(ruta), false);
  });
});
