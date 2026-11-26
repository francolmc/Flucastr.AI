# Tramo 5

## Steps
### Segment 5 — Story: builder and reviewers cite decision IDs
As a user I want the `kit run` reviewer to cite IDs so that it does not reopen settled questions.
Dependencies: Segment 2 — file location.
Contracts to keep: without `decisions.md` the reviewer prompt is byte-identical (`tests/kit-run/run.mjs` compares it); verdict schema unchanged (`criterio` is free text).
Paths likely to change: the three in Files.
Concrete example of the expected result: a defect with `criterio: "A2 (D-02)"`.
Scope: `tools/run/prompts.mjs`, `scripts/kit-run.mjs`, `tests/kit-run/run.mjs`
Files: `tools/run/prompts.mjs`, `scripts/kit-run.mjs`, `tests/kit-run/run.mjs`
WHEN `kit run` reviews a change with `decisions.md` THEN the prompt names the file and asks to cite IDs (A6).
Acceptance:
- A6: the real `kit run` flow sends that line only when the file exists; check with the acceptance flow; expect pass.
TODO:
- [x] In `tools/run/prompts.mjs` add a fifth `decisionesRel` parameter to `promptRevisor`; when set, add after the verdict line: `Decisions: <path>. Read it; do not reopen active rows; a diff that contradicts one is a defect; cite its ID in criterio, e.g. "A# (D-NN)".` (A6). Check: `node --check tools/run/prompts.mjs`; exit 0.
- [x] In `scripts/kit-run.mjs` pass the relative path of `decisions.md` beside the plan only if it exists (A6). Check: `node --check scripts/kit-run.mjs`; exit 0.
- [x] In `tests/kit-run/run.mjs` add cases: function with and without the argument, and a full run with the file present and absent, asserting the reviewer input (A6). Check: `node --test --test-name-pattern=kit-run tests/acceptance/*.test.mjs`; pass.
Segment verification: `node --test --test-name-pattern=kit-run tests/acceptance/*.test.mjs` — level 1; exit 0; covers A6.
Handoff: call site is the `revisar` function in `scripts/kit-run.mjs` (line 431). D-02, D-05.

## Evidence
$ node --check tools/run/prompts.mjs
exit 0

$ node --check scripts/kit-run.mjs
exit 0

$ node tests/kit-run/run.mjs
ok A6 promptRevisor con decisiones: la línea va tras el veredicto; sin ella es idéntico
ok A6 kit run pasa decisions.md al revisor solo si el archivo existe
kit-run: 52 casos pasaron
exit 0

Segment verification: `node --test --test-name-pattern=kit-run tests/acceptance/*.test.mjs`: `✔ kit-run: la suite de kit run pasa (43317 ms)`, pass 3, fail 0, exit 0 (límite 2×43 s = 86 s).

## Notes
- Checkpoint tramo 5 (builder, 2026-11-26): `tools/run/prompts.mjs` (parámetro `decisionesRel` y su línea tras el veredicto; sin él, idéntico), `scripts/kit-run.mjs` (`decisionesRel` solo si existe `decisions.md` junto al plan; línea 431 pasa el argumento), `tests/kit-run/run.mjs` (+3 casos A6: función con y sin argumento, corrida con archivo y sin él). Check: pasa.
