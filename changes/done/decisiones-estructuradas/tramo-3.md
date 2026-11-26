# Tramo 3

## Steps
### Segment 3 — Story: planning creates both records
As a planner I want one documented home for decisions so that no reference sends them elsewhere.
Dependencies: Segment 2 — `references/records.md` exists.
Contracts to keep: plans without `decisions.md` keep `Resuelto:`; other rules in these files unchanged.
Paths likely to change: the three in Files.
Concrete example of the expected result: a minor decision during continuity becomes a new row, not a bullet in `## Decisions`.
Scope: `core/skills/plan-change/references/template.md`, `core/skills/plan-change/references/segments.md`, `docs/kit-run.md`
Files: `core/skills/plan-change/references/template.md`, `core/skills/plan-change/references/segments.md`, `docs/kit-run.md`
WHEN a reference says where a decision goes THEN it names `decisions.md`, with the old path only for plans without it (A4).
Acceptance:
- A4: the three files agree; check by reading the changed lines; expect no instruction that competes with `references/records.md`.
TODO:
- [x] In `core/skills/plan-change/references/template.md`: under *Decisions already taken* and *Decisions*, say bullets cite IDs from `decisions.md` (`records.md`); in the continuity paragraph, minor questions become new rows (without the file, `## Decisions`); the Handoff placeholder says "closed decision IDs" (A4). Check: `grep -c 'decisions.md' core/skills/plan-change/references/template.md`; at least 2.
- [x] In `core/skills/plan-change/references/segments.md` replace the sentence "Record a minor decision resolved during the change in …" with "Record a minor decision resolved during the change as a new row in `decisions.md`; in a plan without that file, as `Resuelto: <date> <decision>` under `## Decisions already taken`." (A4). Check: `grep -c 'as a new row in' core/skills/plan-change/references/segments.md`; 1.
- [x] In `docs/kit-run.md`, row `decision`: "pausa; la persona deja la decisión como fila en `decisions.md` (sin ese archivo, como `Resuelto:`)" (A4). Check: `grep -c 'decisions.md' docs/kit-run.md`; 1.
Segment verification: `grep -q 'decisions.md' core/skills/plan-change/references/template.md && grep -q 'decisions.md' core/skills/plan-change/references/segments.md && grep -q 'decisions.md' docs/kit-run.md` — level 1; exit 0; covers A4.
Handoff: resolves tension C9 (D-02, D-05). `rules.md` and its `Executor:` line stay as they are (D-03).

## Evidence
$ grep -c 'decisions.md' core/skills/plan-change/references/template.md
3 (mínimo 2) exit 0

$ grep -c 'as a new row in' core/skills/plan-change/references/segments.md
1 exit 0

$ grep -c 'decisions.md' docs/kit-run.md
1 exit 0

Segment verification: $ grep -q 'decisions.md' core/skills/plan-change/references/template.md && grep -q 'decisions.md' core/skills/plan-change/references/segments.md && grep -q 'decisions.md' docs/kit-run.md   (con timeout 0.2s, cada grep)
exit 0

## Notes
- Checkpoint segmento 3: `template.md` (4 líneas cambiadas: decisiones citan IDs, continuidad en filas de `decisions.md`, Handoff «closed decision IDs»), `segments.md` (1 línea, ítem 11), `docs/kit-run.md` (1 fila, tabla `decision`). Check: pasa.
