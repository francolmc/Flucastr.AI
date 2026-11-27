---
name: execute-plan
description: "Execute an approved plan in `changes/<name>/plan.md`: follow its steps, fix issues within scope, run `verify`, and record real evidence. Use when building."
---

# Execute a plan

The limits and return format are in the builder contract (core/agents/builder.md in the kit root, path in ~/.flucastr-ai/raiz); if it is not in your context, read it before any change. Input: the plan path.

## Before starting

1. Read the complete plan one segment at a time.
2. If the task includes `Branch:`, for each folder in the frontmatter's `repos:` and only those, run every `git` command with `<folder>` as the command's working directory (for `.`, the root):
   - No `.git` in `<folder>`: note it in *Notes* and continue.
   - `git branch --show-current` already returns the requested branch: continue.
   - The branch exists (`git rev-parse --verify --quiet refs/heads/<branch>` in `<folder>`): `PAUSED` with `motivo=access`.
   - Check the base branch (`base:`; if absent, `git symbolic-ref --short refs/remotes/origin/HEAD`; without a remote, `main` or `master`). `git status` and `git diff` must show no changes outside `changes/<name>/`; otherwise `PAUSED` with `motivo=access`.
   - If the checks pass, create only the authorized branch: `git switch -c <branch>` in `<folder>`.
   - No `repos:`: `PAUSED` with `motivo=ambiguous`.
3. Set `status: in progress`. Set `done` only when `verify` passed (for a segmented plan, its segment check); `partial` only with `PAUSED`; no other state. Closing belongs to the planner.

For `type: docs`, when finished confirm with `git diff --name-only <base>` that only `*.md` files or files under `docs/` changed; otherwise `PAUSED` with `motivo=scope`.

## Segment

If the plan frontmatter contains `segment: <n>`, execute that segment. In the new format, `### Segment N — Story: ...` identifies a self-contained story: read its user/value, dependencies, scope, WHEN/THEN, `A#` criteria, TODO items, and *Handoff*. Use the Handoff to guide implementation and review; check each referenced `A#` and execute only that story's TODO items. Declared dependencies must be complete before starting; otherwise stop, record where to resume, and return `PAUSED` with `motivo=ambiguous`. For older plans, follow their existing steps and acceptance criteria. Read each `tramo-<n>.md` just before using it.

By default, an execution ends when the active segment is complete. Only with `continuity: continuous` may you continue through approved segments of the same story in one run; do not move on to another story. After each segment, add a checkpoint to *Notes* with files changed, a diff summary, and the check result. When the story (without continuity, the segment) is complete, stop for the planner's review in a fresh context: `/compact` or a new session. If the plan declares `Revisión: por tramo`, wait for that review before continuing. For plans without continuity, preserve their existing procedure and content.

In continuous mode, a check that fails twice for the same cause pauses (`motivo=verify`): after the first failure, diagnose and fix only within scope; if the same cause returns, pause with completed work, remaining work, and reason. Also pause if work must leave scope or requires a user decision. If no prior duration is recorded for the exact check in an equivalent environment, cap it at 3 minutes (Comprobación rápida, level 1) or 10 minutes (Verification, levels 2–3) and record the real duration. With one, limit the check to twice it, for example `timeout <2x-segundos>s <comando>`; if it expires, leave the checkbox pending and pause with `motivo=verify`. A check that takes more than twice its measured duration also pauses with `motivo=verify`. Record minor in-scope decisions under `Decisions` and continue; you may update `segment:` while advancing within the same story. Advance only if verification passes, the work stays in Scope, and no user decision is needed. Keep `status: in progress` while advancing; when using `PAUSED`, set `status: partial`, with a resumable note describing progress, remaining work, and cause. The planner reviews the note and reapproves the plan before resumption.

Use the `Segment verification:` line for its check; if this is the plan's final segment, also run the complete *Verification*. Without `segment:`, the plan has one segment. When a story ends, leave a summary for the planner.

## Execution loop

For each `- [ ]` step, in order:

