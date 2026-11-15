import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const resolver = path.join(raiz, "scripts/resolver.mjs");
const instalar = path.join(raiz, "instalar.sh");
const directorioTemporal = async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "permisos-contrato-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
};
const patronesAllow = (contenido) => contenido
  .split(/\n(?=prefix_rule\()/)
  .filter((bloque) => bloque.includes('decision = "allow"'))
  .map((bloque) => JSON.parse(bloque.match(/pattern = (\[[^\n]+\])/)[1]));

test("Codex elimina permisos amplios y omite capacidades de script o ambiguas", async (t) => {
  const dir = await directorioTemporal(t);
  const agents = path.join(dir, "AGENTS.md");
  const reglas = path.join(dir, "flucastr.rules");
  await writeFile(agents, [
    "Comprobación rápida: `npm test`",
    "Servicio: `docker compose up`",
    "Aceptación: `node verificacion/aceptacion.mjs`",
    "Comprobación rápida: `npm test && cat .env`",
  ].join("\n"));

  const ejecutar = (...args) => execFileSync(process.execPath, [resolver, ...args], { encoding: "utf8" }).trim();
  assert.equal(ejecutar("fijar-deny", "codex", reglas, agents), "fijado");
  const contenido = await readFile(reglas, "utf8");
  assert.match(contenido, /pattern = \["ls"\]/);
  assert.deepEqual(patronesAllow(contenido), [["ls"]]);
  assert.match(contenido, /pattern = \["git","commit"\][\s\S]*?decision = "forbidden"/);
  assert.match(contenido, /pattern = \["bash","-c"\][\s\S]*?decision = "forbidden"/);
  assert.equal(ejecutar("fijar-deny", "codex", reglas, agents), "ya-estaba");
});

test("instalar.sh entrega AGENTS.md al generador y reinstala sin duplicar ni ensanchar reglas", async (t) => {
  const dir = await directorioTemporal(t);
  const home = path.join(dir, "home");
  const proyecto = path.join(dir, "proyecto");
  const codexHome = path.join(home, ".codex");
  await mkdir(codexHome, { recursive: true });
  await mkdir(proyecto, { recursive: true });
  await writeFile(path.join(proyecto, "AGENTS.md"), "Comprobación rápida: `./verify`\nServicio: `docker compose up`\n");
  const env = { ...process.env, HOME: home, CODEX_HOME: codexHome, PATH: process.env.PATH };
  const ejecutar = () => execFileSync("bash", [instalar, "--solo", "codex", "--proyecto", proyecto], { cwd: raiz, env, encoding: "utf8" });

  ejecutar();
  const reglasPath = path.join(proyecto, ".codex/rules/flucastr.rules");
  const primero = await readFile(reglasPath, "utf8");
  ejecutar();
  const segundo = await readFile(reglasPath, "utf8");
  assert.equal(segundo, primero);
  assert.deepEqual(patronesAllow(segundo), [["ls"]]);
});
