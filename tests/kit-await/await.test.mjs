import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { esperar, INTERVALO_MS, LIMITE_POR_DEFECTO_MS, parseArgs } from "../../scripts/kit-await.mjs";

const PLAN = "changes/demo/plan.md";
const crear = () => {
  const raiz = mkdtempSync(join(tmpdir(), "kit-await-test-"));
  mkdirSync(join(raiz, "changes/demo"), { recursive: true });
  writeFileSync(join(raiz, PLAN), "---\nstatus: in progress\nsegment: 2\n---\n# Demo\n");
  return raiz;
};
const correr = async (raiz, desde) => {
  const lineas = [];
  const original = console.log;
  console.log = (linea) => lineas.push(linea);
  try {
    const status = await esperar(parseArgs([PLAN, "--desde", String(desde), "--raiz", raiz, "--limite", "0.03"]));
    return { status, stdout: lineas.join("\n") };
  } finally {
    console.log = original;
  }
};
const linea = (resultado) => {
  assert.equal(resultado.stdout.trim().split("\n").length, 1, resultado.stdout);
  return resultado.stdout.trim();
};
const registro = (plan, tramo, resultado, fecha, extra = {}) => ({
  plan, tramo, fecha: "2026-11-27T12:00:00.000Z", herramienta: "codex",
  terminacion: { fecha, resultado, ...extra },
});

test("A2: conserva el sondeo de 5 s y el límite predeterminado de 570 s", () => {
  assert.equal(INTERVALO_MS, 5000);
  assert.equal(LIMITE_POR_DEFECTO_MS, 570_000);
});

test("A2: --desde es opcional y --hasta conserva el alias del límite", () => {
  const antes = Date.now();
  const op = parseArgs([PLAN, "--hasta", "12"]);
  assert.ok(op.desde >= antes);
  assert.equal(op.limite, 12_000);
  assert.equal(parseArgs([PLAN, "--limite", "12"]).limite, 12_000);
});

test("A2: elige solo plan, tramo y término estrictamente posterior a --desde", async () => {
  const raiz = crear();
  try {
    const desde = Date.now() - 5000;
    const ruta = join(raiz, "changes/demo/runs.jsonl");
    appendFileSync(ruta, [
      registro("changes/otro/plan.md", 2, "DONE", new Date().toISOString()),
      registro(PLAN, 1, "DONE", new Date().toISOString()),
      registro(PLAN, 2, "PAUSED", new Date(desde).toISOString(), { motivo: "verify" }),
      registro(PLAN, 2, "DONE", new Date(desde + 1).toISOString()),
    ].map(JSON.stringify).join("\n") + "\n");
    const r = await correr(raiz, desde);
    assert.equal(r.status, 0, r.stderr);
    assert.match(linea(r), /^DONE: plan=changes\/demo\/plan\.md; segment=2; verify=pasa$/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test("A2: mapea PAUSED, INVALIDO e INTERRUMPIDO a salida 1", async () => {
  for (const resultado of ["PAUSED", "INVALIDO", "INTERRUMPIDO"]) {
    const raiz = crear();
    try {
      const desde = Date.now() - 1000;
      const t = new Date().toISOString();
      const extra = resultado === "PAUSED"
        ? { motivo: "verify", hecho: "1/2", siguiente: "paso dos", no_intentado: "falla de verify" }
        : { detalle: "salida incompleta" };
      writeFileSync(join(raiz, "changes/demo/runs.jsonl"), JSON.stringify(registro(PLAN, 2, resultado, t, extra)) + "\n");
      const r = await correr(raiz, desde);
      assert.equal(r.status, 1, `${resultado}: ${r.stderr}`);
      assert.match(linea(r), new RegExp(`^${resultado}:`));
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  }
});

test("A2: devuelve EN_CURSO al vencer el límite", async () => {
  const raiz = crear();
  try {
    const r = await correr(raiz, Date.now() - 1000);
    assert.equal(r.status, 3, r.stderr);
    assert.match(linea(r), /^EN_CURSO: plan=changes\/demo\/plan\.md; segment=2;/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test("A2: aplica evaluarPegado al progreso y devuelve pegado sin terminar ningún proceso", async () => {
  const raiz = crear();
  try {
    const desde = Date.now() - 10 * 60 * 1000;
    const t = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const eventos = Array.from({ length: 10 }, (_, n) => ({
      t, seg: 2, tipo: "comando_iniciado", o: "automatico", id: String(n), cmd: "sleep 1",
    }));
    writeFileSync(join(raiz, "changes/demo/progress.jsonl"), eventos.map(JSON.stringify).join("\n") + "\n");
    const r = await correr(raiz, desde);
    assert.equal(r.status, 4, r.stderr);
    assert.match(linea(r), /^PEGADO: plan=changes\/demo\/plan\.md; segment=2; patron=sondeos;/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});
