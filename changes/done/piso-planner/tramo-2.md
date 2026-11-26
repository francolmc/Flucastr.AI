# Tramo 2

## Steps

### Segment 2 — Story: la skill plan-change pesa 6144 bytes o menos
As planner I want a short core skill so that its re-attachment costs less after compaction.
Dependencies: Segment 1 — las referencias que el núcleo nombra.
Contracts to keep: frases que exigen `tests/builder-contract.mjs` y `tools/verify/`; frontmatter `name` y `description`.
Paths likely to change: `core/skills/plan-change/SKILL.md`; `tests/builder-contract.mjs` lo usa y no se mueve ni se edita.
Concrete example of the expected result: `wc -c core/skills/plan-change/SKILL.md` da 4366.
Scope: referencia de verificación, núcleo y prueba de tamaño.
Files: core/skills/plan-change/references/verification.md, core/skills/plan-change/SKILL.md, tests/context-size/sizes.test.mjs
WHEN el planner carga la skill THEN recibe plantilla, regla de tramos y lista previa a aprobar en 6144 bytes o menos (A2)
Acceptance:
- A2: núcleo ≤ 6144 bytes, cada `references/*.md` nombrado existe y el contrato sigue; check with the segment verification; expect exit 0.
TODO:
- [x] Copiar con `cp` el borrador a `core/skills/plan-change/references/verification.md` (A2). Check: `cmp changes/piso-planner/borradores/references/verification.md core/skills/plan-change/references/verification.md`; expect exit 0.
- [x] Crear `tests/context-size/sizes.test.mjs`: `SKILL.md` ≤ 6144 bytes y existencia de cada referencia nombrada (A2). Check: `node --test tests/context-size/sizes.test.mjs`; expect rojo por tamaño.
- [x] Reemplazar `core/skills/plan-change/SKILL.md` con `cp` del borrador `plan-change.md` (A2). Check: `node --test tests/context-size/sizes.test.mjs`; expect pass.
Segment verification: `node --test tests/context-size/sizes.test.mjs && node tests/builder-contract.mjs && cmp changes/piso-planner/borradores/plan-change.md core/skills/plan-change/SKILL.md` — level 1; exit 0; covers A2.
Handoff: borrador en `changes/piso-planner/borradores/plan-change.md`. La prueba usa `node:test` y rutas relativas a la raíz del kit; ejemplo: `statSync(ruta).size <= 6144`. Las referencias se nombran como `references/<archivo>.md`.
