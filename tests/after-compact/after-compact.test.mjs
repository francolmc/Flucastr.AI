// Punteros tras compactar (A7 de changes/piso-planner/tramo-7.md): scripts/after-compact.mjs imprime hasta 20 líneas
// con punteros al cambio activo, nunca contenido de archivos, y siempre sale con 0. Proyectos temporales; no toca el HOME real.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(raiz, "scripts", "after-compact.mjs");
const creados = [];

function temporal() {
  const dir = mkdtempSync(join(tmpdir(), "after-compact-"));
  creados.push(dir);
  return dir;
}

after(() => {
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

function escribir(ruta, texto) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
}

function planDe({ status = "in progress", segment = "2", branch = "" } = {}) {
  const extra = branch ? `branch: ${branch}\n` : "";
  return `---\nstatus: ${status}\n${extra}segment: ${segment}\n---\n# Demo\n\nCuerpo del plan.\n`;
}

const NOTES = [
  "# Notas",
  "",
  "Estado de la sesión.",
  "",
  "SECRETO-MARCADOR-123 en el cuerpo, nunca debe salir.",
  "",
  "## Next action",
  "Seguir con el tramo 2.",
].join("\n");

// Ejecuta el script con el JSON dado por stdin (sin pipe: spawnSyncSeguro usa un archivo temporal).
function correr(cwd, entrada) {
  const input = entrada === undefined ? "" : typeof entrada === "string" ? entrada : JSON.stringify(entrada);
  return spawnSyncSeguro(process.execPath, [script], { cwd, input, encoding: "utf8", timeout: 10000 });
}

describe("after-compact: punteros tras compactar", () => {
  test("sin carpeta changes/ no imprime nada y sale con 0", () => {
    const dir = temporal();
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  });

  test("compactar con un cambio con notas imprime los punteros", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "2" }));
    escribir(join(dir, "changes", "demo", "notes.md"), NOTES);
    escribir(join(dir, "changes", "demo", "tramo-2.md"), "# Tramo 2\n");
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    const lineas = r.stdout.split("\n").filter(Boolean);
    assert.ok(lineas.length <= 20, `más de 20 líneas: ${lineas.length}`);
    assert.ok(lineas.includes("Notes: changes/demo/notes.md"), r.stdout);
    assert.ok(lineas.includes("Plan: changes/demo/plan.md (status: in progress)"), r.stdout);
    assert.ok(lineas.includes("Segment: 2 (changes/demo/tramo-2.md)"), r.stdout);
    assert.ok(lineas.includes('Next action: changes/demo/notes.md:7 ("## Next action")'), r.stdout);
    assert.ok(!r.stdout.includes("SECRETO-MARCADOR-123"), "salió contenido de notes.md");
  });

  test("source startup no imprime nada", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe());
    const r = correr(dir, { source: "startup", cwd: dir });
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  });

  test("JSON inválido no bloquea: sale con 0", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe());
    const r = correr(dir, "{no es json");
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes("Plan: changes/demo/plan.md"), r.stdout);
  });

  test("con dos cambios elige el de la rama actual y cuenta el otro", () => {
    const dir = temporal();
    spawnSyncSeguro("git", ["init", "-q"], { cwd: dir });
    spawnSyncSeguro("git", ["symbolic-ref", "HEAD", "refs/heads/feature/demo"], { cwd: dir });
    escribir(join(dir, "changes", "otro", "plan.md"), planDe({ branch: "feature/otra" }));
    escribir(join(dir, "changes", "actual", "plan.md"), planDe({ branch: "feature/demo", segment: "1" }));
    escribir(join(dir, "changes", "done", "viejo", "plan.md"), planDe({ status: "done", branch: "feature/demo" }));
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes("Plan: changes/actual/plan.md"), r.stdout);
    assert.ok(r.stdout.includes("Other active changes: 1"), r.stdout);
    assert.ok(!r.stdout.includes("changes/done"), r.stdout);
  });

  test("carpeta con nombre inválido se omite", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "Mala Carpeta", "plan.md"), planDe());
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(!r.stdout.includes("Mala Carpeta"), r.stdout);
  });

  test("estado fuera del conjunto permitido se omite del puntero", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ status: "rm -rf /" }));
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes("Plan: changes/demo/plan.md"), r.stdout);
    assert.ok(!r.stdout.includes("rm -rf"), r.stdout);
  });

  test("segmento no numérico se omite y sin notas ni próxima acción se dice", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "dos" }));
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    const lineas = r.stdout.split("\n");
    assert.ok(lineas.includes("Notes: none"), r.stdout);
    assert.ok(lineas.includes("Next action: not recorded"), r.stdout);
    assert.ok(!lineas.some((l) => l.startsWith("Segment:")), r.stdout);
  });

  test("un marcador secreto en notes y plan nunca sale", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe().replace("Cuerpo del plan.", "SECRETO-MARCADOR-123"));
    escribir(join(dir, "changes", "demo", "notes.md"), NOTES);
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(!r.stdout.includes("SECRETO-MARCADOR-123"), r.stdout);
  });

  test("con «Próxima acción» antigua antes de «Next action» apunta a la última cabecera", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "2" }));
    escribir(
      join(dir, "changes", "demo", "notes.md"),
      ["# Notas", "", "## Próxima acción", "Vieja.", "", "## Next action", "Vigente."].join("\n"),
    );
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes('Next action: changes/demo/notes.md:6 ("## Next action")'), r.stdout);
    assert.ok(!r.stdout.includes("notes.md:3"), r.stdout);
  });

  test("con «Next action» antes de «Próxima acción» apunta a la última cabecera", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "2" }));
    escribir(
      join(dir, "changes", "demo", "notes.md"),
      ["# Notas", "", "## Next action", "Vigente.", "", "## Próxima acción", "Vieja."].join("\n"),
    );
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes('Next action: changes/demo/notes.md:6 ("## Próxima acción")'), r.stdout);
    assert.ok(!r.stdout.includes("notes.md:3"), r.stdout);
  });

  test("siempre sale con 0 aunque la carpeta changes/ no se pueda leer", () => {
    const dir = temporal();
    escribir(join(dir, "changes"), "no es carpeta");
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  });

  test("con decisions.md imprime su puntero justo tras el de notas, sin su contenido", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "2" }));
    escribir(join(dir, "changes", "demo", "notes.md"), NOTES);
    escribir(join(dir, "changes", "demo", "decisions.md"), "| D-01 | SECRETO-DECISION-456 |\n");
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    const lineas = r.stdout.split("\n");
    const iNotas = lineas.indexOf("Notes: changes/demo/notes.md");
    assert.ok(iNotas >= 0, r.stdout);
    assert.equal(lineas[iNotas + 1], "Decisions: changes/demo/decisions.md", r.stdout);
    assert.ok(!r.stdout.includes("SECRETO-DECISION-456"), "salió contenido de decisions.md");
  });

  test("sin decisions.md no imprime la línea Decisions", () => {
    const dir = temporal();
    escribir(join(dir, "changes", "demo", "plan.md"), planDe({ segment: "2" }));
    escribir(join(dir, "changes", "demo", "notes.md"), NOTES);
    const r = correr(dir, { source: "compact", cwd: dir });
    assert.equal(r.status, 0);
    assert.ok(!r.stdout.includes("Decisions:"), r.stdout);
    assert.ok(r.stdout.includes("Notes: changes/demo/notes.md"), r.stdout);
  });
});
