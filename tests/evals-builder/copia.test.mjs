// Prueba de la copia desechable de un tramo (A2). Usa repos falsos creados en un temporal
// que se borra al salir, incluso si una prueba falla. No llama a Codex ni a la red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSyncSeguro } from "../../tools/spawn/sync-seguro.mjs";
import { fechaDeCommit, prepararCopia, seleccionarOraculo, ultimoAntesDe } from "../../evals/builder/lib/copia.mjs";

function git(cwd, args, env = {}) {
  const r = spawnSyncSeguro("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} falló: ${r.stderr}`);
  return r.stdout.trim();
}

function commitear(dir, archivos, fecha, mensaje = "cambio") {
  for (const [ruta, texto] of Object.entries(archivos)) {
    mkdirSync(dirname(join(dir, ruta)), { recursive: true });
    writeFileSync(join(dir, ruta), texto);
  }
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "--no-verify", "--quiet", "--allow-empty", "-m", mensaje], { GIT_AUTHOR_DATE: fecha, GIT_COMMITTER_DATE: fecha });
  return git(dir, ["rev-parse", "HEAD"]);
}

function repo(dir, archivos, fecha = "2024-01-01T10:00:00Z") {
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-b", "main", "--quiet"]);
  git(dir, ["config", "user.name", "prueba"]);
  git(dir, ["config", "user.email", "prueba@local.invalid"]);
  return commitear(dir, archivos, fecha, "base");
}

function sha256(texto) {
  return createHash("sha256").update(texto).digest("hex");
}

async function conTemporal(fn) {
  const raiz = mkdtempSync(join(tmpdir(), "copia-prueba-"));
  try {
    return await fn(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}

test("copia: un commit en main, rama feature/bench, sin historia de la fuente", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    const base = repo(fuente, { "src/a.js": "v1" });
    commitear(fuente, { "src/a.js": "v2" }, "2024-02-01T10:00:00Z");
    const copia = join(raiz, "copia");
    const r = prepararCopia({ destino: copia, cambio: "mi-cambio", repos: [{ fuente, commit: base }] });
    assert.equal(git(copia, ["rev-list", "--count", "main"]), "1");
    assert.equal(git(copia, ["branch", "--show-current"]), "feature/bench");
    assert.equal(readFileSync(join(copia, "src/a.js"), "utf8"), "v1");
    assert.equal(r.commits.length, 1);
    assert.equal(git(fuente, ["rev-list", "--count", "HEAD"]), "2");
    assert.equal(git(fuente, ["status", "--porcelain"]), "");
  }));

test("copia: repo hijo como subcarpeta excluida de la raíz; cada repo con un commit", () =>
  conTemporal((raiz) => {
    const padre = join(raiz, "padre");
    const r1 = repo(padre, { "README.md": "padre" }, "2024-01-01T10:00:00Z");
    const hijo = join(raiz, "hijo");
    const hijoBase = repo(hijo, { "app.js": "h1" }, "2024-02-01T10:00:00Z");
    commitear(hijo, { "app.js": "h2" }, "2024-03-01T10:00:00Z");
    const copia = join(raiz, "copia");
    prepararCopia({
      destino: copia,
      cambio: "mi-cambio",
      repos: [{ fuente: padre, commit: r1 }, { fuente: hijo, commit: hijoBase, subcarpeta: "Sub" }],
    });
    assert.equal(git(copia, ["status", "--porcelain"]), "");
    assert.ok(!git(copia, ["ls-files"]).split("\n").some((f) => f.startsWith("Sub/")));
    assert.equal(readFileSync(join(copia, "Sub/app.js"), "utf8"), "h1");
    assert.equal(git(join(copia, "Sub"), ["rev-list", "--count", "main"]), "1");
    assert.equal(git(join(copia, "Sub"), ["branch", "--show-current"]), "feature/bench");
    assert.equal(git(copia, ["rev-list", "--count", "main"]), "1");
  }));

test("copia: quita changes del cambio y secretos; conserva .env.example y lo ajeno", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    const base = repo(fuente, {
      "changes/mi-cambio/plan.md": "x",
      "changes/done/mi-cambio/plan.md": "y",
      "changes/otro/plan.md": "z",
      ".env": "SECRETO=1",
      ".env.example": "EJEMPLO=1",
      "certs/clave.pem": "k",
      "src/app.js": "ok",
    });
    const copia = join(raiz, "copia");
    prepararCopia({ destino: copia, cambio: "mi-cambio", repos: [{ fuente, commit: base }] });
    assert.ok(!existsSync(join(copia, "changes/mi-cambio")));
    assert.ok(!existsSync(join(copia, "changes/done/mi-cambio")));
    assert.ok(existsSync(join(copia, "changes/otro/plan.md")));
    assert.ok(!existsSync(join(copia, ".env")));
    assert.ok(existsSync(join(copia, ".env.example")));
    assert.ok(!existsSync(join(copia, "certs/clave.pem")));
    assert.equal(readFileSync(join(copia, "src/app.js"), "utf8"), "ok");
  }));

