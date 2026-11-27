---
name: prepare-project
description: "Prepare a project for the kit with a short `AGENTS.md` and a `verify` command that checks the full system from scratch (clean build, startup, and a real user journey). Use when `AGENTS.md` or `verify` is missing."
---

# Prepare a Project

Two deliverables: `AGENTS.md` and `verify`. Without them, there is no reliable way to know whether a change works.

## 1. AGENTS.md (about 40 lines maximum)

Include only information an agent cannot infer by reading the code:

```markdown
# <Proyecto>
<Una frase: qué es.>

## Estructura
<Repos o carpetas y qué hace cada uno. Stack.>

## Comandos
- Instalar: `...`
- Correr en local: `...`
- **Verificar todo desde cero: `./verify`**
- Comprobación rápida: `...` (typecheck, lint y pruebas relacionadas; menos de 60 s, en el host, sin servicios). Siempre se agrega. Sin esa línea el plan usa `verify`.
- Servicio: `...` (opcional)
- Acceptance: `...` (opcional)
- Evidencia: `...` (opcional; dónde escribe `resultado.json`)

## Reglas
- Agentes: sin commit, push, PR, merge ni despliegue; no leer `.env` ni llaves (`.env.example` sí).
- Ramas: `feature/`, `fix/`, `chore/`, `docs/`. Rama base: `<rama>` solo si no es la principal del remoto.
- <Convenciones propias, solo las que no se deducen del código.>
```

Declare each of the four verification capabilities on its own line (full contract in `core/contracts/verification.md`):

- **Rápida** (`Comprobación rápida:`): menos de 60 s, en el host, sin servicios; el builder la corre al cerrar cada tramo.
- **Servicio** (`Servicio:`): la lógica contra dependencias reales, sin interfaz.
- **Acceptance** (`Acceptance:`): un archivo por flujo, filtrable por nombre; resume todos los fallos al final.
- **Evidence** (`Evidencia:`): dónde escribe `resultado.json`.

Anything not covered above is covered by `./verify`.

If the project already exists, explore it first and do not repeat information already stated by the code.

## 2. verify

Create one command at the root (`./verify`) that **exits with a non-zero code** at the first failing stage and does not depend on anything from your machine:

1. **Clean build.** Install from the project package manager's lockfile and build images without cache. `VERIFY_RAPIDO=1 ./verify` uses the build cache for iteration; the final acceptance run always omits this variable. Detect undeclared dependencies and incomplete build contexts.
2. **Real startup.** Use `docker compose` for the complete system: web, API, database, and a test mailbox (Mailpit). Migrations run at startup, and wait for services to respond.
3. **Real user journey.** Exercise the key end-to-end flow without database or email mocks.
4. **Same path as production.** Use the same Dockerfiles and `.env.example` variables as production; only their values change.

Contract: `core/contracts/verification.md`. If a matching `core/recipes/<stack>.md` exists, read it; otherwise continue without one.

Design rules:

- **Build context = the entire repository**, minus files excluded by `.dockerignore`. Never use an allowlist of files: each omission can break the build.
- Declare every directly imported package in the dependency manifest. A package available only through another dependency may work locally and fail in a clean build.
- Clean up at the end (`down -v`) and use a dedicated Compose project to avoid interfering with other services.
- **Run only when requested**, never as a side effect of planning.
- Print a heading for each stage and `VERIFY OK` at the end.

An adaptable skeleton is provided in `reference.md`, next to this skill. Treat it as a starting point: adjust names, ports, and the workflow to your project.

## 3. Verify

Run `./verify` in a clean clone or with a tree free of build artifacts. A `verify` command that has never failed proves nothing: deliberately break it once (for example, remove a dependency) and confirm that it detects the problem.

## 3b. Remote mode (already deployed environment)

`VERIFY_TARGET=<url> ./verify` does not build or start anything (it does not call `docker`): it only runs `verify-flujo.sh` against that URL.

- `VERIFY_TARGET` must begin with `http://` or `https://`; otherwise, fail before doing anything.
- Existing `API_URL` and `WEB_URL` values take precedence; otherwise, use `VERIFY_TARGET`.
- Always print `MODO REMOTO: <url>`.
- The journey has a “Lectura” (always) and “Escritura” (creates data) phase. Without `VERIFY_PERMITIR_ESCRITURA=1`, skip writes with an `OMITIDO` notice; `verify` succeeds only if reading passed: `VERIFY OK (solo lectura)`.
- With `VERIFY_PERMITIR_ESCRITURA=1`, also run the write phase. Test data uses `verify-<pid>@example.invalid` email addresses and names prefixed with `verify-`, so they can be deleted later. `verify` does not guarantee cleanup of the remote environment.
- The first line of a journey declares whether it writes: `# VERIFY_ESCRIBE: sí` or `no`. If absent, treat it as `sí`.
- The planner does not run `VERIFY_TARGET` against production. The user runs the post-deployment check.

## 4. Workspaces (a directory containing multiple repositories)

A workspace is a directory without `.git` that contains repositories. Its root is the unit of work: `AGENTS.md`, `docs/proyecto.md`, `changes/`, and `verify`. Plans list the affected folders in `repos:`.

Detection (a fact, not a decision):

```bash
find . -maxdepth 2 -name .git -not -path './.git'
```

- If the root has no `.git` and child folders do, this is a workspace and you **must ask the user** (closed choices, recommend “yes”). Do not run `git init` without their answer.
  - Yes: run `git init` at the root and create a `.gitignore` listing each child with `.git` as `/<folder>/`, plus `.claude/settings.local.json`. Do not commit.
  - No: the root remains outside a repository; root change plans do not get a branch (see `execute-plan`, step 2).
- If this is a single repository, none of this applies: use `repos: [.]` in plans.

Workflow for an existing workspace (d):

1. The planner writes the root `AGENTS.md` and `docs/proyecto.md` (what it is, the repositories and their roles, how they connect, and decisions with their rationale).
2. The planner links to child `AGENTS.md` files (and `specs/`, if present) without rewriting or moving them.
3. The builder builds only what is missing: `verify` (which calls each repository by its path), `/health`, and `.env.example`.
4. `verify`, `changes/`, and the documents belong at the root.

## 5. `Despliegue` section in docs/proyecto.md

`docs/proyecto.md` must have a `## Despliegue` section with five lines:

1. Where it is deployed (service, platform, or host).
2. Required variable names, never their values (from `.env.example`).
3. How migrations are applied.
4. How to roll back.
5. The post-deployment check: `VERIFY_TARGET=<url> ./verify`.

If the project already exists and lacks this section, add it. Write `pendiente` for each unknown item. Do not invent values.

## 6. Pre-deployment review

When asked to “prepare the deployment”, the planner writes `changes/revision-despliegue/plan.md` as a draft, with `repos:` and read-only steps: the review does not deploy or touch production. Plan steps cover:

- Compare `.env.example` variables with those used by the code.
- Check for pending migrations.
- Check health endpoints (`/health` and the home page).
- Record what `verify` covers and does NOT cover: external providers, OAuth, and real email.
- Document the post-deployment `VERIFY_TARGET` check, which the user runs.

The planner does not deploy, touch production, or run `VERIFY_TARGET` against production.
