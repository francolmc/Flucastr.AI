# Short template (`format: 2`, the default)

New plans use `format: 2`. Required: Goal, Scope, Verification, and Steps; per segment: Files, A# with a command, TODO, and Segment verification. Everything else is optional. Without the mark, the full template in `SKILL.md` applies and its optional sections become required.

Write `changes/<name>/plan.md` (a short lowercase name with hyphens):

```markdown
---
status: draft
format: 2
branch: feature/<name>
base: <branch>   # optional; without it, the remote's main branch
repos: [<folder>, ...]
executor: builder   # optional; planner only if the user asked for it
segment: 1   # segmented plans only
continuity: continuous   # optional; see segments.md
type: code   # docs if the change only touches documents
---
# <Change>

## Goal
One or two sentences: what will work and for whom.

## Scope
Folders and product files the builder may touch; anything not listed is out of scope.

## Verification
`<command>` — defines "done"; fails if anything fails from a clean start.

## Steps
### Segment 1 — Story: <useful outcome>
Files: `<path>`, ... (at most 3)
WHEN <situation> THEN <observable result> (A1)
Acceptance:
- A1: <verifiable result>; check `<command>`; expect <result>. Without a command: "revisión manual".
TODO:
- [ ] <action on a file> (A1). Check: `<command>`; expect <result>.
Segment verification: `<command>` — level 1; exit 0; covers A1.
```

Optional: Exploration, Evaluation, Assumptions, Decisions already taken, Decisions, Validation, Stop conditions, and per story As, Dependencies, and Handoff. Cite decisions by their ID from `decisions.md`.

The builder writes these at the end:

```markdown
## Evidence
## Notes
```
