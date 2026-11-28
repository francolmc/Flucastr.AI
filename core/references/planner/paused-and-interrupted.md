# Paused and interrupted builder

When the builder does not finish (`PAUSED`, a crash, or an interruption), follow this ladder. Take the cheapest step that works; the first step that applies is the next one. `kit run` runs it by itself. In the subagent flow, the planner runs `node "<kit-root>/scripts/kit-escalera.mjs" <plan> --salida <file> --herramienta <claude|pi|codex> --raiz <project>` with the builder's return or error; the command prints class, action and step, and records the attempt in `changes/<name>/runs.jsonl`. Pass a reviewer's return as `PAUSED: …; motivo=verify; <defecto>`. After review, close the segment with `--resuelto`, plus `--paso 3` or `--paso 4` when the DONE comes from that step. `kit run` writes `resuelto_por` on its DONE line; in the subagent flow, `--resuelto` writes it.

## Classes

Classify before acting. Class names are the ones `kit run` writes to `runs.jsonl`:

- `infra`: the process died (thrashing, `invalid_request`, or a cut by the builder's or reviewer's limit).
- `entorno`: space, Docker, permissions, browser, usage limit, network, or a timeout cut in the check.
- `plan`: the builder reports scope, or a result that does not match the plan (`motivo=scope`, or an unknown reason).
- `decision`: the builder asks for a decision (`motivo=ambiguous` or `design`).
- `tarea`: a verification, gate, or reviewer failure (`motivo=verify`, `RETURNED`).

## The steps

### Step 0: infra, entorno, plan, decision

- `infra` repeats with the same model while attempts remain. It counts against the two-relaunch limit and does not advance the step.
- `entorno`, `plan` and `decision` return to the person with a one-line diagnosis in *Notes* and a closed question naming the concrete action; none relaunches from the ladder automatically. For `plan`, correct the exact `Scope`, segment, or `A#` in `changes/`, show the change in at most five lines, and ask for an explicit yes to relaunch; after that yes, set `status: approved` and relaunch. For `entorno`, ask whether the person will fix the named environment issue; for `decision`, present the unresolved choices and ask which decision to record in `changes/<name>/decisions.md` (without that file, `Resuelto:` in the plan). Relaunch only after that action is confirmed and the plan is approved.

### Step 1: first task failure

Relaunch with a handoff: the last error (up to ten lines), the files changed, and the check states.

### Step 2: second task failure

The run stops and asks for advice. The planner writes one line `Consejo (tramo N): …` in *Notes*, at most 500 tokens (2000 characters), and relaunches. This is the second relaunch.

### Step 3: higher level (needs a yes)

After two relaunches are used, including any counted `infra` relaunches, continue here when at least one failure was `tarea` (including `RETURNED`): the builder may run one level higher, one relaunch more. Ask one closed question offering this step or `partial`; require the person's explicit yes every time. Do not offer step 3 when two relaunches are not used or there was no task failure. Claude Code raises the level through the subagent's `model` parameter, for that launch only. Codex uses `kit run --paso 3`. Pi has no single-launch mechanism (`kit run` maps only Codex): describe that limit and offer `partial` unless the person can explicitly authorize an applicable way to launch step 3. A step 3 that fails by task closes the ladder and makes step 4 eligible.

### Step 4: relief to the planner (needs a yes)

Only after a step 3 that failed by task. The planner takes the remaining work. Ask one closed question offering step 4 with the estimate from `--tokens entrada,caché,salida` (builder and planner, labeled as estimate; «sin tarifa» when there is no rate), or `partial`. Do not offer step 4 before that failure. Without an explicit yes to step 4, nothing runs. If the relief finishes DONE, close with `--resuelto --paso 4`.

`infra`, `entorno`, `plan` and `decision` never get relief.

## Always

- Before any relaunch, pick one of the `PAUSED` options or fix the cause, and set `status: approved`. A vague `PAUSED` is not a repeated block: relaunch once with a narrower segment.
- After a deadline interruption, clean up only Docker resources belonging to this project's `verify`; never run `docker system prune`, which would remove resources from other projects.
- After `PAUSED` or interruption, do not trust checkboxes: reconstruct state with `git status` and `git diff --stat` in each `repos:` folder and record it in *Notes* before relaunching.
- Do not edit `models.json` to change the level.
- Before relaunching or asking about an `ambiguous` or `access` pause, search `changes/<name>/decisions.md`: if an `active` row answers it, relaunch citing its ID and do not ask again; a changed answer is a new row that supersedes the old one.
