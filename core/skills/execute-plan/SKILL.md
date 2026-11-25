---
name: execute-plan
description: "Execute an approved plan in `changes/<name>/plan.md`: follow its steps, fix issues within scope, run `verify`, and record real evidence. Use when building."
---

# Execute a plan

Input: the plan path.

## Before starting

1. Read the complete plan one segment at a time. If `status` is not `approved`, stop without changing anything.
2. If the task includes `Branch:`, for each folder in the frontmatter's `repos:` and only those folders. Run every `git` command with `<folder>` as the command's working directory (for `.`, the root); never use `git -C` or `git -c`, which are blocked:
   - If it has no `.git`, note that in *Notes* and continue.
   - If `git branch --show-current` in `<folder>` already returns the requested branch, continue.
   - If the branch exists (`git rev-parse --verify --quiet refs/heads/<branch>` in `<folder>`), return `PAUSED` with `motivo=access`.
   - Check the base branch (`base:`; if absent, use `git symbolic-ref --short refs/remotes/origin/HEAD`; without a remote, use `main` or `master`) and confirm `git status`/`git diff` show no changes outside `changes/<name>/`. Otherwise return `PAUSED` with `motivo=access`.
   - If checks pass, create only the authorized branch: `git switch -c <branch>` in `<folder>`.
   - If `repos:` is missing, return `PAUSED` with `motivo=ambiguous`.
3. Set `status: in progress`.

For Git, states, and the return format, see the builder's *Limits* and *Return* sections.

For `type: docs`, when finished confirm with `git diff --name-only <base>` that only `*.md` files or files under `docs/` changed; otherwise return `PAUSED` with `motivo=scope`.

## Segment

If the plan frontmatter contains `segment: <n>`, execute that segment. In the new format, `### Segment N — Story: ...` identifies a self-contained story: read its user/value, dependencies, scope, WHEN/THEN, `A#` criteria, TODO items, and *Handoff*. Use the handoff to guide implementation and review; check every referenced `A#` criterion and execute only its TODO items. Declared dependencies must be complete before starting; otherwise stop and record where to resume. For older plans, follow their existing steps and acceptance criteria.

By default, an execution ends when the active segment is complete; keep this procedure for plans without continuity and older plans. Only when the approved plan declares `continuity: continuous` may you continue through approved segments of the same story in one run. Read each segment file just before using it; do not move on to another story. After each segment, add a checkpoint to *Notes* with changed files, a diff summary, and the check result; do not commit. When the story is complete, stop for the planner to review in a fresh context and use `/compact` or a new session for that review. If the plan declares `Revisión: por tramo`, wait for that review before continuing.

In continuous mode, follow the plan's *Stop conditions*. If no prior duration is recorded for the exact check in an equivalent environment, pause before running it. Set a limit of twice that duration, for example `timeout <2x-segundos>s <comando>`; if it expires, leave the checkbox pending and record the pause. After the first failure for a cause, diagnose and fix only within scope; if the same cause returns, pause with completed work, remaining work, and reason. Also pause if work must leave scope or requires a user decision. Record minor in-scope decisions under `Decisions` and continue. In continuous mode, you may update `segment:` while advancing within the same story and record those minor decisions under `Decisions`; keep `status: in progress` while advancing and set it to `partial` when pausing, with a resumable note describing progress, remaining work, and cause. The planner reviews the note and re-approves before resumption. Do not change `Scope` or `Acceptance`. For plans without continuity, preserve their existing procedure and content.

Use the `Segment verification:` line for its check; if this is the plan's final segment, also run the complete *Verification*. For an index plan, read `tramo-<n>.md` for the active segment; in continuous mode, then open each subsequent segment of the same story you will execute. Without `segment:`, the plan has one segment. Record a checkpoint when each segment ends; when a story ends, leave a summary for the planner to review in a fresh context. For plans without continuity, preserve the pause between segment invocations and use `/compact` or a new session before continuing the plan.

## Execution loop

For each `- [ ]` step, in order:

