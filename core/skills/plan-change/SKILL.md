---
name: plan-change
description: "Write a change plan in `changes/<name>/plan.md`, the only document the builder receives. Use when work has multiple steps or crosses layers (web, API, database)."
---

# Plan a Change

The plan is the whole handoff to a small builder that did not see your conversation. Explore with real evidence (never cite an unseen file), ask every behavior question in Exploration, evaluate, validate, then write stories. One plan covers a cross-layer flow.

## Template

`changes/<name>/plan.md`. Field guidance: `references/template.md`.

```markdown
---
status: draft
format: 2   # default for new plans; see references/template.md
branch: feature/<name>
base: <branch>   # optional
repos: [<folder>, ...]
executor: builder   # planner only if the user asked
segment: 1   # segmented plans
continuity: continuous   # optional
type: code   # docs: only documents
---
# <Change>
## Goal
## Exploration (optional)
## Evaluation (optional)
## Assumptions (optional)
## Decisions already taken (optional)
## Decisions (optional)
## Validation (optional)
## Scope
## Verification
## Stop conditions (optional)
## Steps
```

New plans use `format: 2`, the short template in `references/template.md`: only Goal, Scope, Verification, and Steps are required; per segment, Files, A# with a command, TODO, and Segment verification. Without it, every heading and field is required. Fields marked (optional) are for high-risk A# or when they add information.

Under `## Steps`, each story is a `### Segment N — Story: <outcome>`, dependencies first:

```markdown
### Segment 1 — Story: <useful outcome>
As <user> I want <capability> so that <value>. (optional)
Dependencies: none ("Not applicable") | Segment <N> — <required result and reason> | External — <system, tool, requirement, or external contract needed and reason>; identify the real dependencies. (optional)
Contracts to keep: <interfaces and behavior that must stay; or "Not applicable">. (optional)
Paths likely to change: <concrete paths likely to change; if a test uses one, say whether it can move or be archived and which test must be updated; or "Not applicable">. (optional)
Concrete example of the expected result: <action or input and observable result; or "Not applicable">. (optional)
Scope: <up to three product files>
Files: <product file paths, comma-separated>
WHEN <situation> THEN <observable result> (A1)
Acceptance:
- A1: <verifiable result>; check with <command or review>; expect <result>.
TODO:
- [ ] <action on file/path> (A1). Check: `<command or signal>`; expect <result>.
Segment verification: `<command>` — level 1; exit 0; covers A1.
Handoff: <minimal context, closed decisions, paths, example, how to resume>. (optional)
```

End the file with these sections, written by the builder:

```markdown
## Evidence
## Notes
```

Also write `changes/<name>/decisions.md` (one row per resolved decision) and `notes.md` (`references/records.md`). The plan cites decisions by ID and never restates them.

## Segment rules

- **Verifiable segments:** each covers declared A#, has one level 1 `Segment verification:` (exact command, expected exit) and a `Handoff:` with an example (optional with `format: 2`). One functional unit, at most three product files; split only for another checkable A#. Level 2 only ends a story; Level 3 only ends the plan.
- **Atomic steps:** one line, one action, one explicit check, and its expected result, about 20 words. `Segment verification:` is additional and never replaces an individual check.
- `executor:` is `builder` unless the user explicitly asks you to execute; apply the executability test.
- `repos:` is required (`[.]` for one repository). Statuses: `draft`, `approved`, `in progress`, `done`, `partial`.

## Short Plans by Default

- At most 8 KB and 3 segments per plan; `review-plan` enforces both. Beyond that, split the work into two plans. Only a line `Excepción de tamaño: <reason>` with a non-empty reason lifts the limit.
- Two changes in one request: ask the user their order before writing.
- Explore for 10 minutes at most. Anything still unknown goes under `## Exploration` as a named gap, not further research.
- Verify only what you touch and its direct dependents: for each A#, the happy path and that criterion's edges.

## References

Read only what applies:

- `references/template.md`: short template (`format: 2`, the default).
- `references/rules.md`: before writing a plan: scope, `base:`, executor test, assumptions, durations, states.
- `references/segments.md`: two or more segments, `tramo-N.md`, `/compact`, `Resuelto:`, continuity and sensitivity tests.
- `references/verification.md`: choosing Verification levels (`Comprobación rápida`, Level 2), `type: docs`, risk.
- `references/records.md`: before writing `decisions.md` or `notes.md`.
- Screens or UI flow: load `design-experience`; approve `pantallas.md` first.

## Before Requesting Approval

Run the executability test, record the executor, and reread as a builder without context. Every A# has a step and verification; dependencies are ordered; no orphan criteria or contradictions; at most three product files per story. Without `format: 2`, each story must identify the real dependencies, including external dependencies beyond the segments and their reasons, contracts to preserve, paths likely to change, and a concrete example of the expected result; if a test uses a path, whether the path may move or be archived and which test must be updated. Any may say “Not applicable”. Run `review-plan`. Tell the user the path; after “yes” set `status: approved`.

If the builder returns `partial`, fix the plan and set `approved` before relaunching; add no stop-condition text, only the next step.
