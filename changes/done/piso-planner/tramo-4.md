# Tramo 4

## Steps

### Segment 4 — Story: revisión y planificación completas bajo demanda
As planner I want the full review and planning text on demand so that no rule is lost.
Dependencies: Segment 3 — carpeta `core/references/planner/`.
Contracts to keep: texto de revisión, gates y clasificación igual al original; `planner.md` no cambia.
Paths likely to change: `core/references/planner/review-extras.md`, `core/references/planner/planning.md`.
Concrete example of the expected result: `grep -c "kit-verificado.mjs estado" core/references/planner/review-extras.md` da 1 o más.
Scope: dos referencias nuevas.
Files: core/references/planner/review-extras.md, core/references/planner/planning.md
WHEN el planner revisa o planifica un caso dudoso THEN lee el texto completo en una referencia (A4)
Acceptance:
- A4: las dos referencias son copia exacta de los borradores; check with `cmp`; expect exit 0.
TODO:
- [x] Copiar con `cp` el borrador a `core/references/planner/review-extras.md` (A4). Check: `cmp changes/piso-planner/borradores/references/planner/review-extras.md core/references/planner/review-extras.md`; expect exit 0.
- [x] Copiar con `cp` el borrador a `core/references/planner/planning.md` (A4). Check: `cmp changes/piso-planner/borradores/references/planner/planning.md core/references/planner/planning.md`; expect exit 0.
Segment verification: `cmp changes/piso-planner/borradores/references/planner/review-extras.md core/references/planner/review-extras.md && cmp changes/piso-planner/borradores/references/planner/planning.md core/references/planner/planning.md` — level 1; exit 0; covers A4.
Handoff: ejemplo: `cp changes/piso-planner/borradores/references/planner/planning.md core/references/planner/planning.md`. No editar el texto.
