---
name: migrate-project
description: "Complete a project's v1-to-v2 migration after `bash install.sh --migrate <project>`: shorten its AGENTS.md, propose its verify command, and turn in-progress work into draft plans. Use after running --migrate on a project."
---

# Migrate a Project from v1 to v2

`install.sh --migrate` has already moved v1 files to `old/v1/` (without deleting them), removed the v1 hook, installed the `planner` agent and deny rules, and created `changes/`. This skill does what the script cannot: understand the project and prepare it for v2 work.

Do not do here, without asking, anything the script did not do: do not touch `src/`, delete anything in `old/v1/`, or commit, push, or create a PR.

## 1. In-progress work

Run `bash install.sh --migrate <proyecto> --dry-run` if its output is not available. Its “Trabajo a medias” section lists:

- tasks in `old/v1/features/*/task-*.md` with status `aprobada`, `in progress`, or `bloqueada`;
- features in `old/v1/definitions/BACKLOG.md` whose Estado is not `hecha` or `completada`.

That list is the only inventory. Do not open `old/v1/registro/`; read it only if the user explicitly asks.

## 2. Workspace (if applicable)

If `install.sh --migrate` printed “Workspace: repos hijos: …”, the root is a workspace. Load `prepare-project`, section 4, and follow its own-repository rule.

- If the root is not a repository, ask the user in their current language using closed options (recommend “yes”). Do not run `git init` without their answer.
  - Yes: run `git init` at the root and create `.gitignore` as described in that section. Do not commit.
  - No: the root remains outside a repository; its plans use `repos: [.]` and do not get a branch.
- If the root is already a repository, or there are no child folders with `.git`, this section does not apply.

## 3. AGENTS.md

Read `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, and `STATUS.md` (only what is needed; continue without any file that does not exist). Use them to write a root `AGENTS.md` for the project, about 40 lines maximum, using the `prepare-project` format: what the project is, structure and stack, commands, the line `Verificar todo desde cero: ./verify`, and rules (agents do not commit, push, create PRs, merge, or deploy; do not read `.env` or keys; branches `feature/`, `fix/`, `chore/`, `docs/`).

Preserve from the old `AGENTS.md` and `old/v1/definitions/`: what the project is, its structure, stack, commands, domain-specific constraints, and v2 hard rules (no commit, push, PR, merge, or deployment; do not read `.env` or keys).

Discard `STATUS.md` and `BACKLOG.md` as workflow, feature branch names (`Fxx`), branch confirmations, coordinator, tasks, gates, “yolo,” and similar v1 workflow rules. Do not copy or paraphrase them: a copied workflow rule still gives a subagent reason to hesitate. If a v1 workflow rule seems useful, do not carry it over; the user decides (see the list below).

At the end of this section, write “Reglas de v1 que descarté”: list each workflow rule you left out on its own line, or write “ninguna” if there were none. Always show the list, even when empty, because the user confirms it. If you write `docs/proyecto.md` (section 4), include the same list under “Descartado”.

If a root `AGENTS.md` already existed (the script warns “AGENTS.md sigue siendo de v1” if it mentions `definitions/`, `features/`, or `registro/`), do not replace it without an answer. Ask the user using closed options:

1. New short `AGENTS.md` (recommended): replace the old one after approval.
2. Keep the old file, changing only links `definitions/`, `features/`, and `registro/` to `old/v1/…`. Do not rewrite rules: only fix links and list any workflow rules you find under “Reglas de v1 que descarté”, unchanged, for the user to decide. This is the only exception to discarding them.

## 4. docs/proyecto.md

If any of `old/v1/definitions/PROJECT.md`, `REPOS.md`, or `ARCHITECTURE.md` exists, write a condensed (one-page) `docs/proyecto.md` from the files that exist; continue without missing files. **Never write it from scratch.** At the end, add a `Descartado` section listing what you left out and why. If none of those files exists, do not create `docs/proyecto.md`.

## 5. Comando verify

Load `prepare-project` and follow its `verify` step. Propose the command based on what the project already has (scripts, Makefile, tests). **Do not invent one**: if you cannot test it from scratch (clean build, startup, and a real user journey), record it as a pending plan in `changes/` and tell the user.

## 6. Convert in-progress work into plans

For each item from section 1, create a plan with `plan-change` at `changes/<name>/plan.md` and set `status: draft`. Create one plan per item, using a short lowercase hyphenated name. Each plan needs `repos:` in its frontmatter: use the folder from the v1 task's `repo:` column, if present; use `[.]` for a single repository and also when the item affects only the root. Cite only paths you have inspected and confirm they exist in the current project; if an `old/v1/` path is no longer valid, say so in the plan instead of copying it.

If an item is too large for one plan, do not split it silently: record it in the plan as awaiting a user decision.

## 7. User approval gate

When finished, stop. Briefly summarize what is in `AGENTS.md`, whether `verify` exists or is pending, and the list of draft plans. Include the `Reglas de v1 que descarté` list (or `ninguna`) and ask the user to confirm it; they can restore a useful rule manually. The user approves plans one by one (changing `status: draft` to `approved`); do not approve or execute them yourself.

If this skill is used by a Pi subagent, declare it under `skills:` in the calling agent. No agent under `core/agents/` currently uses it.
