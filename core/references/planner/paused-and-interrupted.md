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
- `entorno`, `plan` and `decision` return to the person with a one-line diagnosis in *Notes*, with no relaunch from the ladder. The person fixes the environment, the scope, or the decision (writes it as `Resuelto:` in the plan), and relaunches.

### Step 1: first task failure

Relaunch with a handoff: the last error (up to ten lines), the files changed, and the check states.

### Step 2: second task failure

The run stops and asks for advice. The planner writes one line `Consejo (tramo N): …` in *Notes*, at most 500 tokens (2000 characters), and relaunches. This is the second relaunch.

### Step 3: higher level (needs a yes)

When the ladder is exhausted (two relaunches used and at least one task failure), the builder may run one level higher, one relaunch more. Ask for the person's explicit yes, every time. Claude Code raises the level through the subagent's `model` parameter, for that launch only. Codex uses `kit run --paso 3`. Pi has no single-launch mechanism (`kit run` maps only Codex): present it to the person as a decision. A step 3 that fails by task closes the ladder.

### Step 4: relief to the planner (needs a yes)

Only after a step 3 that failed by task. The planner takes the remaining work. Ask one closed question with the estimate from `--tokens entrada,caché,salida` (builder and planner, labeled as estimate; «sin tarifa» when there is no rate). Without an explicit answer, nothing runs. If the relief finishes DONE, close with `--resuelto --paso 4`.

`infra`, `entorno`, `plan` and `decision` never get relief.

## Always

- Before any relaunch, pick one of the `PAUSED` options or fix the cause, and set `status: approved`. A vague `PAUSED` is not a repeated block: relaunch once with a narrower segment.
- After a deadline interruption, clean up only Docker resources belonging to this project's `verify`; never run `docker system prune`, which would remove resources from other projects.
- After `PAUSED` or interruption, do not trust checkboxes: reconstruct state with `git status` and `git diff --stat` in each `repos:` folder and record it in *Notes* before relaunching.
- Do not edit `models.json` to change the level.
