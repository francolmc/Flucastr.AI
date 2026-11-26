# Tramo 4

## Steps

### Segment 4 — Story: el comportamiento y sus límites quedan documentados
As the kit user I want the hook documented so that I know what it blocks, asks and misses.
Dependencies: Segment 3 — hook wired and step 25 present.
Contracts to keep: Spanish documentation; no sentence promises more protection than tested; other sections unchanged.
Paths likely to change: `docs/reglas-deny.md`, `docs/implementacion.md`, `tests/README.md`.
Concrete example of the expected result: `docs/reglas-deny.md` says a note written to `.md` that mentions a protected command is no longer denied by the hook, and a script destination still is.
Scope: three documents.
Files: docs/reglas-deny.md, docs/implementacion.md

#### Content
- `docs/reglas-deny.md`, the two bullets about the hook: it analyzes structure (own analyzer, no dependencies); denies protected commands also chained, substituted or inside `bash`/`sh`/`zsh -c`; asks when it cannot analyze or a command name or git subcommand is dynamic; lifts a textual match only for fully inert lines writing to `.md`, `.txt`, `.log`; deny rules are unchanged, so `bash -c ls` stays blocked by them; not verified whether deny rules also block heredoc lines. Add the limits listed in `plan.md`, *Assumptions*.
- `docs/implementacion.md`: update the hook sentence in the Claude Code bullet (allow, deny, ask, none) and name the hook tests in the `./verify` description.
- `tests/README.md`: add the two new suites to the permissions row.

WHEN someone reads the documents THEN behavior and limits match the code (A7)

Acceptance:
- A7: review the three documents against `scripts/hook-decidir.mjs`; expect every claim backed by a table case or listed as a limit; the full verification of `plan.md` exits 0.

TODO:
- [x] Update hook bullets and limits in `docs/reglas-deny.md` (A7). Check: `grep -c "inert" docs/reglas-deny.md`; expect at least 1.
- [x] Update hook sentence and verification text in `docs/implementacion.md` (A7). Check: `grep -c "hook-decidir" docs/implementacion.md`; expect at least 1.
- [x] Add suites to `tests/README.md` (A7). Check: `grep -c "hook-decision" tests/README.md`; expect 1.
- [x] Run the full verification with `./verify` (A7). Check: `./verify`; expect exit 0.
- [x] Fix the two returned doc statements (`plan.md`, *Notes*, last verdict) in `docs/reglas-deny.md` and `docs/implementacion.md` (A7). Check: `./verify`; expect exit 0.

Segment verification: `grep -q "hook-decision" tests/README.md && grep -q "hook-decidir" docs/implementacion.md` — level 1; exit 0; covers A7.
Handoff: write plainly; paste the `Fingerprint:` printed by `./verify` into *Evidence*. `./verify` is the plan's level 3.
