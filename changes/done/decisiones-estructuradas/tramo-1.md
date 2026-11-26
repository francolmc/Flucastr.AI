# Tramo 1

## Steps
### Segment 1 — Story: the plan review flags decision problems
As a planner I want warnings about decision IDs so that a plan cannot silently contradict the record.
Dependencies: none.
Contracts to keep: CLI, exit codes and existing warnings of `scripts/review-plan.mjs`.
Paths likely to change: the three in Files; `tests/review-plan/review-plan.test.mjs` stays untouched.
Concrete example of the expected result: a plan citing `D-09` (absent from the table) prints `plan.md:12: decisiones: D-09 no existe en decisions.md`, exit 1.
Scope: `tools/check/decisiones.mjs`, `scripts/review-plan.mjs`, `tests/review-plan/decisiones.test.mjs`
Files: `tools/check/decisiones.mjs`, `scripts/review-plan.mjs`, `tests/review-plan/decisiones.test.mjs`

Rules (format in `changes/decisiones-estructuradas/formatos.md`). The registry is `decisions.md` beside the reviewed file; each warning is `<file>:<line>: decisiones: <msg>`:
1. Registry: missing header `ID | Decision | Reason | Date | Status`; ID not matching `^D-\d{2,}$`; repeated ID; empty cell or Date not `YYYY-MM-DD`; Status other than `active`, `revoked`, `superseded by D-NN`; replacement missing or itself. `\|` is a literal pipe.
2. Plan: cited ID absent from the table.
3. Cited ID `revoked`, or superseded without its replacement on the same line; skip `## Exploration`, `## Notes`, `## Evidence`.
4. In `## Decisions already taken` and `## Decisions`, a top-level bullet without ID; anywhere, a `Resuelto:` line without ID. Exempt: `Executor:`, `None`, `Ninguna`.
5. In those sections, `- D-NN: text` (also `—`, `–`, `=`) whose text differs from the Decision cell (ignore case, spacing, final period).
6. No registry: warn only if the file cites an ID.
Fenced blocks and inline code are ignored when detecting; compare text using the raw line.

WHEN the plan contradicts the registry or lacks an ID THEN one warning per case appears and exit is 1 (A1).
WHEN a plan has no registry and cites no ID THEN no `decisiones:` line appears (A2).
Acceptance:
- A1: each of rules 1–6 warns on a bad fixture and a clean plan exits 0; check with the new test; expect pass.
- A2: every repo `plan.md` without registry emits no `decisiones:` line and output equals `main`; check with the test and the comparison step; expect no `DIFF`.
TODO:
- [x] Create `tools/check/decisiones.mjs` exporting a pure function (plan text, file, registry text or null, registry file) returning warnings (A1). Check: `node --check tools/check/decisiones.mjs`; exit 0.
- [x] In `scripts/review-plan.mjs` read the registry (ENOENT means null), append its warnings, even without `## Steps`, and describe them in HELP (A1, A2). Check: `node scripts/review-plan.mjs changes/decisiones-estructuradas/plan.md`; no `decisiones:` line.
- [x] Add `tests/review-plan/decisiones.test.mjs`: temp dirs removed on failure; one bad case per rule, clean case, code-span case, and all repo plans without registry (require a non-empty list) (A1, A2). Check: `node --test tests/review-plan/*.test.mjs`; pass.
- [x] Compare against `main` for `scripts/review-plan.mjs` (A2). Check: `git show main:scripts/review-plan.mjs > "$TMPDIR/rp.mjs"; for p in changes/*/plan.md changes/done/*/plan.md; do [ -f "${p%/*}/decisions.md" ] && continue; a=$(node "$TMPDIR/rp.mjs" "$p" 2>&1; echo $?); b=$(node scripts/review-plan.mjs "$p" 2>&1; echo $?); [ "$a" = "$b" ] || echo "DIFF $p"; done`; empty output.
Segment verification: `node --test tests/review-plan/*.test.mjs` — level 1; exit 0; covers A1, A2.
Handoff: `scripts/review-plan.mjs` main block reads one file and prints `analyze()` warnings; keep `analyze` as is. Decisions D-03, D-05, D-06.

## Evidence
- Paso 1: `$ node --check tools/check/decisiones.mjs` (junto con `node --check scripts/review-plan.mjs`, ambos con `&& echo CHECK_OK`); salida `CHECK_OK`; exit 0.
- Paso 2: `$ node scripts/review-plan.mjs changes/decisiones-estructuradas/plan.md`; salida: solo la nota de formato anterior (stderr); sin línea `decisiones:` (conteo 0); exit 0.
- Paso 3: `$ node --test tests/review-plan/*.test.mjs`; `ℹ tests 35`, `ℹ pass 35`, `ℹ fail 0`; exit 0.
- Paso 4: `$ git show main:scripts/review-plan.mjs > "$TMPDIR/rp.mjs"; for p in ...` (bucle completo de la comprobación); salida vacía; exit 0; 91 planes del repo comparados.

## Notes
- Checkpoint (historia completa): archivos `tools/check/decisiones.mjs` (nuevo), `scripts/review-plan.mjs` (+11/-1), `tests/review-plan/decisiones.test.mjs` (nuevo), `changes/decisiones-estructuradas/decisions.md` (D-07, D-08). Comprobación del tramo: 35/35 pasan. Detención para la revisión del planner.
