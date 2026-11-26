// Regeneración de lanzadores generados huérfanos (caso A3 de changes/ventana-por-agente/plan.md):
// un archivo con la marca del kit que el manifiesto ya no registra se regenera al reinstalar;
// un archivo sin marca y un enlace ajeno se conservan; --dry-run no escribe nada.
// HOME temporal y models.json temporal; no toca el HOME real.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const creados = [];

function temporal(prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

// Ejecuta sin shell y sin pipe en stdin (paso 19 de ./verify).
function correr(args, env = {}, cwd = raiz) {
  const base = { ...process.env };
  for (const k of ["FLUCASTR_MODELOS", "CLAUDE_CODE_AUTO_COMPACT_WINDOW", "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE", "PI_CODING_AGENT_DIR"]) {
    delete base[k];
  }
  return spawnSync(args[0], args.slice(1), {
    cwd,
    env: { ...base, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 100000,
  });
}

// models.json real con cambios opcionales; devuelve la ruta del archivo temporal.
function modelosCon(cambios = () => {}) {
  const m = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  cambios(m);
  const archivo = join(temporal("orfanos-modelos-"), "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

// Instala sobre un HOME existente (no crea otro) con el models.json dado.
function instalarEn(home, modelos, extra = []) {
  return correr(["bash", "install.sh", "--copy", ...extra], {
    HOME: home,
    CODEX_HOME: join(home, ".codex"),
    FLUCASTR_MODELOS: modelos,
  });
}

function nuevoHome() {
  const home = temporal("orfanos-home-");
  mkdirSync(join(home, ".local", "bin"), { recursive: true });
  return home;
}

function bin(home, nombre) {
  return join(home, ".local", "bin", nombre);
}

// Quita del manifiesto las líneas que nombran el destino; devuelve cuántas quitó.
function quitarDelManifiesto(home, destino) {
  const archivo = join(home, ".flucastr-ai", "manifiesto.txt");
  const lineas = readFileSync(archivo, "utf8").split("\n");
  const quedan = lineas.filter((l) => !l.includes(destino));
  writeFileSync(archivo, quedan.join("\n"));
  return lineas.length - quedan.length;
}

function manifiesto(home) {
  return readFileSync(join(home, ".flucastr-ai", "manifiesto.txt"), "utf8");
}

describe("A3: lanzadores generados huérfanos", () => {
  test("claude-planner marcado y sin registrar se regenera con la ventana nueva", () => {
    const home = nuevoHome();
    const destino = bin(home, "claude-planner");
    const r1 = instalarEn(home, modelosCon());
    assert.equal(r1.status, 0, (r1.stderr || r1.stdout).slice(-800));
    assert.match(readFileSync(destino, "utf8"), / --autocompact 300000/);

    const quitadas = quitarDelManifiesto(home, destino);
    assert.ok(quitadas > 0, "el manifiesto debía registrar claude-planner antes de quitarlo");

    const r2 = instalarEn(home, modelosCon((m) => { m.agents.planner.compact_at["claude-code"] = 250000; }));
    assert.equal(r2.status, 0, (r2.stderr || r2.stdout).slice(-800));
    assert.match(r2.stdout, /reemplazando archivo generado anterior: .*claude-planner/);
    assert.match(readFileSync(destino, "utf8"), / --autocompact 283000/);
    assert.match(manifiesto(home), /claude-planner/, "tras regenerarlo debe quedar registrado");
  });

  test("codex-planner marcado y sin registrar pasa de 60000 a 200000 y queda registrado", () => {
    const home = nuevoHome();
    const destino = bin(home, "codex-planner");
    const r1 = instalarEn(home, modelosCon((m) => { m.agents.planner.compact_at.codex = 60000; }));
    assert.equal(r1.status, 0, (r1.stderr || r1.stdout).slice(-800));
    assert.match(readFileSync(destino, "utf8"), /model_auto_compact_token_limit=60000/);

    const quitadas = quitarDelManifiesto(home, destino);
    assert.ok(quitadas > 0, "el manifiesto debía registrar codex-planner antes de quitarlo");

    const r2 = instalarEn(home, modelosCon());
    assert.equal(r2.status, 0, (r2.stderr || r2.stdout).slice(-800));
    assert.match(r2.stdout, /reemplazando archivo generado anterior: .*codex-planner/);
    const contenido = readFileSync(destino, "utf8");
    assert.match(contenido, /model_auto_compact_token_limit=200000/);
    assert.equal(contenido.includes("model_auto_compact_token_limit=60000"), false);
    assert.match(manifiesto(home), /codex-planner/, "tras regenerarlo debe quedar registrado");
  });

  test("un archivo sin marca del kit se conserva y se omite", () => {
    const home = nuevoHome();
    const destino = bin(home, "claude-builder");
    const ajeno = "#!/usr/bin/env bash\necho mio\n";
    writeFileSync(destino, ajeno);

    const r = instalarEn(home, modelosCon());
    assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
    assert.match(r.stdout, /OMITIDO \(ya existe\): .*claude-builder/);
    assert.equal(readFileSync(destino, "utf8"), ajeno);
  });

  test("un enlace a un lugar ajeno al repo se conserva y no se escribe a través de él", () => {
    const home = nuevoHome();
    const destino = bin(home, "claude-builder");
    const fuera = temporal("orfanos-ajeno-");
    const objetivo = join(fuera, "otro.sh");
    writeFileSync(objetivo, "echo ajeno\n");
    symlinkSync(objetivo, destino);

    const r = instalarEn(home, modelosCon());
    assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
    assert.match(r.stdout, /OMITIDO \(ya existe\): .*claude-builder/);
    assert.equal(readlinkSync(destino), objetivo);
    assert.equal(readFileSync(objetivo, "utf8"), "echo ajeno\n");
  });

  test("--dry-run no reescribe un lanzador marcado aunque el umbral haya cambiado", () => {
    const home = nuevoHome();
    const destino = bin(home, "claude-planner");
    const r1 = instalarEn(home, modelosCon());
    assert.equal(r1.status, 0, (r1.stderr || r1.stdout).slice(-800));
    const antes = readFileSync(destino, "utf8");
    quitarDelManifiesto(home, destino);

    const r = instalarEn(home, modelosCon((m) => { m.agents.planner.compact_at["claude-code"] = 250000; }), ["--dry-run"]);
    assert.equal(r.status, 0, (r.stderr || r.stdout).slice(-800));
    assert.match(r.stdout, /reemplazando archivo generado anterior: .*claude-planner/);
    assert.equal(readFileSync(destino, "utf8"), antes);
  });
});
