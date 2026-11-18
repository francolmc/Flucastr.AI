# Segment 5

## Steps

### Segment 5 — Story: vocabulario del plan, marcadores y agentes
As a user I want claves, secciones, marcadores, niveles y agentes to have English names so that the kit speaks one language in its contracts.
Dependencies: Segment 4 — quitar alias y renombrar documentos antes de cambiar claves y agentes.
Contracts to keep: Los agentes siguen haciendo lo mismo (planner planifica y revisa; builder ejecuta); los niveles siguen siendo tres; `COMPLETADO`/`PAUSA` mantienen semántica como `DONE`/`PAUSED`.
Paths likely to change: `core/agents/*`, `core/skills/*`, `adapters/*`, `scripts/revisar-plan.mjs`, `scripts/kit-run.mjs`, `tools/run/*`, `tools/model-resolution/models.mjs`, `modelos.json`→`models.json`, `tests/*`, `tools/verify/*`, instaladores.
Concrete example of the expected result: un plan nuevo usa `status: draft`, `## Scope`, `## Evidence`; el builder termina con `DONE` o `PAUSED`; `models.json` usa `levels` y `high/medium/low`; existen `planner.md` y `builder.md`.
Scope: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Files: core/agents/planner.md, core/agents/builder.md, models.json, scripts/revisar-plan.mjs, scripts/kit-run.mjs
WHEN se aplica el mapa de vocabulario del plan THEN los agentes, los contratos y los lectores usan el vocabulario nuevo y ninguno acepta el viejo (A1).
Acceptance:
- A1: `git grep -nE 'COMPLETADO|PAUSA|APROBADO|DEVUELTO|^estado:|## Alcance|## Evidencia|principal|constructor' -- core adapters scripts tools tests install.sh` no devuelve resultados, salvo textos de documentación citados; esperar sin resultados en código y contratos.

TODO:
- [x] Con `git mv`, renombrar `core/agents/principal.md` a `core/agents/planner.md` y `core/agents/constructor.md` a `core/agents/builder.md`, y aplicar el mapa de nombres en `core/skills/execute-plan/SKILL.md` y `adapters/` (A1). Comprobación: `git grep -nE 'principal|constructor' -- core adapters`; sin resultados.
- [x] Aplicar el mapa a `scripts/revisar-plan.mjs`, `scripts/kit-run.mjs`, `tools/run/verdict.mjs`, `tools/model-resolution/models.mjs`, `verify` e instaladores, y renombrar `modelos.json` a `models.json` con claves en inglés (A1). Comprobación: el `git grep` de la aceptación; sin resultados. Excepciones documentadas por el principal (Notas del plan, tramo 5, opción a): datos de prueba históricos, «principal» como adjetivo y la tabla de traducción de `tests/review-plan/review-plan.test.mjs:23`.
- [x] Actualizar los fixtures y pruebas de `tests/` al vocabulario nuevo sin debilitarlos, empezando por `tests/review-plan/review-plan.test.mjs` (A1). Comprobación: `node --test tests/review-plan/review-plan.test.mjs`; exit 0.
- [x] Correr `./verify` (A1). Comprobación: `./verify`; exit 0 y VERIFY OK.

Segment verification: `./verify` — level 3; exit 0; covers A1.
Handoff: este plan y sus tramos pasan al vocabulario nuevo en el último paso del tramo (el revisor ya no acepta las claves viejas); no editar planes de `changes/done/`; no cambiar el texto de la documentación salvo los nombres exactos; sin alias.
