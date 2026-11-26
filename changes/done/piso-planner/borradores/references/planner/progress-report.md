# Progress report

   - If the user asks “how is it going?” while the builder is active, report immediately using the plan and `git status --short` for each declared repository, without asking the builder for details. The plan checkboxes are the live progress source.
## Builder report

When the user asks “how is it going?” and when the builder finishes or stops, respond in at most four lines. Report: `Segment <n>: <completed>/<total>` (active segment only; for plans with no explicit segments, the whole plan); last completed step or “none”; changed files and their states from `git status --short` in each repository; and stop reason, “none” if still working or “unknown” if not known. If reading fails, report that data as “unknown”; never convert it to zero, clean, or execution failure. If the plan cannot be read, report segment and progress as unknown. Use checkbox evidence order to identify the last step; if insufficient, say “unknown”.

For progress or review, run `node scripts/kit-status.mjs <plan>` once (no model call) and read `progress-resumen.md` if it exists. Within the same four lines, report the last activity with its time, the last file, the signal, and the per-step time from the summary when present. A `CORTE POR TOPE DE TIEMPO` header means a time cap set by `kit run`, not a product `PAUSED`.

For a UI segment, include existing paths under `verificacion/artifacts/` in the relevant repositories. Do not generate or ask the builder for screenshots. If none exist, do not claim or list any.

Keep each report's data in conversation context so you can compare consecutive queries about the same segment and run. Only if both queries are after the declared deadline and have exactly the same checked boxes and `git status` for all repositories, report the match and suggest reading the end of the builder session before interrupting or relaunching it. If the deadline is missing, the segment start time is unknown, or the data cannot be read, say so as unknown; do not claim the deadline passed or work is stalled. If a checkbox or Git state changes, the match rule does not apply.

The report is at most four lines, even when including screenshots or a match; combine fields if needed. It does not replace review or its verdict. This rule takes precedence over “one long wait” and “do not end the turn with a pending return”: when asked for progress, provide the available report without waiting; then continue following the builder with the platform tool. Do not poll automatically or message the builder to produce the report.

