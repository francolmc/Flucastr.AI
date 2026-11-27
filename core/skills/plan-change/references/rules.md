# States, rules, and approval

## States

The plan's `status:` field accepts only these values, with the responsible agent:

- `draft`: the planner writes it.
- `approved`: the planner sets it after the user says “yes”.
- `in progress`: the builder sets it when starting.
- `done`: the builder sets it when `verify` passes. In a plan with segments, `done` means “segment completed and its verification passed”; the planner sets it back to `approved` with `segment: N+1` and, after the final segment, completes the full `verify`.
- `partial`: the builder sets it when returning `PAUSED`.

When closing the change, the planner moves the folder to `changes/done/` **without changing `status`**: the folder location is the marker. There are no separate closed states.

## Rules for a Good Plan

With `format: 2`, these rules stay mandatory; the automatic review only enforces what `template.md` marks as required.

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
14. **Experience.** If a plan touches a screen, route, or UI flow, load the `design-experience` skill before planning and get its sketch in `changes/<name>/pantallas.md` approved. Link `pantallas.md` under *Scope* and add experience criteria to affected story acceptance: the task is completable in N steps, uses no prohibited terms from `docs/experiencia.md`, and a 390 px screenshot has no horizontal overflow. Present the sketch in your gate 1 response, not just its path. This rule does not apply if no screens are touched.


## Before Requesting Approval

Apply the executability test (rule 7) and record the executor. Reread the plan as if you were a builder without context: what would you have to guess? Fix it. Check every story's links among WHEN/THEN, A#, TODO, file, and check; every criterion must be covered by a step and verification, and dependencies must be ordered. For each story, confirm it documents its real dependencies, including external dependencies beyond the segments and their reasons, contracts to preserve, paths likely to change, and a concrete example of the expected result. If a test uses a path, confirm it says whether the path may move or be archived and which test must be updated. Any of these fields may say “Not applicable”. Confirm each story lists at most three product files and there are no orphan A# criteria or contradictions. Then stop and tell the user the plan path. After the user says yes, set `status: approved`.

If the builder returns `partial`, correct the plan and set it back to `status: approved` before relaunching: the builder starts only from `approved`. When relaunching after `PAUSED`, do not add text about stop conditions (“real limit”, “checkpoint”); state only the next step.
