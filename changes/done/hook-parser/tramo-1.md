# Tramo 1

## Steps

### Segment 1 — Story: el hook distingue comandos de texto
As the kit user I want the command split into structure so that quoted text and heredoc bodies are not read as commands.
Dependencies: Not applicable.
Contracts to keep: no existing file changes; no dependencies (Node built-ins only).
Paths likely to change: `scripts/hook-shell.mjs`, `tests/permissions-contract/hook-shell.test.mjs` (both new).
Concrete example of the expected result: `echo "$(git push)"` yields two command nodes (`echo`, `git push`) and `plano: false`; `cat >> a.md <<'EOF'` with body `git push` yields one node `cat`.
Scope: one new module and its test.
Files: scripts/hook-shell.mjs

#### Contract
`export function analizar(texto)` returns `{ ok: true, plano, comandos }` or `{ ok: false, motivo }`. It never throws.
- `comandos`: flat list of every command node at any depth: `{ palabras, asignaciones, redirecciones: [{ op, destino }], heredocs: [{ cuerpo, citado }] }`. `op` excludes the leading fd number; heredocs are not in `redirecciones`.
- Word: `{ texto, expansion, glob, baseDinamica }`. `texto` is after quote and backslash removal with adjacent parts joined (`".en""v"` → `.env`, `g\it` → `git`). `expansion`: `$name`, `${…}`, `$(…)`, backticks, `<(…)`, `>(…)`, `$((…))`, `$'…'`, `$"…"` (keep their source in `texto`). `glob`: unquoted `*`, `?`, `[…]` closed in the same word, `{a,b}`, `{1..3}`, leading `~`; lone `[`, `[[`, `{}` are literal. `baseDinamica`: expansion or glob after the last literal `/`.
- Operators: `; & && || | |&` newline; redirections `> >> < <> >| &> &>> >& <& <<<`, optional fd; heredocs `<<`, `<<-`, several per line.
- Heredoc is quoted if its delimiter has any quote or backslash: body untouched. Unquoted bodies: substitutions inside produce nodes.
- Recurse into `$(…)`, backticks (with their escapes), process substitution, `${…}` and `$((…))` contents, `(…)`, `{ …; }`.
- Keywords at command position: `if then elif else fi for in do done while until ! time`. A `for` header is not a node. `[[ … ]]` is one node starting with `[[`, inner operators as words. Redirections after `done`, `fi`, `)`, `}` give a node with empty `palabras`.
- `#` at word start is a comment. Backslash-newline (unescaped backslash) is literal inside single quotes and quoted heredoc bodies, ignored in comments, and joins lines only when the character before it is a space or tab. Anywhere else, including any line of an unquoted heredoc body ending with it → `ok: false`.
- Also `ok: false`: `$[` outside single quotes and quoted heredocs; a word at assignment or command position matching `^[A-Za-z_]\w*\[` (bash reads the subscript, so `<<` there is not a heredoc).
- `plano` is false if there is any compound keyword, `[[`, subshell, group, substitution, arithmetic or comment.
- `ok: false`: `case`, `select`, `coproc`, function definitions, arrays `x=(`, `((` command, `;;`, unterminated quote, substitution or heredoc, unbalanced parentheses or keywords, depth over 10, length over 100000.

WHEN a command has nested or chained commands THEN each one is a node and inert text is not (A1)
WHEN the text is unsupported or broken THEN the analyzer reports `ok: false` (A2)

Acceptance:
- A1: nodes, words, redirections, heredocs and `plano` follow the contract; check with `node --test tests/permissions-contract/hook-shell.test.mjs`; expect pass.
- A2: every unsupported form returns `ok: false` without throwing; check with the same test; expect pass.

TODO:
- [x] Write tests in `tests/permissions-contract/hook-shell.test.mjs` for every contract bullet (A1). Check: `node --test tests/permissions-contract/hook-shell.test.mjs`; expect failure, module missing.
- [x] Implement words, quotes, operators, redirections and heredocs in `scripts/hook-shell.mjs` (A1). Check: `node --test tests/permissions-contract/hook-shell.test.mjs`; expect those cases pass.
- [x] Add substitutions, groups, keywords and comments in `scripts/hook-shell.mjs` (A1). Check: `node --test tests/permissions-contract/hook-shell.test.mjs`; expect nested nodes pass.
- [x] Return `ok: false` for listed forms, 20000 nested `$(` and random truncations, in `scripts/hook-shell.mjs` (A2). Check: `node --test tests/permissions-contract/hook-shell.test.mjs`; expect all pass.
- [x] Fix the returned cases (`plan.md`, *Notes*) in `scripts/hook-shell.mjs`, adding each as a test (A1, A2). Check: `node --test tests/permissions-contract/hook-shell.test.mjs`; expect all pass.

Segment verification: `node --test tests/permissions-contract/hook-shell.test.mjs` — level 1; exit 0; covers A1, A2.
Handoff: pure module, never executes anything. Test strings are data inside the file. Example above. Resume at the first unchecked TODO.
