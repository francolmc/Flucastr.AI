# Tramo 6

## Steps
### Segment 6 — Story: builder and reviewers cite decision IDs
As a user I want the planner to review and resume with IDs so that I am not asked twice.
Dependencies: Segment 2 — file format.
Contracts to keep: `planner.md` ≤ 8192 bytes; its literal phrases; ladder classes and relaunch limits.
Paths likely to change: the three in Files.
Concrete example of the expected result: a `PAUSED` for access already answered by an `active` row is relaunched citing it.
Scope: `core/agents/planner.md`, `core/references/planner/paused-and-interrupted.md`, `tools/run/escalera.mjs`
Files: `core/agents/planner.md`, `core/references/planner/paused-and-interrupted.md`, `tools/run/escalera.mjs`
WHEN the planner reviews or handles a pause THEN it consults `decisions.md` and cites IDs (A7).
Acceptance:
- A7: the texts below are present and checks pass; check with the segment command; expect exit 0, `planner.md` 8192 bytes.

Exact edits (apply verbatim):
- planner, *Context*, replace the bullet starting "- Write each finding" with: "- Keep `changes/<name>/notes.md` (≤15 lines, `## Next action`) current; decisions to `decisions.md`, findings to `<topic>.md`. After compaction resume there; reread only changed sources, or to quote, edit, or review."
- planner, replace "mark each Acceptance row." with "mark each Acceptance row, citing `D-NN`."
- ladder reference, bullet about `entorno`: replace "(writes it as `Resuelto:` in the plan)" with "(a row in `changes/<name>/decisions.md`; without that file, `Resuelto:` in the plan)".
- ladder reference, under *Always*, add: "- Before relaunching or asking about an `ambiguous` or `access` pause, search `changes/<name>/decisions.md`: if an `active` row answers it, relaunch citing its ID and do not ask again; a changed answer is a new row that supersedes the old one."

TODO:
- [x] Apply both edits in `core/agents/planner.md` (A7). Check: `node --test tests/context-size/sizes.test.mjs`; pass.
- [x] Apply both edits in `core/references/planner/paused-and-interrupted.md` (A7). Check: `grep -c 'decisions.md' core/references/planner/paused-and-interrupted.md`; 2.
- [x] In `tools/run/escalera.mjs` set the `decision` message to this exact text, without the backticks: `tomar la decisión que pide el builder o el revisor, dejarla como fila en decisions.md (sin ese archivo, en el plan con Resuelto:) y volver a correr kit run` (A7). Check: `node --test tests/escalera/*.test.mjs`; pass.
Segment verification: `node --test tests/context-size/*.test.mjs tests/compaction/*.test.mjs tests/escalera/*.test.mjs` — level 1; exit 0; covers A7.
Handoff: D-02, D-05. `planner.md` has no spare bytes: change nothing else there.

## Evidence
$ grep -c 'decisions.md' core/references/planner/paused-and-interrupted.md
2
exit 0

$ node --check tools/run/escalera.mjs
exit 0

Segment verification: `node --test tests/context-size/*.test.mjs tests/compaction/*.test.mjs tests/escalera/*.test.mjs`
ℹ tests 194, suites 35, pass 194, fail 0; duración 31565 ms (previa 32 s); exit 0. Incluye tests/context-size/sizes.test.mjs. `core/agents/planner.md`: 8192 bytes.

## Notes
- Checkpoint tramo 6 (builder, 2026-11-26): `core/agents/planner.md` (2 frases reemplazadas: notas y `D-NN`; 8192 bytes, límite 8192), `core/references/planner/paused-and-interrupted.md` (línea `entorno`/`decision` apunta a `decisions.md`; viñeta nueva en *Always*), `tools/run/escalera.mjs` (mensaje `decision` con el texto exacto). Check: pasa.
