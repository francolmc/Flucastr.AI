// Prueba de la variante de un tramo (A5). Usa un kit falso y una carpeta de Codex falsa en un
// temporal que se borra al salir, incluso si una prueba falla. No llama a Codex ni a la red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { ErrorVariante, leerVariante, prepararVariante } from "../../evals/builder/lib/variante.mjs";

const RAIZ_BANCO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = join(RAIZ_BANCO, "evals", "builder", "variantes", "base.json");

const MODELOS = {
  levels: ["high", "medium", "low"],
  efforts: ["low", "medium", "high", "xhigh", "max"],
  agents: {
    builder: { level: "low", effort: "high", compact_at: { "claude-code": 167000, codex: 150000 } },
    planner: { level: "medium", effort: "medium", compact_at: { "claude-code": 267000, codex: 200000 } },
  },
};

function escribir(ruta, texto) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
}

function json(ruta, objeto) {
  escribir(ruta, JSON.stringify(objeto, null, 2));
}

// Kit falso: solo lo que la variante copia (core/, scripts/, tools/, adapters/, models.json).
function kitFalso(raiz) {
  escribir(join(raiz, "adapters/codex/adapter.mjs"), "adapter codex");
  escribir(join(raiz, "core/agents/builder.md"), "builder base");
  escribir(join(raiz, "core/agents/planner.md"), "planner base");
  escribir(join(raiz, "core/skills/execute-plan/SKILL.md"), "execute-plan base");
  escribir(join(raiz, "core/skills/plan-change/SKILL.md"), "plan-change base");
  escribir(join(raiz, "scripts/kit-run.mjs"), "// kit-run");
  escribir(join(raiz, "tools/run/prompts.mjs"), "// prompts");
  json(join(raiz, "models.json"), MODELOS);
  return raiz;
}

// Carpeta de Codex falsa: un secreto que no debe leerse ni aparecer en el resultado.
function codexFalso(dir) {
  escribir(join(dir, "auth.json"), "CLAVE-FALSA-NO-LEER");
  escribir(join(dir, "sessions/s1.jsonl"), "{}");
  return dir;
}

// Variante en `vdir/<nombre>.json`; sus contratos viven en `vdir/<nombre>/` (rutas relativas a la variante).
function variante(vdir, nombre, cuerpo = {}) {
  const ruta = join(vdir, `${nombre}.json`);
  json(ruta, { nombre, ...cuerpo });
  return ruta;
}

function conTemporal(fn) {
  const raiz = mkdtempSync(join(tmpdir(), "variante-prueba-"));
  try {
    return fn(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}

test("variante: aplica contrato, nivel, esfuerzo y ventana en la copia; models.json del repo igual (A5)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const vdir = join(raiz, "variantes");
    escribir(join(vdir, "v/builder.md"), "builder v");
    escribir(join(vdir, "v/SKILL.md"), "execute-plan v");
    const ruta = variante(vdir, "v", {
      contrato: { builder: "v/builder.md", execute_plan: "v/SKILL.md" },
      nivel: "medium",
      esfuerzo: "medium",
      ventana: 120000,
    });
    const p = prepararVariante({ variante: ruta, destino: join(raiz, "copia"), raiz: kit, codexReal: codex });
    try {
      assert.equal(readFileSync(join(p.destino, "core/agents/builder.md"), "utf8"), "builder v");
      assert.equal(readFileSync(join(p.destino, "core/skills/execute-plan/SKILL.md"), "utf8"), "execute-plan v");
      const modelos = JSON.parse(readFileSync(join(p.destino, "models.json"), "utf8"));
      assert.deepEqual(modelos.agents.builder, {
        level: "medium",
        effort: "medium",
        compact_at: { "claude-code": 167000, codex: 120000 },
      });
      assert.deepEqual(modelos.agents.planner, MODELOS.agents.planner);
      assert.deepEqual(JSON.parse(readFileSync(join(kit, "models.json"), "utf8")), MODELOS);
      assert.equal(p.env.FLUCASTR_MODELOS, join(p.destino, "models.json"));
      assert.equal(readFileSync(join(kit, "core/agents/builder.md"), "utf8"), "builder base");
    } finally {
      p.limpiar();
    }
  }));

test("variante: HOME temporal enlaza .agents/skills a la copia y .codex a la carpeta real (A5)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const ruta = variante(join(raiz, "variantes"), "sin-cambios");
    const p = prepararVariante({ variante: ruta, destino: join(raiz, "copia"), raiz: kit, codexReal: codex });
    try {
      assert.equal(p.env.HOME, p.home);
      assert.ok(lstatSync(join(p.home, ".agents/skills")).isDirectory());
      assert.equal(readlinkSync(join(p.home, ".agents/skills/execute-plan")), join(p.destino, "core/skills/execute-plan"));
      assert.equal(readlinkSync(join(p.home, ".agents/skills/plan-change")), join(p.destino, "core/skills/plan-change"));
      assert.equal(readlinkSync(join(p.home, ".codex")), codex);
    } finally {
      p.limpiar();
    }
  }));

