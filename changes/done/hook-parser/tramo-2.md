# Tramo 2

## Steps

### Segment 2 — Story: la decisión sigue la tabla aprobada
As the kit user I want mentions allowed and protected commands denied so that notes can be written without weakening protection.
Dependencies: Segment 1 — `analizar()` passing its tests.
Contracts to keep: `accionProtegida` and `META` unchanged; in `permissions-hook.mjs` the only edit is adding `export` to `esSecreto`.
Paths likely to change: `scripts/hook-decidir.mjs`, `scripts/permissions-hook.mjs`, `tests/permissions-contract/hook-decision.test.mjs`.
Concrete example of the expected result: `cat >> n.md <<'EOF'` with body `git push` → `normal`; `echo ok&&git push` → `deny`; `$x push` → `ask`.
Scope: evaluator and one export.
Files: scripts/hook-decidir.mjs, scripts/permissions-hook.mjs

#### Contract
`export function evaluar(comando, { textual, secreto })` returns `"deny" | "ask" | "normal"`. No import of `permissions-hook.mjs`.
1. `r = analizar(comando)`. If `!r.ok`: `deny` when `textual(comando)`, else `ask`.
2. Examine every node (worst result wins). Any `deny` → `deny`.
3. If `textual(comando)`: `normal` only if the line is inert and step 2 gave `normal`; else `deny`.
4. Otherwise return step 2. Any thrown error: `deny` if `textual`, else `ask`.

Node examination:
- Any redirection target or assignment value that is `secreto` → `deny`.
- Inert names, exact first word without `/`: `cat echo printf grep rg mkdir ls wc head tail true`. Their data is not secret-checked: all `echo`/`printf` arguments, and the `grep`/`rg` pattern (first non-option) only when every option is allowed below. Their other words are secret-checked. Nothing else applies.
- Other nodes: first word `baseDinamica` → `ask`. Any word `secreto`, or equal (lowercase) to `deploy`/`deployment` → `deny`.
- Any word with basename `git` (lowercase): later `commit`, `push` or `merge` → `deny`; later `-c` value or `--config-env` starting `alias.` (also glued) → `deny`; subcommand (skipping options and the values of `-C -c --git-dir --work-tree`) with expansion → `ask`.
- The next three rules, like `git`, apply to a matching word at **any** position (`env`, `sudo`, `timeout`, `command`, `find -exec` wrappers).
- Basename `gh`: later `pr` followed later by `create` or `merge` → `deny`; one of the first two non-option arguments after it with expansion → `ask`.
- Basename `bash`, `sh`, `zsh`: read the following options (`-…`, `+…`), skipping the value of any short one containing `o` or `O`; if a short `-` option contains `c`, the next non-option word is a script: expansion → `ask`, else `evaluar` it recursively. Heredoc bodies and `<<<` words of that node are evaluated the same way.
- Word `eval`: any later argument with expansion → `ask`, else evaluate the later arguments joined.

Inert line (all must hold): `r.plano`; every node has an inert first word and no assignments; no word or target with `expansion` or `glob`; `printf` first argument does not start with `-`; `grep` options match `-[ncilEFwoqhHxvs]+` or `--`; `rg` options match `-[ncilFwoqx]+` or `--`, with at least one path; no `grep` or `rg` path starts `/`, `~` or has a segment starting `.`; if the `grep`/`rg` pattern is `secreto`, at least one path and all ending `.md`, `.txt` or `.log` (here `grep` also reads folders and hidden files); `mkdir` options only `-p`; redirections only `<`, `<<<`, fd duplication (`2>&1`), and `>`/`>>` to `/dev/null` or a path, relative or absolute, ending `.md`, `.txt`, `.log` without `..` or segments starting `.` (a leading `./` is fine); unquoted heredoc bodies contain no `$`, backtick or backslash.

WHEN any command in the table is evaluated THEN the decision matches it (A3)
WHEN a protected action appears chained or substituted THEN it is denied (A4)
WHEN analysis fails THEN the result is never `normal` (A5)

Acceptance:
- A3: `node changes/hook-parser/comparar.mjs`; expect `tabla: 97/97`, only P1–P9 relieved, exit 0.
- A4: matrix of `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `cat .env`, `bash -c 'git push'`, `git -C . push`, `git -c a.b=c commit`, `vercel deploy`, each alone and after `&&`, `||`, `;`, `|`, newline, glued `&&`, inside `$(…)`, quoted `$(…)`, backticks, `(…)`, `<(…)`; check with the segment test; expect all `deny`.
- A5: unparsable strings and a `textual` or `secreto` that throws never give `normal`; check with the segment test; expect pass.

TODO:
- [x] Add `export` to `esSecreto` in `scripts/permissions-hook.mjs` (A3). Check: `node --test tests/permissions-contract/hook.test.mjs`; expect 6 pass.
- [x] Write table copy, matrix and failure cases in `tests/permissions-contract/hook-decision.test.mjs` (A4, A5). Check: `node --test tests/permissions-contract/hook-decision.test.mjs`; expect failure, module missing.
- [x] Implement the contract in `scripts/hook-decidir.mjs` (A3). Check: `node changes/hook-parser/comparar.mjs`; expect `tabla: 97/97`, exit 0.
- [x] Complete `scripts/hook-decidir.mjs` until the matrix passes (A4). Check: `node --test tests/permissions-contract/hook-decision.test.mjs`; expect pass.
- [x] Fix the returned cases (`plan.md`, *Notes*, *Revisión 2*) in `scripts/hook-decidir.mjs`, each as a test (A3, A4). Check: `node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs`; expect pass.

Segment verification: `node --test tests/permissions-contract/hook-decision.test.mjs && node changes/hook-parser/comparar.mjs` — level 1; exit 0; covers A3, A4, A5.
Handoff: the table is `casos.mjs` (read only). Copy its cases and expected values into the test; do not import from `changes/`. Never loosen a rule to make a case pass.
