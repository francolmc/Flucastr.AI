# Tramo 4

## Steps
### Segment 4 — Story: builder and reviewers cite decision IDs
As a user I want the builder to consult the record so that settled questions are not reopened.
Dependencies: Segment 2 — file format.
Contracts to keep: `builder.md` + `execute-plan/SKILL.md` ≤ 13500 bytes; every existing literal phrase; behavior without `decisions.md`.
Paths likely to change: the three in Files; `tests/builder-contract.mjs` only gains assertions.
Concrete example of the expected result: ambiguity answered by an `active` row means the builder applies it and returns `decisiones: D-02` instead of `PAUSED`.
Scope: `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`, `tests/builder-contract.mjs`
Files: `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`, `tests/builder-contract.mjs`
WHEN a change has `decisions.md` THEN the builder searches it before pausing, adds only new rows, keeps `notes.md` and cites IDs (A5).
Acceptance:
- A5: the exact texts below are present, sizes hold and new assertions pass; check with the segment command; expect exit 0 (measured result: 13492 bytes).

Exact edits (byte budget measured; apply verbatim):
- builder: after "add minor resolved questions to *Decisions*." append " You may also add rows to `decisions.md` and rewrite `notes.md` beside the plan; cite `D-NN` in returns."
- skill: after "record minor decisions there too (with continuity, under *Decisions*)." add a new line "- With `decisions.md`, add them as new rows there instead; rewrite `notes.md` (its headings, ≤15 lines) per segment and before pausing."
- skill: replace "look for `Resuelto:` under *Decisions already taken*;" with "search `decisions.md` (without it, `Resuelto:` under *Decisions already taken*);"
- skill: replace "When a segment ends, record its checkpoint; when a story ends," with "When a story ends," (the checkpoint rule already exists above).

TODO:
- [x] Apply the builder edit in `core/agents/builder.md` (A5). Check: `grep -c 'in returns' core/agents/builder.md`; 1.
- [x] Apply the three edits in `core/skills/execute-plan/SKILL.md` (A5). Check: `node --test tests/context-size/sizes.test.mjs`; pass.
- [x] In `tests/builder-contract.mjs` assert the skill includes "search `decisions.md` (without it, `Resuelto:`" and "add them as new rows there instead", and the builder includes "cite `D-NN` in returns" (A5). Check: `node tests/builder-contract.mjs`; exit 0, and it fails if one phrase is removed from a temporary copy.
Segment verification: `node tests/builder-contract.mjs && node --test tests/context-size/sizes.test.mjs` — level 1; exit 0; covers A5.
Handoff: D-02, D-05. If a size fails, pause with `motivo=design`; do not trim other rules.

## Evidence
$ grep -c 'in returns' core/agents/builder.md
1
exit 0

$ node --test tests/context-size/sizes.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ node tests/builder-contract.mjs
ok A5: 4 frases de decisions.md presentes y mutaciones detectadas
ok A5: 11 etiquetas de retorno y límite de cinco líneas en builder.md
ok A5: plantilla y revisión exigen dependencias externas, contratos, rutas y ejemplo; 12 mutaciones negativas detectadas
ok A5
exit 0

Segment verification: `node tests/builder-contract.mjs && node --test tests/context-size/sizes.test.mjs`: exit 0, pass 7 fail 0 (tamaños: builder.md 2857 + execute-plan/SKILL.md 10635 = 13492 bytes, dentro de 13500).

## Notes
- Checkpoint tramo 4 (builder, 2026-11-26): `core/agents/builder.md` (+1 frase al final del punto de cambios), `core/skills/execute-plan/SKILL.md` (+1 viñeta; reemplazo de Resuelto por `decisions.md`; «When a segment ends, record its checkpoint;» retirada, la regla de checkpoint ya existe arriba), `tests/builder-contract.mjs` (+bloque A5 con 4 frases y mutaciones en memoria). Check: pasa.
