# Tramo 2

## Steps
### Segment 2 — Story: planning creates both records
As a planner I want the planning skill to create both files so that every new change has them.
Dependencies: Segment 1 — the checker enforces the format described here.
Contracts to keep: `plan-change/SKILL.md` ≤ 6144 bytes; its literal phrases (`Resuelto:`, `tramo-N.md`, `/compact`, `### Segment N`, `segment: 1`, `cross-layer flow`).
Paths likely to change: the two in Files.
Concrete example of the expected result: planning `changes/x/` yields `plan.md`, `decisions.md` and `notes.md`; the plan lists `- D-01, D-02`.
Scope: `core/skills/plan-change/SKILL.md`, `core/skills/plan-change/references/records.md`
Files: `core/skills/plan-change/SKILL.md`, `core/skills/plan-change/references/records.md`
WHEN a change is planned THEN the skill requires both files and the plan cites IDs (A3).
Acceptance:
- A3: reference equals the approved format and the skill requires it; check with the segment command and a diff; expect exit 0 and no differences.
TODO:
- [x] Create `core/skills/plan-change/references/records.md` with everything after `<!-- records -->` in `changes/decisiones-estructuradas/formatos.md` (A3). Check: `diff <(sed '1,/^<!-- records -->$/d' changes/decisiones-estructuradas/formatos.md) core/skills/plan-change/references/records.md`; empty.
- [x] In `core/skills/plan-change/SKILL.md`, after the template block, add: "Also write `changes/<name>/decisions.md` (one row per resolved decision) and `notes.md` (`references/records.md`). The plan cites decisions by ID and never restates them." (A3). Check: `grep -c 'decisions.md' core/skills/plan-change/SKILL.md`; at least 1.
- [x] In `core/skills/plan-change/SKILL.md` *References*, add: "- `references/records.md`: before writing `decisions.md` or `notes.md`." (A3). Check: `node --test tests/context-size/sizes.test.mjs`; pass.
Segment verification: `node --test tests/context-size/sizes.test.mjs && grep -q 'references/records.md' core/skills/plan-change/SKILL.md` — level 1; exit 0; covers A3.
Handoff: text is closed (D-01, D-02, D-03); do not reword the reference.

## Evidence
$ diff <(sed '1,/^<!-- records -->$/d' changes/decisiones-estructuradas/formatos.md) core/skills/plan-change/references/records.md
(sin salida) exit 0

$ grep -c 'decisions.md' core/skills/plan-change/SKILL.md
2 (mínimo 1) exit 0

$ node --test tests/context-size/sizes.test.mjs   (con timeout 0.2s; medido 0.09 s)
ℹ tests 7 / ℹ pass 7 / ℹ fail 0 exit 0

Segment verification: $ node --test tests/context-size/sizes.test.mjs && grep -q 'references/records.md' core/skills/plan-change/SKILL.md
exit 0

## Notes
- Checkpoint segmento 2: archivos `core/skills/plan-change/references/records.md` (nuevo, 52 líneas) y `core/skills/plan-change/SKILL.md` (+2 líneas en el cuerpo: párrafo tras la plantilla y viñeta de referencias; 4366 bytes antes, dentro del límite de 6144). Check: pasa.
