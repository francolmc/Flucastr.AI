---
segment: 3
---
## Steps

### Segment 3 — Story: nota de cuándo dividir
As maintainer I want a short note so that splitting is judged by cost, not habit.
Dependencies: Segment 2 — documents its false positives.
Contracts to keep: documentation only, in Spanish.
Paths likely to change: `docs/tamano-de-tramos.md`, `tests/README.md`.
Concrete example of the expected result: la nota dice que dividir ayuda si añade un A# comprobable y solo suma costo fijo si no.
Scope: `docs/tamano-de-tramos.md`, `tests/README.md`
Files: docs/tamano-de-tramos.md, tests/README.md
WHEN someone asks why a segment was or was not split THEN the note answers (A4).
Acceptance:
- A4: note covers when splitting helps, when it only adds startup, verification and review cost, and the heuristics' known false positives; check with `rg -c "falsos positivos" docs/tamano-de-tramos.md`; expect 1 or more.
TODO:
- [x] Create `docs/tamano-de-tramos.md` (≤30 lines, Spanish) (A4). Check: `rg -c "falsos positivos" docs/tamano-de-tramos.md`; expect 1 or more.
- [x] Update the review-plan row in `tests/README.md` with the new cases (A4). Check: `rg -c "nivel" tests/README.md`; expect 1 or more.
Segment verification: `git diff --check` — level 1; exit 0; covers A4.
Handoff: Example for the note: a segment with one A# and one file gains nothing when split again; two A# on disjoint files gain a check each.
