---
name: define-project
description: "Define a new project (an empty or nearly empty repository): asks up to 5 closed questions, writes `AGENTS.md` and `docs/proyecto.md`, prepares the root, and stops to wait for the user. Use when the folder has no `AGENTS.md` and no code."
---

# Define a New Project

A “new” project has no `AGENTS.md` and no code: only an empty folder, `README`, or `.git`. If code already exists, say so and use `prepare-project`.

Work in two stages. Do not combine them.

## First stage: ask (write nothing)

1. Read what the user said and what is already in the folder. Do not ask what the context already answers.
2. Ask up to 5 closed questions, each with 2 to 4 options. Put the recommended default first and label it “(Recomendada)”.
3. The first question is always: “¿Es un repo o un workspace con varios repos?”. Never decide this yourself, even if context suggests an answer.
4. Ask the remaining questions only about unknowns: stack, who uses the system, MVP scope, data and access (for example, login or email link), and deployment location. If the project has a UI, include “who uses it and what their frequent task is” among the questions, unless context already says so.
5. End the turn and wait for the answers. Until then, create no files or folders, and do not run `git init`.

## Second stage: write (using the answers)

Write only these items at the root:

- **`AGENTS.md`**: use the format and limit (about 40 lines) from section 1 of `prepare-project`. Mark `./verify` as pending: “(pendiente: lo crea el plan del esqueleto)”. List the kit skills on one line without descriptions.
- **`docs/proyecto.md`**: one page with these sections: Qué es, Para quién, MVP, Fuera de alcance, Decisiones (each with its reason). For a workspace, add “Repos” (folder and role). Also add “Despliegue” with its five lines (see section 5 of `prepare-project`); unknown items are “pendiente”, without invented values.
- **`changes/`**: a folder with `.gitkeep`.

Do not create child repository folders or code: those belong to the skeleton plan.

**For a repository:** plans use `repos: [.]`.

**For a workspace** (root without `.git` and child folders with `.git`; check using `find . -maxdepth 2 -name .git -not -path './.git'`): ask “¿Hacemos la raíz repo propio?” (recommended: “Sí”). Without an answer, do not run `git init`; state that it is pending. With “Sí”: run `git init` at the root and create `.gitignore` entries `/<folder>/` for each child with `.git`, plus `.claude/settings.local.json`. Never commit.

## Close

Respond with:

1. The exact paths of files written.
2. “Espero tu aprobación”.
3. The next step: if the project has a UI, run `design-experience` before the UI skeleton (it leaves `docs/experiencia.md` approved in the terminal); then create the skeleton plan (`./verify` with `prepare-project`, including `repos:`). Do not write that plan before approval.

Then stop.
