# Tramo 3

## Steps

### Segment 3 — Story: el hook real aplica la nueva decisión
As the kit user I want the live hook to use the evaluator so that the false positive disappears in my sessions.
Dependencies: Segment 2 — `evaluar()` passing table and matrix.
Contracts to keep: `allow` only through `comandoSeguro` (unchanged, still first); non-string command → `ask`; deny message `acción protegida: la hace la persona usuaria`; `onFailure: "block"`; install, remove and audit unchanged; non-Bash tools get no decision.
Paths likely to change: `scripts/permissions-hook.mjs`, `verify`, `tests/permissions-contract/hook.test.mjs` (only additions; no existing test changes).
Concrete example of the expected result: the real hook gives no decision for the heredoc note, `deny` for `echo "$(git push)"`, `ask` for an unclosed quote.
Scope: wiring and one new `verify` step.
Files: scripts/permissions-hook.mjs, verify

#### Contract
- In `decidir`, after `comandoSeguro`: call `evaluar(cmd, { textual: accionProtegida, secreto: esSecreto })` inside `try`; on error use `deny` if `accionProtegida(cmd)`, else `ask`; if that also throws, `deny`.
- `deny` → current message. `ask` → `respuesta("ask", "el hook no pudo comprobar este comando: confírmalo")`. `normal` → no output.
- This is one complete edit of the file: it is live. Right after it, run the hook tests. If Bash gets blocked, repair the file with the edit tools.
- `verify`: add step 25 before `VERIFY OK`, in the style of step 24, running `tests/permissions-contract/hook.test.mjs`, `hook-shell.test.mjs` and `hook-decision.test.mjs` with `fallo "25: …"`.

WHEN Claude Code asks the hook about a table command THEN it answers as approved, and `./verify` runs the hook tests (A6)

Acceptance:
- A6: `node changes/hook-parser/comparar.mjs --hook`; expect `tabla: 97/97`, exit 0; the 6 previous tests pass unmodified; step 25 in `verify` runs the three hook suites.

TODO:
- [x] Add real-process cases to `tests/permissions-contract/hook.test.mjs`: heredoc `normal`, substitution `deny`, unclosed quote `ask`, declared command still `allow` (A6). Check: `node --test tests/permissions-contract/hook.test.mjs`; expect new cases fail.
- [x] Wire `evaluar` in `scripts/permissions-hook.mjs` (A6). Check: `node --test tests/permissions-contract/hook.test.mjs`; expect all pass.
- [x] Add step 25 to `./verify` (A6). Check: `bash -n ./verify`; expect exit 0.

Segment verification: `node --test tests/permissions-contract/hook*.test.mjs && node changes/hook-parser/comparar.mjs --hook` — level 1; exit 0; covers A6.
Handoff: `decidir` is near line 244. Example above. Never edit `.claude/` settings or deny rules.
