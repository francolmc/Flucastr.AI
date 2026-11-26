// Compactación de Codex en kit run (caso A8 de changes/ventana-por-agente/plan.md): el rol BUILDER lleva
// model_auto_compact_token_limit de compactar-codex builder; el revisor, el de reviewer; sin valor no se añade nada;
// KIT_RUN_<ROL> no cambia. Usa models.json en copias temporales y el resolver real; no toca el HOME real.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESOLVER = join(raiz, "scripts", "resolver.mjs");
const FLAG = "model_auto_compact_token_limit=";
const creados = [];
const claves = ["FLUCASTR_MODELOS", "KIT_RUN_BUILDER", "KIT_RUN_REVIEWER"];
const previo = Object.fromEntries(claves.map(k => [k, process.env[k]]));

after(() => {
  for (const k of claves) {
    if (previo[k] === undefined) delete process.env[k];
    else process.env[k] = previo[k];
  }
  for (const dir of creados) rmSync(dir, { recursive: true, force: true });
});

// Copia de models.json del kit con cambios opcionales; devuelve la ruta. Se usa como FLUCASTR_MODELOS.
function modelosCon(cambios = () => {}) {
  const m = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  cambios(m);
  const dir = mkdtempSync(join(tmpdir(), "kit-run-modelos-"));
  creados.push(dir);
  const archivo = join(dir, "models.json");
  writeFileSync(archivo, JSON.stringify(m));
  return archivo;
}

// Carga los módulos reales con el models.json indicado y sin variables KIT_RUN_<ROL> heredadas.
async function cargar(modelos, sobre = {}) {
  for (const k of claves) delete process.env[k];
  process.env.FLUCASTR_MODELOS = modelos;
  Object.assign(process.env, sobre);
  const { crearResolutoresPerfil } = await import(join(raiz, "tools", "run", "profiles.mjs") + `?v=${Math.random()}`);
  const { crearComando } = await import(join(raiz, "tools", "run", "commands.mjs") + `?v=${Math.random()}`);
  const resolutores = crearResolutoresPerfil(raiz);
  const comando = crearComando({ ...resolutores, resolverCompactacion: resolutores.resolverCompactacion });
  const sinCompactacion = crearComando({ resolverAgente: resolutores.resolverAgente, resolverRevisorKit: resolutores.resolverRevisorKit });
  return { resolutores, comando, sinCompactacion };
}