- Group independent reads for a step into one call and read each file once.
- Workflow: read the file to change; capture its starting state with a command and record the output; make the smallest in-scope change (never omit, defer, or simplify requested work); rerun the same command and compare it with the recorded output.
- After each coherent unit, run the `Comprobación rápida` from `AGENTS.md` (Level 1, no Docker) if present; otherwise use `verify`. Reserve Docker-based `verify` for *Verificación final* and `Segment verification:` (each at its declared level).
- As soon as a step is complete and its check passes, mark `- [x]` and add evidence to the plan's *Evidence* section before starting the next step. Do not wait until the segment ends. Change only step checkboxes, their evidence, frontmatter `status`, and the *Evidence* and *Notes* sections; never edit *Scope* or *Acceptance*.
- If a step has no explicit check, leave it unchecked and add a *Notes* line with the step and missing check; do not invent one or claim completion. If interrupted or incomplete, leave it unchecked and record the exact resumption point.
- Count pending items with the `bash pendientes-plan` block below, passing the plan path as `$1`. Record the count; a read error is not zero. Continue with pending work unless an allowed blocker applies.
- Fix related issues within scope and record them in *Notes*.
- For long output (builds, `verify`, listings), show only the tail and errors; use quiet options when available.
- Wait for long commands (`verify`, builds) with one call (Claude Code: maximum `timeout` or `run_in_background` and wait for its notice; Pi: `bash` timeout; Codex: `exec_command` in an `exec` cell and, if it returns “Script running with cell ID N”, make one `wait` call with that `cell_id` and `yield_time_ms: 300000`; if it returns a `session_id`, make one `write_stdin` call with empty `chars` and `yield_time_ms: 1800000`, and repeat only while the command still runs, never every few seconds). Never poll with `sleep`, `tail`, or status loops.
- For browser/container validation, use a fixed repository script (`./scripts/<name>.sh` or `./verify`) that runs all journeys and captures in one pass. Do not chain standalone `docker run` or `compose run` calls.

### Canonical counter

```bash pendientes-plan
#!/usr/bin/env bash
set -e
awk '
  /^- \[ \]/ { n++ }
  END { print n+0 }
' "$1"
```

Count only root-level pending checkboxes, print `0` when there are no matches, and propagate read errors.

## Final Verification

After the other steps are complete, run the *Verification* command **exactly as written** before checking off its specific step. Local unit checks do not count against the three final runs; do not repeat an identical suite without a change or new diagnosis.

- If it passes, record the real output and check off the step.
- If it fails, find the root cause within the full scope, fix it, and rerun.
- **Limit:** 3 final runs. If the same cause persists after two fixes or the third run fails, return `PAUSED` with `motivo=verify` and a complete diagnosis.
- Finish only when acceptance requirements are met, final verification passes, and no steps remain pending. Checkboxes report progress; they are not independent evidence.

## Counting, context, and pausing

- If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report DONE. An interruption leaves `in progress`; it is not a product PAUSED. The planner reconstructs the state and re-approves before resuming.
- Do not end the turn with a progress report. Your response must start with `DONE` or `PAUSED`. If work remains within *Scope*, keep going instead of reporting it.
- If a historical or foreign test fails, diagnose the cause and fix it within *Scope* before reporting. Do not report it as a plan failure until that diagnosis is recorded.
- Pause only in these cases:
  - A step is ambiguous and different interpretations change the result → `motivo=ambiguous`.
  - The plan's solution does not work (design issue) → `motivo=design`.
  - Work outside *Scope* is needed or specified behavior would change → `motivo=scope`.
  - A credential, access, or tool is missing → `motivo=access`.
  - `verify` fails in 3 runs → `motivo=verify`.
- Before a `PAUSED` with `motivo=ambiguous` or `motivo=access`, look for `Resuelto:` under the plan's *Decisions already taken*. Do not ask again about anything already marked `Resuelto:`; apply it as written.
- The `PAUSED` format (first line, then the issue and 2 or 3 options) is in the builder's *Return* section.
- On a blocker, run `node scripts/kit-nota.mjs <plan> blocked "<cause>"` once before returning; use `doing "<step>"` only if the user approves it after the measurement.

Do not guess; pause. Leave completed work intact.

## Evidence

In *Evidence*, include each verification command as `$ <comando>`, exactly as written in the plan, followed by its **real** output (the relevant tail, up to about 1.5 KB; never fabricated) and a final `exit N` line with the actual exit code. Add each entry immediately when checking off its corresponding step.

## When Done

- In *Notes*, record minor decisions and related issues you fixed.
- For states and the response's first line (`DONE` or `PAUSED`), see the builder's *Limits* and *Return* sections.
