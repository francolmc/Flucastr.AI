# Tramo 12

## Steps

### Segment 12 — Story: verify protege los tamaños y el hook
As maintainer I want verify to run the new tests so that the floor does not grow back.
Dependencies: Segment 1 a 11 — pruebas y documentos creados.
Contracts to keep: pasos 1 a 22 de `./verify` sin cambios; `VERIFY OK` sigue siendo la última línea.
Paths likely to change: `verify`, `README.md`, `docs/como-funciona.md`.
Concrete example of the expected result: `./verify` muestra el paso 23 y termina en `VERIFY OK`.
Scope: paso 23 y documentación.
Files: verify, README.md, docs/como-funciona.md
WHEN corre `./verify` THEN ejecuta las pruebas de tamaños, cabecera y hook (A12)
Acceptance:
- A12: `./verify` completo en verde con paso 23; README y detalle describen hook, límites y lo no probado; check with `./verify` and `git diff README.md docs/como-funciona.md`; expect `VERIFY OK`.
TODO:
- [x] En `./verify`, añadir paso 23 que ejecute `node --test tests/context-size/*.test.mjs tests/after-compact/*.test.mjs` (A12). Check: `bash -n verify`; expect exit 0.
- [x] En `./README.md`, describir el paso 23 y el hook: instalación, aprobación en Codex, Pi sin hook (A12). Check: `grep -c after-compact README.md`; expect 1 o más.
- [x] En `docs/como-funciona.md`, añadir tamaños, referencias del planner, herramientas excluidas y hook sin probar en sesión real (A12). Check: `grep -c after-compact docs/como-funciona.md`; expect 1 o más.
- [x] Ejecutar `./verify` completo desde la raíz y anotar duración (A12). Check: `./verify`; expect `VERIFY OK`.
Segment verification: `./verify` — level 3; exit 0; covers A12.
Handoff: seguir la forma del paso 22 (comentario, `paso 23 "…"`, `node --test … || fallo "23: …"`). Documentación en español. Anotar en *Evidence* de `plan.md` los bytes finales de `core/agents/planner.md`, `core/skills/plan-change/SKILL.md` y `AGENTS.md`. Duración de referencia ≈122 s más las pruebas nuevas.
