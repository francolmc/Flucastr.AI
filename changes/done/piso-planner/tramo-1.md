# Tramo 1

## Steps

### Segment 1 — Story: reglas de plan-change disponibles bajo demanda
As planner I want the detail in reference files so that the core skill can shrink.
Dependencies: ninguna.
Contracts to keep: texto de las reglas idéntico al original; `SKILL.md` no cambia en este tramo.
Paths likely to change: `core/skills/plan-change/references/template.md`, `core/skills/plan-change/references/rules.md`, `core/skills/plan-change/references/segments.md`.
Concrete example of the expected result: `cmp` entre cada borrador y su destino no imprime nada.
Scope: las tres referencias nuevas.
Files: core/skills/plan-change/references/template.md, core/skills/plan-change/references/rules.md, core/skills/plan-change/references/segments.md
WHEN se instala la skill THEN las tres referencias viajan con ella (A1)
Acceptance:
- A1: las tres referencias son copia exacta de los borradores; check with `cmp`; expect exit 0.
TODO:
- [x] Copiar con `cp` el borrador a `core/skills/plan-change/references/template.md` (A1). Check: `cmp changes/piso-planner/borradores/references/template.md core/skills/plan-change/references/template.md`; expect exit 0.
- [x] Copiar con `cp` el borrador a `core/skills/plan-change/references/rules.md` (A1). Check: `cmp changes/piso-planner/borradores/references/rules.md core/skills/plan-change/references/rules.md`; expect exit 0.
- [x] Copiar con `cp` el borrador a `core/skills/plan-change/references/segments.md` (A1). Check: `cmp changes/piso-planner/borradores/references/segments.md core/skills/plan-change/references/segments.md`; expect exit 0.
Segment verification: `cmp changes/piso-planner/borradores/references/template.md core/skills/plan-change/references/template.md && cmp changes/piso-planner/borradores/references/rules.md core/skills/plan-change/references/rules.md && cmp changes/piso-planner/borradores/references/segments.md core/skills/plan-change/references/segments.md` — level 1; exit 0; covers A1.
Handoff: borradores en `changes/piso-planner/borradores/references/`; ejemplo: `mkdir -p core/skills/plan-change/references` y luego `cp`. No editar el texto copiado.