// Valor de compactar-codex para un agente con el resolver real (la misma fuente que usa kit run).
function compactarCodexReal(agente, modelos) {
  const r = spawnSync("node", [RESOLVER, "compactar-codex", agente], {
    cwd: raiz,
    env: { ...process.env, FLUCASTR_MODELOS: modelos },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function flagDe(args) {
  const idx = args.findIndex(a => a.startsWith(FLAG));
  return idx === -1 ? undefined : args[idx];
}

describe("kit run: umbral de compactación de Codex por rol (A8)", () => {
  test("con los valores reales de models.json, el builder y el revisor llevan su propio umbral", async () => {
    const modelos = modelosCon();
    const { comando } = await cargar(modelos);
    const builder = compactarCodexReal("builder", modelos);
    const revisor = compactarCodexReal("reviewer", modelos);
    assert.match(builder, /^\d+$/, `compactar-codex builder devolvió «${builder}»`);
    assert.match(revisor, /^\d+$/, `compactar-codex reviewer devolvió «${revisor}»`);

    const b = comando("BUILDER", "codex", raiz, "");
    assert.equal(b.exe, "codex");
    assert.equal(flagDe(b.args), `${FLAG}${builder}`);
    assert.equal(b.args[b.args.indexOf(`${FLAG}${builder}`) - 1], "-c");

    const r = comando("REVIEWER", "codex", raiz, "/tmp/esquema.json");
    assert.equal(flagDe(r.args), `${FLAG}${revisor}`);
    assert.equal(r.args[r.args.indexOf(`${FLAG}${revisor}`) - 1], "-c");
  });

  test("con valores conocidos (builder 150000, reviewer 200000), cada rol recibe el suyo", async () => {
    const modelos = modelosCon(m => {
      m.agents.builder.compact_at = 150000;
      m.kit_run = { reviewer: { ...(m.kit_run?.reviewer ?? {}), compact_at: 200000 } };
    });
    const { comando } = await cargar(modelos);
    assert.equal(flagDe(comando("BUILDER", "codex", raiz, "").args), `${FLAG}150000`);
    assert.equal(flagDe(comando("REVIEWER", "codex", raiz, "/tmp/esquema.json").args), `${FLAG}200000`);
  });

  test("sin valor de compactación no se añade ninguna bandera (resolutor sustituto vacío)", async () => {
    const { resolutores, sinCompactacion } = await cargar(modelosCon());
    const { crearComando } = await import(join(raiz, "tools", "run", "commands.mjs") + `?v=${Math.random()}`);
    const vacio = crearComando({ ...resolutores, resolverCompactacion: () => "" });
    const sin = sinCompactacion("BUILDER", "codex", raiz, "");
    assert.equal(flagDe(sin.args), undefined);
    // Con el resolutor sustituto `() => ""` los argumentos son exactamente los de hoy.
    assert.deepEqual(vacio("BUILDER", "codex", raiz, "").args, sin.args);
    assert.deepEqual(vacio("REVIEWER", "codex", raiz, "/tmp/esquema.json").args, sinCompactacion("REVIEWER", "codex", raiz, "/tmp/esquema.json").args);
  });

  test("un valor vacío o ausente en el resolutor no añade la bandera para ningún rol", async () => {
    const { resolutores } = await cargar(modelosCon());
    const { crearComando } = await import(join(raiz, "tools", "run", "commands.mjs") + `?v=${Math.random()}`);
    for (const valor of ["", undefined]) {
      const comando = crearComando({ ...resolutores, resolverCompactacion: valor === undefined ? undefined : () => valor });
      assert.equal(flagDe(comando("BUILDER", "codex", raiz, "").args), undefined, `valor ${String(valor)}`);
      assert.equal(flagDe(comando("REVIEWER", "codex", raiz, "/tmp/esquema.json").args), undefined, `valor ${String(valor)}`);
    }
  });

  test("el resolutor recibe el agente del rol: builder para BUILDER y reviewer para el revisor", async () => {
    const { crearComando } = await import(join(raiz, "tools", "run", "commands.mjs") + `?v=${Math.random()}`);
    const pedidos = [];
    const comando = crearComando({
      resolverAgente: () => "modelo-x",
      resolverRevisorKit: () => ({ modelo: "rev", esfuerzo: "" }),
      resolverCompactacion: agente => { pedidos.push(agente); return "1000"; },
    });
    comando("BUILDER", "codex", raiz, "");
    comando("REVIEWER", "codex", raiz, "/tmp/esquema.json");
    assert.deepEqual(pedidos, ["builder", "reviewer"]);
  });

  test("con KIT_RUN_BUILDER el comando es el ejecutable indicado y no lleva la bandera", async () => {
    const { crearComando } = await import(join(raiz, "tools", "run", "commands.mjs") + `?v=${Math.random()}`);
    process.env.KIT_RUN_BUILDER = "/bin/true";
    const comando = crearComando({
      resolverAgente: () => "modelo-x",
      resolverRevisorKit: () => ({ modelo: "rev", esfuerzo: "" }),
      resolverCompactacion: () => "150000",
    });
    const cmd = comando("BUILDER", "codex", raiz, "");
    delete process.env.KIT_RUN_BUILDER;
    assert.equal(cmd.exe, "/bin/true");
    assert.equal(flagDe(cmd.args), undefined);
    assert.deepEqual(cmd.args, ["exec", "--sandbox", "workspace-write", "-c", 'approval_policy="on-request"', "-C", raiz, "-"]);
  });

  test("kit-run.mjs conecta resolverCompactacion al crear el comando", () => {
    // Comprobación de cableado: el entrypoint pasa el resolutor a crearComando (no hay API para invocarlo sin correr kit run).
    const fuente = readFileSync(join(raiz, "scripts", "kit-run.mjs"), "utf8");
    assert.match(fuente, /crearComando\(\{ resolverAgente, resolverRevisorKit, resolverCompactacion \}\)/);
  });
});
