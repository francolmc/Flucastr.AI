## Steps

### Segment 3 — Story: plan reconstruido
As builder I want un plan aprobado solo con el tramo pedido so that ejecute lo mismo que en su día.
Dependencies: Segment 2 — carpetas de la copia.
Contracts to keep: formato que leen `scripts/kit-check.mjs` y `scripts/kit-scope.mjs`.
Paths likely to change: `evals/builder/lib/plan.mjs`, `tests/evals-builder/plan.test.mjs`.
Concrete example of the expected result: plan `done` de 3 tramos → `status: approved`, `segment: 2`, solo la historia 2, casillas vacías.
Scope: `evals/builder/lib/plan.mjs` y su prueba.
Files: evals/builder/lib/plan.mjs, tests/evals-builder/plan.test.mjs
WHEN se reconstruye el tramo N THEN el plan no trae resultados de la ejecución original (A3)
Acceptance:
- A3: `base: main`, `branch: feature/bench`, sin `continuity`, *Scope* = `Files:`, *Verification* = `- [ ] Dejar todas las casillas vacías (`- [x]` → `- [ ]`) en `evals/builder/lib/plan.mjs` (A3). Check: caso en la prueba con casillas marcadas; expect ninguna marcada.
Segment verification:` (con `cd` si corre en el repo hijo), *Evidence* y *Notes* vacías, sin líneas `Resuelto:`, `Devuelto:` ni `Consejo`; `kit-check` y `kit-scope` no salen con 2; check with `node --test tests/evals-builder/plan.test.mjs`; expect exit 0.
TODO:
- [x] Escribir `tests/evals-builder/plan.test.mjs` con un plan ficticio segmentado (A3). Check: la prueba; expect rojo. (Rojo antes de crear `plan.mjs`: exit 1.)
- [x] Implementar `evals/builder/lib/plan.mjs`, copiando `decisions.md` si existe (A3). Check: la prueba; expect exit 0. (5/5 en verde; `kit-check` y `kit-scope` no salen con 2.)
- [x] Escribir *Verification* entre comillas invertidas en `evals/builder/lib/plan.mjs` y ajustar `tests/evals-builder/plan.test.mjs` (A3). Check: `comandoVerificacion` de `tools/run/plan.mjs` sobre el plan reconstruido; expect el comando del tramo. (Prueba «tools/run lee el comando de Verification»: exit 0, con y sin `cd`.)
- [x] Quitar el punto final de cada ruta de `Files:` en `evals/builder/lib/plan.mjs` (A3). Check: caso con punto final en `tests/evals-builder/plan.test.mjs`; expect *Scope* sin punto. (Prueba «quita el punto final»: exit 0.)
Segment verification: `node --test tests/evals-builder/plan.test.mjs` — level 1; exit 0; covers A3.
Handoff: el destino es `changes/<ID>/plan.md` en la copia; el texto fuente se lee con `git show HEAD:<ruta>` en el repo raíz. `tools/run/plan.mjs` muestra cómo se lee *Verification*. Nada del plan se escribe en el kit.

## Evidence
