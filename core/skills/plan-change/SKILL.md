---
name: plan-change
description: "Write a change plan in `changes/<name>/plan.md`, the only document the builder receives. Use when work has multiple steps or crosses layers (web, API, database)."
---

# Plan a Change

The plan is the **handoff** between you and the builder. The builder is a small model that did not see your conversation; it only knows what is written down. Write the plan so it does not have to guess.

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
Confirmed decisions and their reasons, one per line. Include `Executor: <who>, because <answer from the executability test>`.

## Decisions
Minor questions resolved during execution, one per line with the reason. Product or scope decisions remain with the user.

## Validation
What the user confirmed and when. Do not introduce new questions here: if a decision that changes the outcome still needs confirmation, return to Exploration. Without explicit approval, the plan remains a draft.

## Scope
Product folders and files the builder may change. Use one branch for the entire feature. Each story declares its scope and lists at most three product files; split additional files into ordered stories. Include the complete cross-layer flow (code, manifests, lockfiles, Dockerfiles, configuration). Anything not listed is out of scope.

## Verification
`<command>` — the command that defines “done”. It must run from a clean start and fail if anything fails.

## Stop conditions
In continuous mode, continue if the check passes, the next step remains within Scope, and no user decision is needed. Stop with a note describing completed work, remaining work, and the reason if the same cause fails twice, work must leave Scope, a user decision is missing, or a check takes more than twice its measured duration. Record minor in-scope questions under `## Decisions` and continue.

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
Handoff: <minimal context, closed decisions, relevant paths, and how to resume the planner-builder iteration>.
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

## States

The plan's `status:` field accepts only these values, with the responsible agent:

- `draft`: the planner writes it.
- `approved`: the planner sets it after the user says “yes”.
- `in progress`: the builder sets it when starting.
- `done`: the builder sets it when `verify` passes. In a plan with segments, `done` means “segment completed and its verification passed”; the planner sets it back to `approved` with `segment: N+1` and, after the final segment, completes the full `verify`.
- `partial`: the builder sets it when returning `PAUSED`.

When closing the change, the planner moves the folder to `changes/done/` **without changing `status`**: the folder location is the marker. There are no separate closed states.

## Rules for a Good Plan

