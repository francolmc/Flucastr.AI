---
segment: 2
---
## Steps

### Segment 2 — Story: review-plan avisa tramos no verificables
As planner I want review-plan to flag non-verifiable segments so that I fix them before Gate 1.
Dependencies: Segment 1 — rule 15 defines what is flagged.
Contracts to keep: salida por línea `archivo:línea: motivo`; exit 1 con avisos; fixtures actuales sin cambios y sin avisos nuevos; exit 2 por uso.
Paths likely to change: `scripts/review-plan.mjs`; las pruebas pueden añadirse pero no se edita ninguna aserción existente.
Concrete example of the expected result: un tramo nuevo con `Segment verification: \`docker compose up\` — level 1` produce un aviso; el mismo tramo con `node --test x` no.
Scope: `scripts/review-plan.mjs`, `tests/review-plan/review-plan.test.mjs`, `tests/review-plan/fixtures/segment-mixed.md`
Files: scripts/review-plan.mjs, tests/review-plan/review-plan.test.mjs, tests/review-plan/fixtures/segment-mixed.md
WHEN a new-format segment lacks coverage, a quick check, or mixes units THEN a warning appears (A2).
Acceptance:
- A2: only in `### Segment N — Story:` chunks, warn for: verification that covers no A# or leaves one A# uncovered; no command or no `level`; level ≠1 unless last of story; level 3 unless last of plan; level 1 with service markers (docker, compose, VERIFY_RAPIDO, ./verify, playwright, e2e, psql, redis, localhost); two A# with disjoint product files. Valid segment, no A#, no quick check and mixed segment each have a test; check with `node --test tests/review-plan/review-plan.test.mjs`; expect exit 0.
- A3: old format prints one line `nota: formato anterior…` on stderr, exit 0, stdout empty; check with the same test.
TODO:
- [x] Add the A2 checks to `scripts/review-plan.mjs` inside the new-story branch (A2). Check: `node scripts/review-plan.mjs tests/review-plan/fixtures/segment-mixed.md`; expect a line with «mezcla unidades».
- [x] Add the one-line old-format note to `scripts/review-plan.mjs`, plus known false positives in HELP (A3). Check: `node scripts/review-plan.mjs tests/review-plan/fixtures/plan-correct.md`; expect exit 0.
- [x] Create `tests/review-plan/fixtures/segment-mixed.md` with two criteria on disjoint files (A2). Check: `node scripts/review-plan.mjs tests/review-plan/fixtures/segment-mixed.md`; expect exit 1.
- [x] Add four tests in `tests/review-plan/review-plan.test.mjs`: valid, no A#, no quick check, mixed; each fails if its rule is removed (A2, A3). Check: `node --test tests/review-plan/review-plan.test.mjs`; expect exit 0.
Segment verification: `node --test tests/review-plan/review-plan.test.mjs` — level 1; exit 0; covers A2, A3.
Handoff: Use `newStoryPlan` in the test as base. Do not edit existing assertions. Known false positives to list in HELP: A# sharing no file by design (docs vs code), root files without «/» are not seen, level in prose.

