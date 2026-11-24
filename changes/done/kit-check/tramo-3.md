## Steps

### Segment 3 — Story: informe, códigos de salida y fixtures de la línea base

As a planner, I want `node scripts/kit-check.mjs <plan> [--segment N]` to print a table per A# and exit non-zero unless everything passes, so that «done» is decided by a tool and never shows failure as success.

Dependencies: Segment 1 (`parsearPlan`) y Segment 2 (`ejecutarFila`).
Scope: CLI, prueba de extremo a extremo, paso 16 de `verify` y documentación. No cambiar `kit run` ni el plan evaluado.
Files: `scripts/kit-check.mjs`, `tools/verify/usage-and-run.sh`, `tests/kit-check/run.mjs`, `tests/README.md`, `README.md`, `AGENTS.md`.

Contract: opciones `--segment N`, `--timeout <seg>` (120 por defecto), `--revisado A3,A5`, `--help`. Tabla en stdout: `A# | estado | comando ejecutado | motivo/cola`. Códigos: 0 todo `pasa`; 1 algún `falla`; 3 sin fallas pero hay `bloqueado` o `no-automatizable` sin revisar; 2 uso o plan mal formado. `--revisado` marca «no automatizable (revisado)» y no cuenta, nunca excusa `bloqueado` ni `falla`. Con fallas y bloqueos a la vez, 1. El informe distingue las cuatro categorías y siempre imprime el comando.

WHEN todo pasa THEN código 0 y ninguna fila queda sin estado (A1).
WHEN un A# falla THEN código 1 y la fila dice `falla` (A2).
WHEN un A# es bloqueado o no automatizable sin revisar THEN código 3 con la categoría visible (A3).
WHEN la tabla está mal formada o falta el plan THEN código 2 y ninguna ejecución (A4).
WHEN el fixture (a) tiene `verify` verde pero un A# incumplido THEN no sale 0 (A5).
WHEN el fixture (b) tiene typecheck rojo con la verificación del tramo verde THEN el A# de typecheck da `falla` y no sale 0 (A6).
WHEN corre `./verify` THEN incluye el paso 16 y el plan evaluado queda intacto (A7).

Acceptance:
- A1: todo verde da 0; check with `node tests/kit-check/run.mjs --caso=verde`; expect exit 0.
- A2: un rojo da 1; check with `node tests/kit-check/run.mjs --caso=rojo`; expect exit 0.
- A3: bloqueado y ambiguo dan 3; check with `node tests/kit-check/run.mjs --caso=bloqueado`; expect exit 0.
- A4: tabla mal formada da 2; check with `node tests/kit-check/run.mjs --caso=malformada`; expect exit 0.
- A5: verify verde con A# incumplido no da 0; check with `node tests/kit-check/run.mjs --caso=verify-verde`; expect exit 0.
- A6: typecheck rojo con tramo verde no da 0; check with `node tests/kit-check/run.mjs --caso=typecheck`; expect exit 0.
- A7: paso 16 en `verify` y plan sin cambios; check with `./verify`; expect exit 0.

TODO:
- [x] Crear fixtures sintéticos anonimizados en `tests/kit-check/fixtures/` (verde, rojo, bloqueado, malformada, ambiguo, verify-verde, typecheck); sin contenido de proyectos. Check: `ls tests/kit-check/fixtures`.
- [x] Escribir `tests/kit-check/run.mjs` con un caso por A1–A6 (A1, A2, A3, A4, A5, A6) que ejecute el CLI y compare código y salida; deben fallar antes. Check: `node tests/kit-check/run.mjs` (falla).
- [x] Implementar `scripts/kit-check.mjs` (cabecera con uso, `uso()` que sale con 2, códigos documentados, como `kit-status`). Check: `node tests/kit-check/run.mjs`.
- [x] Añadir el paso 16 en `tools/verify/usage-and-run.sh` y documentar en `tests/README.md`, `README.md` y `AGENTS.md` (formatos soportados y excluidos). Check: `./verify`.

Segment verification: `node tests/kit-check/run.mjs` (nivel 2); `./verify` solo en la revisión final.
Handoff: dejar en Notes el comando de cada A# ejecutado en el informe real, para que el planner revise montajes sintéticos. La integración con `kit run` es C3 y no se toca.
