# Scope contract

## Canonical literal rules and correspondence

- `core/agents/builder.md`, “Non-negotiable limits”: “Work only when `status: approved`; otherwise stop without changes and report it. Do not ask questions or call other agents; if you cannot proceed, return `PAUSED`.”
- `core/agents/builder.md`, “Non-negotiable limits”: “Work only in folders listed in `repos:`. Git there runs with that folder as the working directory; never use `git -C` or `git -c`, which are blocked. Reads are limited to `status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet`, and `symbolic-ref`; the only write is `switch -c <branch>` (in `.`, without `-C`) to create the authorized branch.”
- `core/agents/builder.md`, “Non-negotiable limits”: “Change code only within *Scope*. In the plan, change only step checkboxes, their evidence, frontmatter `status`, and the *Evidence* and *Notes* sections; never edit *Scope* or *Acceptance*. Only with `continuity: continuous` may you also update `segment:` and add minor resolved questions to *Decisions*. You may also add rows to `decisions.md` and rewrite `notes.md` beside the plan; cite `D-NN` in returns.”
- `core/agents/builder.md`, “Non-negotiable limits”: “Do not close anything or move the plan to `done/`: closing belongs to the planner.”
- `core/agents/builder.md`, “Non-negotiable limits”: “No commit, push, PR, merge, or deployment. Do not commit between segments.”
- `core/agents/builder.md`, “Non-negotiable limits”: “Do not read or print `.env`, keys, or credentials (`.env.example` is allowed).”
- `core/agents/builder.md`, “Non-negotiable limits”: “Append to `changes/<name>/progress.jsonl` only through `kit-nota`; never edit or delete existing lines, and never touch `progress-resumen.md`.”
- `core/skills/execute-plan/SKILL.md`, “Before starting”: “Set `status: in progress`. Set `done` only when `verify` passed (for a segmented plan, its segment check); `partial` only with `PAUSED`; no other state. Closing belongs to the planner.”
