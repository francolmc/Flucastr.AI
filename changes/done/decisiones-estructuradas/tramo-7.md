# Tramo 7

## Steps
### Segment 7 — Story: resume after compaction includes decisions
As a user I want the compaction hook to point at the record so that decisions are reread from disk.
Dependencies: Segment 2 — file name.
Contracts to keep: pointers only (never file content), exit 0, at most 20 lines; output without `decisions.md` unchanged.
Paths likely to change: the three in Files; existing tests stay.
Concrete example of the expected result: after `Notes: changes/demo/notes.md` comes `Decisions: changes/demo/decisions.md`.
Scope: `scripts/after-compact.mjs`, `tests/after-compact/after-compact.test.mjs`, `docs/como-funciona.md`
Files: `scripts/after-compact.mjs`, `tests/after-compact/after-compact.test.mjs`, `docs/como-funciona.md`
WHEN the active change has `decisions.md` THEN the hook prints its path (A8).
Acceptance:
- A8: line present with the file, absent without it, no content leaked, and the docs describe records, checker and hook; check with the segment command and reading the docs; expect pass.
TODO:
- [x] In `scripts/after-compact.mjs` print the `Decisions:` line after the notes line only if the file exists (A8). Check: `node --check scripts/after-compact.mjs`; exit 0.
- [x] In `tests/after-compact/after-compact.test.mjs` add present and absent cases with a secret marker inside the file (A8). Check: `node --test tests/after-compact/after-compact.test.mjs`; pass.
- [x] In `docs/como-funciona.md` update the hook output bullet and add a short entry on `decisions.md`, `notes.md`, the checker and its limit: it cannot detect contradictions of meaning (A8). Check: `grep -c 'decisions.md' docs/como-funciona.md`; at least 2.
Segment verification: `node --test tests/after-compact/after-compact.test.mjs` — level 1; exit 0; covers A8.
Handoff: D-04, D-06. This is the last segment: also run the plan's *Verification*.

## Evidence

## Notes
