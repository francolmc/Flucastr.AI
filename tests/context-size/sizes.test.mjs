// Tamaños del piso de contexto: SKILL.md de plan-change ≤ 6144 bytes; core/agents/planner.md ≤ 8192 bytes;
// AGENTS.md ≤ 6144 bytes; y cada referencia nombrada en SKILL.md o en planner.md existe en el kit.
// Solo lee archivos del kit; no ejecuta instaladores ni toca el HOME.

import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillDir = join(raiz, "core", "skills", "plan-change");
const skillMd = join(skillDir, "SKILL.md");
const plannerMd = join(raiz, "core", "agents", "planner.md");
const agentsMd = join(raiz, "AGENTS.md");
const LIMITE_SKILL_BYTES = 6144;
const LIMITE_PLANNER_BYTES = 8192;
const LIMITE_AGENTS_BYTES = 6144;
const LIMITE_TEMPLATE_BYTES = 3072;
const templateMd = join(skillDir, "references", "template.md");

describe("skill plan-change", () => {
  test("references/template.md pesa 3072 bytes o menos", () => {
    const tamano = statSync(templateMd).size;
    assert.ok(tamano <= LIMITE_TEMPLATE_BYTES, `template.md mide ${tamano} bytes; el límite es ${LIMITE_TEMPLATE_BYTES}`);
  });

  test("SKILL.md pesa 6144 bytes o menos", () => {
    const tamano = statSync(skillMd).size;
    assert.ok(tamano <= LIMITE_SKILL_BYTES, `SKILL.md mide ${tamano} bytes; el límite es ${LIMITE_SKILL_BYTES}`);
  });

  test("cada references/<archivo>.md nombrado en SKILL.md existe", () => {
    const texto = readFileSync(skillMd, "utf8");
    const nombrados = [...new Set([...texto.matchAll(/references\/([A-Za-z0-9_.-]+\.md)/g)].map((m) => m[1]))];
    assert.ok(nombrados.length > 0, "SKILL.md no nombra ninguna referencia");
    const faltan = nombrados.filter((nombre) => !existsSync(join(skillDir, "references", nombre)));
    assert.deepEqual(faltan, [], `referencias nombradas que no existen: ${faltan.join(", ")}`);
  });
});

describe("piso del planner y AGENTS.md", () => {
  test("planner.md pesa 8192 bytes o menos", () => {
    const tamano = statSync(plannerMd).size;
    assert.ok(tamano <= LIMITE_PLANNER_BYTES, `planner.md mide ${tamano} bytes; el límite es ${LIMITE_PLANNER_BYTES}`);
  });

  test("cada core/references/planner/<archivo>.md nombrado en planner.md existe", () => {
    // planner.md nombra las referencias como `archivo.md` en la línea que cita core/references/planner/.
    const lineas = readFileSync(plannerMd, "utf8").split("\n").filter((l) => l.includes("core/references/planner/"));
    const nombrados = [...new Set(lineas.flatMap((l) => [...l.matchAll(/`([A-Za-z0-9_.-]+\.md)`/g)].map((m) => m[1])))];
    assert.ok(nombrados.length > 0, "planner.md no nombra ninguna referencia");
    const dir = join(raiz, "core", "references", "planner");
    const faltan = nombrados.filter((nombre) => !existsSync(join(dir, nombre)));
    assert.deepEqual(faltan, [], `referencias del planner que no existen: ${faltan.join(", ")}`);
  });

  test("AGENTS.md pesa 6144 bytes o menos", () => {
    const tamano = statSync(agentsMd).size;
    assert.ok(tamano <= LIMITE_AGENTS_BYTES, `AGENTS.md mide ${tamano} bytes; el límite es ${LIMITE_AGENTS_BYTES}`);
  });
});

describe("contrato del builder", () => {
  const builderMd = join(raiz, "core", "agents", "builder.md");
  const executeSkillMd = join(raiz, "core", "skills", "execute-plan", "SKILL.md");
  const LIMITE_BUILDER_SKILL_BYTES = 13500;
  const sumaTamanos = (archivos) => archivos.reduce((total, archivo) => total + statSync(archivo).size, 0);
  const cumpleLimite = (total) => total <= LIMITE_BUILDER_SKILL_BYTES;

  test("builder.md y execute-plan/SKILL.md suman 13500 bytes o menos", () => {
    const total = sumaTamanos([builderMd, executeSkillMd]);
    assert.ok(cumpleLimite(total), `builder.md + execute-plan/SKILL.md suman ${total} bytes; el límite es ${LIMITE_BUILDER_SKILL_BYTES}`);
  });

  test("un total de 13501 bytes no cumple el límite", () => {
    assert.equal(cumpleLimite(LIMITE_BUILDER_SKILL_BYTES), true);
    assert.equal(cumpleLimite(LIMITE_BUILDER_SKILL_BYTES + 1), false);
  });
});
