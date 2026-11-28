# Builder return contract

## Canonical literal rules and correspondence

- `core/agents/builder.md`, “Return”: “The first line of your final response is one of these. Omit `segment=<n>` when the plan has no `segment:`.”
- `core/agents/builder.md`, “Return”: “`DONE: plan=<path>; segment=<n>; verify=pasa`, then `cambios:`, `evidencia:` (command, `exit N`, `Fingerprint`), `decisiones:`, and `revisar:`; at most five lines in total.”
- `core/agents/builder.md`, “Return”: “`PAUSED: plan=<path>; segment=<n>; motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<exact step>; no_intentado=<reason>`, then `problema:`, `opciones:` (2 or 3 fixed options, one marked “(recommended)”), `cambios:`, and `retomar:`.”
- `core/agents/builder.md`, “Return”: “End your turn only with `DONE` or `PAUSED`; never end with a progress report, except on a cut-off warning, when the state stays `in progress` (see the skill).”
- `core/skills/execute-plan/SKILL.md`, “Counting, context, and pausing”: “If the harness warns that execution may be cut off, persist progress and the next action in *Notes*; do not report `DONE`. The state stays `in progress` (it is not a product `PAUSED`); the planner reconstructs it and reapproves before resuming.”
- `core/contracts/termination.md`, “Builder termination contract”: “`DONE: plan=<path>; [segment=<n>; ]verify=pasa` means success.”
- `core/contracts/termination.md`, “Builder termination contract”: “`PAUSED: plan=<path>; [segment=<n>; ]motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<step>; no_intentado=<reason>` requests a pause.”
- `core/agents/planner.md`, “Builder interface”: “Returns: `DONE: plan=<path>; segment=<n>; verify=pasa` and 5 lines at most, or `PAUSED: …; motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<step>; no_intentado=<reason>` and problem with options (plan `partial`). Interrupted: stays `in progress`.”
