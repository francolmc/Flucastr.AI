---
name: planificar-cambio
description: "Write a change plan in `cambios/<name>/plan.md`, the only document the constructor receives. Use when work has multiple steps or crosses layers (web, API, database)."
---

# Plan a Change

The plan is the **handoff** between you and the constructor. The constructor is a small model that did not see your conversation; it only knows what is written down. Write the plan so it does not have to guess.

## Before Writing

- Work as a conversation: explore what exists and what remains unknown; evaluate options and cost; confirm the decision with the user; then write stories for the constructor to build and iterate on.
- Ask all behavioral questions during Exploration, before Validation and before writing stories. If a later question could change the result, return to Exploration, ask, and update the plan before continuing.
- You may skip a phase if the change is small or clear. State in one line which phase you are skipping and why; do not skip a necessary decision.
- Explore and investigate until you have real evidence: read files and confirm paths. Never cite a file in the plan that you have not seen. Run checks when they provide evidence relevant to the change.
- If the change crosses layers, **one plan** must cover the complete flow. Do not create one plan per file or layer.

## Template

Create `cambios/<name>/plan.md` (a short lowercase name with hyphens):

```markdown
---
estado: borrador
rama: feature/<nombre>
base: <rama>   # opcional; sin ella, la principal del remoto
repos: [<carpeta>, ...]
ejecutor: constructor   # principal solo si la persona usuaria lo pidió
tramo: 1   # solo en planes por tramos: el tramo que ejecuta el constructor (regla 11)
continuidad: continua   # opcional: habilita al constructor a avanzar por los tramos aprobados
tipo: codigo   # docs si el cambio solo toca documentos (regla 12)
---
# <Cambio>

## Objetivo
One or two sentences: what will work and for whom.

## Exploración
What exists, what remains unknown, and the evidence reviewed. Record all behavioral questions and their answers here. If the topic is large or unfamiliar, expand the research in `exploracion.md` and link it; otherwise, keep the record in this plan.

## Evaluación
Options considered, benefits, cost and risk, and the recommended option. For clear changes without relevant alternatives, say so in one line.

## Supuestos
List each assumption on its own line and state what changes if the user corrects it. If there are no assumptions, write “None”.

## Decisiones ya tomadas
Confirmed decisions and their reasons, one per line. Include `Ejecutor: <who>, porque <answer from the executability test>`.

## Decisiones
Minor questions resolved during execution, one per line with the reason. Product or scope decisions remain with the user.

## Validación
What the user confirmed and when. Do not introduce new questions here: if a decision that changes the outcome still needs confirmation, return to Exploration. Without explicit approval, the plan remains a draft.

## Alcance
Product folders and files the constructor may change. Use one branch for the entire feature. Each story declares its scope and lists at most three product files; split additional files into ordered stories. Include the complete cross-layer flow (code, manifests, lockfiles, Dockerfiles, configuration). Anything not listed is out of scope.

## Verificación
`<command>` — the command that defines “done”. It must run from a clean start and fail if anything fails.

## Condiciones de parada
In continuous mode, continue if the check passes, the next step remains within Alcance, and no user decision is needed. Stop with a note describing completed work, remaining work, and the reason if the same cause fails twice, work must leave Alcance, a user decision is missing, or a check takes more than twice its measured duration. Record minor in-scope questions under `## Decisiones` and continue.

## Pasos

Each story is a `### Tramo N — Historia: <outcome>` and can be built and checked on its own against the base, except for declared dependencies. Order stories so dependencies come first. Each story includes the following fields:

