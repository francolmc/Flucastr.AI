# Tramo 8

## Steps
### Segment 8 — Story: the builder applies only active decisions
As a user I want the builder to apply only active rows so that a replaced decision is not applied.
Dependencies: Segment 4 — the two sentences it added.
Contracts to keep: `builder.md` + `execute-plan/SKILL.md` ≤ 13500 bytes; literal `Resuelto:`; every other assertion.
Paths likely to change: the two in Files; in `tests/builder-contract.mjs` only the decision phrase list added by this change.
Concrete example of the expected result: a matching row `superseded by D-NN` is not applied; its `active` replacement is.
Scope: `core/skills/execute-plan/SKILL.md`, `tests/builder-contract.mjs`
Files: `core/skills/execute-plan/SKILL.md`, `tests/builder-contract.mjs`
WHEN the builder finds a decision before pausing THEN it applies it only if `active` (A9).
Acceptance:
- A9: both sentences read as below, assertions match and sizes hold; check with the segment command; expect exit 0 (measured: 13495 bytes).

Exact edits (apply verbatim, nothing else):
- skill: replace "apply it as written and do not ask again." with "apply it if `active`; do not ask again."
- skill: replace "add them as new rows there instead" with "add decisions as new rows there instead"

TODO:
- [x] Apply both edits in `core/skills/execute-plan/SKILL.md` (A9). Check: `node --test tests/context-size/sizes.test.mjs`; pass.
- [x] In `tests/builder-contract.mjs`, in the decision phrase list: change the phrase to "add decisions as new rows there instead" and add an entry requiring "apply it if `active`" (A9). Check: `node tests/builder-contract.mjs`; exit 0.
Segment verification: `node tests/builder-contract.mjs && node --test tests/context-size/sizes.test.mjs` — level 1; exit 0; covers A9.
Handoff: D-09. This is now the last segment: also run the plan's *Verification*.

## Evidence

## Notes
