# State contract

## Canonical literal rules and correspondence

- `core/agents/builder.md`, “Non-negotiable limits”: “Work only when `status: approved`; otherwise stop without changes and report it.”
- `core/skills/plan-change/references/rules.md`, “States”: “`draft`: the planner writes it.”
- `core/skills/plan-change/references/rules.md`, “States”: “`approved`: the planner sets it after the user says “yes”.”
- `core/skills/execute-plan/SKILL.md`, “Before starting”: “Set `status: in progress`. Set `done` only when `verify` passed (for a segmented plan, its segment check); `partial` only with `PAUSED`; no other state. Closing belongs to the planner.”
- `core/skills/plan-change/references/rules.md`, “States”: “`done`: the builder sets it when `verify` passes. In a plan with segments, `done` means “segment completed and its verification passed”; the planner sets it back to `approved` with `segment: N+1` and, after the final segment, completes the full `verify`.”
- `core/skills/plan-change/references/rules.md`, “States”: “`partial`: the builder sets it when returning `PAUSED`.”
- `core/skills/execute-plan/SKILL.md`, “Segment”: “By default, an execution ends when the active segment is complete.”
- `core/skills/execute-plan/SKILL.md`, “Segment”: “Only with `continuity: continuous` may you continue through approved segments of the same story in one run; do not move on to another story.”
- `core/skills/execute-plan/SKILL.md`, “Segment”: “Advance only if verification passes, the work stays in Scope, and no user decision is needed. Keep `status: in progress` while advancing; when using `PAUSED`, set `status: partial`, with a resumable note describing progress, remaining work, and cause.”
- `core/skills/execute-plan/SKILL.md`, “Counting, context, and pausing”: “If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report `DONE`. The state stays `in progress` (it is not a product `PAUSED`); the planner reconstructs it and reapproves before resuming.”