```markdown
### Tramo 1 — Historia: <resultado útil>
Como <usuario> quiero <capacidad> para <valor>.
Dependencias: ninguna («No aplica») | Tramo <N> — <resultado requerido y motivo> | Externa — <sistema, herramienta, requisito o contrato externo necesario y motivo>; identifica las dependencias reales.
Contratos a conservar: <interfaces y comportamientos que deben mantenerse; o «No aplica»>.
Rutas susceptibles de cambio: <rutas concretas que probablemente cambien; si una prueba usa una ruta, indica si puede moverse o archivarse y qué prueba debe actualizarse; o «No aplica»>.
Ejemplo concreto del resultado esperado: <acción o entrada y resultado observable; o «No aplica»>.
Alcance: <hasta tres archivos de producto; identificar cuáles>
Archivos: <rutas de los archivos de producto, separadas por comas>
CUANDO <situación> ENTONCES <resultado observable> (A1)
Aceptación:
- A1: <resultado verificable>; comprobar con <comando o revisión y qué mirar>; esperar <resultado>.
TODO:
- [ ] <acción en archivo/ruta> (A1). Comprobación: `<comando o señal>`; esperar <resultado>.
Verificación del tramo: `<comando>` — nivel <1|2|3>; exit 0; cubre A1.
Handoff: <contexto mínimo, decisiones cerradas, rutas relevantes y cómo retomar la iteración principal-constructor>.
```

To enable continuity, set `continuidad: continua` in the frontmatter; if omitted, the plan keeps one-tramo-at-a-time execution. In continuous mode, a story may include several small, ordered tramos: each tramo has its own scope, criteria, steps, and verification, and the constructor executes them in sequence until the story is complete or a stop condition applies. Group them under the same user outcome and list no more than three product files per tramo. Also declare `Revisión: fin de historia` or `Revisión: por tramo`; the latter is optional even for high-risk work, but when declared it blocks progress until review. Record a baseline measurement for each check command: exact command, observed duration, and environment. If no measurement exists yet, the constructor stops before running that check and leaves a note to measure it. Each tramo records a checkpoint with changed files, a diff summary, and the check result; when the story ends, suggest one commit for the user to make, without creating it.

Each story has its own `CUANDO/ENTONCES`, `A1..An` criteria, and TODOs. A# identifiers must be unique across the plan. Each TODO is one atomic action, names the file, and specifies how to check it and what result to expect; split tasks that combine files or checks. Tests and documentation do not count toward the three-product-file limit. Story verification must check its observable result through the relevant production flow; do not present an isolated function as a complete flow. If a story depends on another, explain which result it needs and why, then order it afterward. The handoff gives the constructor only the context needed to complete the story and return evidence for the principal's review.

For new tests, add a relevant sensitivity check (an invalid fixture or isolated mutation that fails for the expected reason). If an empty list could accept everything, require non-empty discovered entries or cases. A mutation is not needed for every sentence or administrative step.

Older plans using `## Escenarios` and `## Aceptación` remain valid for execution and review. In new plans, criteria belong inside each story; do not duplicate them in a global acceptance section.

## Evidencia
(written by the constructor)

