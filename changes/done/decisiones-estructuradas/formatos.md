# Formatos (texto exacto para `core/skills/plan-change/references/records.md`)

Todo lo que sigue a la línea `<!-- records -->` se copia tal cual en el tramo 2.

<!-- records -->
# Decision and progress records

Each change keeps both files in `changes/<name>/`, next to `plan.md`. Fixed keys are in English; cell and bullet text use the conversation language.

## decisions.md

One row per resolved decision. This is the only place where its text lives; plans cite the ID.

```markdown
# Decisions — <name>

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | <what was decided, one sentence> | <why> | YYYY-MM-DD | superseded by D-02 |
| D-02 | <new decision> | <why> | YYYY-MM-DD | active |
```

- ID: `D-01`, `D-02`, …; never reused or renumbered.
- Status: `active`, `superseded by D-NN`, or `revoked`.
- One line per row, no empty cell; write a literal pipe as `\|`.
- To change a decision, add a row and set the old one to `superseded by D-NN`. Never rewrite its text.
- The planner writes rows and statuses. The builder only adds rows for minor in-scope decisions; product or scope decisions stay with the user.

## Citing in the plan

- In `## Decisions already taken` and `## Decisions`, every bullet carries an ID: `- D-01, D-02`. The `Executor:` line is exempt.
- Do not restate the text. `- D-01: <text>` is accepted only if it matches the row exactly.
- `Resuelto:` lines carry the ID.
- Cite IDs in plain text: IDs inside backticks or code blocks are examples and are not checked.

## notes.md

Current state only: rewrite it, do not append. 15 lines or fewer. The log stays in the plan's *Notes*.

```markdown
# <name>

## Done
- <segment or step and its check result>

## Pending
- <what is left>

## Next action
- <one concrete step, with path or command>
```

Findings go to `changes/<name>/<topic>.md`, not here.

## Plans without decisions.md

They keep working as before: `Resuelto:` under *Decisions already taken* and builder notes in *Notes*.
