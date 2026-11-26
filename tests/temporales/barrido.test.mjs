// Pruebas del barrido de temporales huérfanos (tools/temporales/barrido.mjs). Caso A1 de
// changes/higiene-verify/tramo-1.md. Trabaja solo en una base temporal propia (nunca en el /tmp real).

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, lutimesSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { barrer } from "../../tools/temporales/barrido.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = join(RAIZ, "tools", "temporales", "barrido.mjs");
const KIT_RUN = join(RAIZ, "scripts", "kit-run.mjs");
const HORA = 60 * 60 * 1000;
const bases = [];

function crearBase() {
  const base = mkdtempSync(join(tmpdir(), "barrido-test-"));
  bases.push(base);
  return base;
}

// Marca una entrada con una antigüedad en milisegundos (directorio, archivo o enlace).
function envejecer(ruta, hacePoco) {
  const t = new Date(Date.now() - hacePoco);
  if (lstatSync(ruta).isSymbolicLink()) lutimesSync(ruta, t, t);
  else utimesSync(ruta, t, t);
}

after(() => {
  for (const base of bases) rmSync(base, { recursive: true, force: true });
});

describe("barrer (A1)", () => {
  test("borra flucastr-verify.* de más de 120 min y deja los recientes", () => {
    const base = crearBase();
    mkdirSync(join(base, "flucastr-verify.aaaaaa"));
    writeFileSync(join(base, "flucastr-verify.aaaaaa", "salida.txt"), "x");
    envejecer(join(base, "flucastr-verify.aaaaaa"), 3 * HORA);
    mkdirSync(join(base, "flucastr-verify.bbbbbb"));
    envejecer(join(base, "flucastr-verify.bbbbbb"), 10 * 60 * 1000);

    const borrados = barrer(base);

    assert.deepEqual(borrados, ["flucastr-verify.aaaaaa"]);
    assert.equal(existsSync(join(base, "flucastr-verify.aaaaaa")), false);
    assert.equal(existsSync(join(base, "flucastr-verify.bbbbbb")), true);
  });

  test("deja otros nombres, archivos con el prefijo y enlaces simbólicos con su destino", () => {
    const base = crearBase();
    mkdirSync(join(base, "otro.viejo"));
    envejecer(join(base, "otro.viejo"), 5 * HORA);
    writeFileSync(join(base, "flucastr-verify.archivo"), "x");
    envejecer(join(base, "flucastr-verify.archivo"), 5 * HORA);
    mkdirSync(join(base, "destino-viejo"));
    envejecer(join(base, "destino-viejo"), 5 * HORA);
    symlinkSync(join(base, "destino-viejo"), join(base, "flucastr-verify.enlace"));
    envejecer(join(base, "flucastr-verify.enlace"), 5 * HORA);

    barrer(base);

    assert.equal(existsSync(join(base, "otro.viejo")), true);
    assert.equal(existsSync(join(base, "flucastr-verify.archivo")), true);
    assert.equal(existsSync(join(base, "flucastr-verify.enlace")), true);
    assert.equal(existsSync(join(base, "destino-viejo")), true);
  });

  test("respeta el umbral en minutos", () => {
    const base = crearBase();
    mkdirSync(join(base, "flucastr-verify.cccccc"));
    envejecer(join(base, "flucastr-verify.cccccc"), 3 * HORA);

    assert.deepEqual(barrer(base, { minutos: 240 }), []);
    assert.equal(existsSync(join(base, "flucastr-verify.cccccc")), true);
  });

  test("no lanza si la base no existe", () => {
    const base = join(crearBase(), "no-existe");
    assert.deepEqual(barrer(base), []);
  });

  test("no borra lo de otro dueño (uid distinto del de quien ejecuta)", () => {
    const base = crearBase();
    mkdirSync(join(base, "flucastr-verify.ajeno"));
    envejecer(join(base, "flucastr-verify.ajeno"), 3 * HORA);
    const uidAjeno = lstatSync(join(base, "flucastr-verify.ajeno")).uid + 1;

    assert.deepEqual(barrer(base, { uid: uidAjeno }), []);
    assert.equal(existsSync(join(base, "flucastr-verify.ajeno")), true);
  });
});

describe("CLI del barrido", () => {
  test("con una base sale 0 y borra el viejo", () => {
    const base = crearBase();
    mkdirSync(join(base, "flucastr-verify.dddddd"));
    envejecer(join(base, "flucastr-verify.dddddd"), 3 * HORA);

    const r = spawnSync(process.execPath, [CLI, base], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(join(base, "flucastr-verify.dddddd")), false);
  });

  test("kit run barre al iniciar: con base propia borra el viejo, conserva el reciente y sale 2 sin plan", () => {
    const base = crearBase();
    const raiz = crearBase();
    mkdirSync(join(base, "flucastr-verify.aaaaaa"));
    envejecer(join(base, "flucastr-verify.aaaaaa"), 3 * HORA);
    mkdirSync(join(base, "flucastr-verify.recien"));

    const r = spawnSync(
      process.execPath,
      [KIT_RUN, "no-existe.md", "--tool", "codex", "--root", raiz],
      { env: { ...process.env, TMPDIR: base }, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    );

    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /no existe el plan no-existe\.md/);
    assert.equal(existsSync(join(base, "flucastr-verify.aaaaaa")), false);
    assert.equal(existsSync(join(base, "flucastr-verify.recien")), true);
  });
});