## Notas
(written by the constructor)
```

## States

The plan's `estado:` field accepts only these values, with the responsible agent:

- `borrador`: the principal writes it.
- `aprobado`: the principal sets it after the user says “yes”.
- `en curso`: the constructor sets it when starting.
- `listo`: the constructor sets it when `verify` passes. In a plan with tramos, `listo` means “tramo completed and its verification passed”; the principal sets it back to `aprobado` with `tramo: N+1` and, after the final tramo, completes the full `verify`.
- `parcial`: the constructor sets it when returning `PAUSA`.

When closing the change, the principal moves the folder to `cambios/hechos/` **without changing `estado`**: the folder location is the marker. There are no `hecho` or `cerrado` states.

## Reglas del buen plan

1. **Scope by path, not by file.** If the constructor finds a related defect within scope, it fixes it; it should not have to stop for that reason.
2. **One verification command** tests the final outcome, not each piece. If the project does not yet have `verify`, the first plan creates it (`preparar-proyecto`).
3. **Atomic steps**: one line, one action, one explicit check, and its expected result, aiming for about 20 words. Put the check on a subline when it does not fit clearly in the step. `Verificación del tramo` is additional and never replaces an individual check. Do not sacrifice clarity to meet the target. Split a step with multiple requirements. There is no step limit (40 is valid); order the steps and make each checkable. Avoid full code except signatures or contracts that must be preserved.
4. **Manageable context.** Write what the constructor needs to understand its story without irrelevant context. Sizes of 5 KB for a simple change and about 8 KB for one investigating several parts are guidelines only. If context becomes difficult to manage, stories may go in `tramo-N.md` files linked from `plan.md`, each with its own verification; size alone does not require splitting.
5. **Repos in frontmatter.** `repos:` is required: list the folders (relative to the project root) where the change touches code or receives the branch. A single-repository project uses `repos: [.]`. A workspace lists only the folders touched by the change (e.g. `repos: [api]`). If the change only touches documentation or root `verify`, use `repos: [.]`; the root counts as a repository.
6. **Questions during exploration.** Ask all behavioral questions in `## Exploración`, before validation and writing stories. If a later answer could change the outcome, return to exploration and confirm the change with the user before continuing. Do not leave necessary decisions open when requesting approval.
7. **Who executes (`ejecutor:`): executability test.** Decide from the written plan by answering four yes/no questions: (1) are the requirements covered? (2) are the context and prerequisites accessible? (3) are there checks with expected results and errors or blockers that can be handled within scope? (4) does it avoid credentials, deployment, and production? Rewrite steps so the constructor does not need to know future results or anticipate every error. The executor is `constructor` unless the user explicitly asks you to execute; then use `ejecutor: principal` and cite their request in the reason. Otherwise use `ejecutor: constructor`, even if any answer is no: improve the plan where possible, but never assign `principal` for that reason. In either case, `## Decisiones ya tomadas` must include `Ejecutor: <who>, porque <answer from the test>` for the user to discuss at gate 1. Without an `ejecutor:` line, treat it as `constructor`. A small change (defined under Hard rules in `agentes/principal.md`) may use `ejecutor: principal` when the user says yes to that definition.
8. **Explicit assumptions.** Put each assumption on its own line in `## Supuestos` and state what changes if the user corrects it (e.g. “Validate email with a simple regex; if the user wants DNS checks, scope and one step change”). If something is a decision that changes the outcome rather than an assumption, ask the user.
9. **Duration for heavy steps.** A step that runs a build, installation, or suite includes its estimated duration in parentheses, e.g. “(≈8 min)”. If the total exceeds about 20 minutes, split the plan into tramos, each with partial verification. Intermediate steps use `VERIFY_RAPIDO=1 ./verify` (cached build); use “no cache” only for the final acceptance run.
10. **Base (`base:`).** The base branch for a folder in `repos:` is the plan's `base:`; if absent, use `git symbolic-ref --short refs/remotes/origin/HEAD`; without a remote, use `main` or `master`. `base:` can be one branch name for all folders or a map `{folder: branch}` when a workspace uses different branches. The principal copies `base:` from the project's `AGENTS.md` “Base branch” line, if present.
11. **Stories and tramos.** A feature uses one branch and one `plan.md`. Each self-contained story may use one tramo or group several consecutive small tramos under the same user outcome. Each tramo has a scope of up to three product files, its own A# criteria, atomic TODOs naming files and checks, verification, and evidence; the story includes the user and value, dependencies, CUANDO/ENTONCES, and handoff. Each story must be buildable and verifiable on its own against the base; if it depends on another, explain which result it needs and why, and order it afterward. Keep stories small, preferably bounded by file, without splitting a flow into isolated functions that are not useful outcomes. If the environment has not been verified, the first tramo covers only the environment (install, start, reproduce), with no code changes. Without `continuidad: continua`, the principal launches one tramo at a time; with it, the constructor continues through approved tramos of the same story in order, subject to `## Condiciones de parada`. A plan with two or more tramos of the same story should declare `continuidad: continua` by default; `revisar-plan` warns when two or more tramos lack it. Each tramo's completion criterion is measurable: its `Verificación del tramo:` names a command and its expected result (exit code or output), not a general description. Adjust later tramos after seeing the previous tramo's actual state. Older plans with traditional steps or tramos remain executable. To limit constructor context when needed, put some stories in `tramo-N.md` files linked from `plan.md`, each with its story, steps, `Verificación del tramo:`, and evidence; the index retains frontmatter, objective, exploration if applicable, assumptions, decisions, validation, scope, verification, and the ordered story list with status. Neither size nor story count alone requires externalizing stories. The constructor reads `plan.md` and only the active `tramo-<n>.md`, not other tramo documents. At the end of each story, use `/compact` or a new session so the principal reviews in a fresh context. A plan may require review per tramo, including for high-risk work; if declared, it blocks progress until the verdict. A final review preserves continuity but may find accumulated defects; reviewing each tramo finds them sooner, with more pauses and reviews. In either case, each tramo checkpoint records files, a diff summary, and verification, and suggests a story commit for the user to make, without committing. Record a minor decision resolved during the change in `## Decisiones` as `Resuelto: <date> <decision>`. Each `Verificación del tramo:` declares its level (rule 13); Level 3 is only for the final acceptance run in the last story.
12. **Type.** Use `tipo: docs` only when the change touches `*.md` or `docs/` files. Its *Verificación* is lightweight, with no build or Docker: `git diff --check` plus checking that cited paths and commands exist (`test -f`, `rg`). Without `tipo:`, use `codigo`.
13. **Verification levels.** Three levels: **Level 1** `Comprobación rápida` (the `Comprobación rápida: <command>` line in `AGENTS.md`: types, lint, and host tests; no Docker; seconds); **Level 2** `VERIFY_RAPIDO=1 ./verify` (Docker with cache); **Level 3** `./verify` without cache (final acceptance). Low risk (a small change or `tipo: docs`, as defined by `agentes/principal.md`) means one repository, no migration, no API contract change, and no route or screen change in the flow. Classification is by risk, not file count; any unlisted risk is high. Its *Verificación* is Level 1 plus a test covering the change. If a plan validates with a browser or containers, its *Verificación* is one fixed repository script (`./scripts/<name>.sh` or `./verify`) that runs all journeys once, not standalone `docker run` or `compose run` commands. If `AGENTS.md` has no `Comprobación rápida` line, use `verify` as today.
14. **Experience.** If a plan touches a screen, route, or UI flow, load the `disenar-experiencia` skill before planning and get its sketch in `cambios/<name>/pantallas.md` approved. Link `pantallas.md` under *Alcance* and add experience criteria to affected story acceptance: the task is completable in N steps, uses no prohibited terms from `docs/experiencia.md`, and a 390 px screenshot has no horizontal overflow. Present the sketch in your gate 1 response, not just its path. This rule does not apply if no screens are touched.

## Before Requesting Approval

Apply the executability test (rule 7) and record the executor. Reread the plan as if you were a constructor without context: what would you have to guess? Fix it. Check every story's links among CUANDO/ENTONCES, A#, TODO, file, and check; every criterion must be covered by a step and verification, and dependencies must be ordered. For each story, confirm it documents its real dependencies, including external dependencies beyond the tramos and their reasons, contracts to preserve, paths likely to change, and a concrete example of the expected result. If a test uses a path, confirm it says whether the path may move or be archived and which test must be updated. Any of these fields may say “Not applicable”. Confirm each story lists at most three product files and there are no orphan A# criteria or contradictions. Then stop and tell the user the plan path. After the user says yes, set `estado: aprobado`.

If the constructor returns `parcial`, correct the plan and set it back to `estado: aprobado` before relaunching: the constructor starts only from `aprobado`. When relaunching after `PAUSA`, do not add text about stop conditions (“real limit”, “checkpoint”); state only the next step.