test("copia: superpone previos desde la referencia y devuelve hashes del oráculo", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    const base = repo(fuente, { "src/a.js": "v1", "src/b.js": "b1" });
    const ref = commitear(
      fuente,
      {
        "src/a.js": "v2",
        "src/b.js": "b2",
        "tests/a.test.js": "prueba-oraculo",
        "tests/tramo.test.js": "de-este-tramo",
        "docs/nota.md": "nota",
      },
      "2024-02-01T10:00:00Z",
    );
    const elegidos = seleccionarOraculo({ fuente, base, referencia: ref, excluir: ["tests/tramo.test.js"] });
    assert.deepEqual(elegidos, ["tests/a.test.js"]);
    const copia = join(raiz, "copia");
    const r = prepararCopia({
      destino: copia,
      cambio: "mi-cambio",
      repos: [{ fuente, commit: base }],
      superposicion: [
        { fuente, rev: ref, ruta: "src/a.js" },
        { fuente, rev: ref, ruta: "tests/a.test.js", oraculo: true },
      ],
    });
    assert.equal(readFileSync(join(copia, "src/a.js"), "utf8"), "v2");
    assert.equal(readFileSync(join(copia, "src/b.js"), "utf8"), "b1");
    assert.equal(readFileSync(join(copia, "tests/a.test.js"), "utf8"), "prueba-oraculo");
    assert.ok(!existsSync(join(copia, "tests/tramo.test.js")));
    assert.deepEqual(r.oraculo, [{ ruta: "tests/a.test.js", subcarpeta: "", sha256: sha256("prueba-oraculo") }]);
  }));

test("copia: el contrato recibido se escribe solo si existe en la base y el árbol queda limpio (A15, D-35)", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    const base = repo(fuente, { "core/skills/execute-plan/SKILL.md": "viejo\n", "app.txt": "a\n" });
    const origen = join(raiz, "SKILL-nuevo.md");
    writeFileSync(origen, "nuevo\n");
    const copia = join(raiz, "copia");
    prepararCopia({
      destino: copia,
      cambio: "mi-cambio",
      repos: [{ fuente, commit: base }],
      contrato: [
        { ruta: "core/skills/execute-plan/SKILL.md", origen },
        { ruta: "core/agents/builder.md", origen },
      ],
    });
    assert.equal(readFileSync(join(copia, "core/skills/execute-plan/SKILL.md"), "utf8"), "nuevo\n");
    assert.ok(!existsSync(join(copia, "core/agents/builder.md")), "un contrato que no existe en la base no se añade");
    assert.equal(git(copia, ["status", "--porcelain"]), "", "el contrato entra en el commit sintético");
  }));

test("copia: ante un error borra el destino parcial", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    repo(fuente, { "a.js": "1" });
    const copia = join(raiz, "copia-fallida");
    assert.throws(() => prepararCopia({ destino: copia, cambio: "x", repos: [{ fuente, commit: "0".repeat(40) }] }));
    assert.ok(!existsSync(copia));
  }));

test("copia: rechaza rutas que salen del repo y borra el destino", () =>
  conTemporal((raiz) => {
    const fuente = join(raiz, "fuente");
    const base = repo(fuente, { "a.js": "1" });
    const copia = join(raiz, "copia-ruta");
    assert.throws(() =>
      prepararCopia({
        destino: copia,
        cambio: "x",
        repos: [{ fuente, commit: base }],
        superposicion: [{ fuente, rev: base, ruta: "../fuera.js" }],
      }),
    );
    assert.ok(!existsSync(copia));
  }));

test("ultimoAntesDe: último commit de la raíz anterior a la fecha de la referencia", () =>
  conTemporal((raiz) => {
    const padre = join(raiz, "padre");
    const r1 = repo(padre, { "a.md": "1" }, "2024-01-01T10:00:00Z");
    commitear(padre, { "a.md": "2" }, "2024-05-01T10:00:00Z");
    const hijo = join(raiz, "hijo");
    const ref = repo(hijo, { "app.js": "h" }, "2024-03-01T10:00:00Z");
    const fecha = fechaDeCommit({ fuente: hijo, commit: ref });
    assert.equal(ultimoAntesDe({ fuente: padre, fecha }), r1);
  }));