test("variante: huellas separadas; cambiar solo el contrato no cambia la del kit (A5)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const vdir = join(raiz, "variantes");
    escribir(join(vdir, "a/builder.md"), "builder a");
    escribir(join(vdir, "b/builder.md"), "builder b");
    const a = prepararVariante({
      variante: variante(vdir, "a", { contrato: { builder: "a/builder.md" } }),
      destino: join(raiz, "copia-a"),
      raiz: kit,
      codexReal: codex,
    });
    const b = prepararVariante({
      variante: variante(vdir, "b", { contrato: { builder: "b/builder.md" } }),
      destino: join(raiz, "copia-b"),
      raiz: kit,
      codexReal: codex,
    });
    try {
      assert.equal(a.huellas.kit, b.huellas.kit);
      assert.notEqual(a.huellas.contrato, b.huellas.contrato);
      assert.match(a.huellas.kit, /^[0-9a-f]{64}$/);
      assert.match(a.huellas.contrato, /^[0-9a-f]{64}$/);
    } finally {
      a.limpiar();
      b.limpiar();
    }
  }));

test("variante: copia adapters/; models.json tiene huella modelos aparte y el kit no cambia (A5, D-26)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const vdir = join(raiz, "variantes");
    const base = prepararVariante({ variante: variante(vdir, "sin-cambios"), destino: join(raiz, "copia-base"), raiz: kit, codexReal: codex });
    const nivel = prepararVariante({ variante: variante(vdir, "nivel", { nivel: "high" }), destino: join(raiz, "copia-nivel"), raiz: kit, codexReal: codex });
    try {
      assert.equal(readFileSync(join(base.destino, "adapters/codex/adapter.mjs"), "utf8"), "adapter codex");
      assert.equal(base.huellas.kit, nivel.huellas.kit);
      assert.match(base.huellas.modelos, /^[0-9a-f]{64}$/);
      assert.match(nivel.huellas.modelos, /^[0-9a-f]{64}$/);
      assert.notEqual(base.huellas.modelos, nivel.huellas.modelos);
    } finally {
      base.limpiar();
      nivel.limpiar();
    }
  }));

test("variante: contrato nulo, igual al base, o valores inválidos fallan con 2 y no dejan destino (A5)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const vdir = join(raiz, "variantes");
    escribir(join(vdir, "igual/builder.md"), "builder base");
    const casos = {
      "contrato nulo": { contrato: null },
      "contrato igual al base": { contrato: { builder: "igual/builder.md" } },
      "nivel fuera de levels": { nivel: "ultra" },
      "esfuerzo fuera de efforts": { esfuerzo: "extremo" },
      "ventana no entera": { ventana: 0 },
      "ruta que sale de la variante": { contrato: { builder: "../../kit/core/agents/builder.md" } },
    };
    for (const [caso, cuerpo] of Object.entries(casos)) {
      const destino = join(raiz, `copia-${caso.replace(/\W+/g, "-")}`);
      const ruta = variante(vdir, caso.replace(/\W+/g, "-"), cuerpo);
      assert.throws(
        () => prepararVariante({ variante: ruta, destino, raiz: kit, codexReal: codex }),
        (e) => e instanceof ErrorVariante && e.codigo === 2,
        caso,
      );
      assert.equal(existsSync(destino), false, caso);
    }
  }));

test("variante: al limpiar, el destino de los enlaces queda intacto y no se lee la carpeta de Codex (A5)", () =>
  conTemporal((raiz) => {
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const ruta = variante(join(raiz, "variantes"), "limpieza");
    const p = prepararVariante({ variante: ruta, destino: join(raiz, "copia"), raiz: kit, codexReal: codex });
    assert.equal(JSON.stringify(p).includes("CLAVE-FALSA-NO-LEER"), false);
    p.limpiar();
    p.limpiar();
    assert.equal(existsSync(p.home), false);
    assert.equal(existsSync(p.destino), false);
    assert.equal(readFileSync(join(codex, "auth.json"), "utf8"), "CLAVE-FALSA-NO-LEER");
    assert.equal(readFileSync(join(codex, "sessions/s1.jsonl"), "utf8"), "{}");
    assert.equal(readFileSync(join(kit, "core/skills/execute-plan/SKILL.md"), "utf8"), "execute-plan base");
  }));

test("variante base: solo nombre; la copia queda con los mismos valores del kit (A5)", () =>
  conTemporal((raiz) => {
    const leida = leerVariante(BASE);
    assert.equal(leida.nombre, "base");
    assert.equal(leida.contrato, null);
    assert.equal(leida.nivel, undefined);
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(BASE, "utf8"))), ["nombre"]);
    const kit = kitFalso(join(raiz, "kit"));
    const codex = codexFalso(join(raiz, "codex"));
    const p = prepararVariante({ variante: BASE, destino: join(raiz, "copia"), raiz: kit, codexReal: codex });
    try {
      assert.deepEqual(JSON.parse(readFileSync(join(p.destino, "models.json"), "utf8")), MODELOS);
      assert.equal(readFileSync(join(p.destino, "core/agents/builder.md"), "utf8"), "builder base");
    } finally {
      p.limpiar();
    }
  }));