- Group independent reads for a step into one call and read each file once; read in chunks (`offset`, `limit`); rereading relevant material after edits or recovery is allowed. Edit files with `edit`.
- Workflow: read the file to change; capture its starting state with a command and record the output; make the smallest in-scope change (never omit, defer, or simplify requested work); rerun the same command and compare it with the recorded output.
- After each coherent unit and at each segment's close, run the `Comprobación rápida` from `AGENTS.md` (Level 1, no Docker) if present; otherwise the step's check. Run the full *Verification* once, at the end, and `Segment verification:` at its declared level.
- As soon as a step is complete and its check passes, mark `- [x]` and add its evidence to *Evidence* before starting the next step; do not accumulate checkboxes until the end of the segment. Never mark a step whose check failed.
- If a step has no explicit check, leave it unchecked and add a *Notes* line naming the step and the missing check; do not invent one or claim completion. If interrupted or incomplete, leave it unchecked and record the exact resumption point in *Notes*.
- Count pending items with the `bash pendientes-plan` block below, passing the plan path as `$1`; record the count. A read error is not zero. Continue with pending work unless an allowed blocker applies.
- Fix related issues within scope and record them in *Notes*; record minor decisions there too (with continuity, under *Decisions*).
- With `decisions.md`, add decisions as new rows there instead; rewrite `notes.md` (its headings, ≤15 lines) per segment and before pausing.
- Long output (builds, `verify`, listings): show only the tail and errors; use quiet options when available.
- Wait for long commands (`verify`, builds) with one call. Claude Code: maximum `timeout` or `run_in_background`, then wait for its notice. Pi: `bash` timeout. Codex: `exec_command` in an `exec` cell; if it returns “Script running with cell ID N”, make one `wait` call with that `cell_id` and `yield_time_ms: 300000`; if it returns a `session_id`, make one `write_stdin` call with empty `chars` and `yield_time_ms: 1800000`, repeating only while the command still runs, never every few seconds. Never loop with `sleep`, `tail`, or status polling.
- For browser or container validation, use a fixed repository script (`./scripts/<name>.sh` or `./verify`) that runs all journeys and captures in one pass; do not chain standalone `docker run` or `compose run` calls.

### Canonical counter

```bash pendientes-plan
#!/usr/bin/env bash
set -e
awk '
  /^- \[ \]/ { n++ }
  END { print n+0 }
' "$1"
```

## Proportional tests

- Test only what you created or modified and its direct dependents: for each A#, the happy path and that criterion's edges.
- At most one regression test per bug.
- Every test exercises the real product; a fixture may feed it but never replaces or rewrites what is under test.
- While building, run only the tests related to the diff (import graph or the runner's related-tests option; otherwise the test files covering the changed paths). The final gate runs the full suite.
- This never narrows a declared command: Check, Segment verification:, and Verification run exactly as written.

## Final Verification

After the other steps are complete, run the *Verification* command **exactly as written** before checking off its specific step. Local unit checks do not count against the two runs; do not repeat an identical suite without a change or new diagnosis.

- If it passes, record the real output and check off the step.
- If it fails, find the root cause within the full scope, fix it, and rerun. Before relaunching after a failure, run `node scripts/kit-verificado.mjs estado --nivel <nivel>` (the level of the *Verification*): exit `3` means the same tree already failed, so do not relaunch it as a new run; fix the cause first. Exit `0` after an earlier success means the tree is already verified; do not repeat it.
- Next to each command in *Evidence*, note the `Fingerprint: <12 hex>` line that the CLI prints.
- **Limit:** 2 runs of *Verification*. A second failure, or the same correction applied twice, returns `PAUSED` with `motivo=verify`, a diagnosis, and handoff; no third attempt.
- Finish only when acceptance requirements are met, final verification passes, and no steps remain pending. Checkboxes report progress; they are not independent evidence.

## Counting, context, and pausing

- If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report `DONE`. The state stays `in progress` (it is not a product `PAUSED`); the planner reconstructs it and reapproves before resuming.
- If a historical or foreign test fails, diagnose and fix it within *Scope* before reporting; do not report it as a plan failure until that diagnosis is recorded.
- Pause only for these motives: `ambiguous` (a step is ambiguous and interpretations change the result); `design` (the plan's solution does not work); `scope` (work outside *Scope* is needed or specified behavior would change); `access` (a credential, access, or tool is missing); `verify` (any command or correction that fails twice, or the same correction applied twice, with no third attempt; in continuous mode, a check fails twice for the same cause).
- Before a `PAUSED` with `motivo=ambiguous` or `motivo=access`, search `decisions.md` (without it, `Resuelto:` under *Decisions already taken*); apply it if `active`; do not ask again.
- On a blocker, run `node scripts/kit-nota.mjs <plan> blocked "<cause>"` once before returning; use `doing "<step>"` only if the person already approved it after the measurement; never ask for that approval.
- Do not guess; pause. Leave completed work intact.

## Evidence

In *Evidence*, include each verification command as `$ <comando>`, exactly as written in the plan, followed by its **real** output (the relevant tail, up to about 1.5 KB; never fabricated) and a final `exit N` line with the actual exit code.