1. **Scope by path, not by file.** If the builder finds a related defect within scope, it fixes it; it should not have to stop for that reason.
2. **One verification command** tests the final outcome, not each piece. If the project does not yet have `verify`, the first plan creates it (`prepare-project`).
3. **Atomic steps**: one line, one action, one explicit check, and its expected result, aiming for about 20 words. Put the check on a subline when it does not fit clearly in the step. `Segment verification:` is additional and never replaces an individual check. Do not sacrifice clarity to meet the target. Split a step with multiple requirements. There is no step limit (40 is valid); order the steps and make each checkable. Avoid full code except signatures or contracts that must be preserved.
4. **Manageable context.** Write what the builder needs to understand its story without irrelevant context. Sizes of 5 KB for a simple change and about 8 KB for one investigating several parts are guidelines only. If context becomes difficult to manage, stories may go in `tramo-N.md` files linked from `plan.md`, each with its own verification; size alone does not require splitting.
5. **Repos in frontmatter.** `repos:` is required: list the folders (relative to the project root) where the change touches code or receives the branch. A single-repository project uses `repos: [.]`. A workspace lists only the folders touched by the change (e.g. `repos: [api]`). If the change only touches documentation or root `verify`, use `repos: [.]`; the root counts as a repository.
6. **Questions during exploration.** Ask all behavioral questions in `## Exploration`, before validation and writing stories. If a later answer could change the outcome, return to exploration and confirm the change with the user before continuing. Do not leave necessary decisions open when requesting approval.
7. **Who executes (`executor:`): executability test.** Decide from the written plan by answering four yes/no questions: (1) are the requirements covered? (2) are the context and prerequisites accessible? (3) are there checks with expected results and errors or blockers that can be handled within scope? (4) does it avoid credentials, deployment, and production? Rewrite steps so the builder does not need to know future results or anticipate every error. The executor is `builder` unless the user explicitly asks you to execute; then use `executor: planner` and cite their request in the reason. Otherwise use `executor: builder`, even if any answer is no: improve the plan where possible, but never assign `planner` for that reason. In either case, `## Decisions already taken` must include `Executor: <who>, because <answer from the test>` for the user to discuss at gate 1. Without an `executor:` line, treat it as `builder`. A small change (defined under Hard rules in `core/agents/planner.md`) may use `executor: planner` when the user says yes to that definition.
8. **Explicit assumptions.** Put each assumption on its own line in `## Assumptions` and state what changes if the user corrects it (e.g. “Validate email with a simple regex; if the user wants DNS checks, scope and one step change”). If something is a decision that changes the outcome rather than an assumption, ask the user.
9. **Duration for heavy steps.** A step that runs a build, installation, or suite includes its estimated duration in parentheses, e.g. “(≈8 min)”. If the total exceeds about 20 minutes, split the plan into segments, each with partial verification. Intermediate segments follow rule 15 (Level 1); the final acceptance run is Level 3 (rule 13), without cache.
10. **Base (`base:`).** The base branch for a folder in `repos:` is the plan's `base:`; if absent, use `git symbolic-ref --short refs/remotes/origin/HEAD`; without a remote, use `main` or `master`. `base:` can be one branch name for all folders or a map `{folder: branch}` when a workspace uses different branches. The planner copies `base:` from the project's `AGENTS.md` “Base branch” line, if present.
11. **Stories and segments.** A feature uses one branch and one `plan.md`. Each self-contained story may use one segment or group several consecutive small segments under the same user outcome. Each segment has a scope of up to three product files, its own A# criteria, atomic TODOs naming files and checks, verification, and evidence; the story includes the user and value, dependencies, WHEN/THEN, and handoff. Each story must be buildable and verifiable on its own against the base; if it depends on another, explain which result it needs and why, and order it afterward. Keep stories small, preferably bounded by file, without splitting a flow into isolated functions that are not useful outcomes. If the environment has not been verified, the first segment covers only the environment (install, start, reproduce), with no code changes. Without `continuity: continuous`, the planner launches one segment at a time; with it, the builder continues through approved segments of the same story in order, subject to `## Stop conditions`. A plan with two or more segments of the same story should declare `continuity: continuous` by default; `review-plan` warns when two or more segments lack it. Each segment's completion criterion is measurable: its `Segment verification:` names a command and its expected result (exit code or output), not a general description. Adjust later segments after seeing the previous segment's actual state. Older plans with traditional steps or segments remain executable. To limit builder context when needed, put some stories in `tramo-N.md` files linked from `plan.md`, each with its story, steps, `Segment verification:`, and evidence; the index retains frontmatter, objective, exploration if applicable, assumptions, decisions, validation, scope, verification, and the ordered story list with status. Neither size nor story count alone requires externalizing stories. The builder reads `plan.md` and only the active `tramo-<n>.md`, not other segment documents. At the end of each story, use `/compact` or a new session so the planner reviews in a fresh context. A plan may require review per segment, including for high-risk work; if declared, it blocks progress until the verdict. A final review preserves continuity but may find accumulated defects; reviewing each segment finds them sooner, with more pauses and reviews. In either case, each segment checkpoint records files, a diff summary, and verification, and suggests a story commit for the user to make, without committing. Record a minor decision resolved during the change in `## Decisions` as `Resuelto: <date> <decision>`. Each `Segment verification:` declares its level (rule 13); Level 3 is only for the final acceptance run in the last story.
12. **Type.** Use `type: docs` only when the change touches `*.md` or `docs/` files. Its *Verification* is lightweight, with no build or Docker: `git diff --check` plus checking that cited paths and commands exist (`test -f`, `rg`). Without `type:`, use `code`.
13. **Verification levels.** Three levels: **Level 1** `Comprobación rápida` (the `Comprobación rápida: <command>` line in `AGENTS.md`: types, lint, and host tests; no Docker; seconds); **Level 2** `VERIFY_RAPIDO=1 ./verify` (Docker with cache); **Level 3** `./verify` without cache (final acceptance). Low risk (a small change or `type: docs`, as defined by `core/agents/planner.md`) means one repository, no migration, no API contract change, and no route or screen change in the flow. Classification is by risk, not file count; any unlisted risk is high. Its *Verification* is Level 1 plus a test covering the change. If a plan validates with a browser or containers, its *Verification* is one fixed repository script (`./scripts/<name>.sh` or `./verify`) that runs all journeys once, not standalone `docker run` or `compose run` commands. If `AGENTS.md` has no `Comprobación rápida` line, use `verify` as today.
14. **Experience.** If a plan touches a screen, route, or UI flow, load the `design-experience` skill before planning and get its sketch in `changes/<name>/pantallas.md` approved. Link `pantallas.md` under *Scope* and add experience criteria to affected story acceptance: the task is completable in N steps, uses no prohibited terms from `docs/experiencia.md`, and a 390 px screenshot has no horizontal overflow. Present the sketch in your gate 1 response, not just its path. This rule does not apply if no screens are touched.
15. **Verifiable segments.** Each segment is judged by a machine when it ends. It declares (a) the A# it covers (`covers A1`; every A# of the segment is covered); (b) `Segment verification:` = one Level 1 quick check (host, no services, seconds; a targeted test counts) with exact command, `level 1` and expected exit; (c) a `Handoff:` with a concrete example. One functional unit per segment: two A# touching disjoint files are two segments. Level 2 only in the last segment of a story; Level 3 only in the plan's last segment. Split further only if it adds an independently checkable A#; else merge. Explain residual warnings in one line.

## Before Requesting Approval

Apply the executability test (rule 7) and record the executor. Reread the plan as if you were a builder without context: what would you have to guess? Fix it. Check every story's links among WHEN/THEN, A#, TODO, file, and check; every criterion must be covered by a step and verification, and dependencies must be ordered. For each story, confirm it documents its real dependencies, including external dependencies beyond the segments and their reasons, contracts to preserve, paths likely to change, and a concrete example of the expected result. If a test uses a path, confirm it says whether the path may move or be archived and which test must be updated. Any of these fields may say “Not applicable”. Confirm each story lists at most three product files and there are no orphan A# criteria or contradictions. Then stop and tell the user the plan path. After the user says yes, set `status: approved`.

If the builder returns `partial`, correct the plan and set it back to `status: approved` before relaunching: the builder starts only from `approved`. When relaunching after `PAUSED`, do not add text about stop conditions (“real limit”, “checkpoint”); state only the next step.
