# Template guidance and full annotated template

## Before Writing

- Work as a conversation: explore what exists and what remains unknown; evaluate options and cost; confirm the decision with the user; then write stories for the builder to build and iterate on.
- Ask all behavioral questions during Exploration, before Validation and before writing stories. If a later question could change the result, return to Exploration, ask, and update the plan before continuing.
- You may skip a phase if the change is small or clear. State in one line which phase you are skipping and why; do not skip a necessary decision.
- Explore and investigate until you have real evidence: read files and confirm paths. Never cite a file in the plan that you have not seen. Run checks when they provide evidence relevant to the change.
- If the change crosses layers, **one plan** must cover the complete flow. Do not create one plan per file or layer.

## Template

Create `changes/<name>/plan.md` (a short lowercase name with hyphens):

```markdown
---
status: draft
branch: feature/<name>
base: <branch>   # optional; without it, the remote's main branch
repos: [<folder>, ...]
executor: builder   # planner only if the user asked for it
segment: 1   # plans with segments only: the segment the builder runs (rule 11)
continuity: continuous   # optional: lets the builder advance through approved segments
type: code   # docs if the change only touches documents (rule 12)
---
# <Change>

## Goal
One or two sentences: what will work and for whom.

## Exploration
What exists, what remains unknown, and the evidence reviewed. Record all behavioral questions and their answers here. If the topic is large or unfamiliar, expand the research in `exploracion.md` and link it; otherwise, keep the record in this plan.

## Evaluation
Options considered, benefits, cost and risk, and the recommended option. For clear changes without relevant alternatives, say so in one line.

## Assumptions
List each assumption on its own line and state what changes if the user corrects it. If there are no assumptions, write “None”.

## Decisions already taken
Confirmed decisions and their reasons, one per line. Include `Executor: <who>, because <answer from the executability test>`. Bullets cite IDs from `decisions.md` (`references/records.md`); the `Executor:` line is exempt.

## Decisions
Minor questions resolved during execution, one per line with the reason. Bullets cite IDs from `decisions.md` (`references/records.md`). Product or scope decisions remain with the user.

## Validation
What the user confirmed and when. Do not introduce new questions here: if a decision that changes the outcome still needs confirmation, return to Exploration. Without explicit approval, the plan remains a draft.

## Scope
Product folders and files the builder may change. Use one branch for the entire feature. Each story declares its scope and lists at most three product files; split additional files into ordered stories. Include the complete cross-layer flow (code, manifests, lockfiles, Dockerfiles, configuration). Anything not listed is out of scope.

## Verification
`<command>` — the command that defines “done”. It must run from a clean start and fail if anything fails.

## Stop conditions
In continuous mode, continue if the check passes, the next step remains within Scope, and no user decision is needed. Stop with a note describing completed work, remaining work, and the reason if the same cause fails twice, work must leave Scope, a user decision is missing, or a check takes more than twice its measured duration. Record minor in-scope questions as new rows in `decisions.md` (without that file, under `## Decisions`) and continue.

## Steps

Each story is a `### Segment N — Story: <outcome>` and can be built and checked on its own against the base, except for declared dependencies. Order stories so dependencies come first. Each story includes the following fields:

```markdown
### Segment 1 — Story: <useful outcome>
As <user> I want <capability> so that <value>.
Dependencies: none ("Not applicable") | Segment <N> — <required result and reason> | External — <system, tool, requirement, or external contract needed and reason>; identify the real dependencies.
Contracts to keep: <interfaces and behavior that must stay; or "Not applicable">.
Paths likely to change: <concrete paths likely to change; if a test uses one, say whether it can move or be archived and which test must be updated; or "Not applicable">.
Concrete example of the expected result: <action or input and observable result; or "Not applicable">.
Scope: <up to three product files; name them>
Files: <product file paths, comma-separated>
WHEN <situation> THEN <observable result> (A1)
Acceptance:
- A1: <verifiable result>; check with <command or review and what to look at>; expect <result>.
TODO:
- [ ] <action on file/path> (A1). Check: `<command or signal>`; expect <result>.
Segment verification: `<command>` — level <1|2|3>; exit 0; covers A1.
Handoff: <minimal context, closed decision IDs, relevant paths, and how to resume the planner-builder iteration>.
```

To enable continuity, set `continuity: continuous` in the frontmatter; if omitted, the plan keeps one-segment-at-a-time execution. In continuous mode, a story may include several small, ordered segments: each segment has its own scope, criteria, steps, and verification, and the builder executes them in sequence until the story is complete or a stop condition applies. Group them under the same user outcome and list no more than three product files per segment. Also declare `Revisión: fin de historia` or `Revisión: por tramo`; the latter is optional even for high-risk work, but when declared it blocks progress until review. Record a baseline measurement for each check command: exact command, observed duration, and environment. If no measurement exists yet, the builder stops before running that check and leaves a note to measure it. Each segment records a checkpoint with changed files, a diff summary, and the check result; when the story ends, suggest one commit for the user to make, without creating it.

Each story has its own `WHEN/THEN`, `A1..An` criteria, and TODOs. A# identifiers must be unique across the plan. Each TODO is one atomic action, names the file, and specifies how to check it and what result to expect; split tasks that combine files or checks. Tests and documentation do not count toward the three-product-file limit. Story verification must check its observable result through the relevant production flow; do not present an isolated function as a complete flow. If a story depends on another, explain which result it needs and why, then order it afterward. The handoff gives the builder only the context needed to complete the story and return evidence for the planner's review.

For new tests, add a relevant sensitivity check (an invalid fixture or isolated mutation that fails for the expected reason). If an empty list could accept everything, require non-empty discovered entries or cases. A mutation is not needed for every sentence or administrative step.

Older plans using `## Escenarios` and `## Aceptación` remain valid for execution and review. In new plans, criteria belong inside each story; do not duplicate them in a global acceptance section.

## Evidence
(written by the builder)

## Notes
(written by the builder)
```

