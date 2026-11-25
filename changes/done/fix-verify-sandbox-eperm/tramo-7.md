---
segment: 7
---
# Segment 7

Plan: [plan.md](plan.md)

## Steps

### Segment 7 — Story: pruebas C (kit run, progreso, informes)
As mantenedor I want el resto de pruebas sin stdin pipe so that `./verify` completo corra en Codex.
Dependencies: Segment 1.
Contracts to keep: aserciones intactas.
Paths likely to change: `tests/progress/run.mjs`, `tests/kit-run/run.mjs`, `tests/kit-scope/run.mjs`, `tests/kit-close/run.mjs`, `tests/kit-check/run.mjs`, `tests/usage/run.mjs`, `tests/runs-report/run.mjs`, `tests/review-plan/review-plan.test.mjs`, `tests/acceptance/{builder-contract,kit-run,usage}.test.mjs`, `tests/luna-reviewer/measure.mjs`.
Concrete example of the expected result: `tests/progress/run.mjs:291` (hook con `input`) usa el helper con `input`.
Scope: los archivos de prueba nombrados
Files: tests/progress/run.mjs, tests/kit-run/run.mjs, tests/kit-scope/run.mjs, tests/kit-close/run.mjs, tests/kit-check/run.mjs, tests/usage/run.mjs, tests/runs-report/run.mjs, tests/review-plan/review-plan.test.mjs, tests/acceptance/builder-contract.test.mjs, tests/acceptance/kit-run.test.mjs, tests/acceptance/usage.test.mjs, tests/luna-reviewer/measure.mjs
WHEN corren THEN sus hijos síncronos no usan stdin pipe (A9)
Acceptance:
- A9: sin stdin pipe en esos archivos; check with `node --test tests/acceptance/*.test.mjs`; expect exit 0.
TODO:
- [x] Migrar `tests/progress/run.mjs` (incluye `input` en :291 y :589) (A9). Check: `node tests/progress/run.mjs`; expect exit 0.
- [x] Migrar `tests/kit-run/run.mjs`, `tests/kit-scope/run.mjs`, `tests/kit-close/run.mjs`, `tests/kit-check/run.mjs` (A9). Check: `node tests/kit-run/run.mjs && node tests/kit-scope/run.mjs && node tests/kit-close/run.mjs && node tests/kit-check/run.mjs`; expect exit 0.
- [x] Migrar `tests/usage/run.mjs`, `tests/runs-report/run.mjs`, `tests/review-plan/review-plan.test.mjs`, `tests/luna-reviewer/measure.mjs` (A9). Check: `node tests/usage/run.mjs && node tests/runs-report/run.mjs && node --test tests/review-plan/review-plan.test.mjs`; expect exit 0.
- [x] Migrar `tests/acceptance/builder-contract.test.mjs`, `tests/acceptance/kit-run.test.mjs` y `tests/acceptance/usage.test.mjs` (A9). Check: `node --test tests/acceptance/*.test.mjs`; expect exit 0.
Segment verification: `node --test tests/acceptance/*.test.mjs` — level 1; exit 0; covers A9. (Medir la duración la primera vez.)
Handoff: `tests/luna-reviewer/measure.mjs` lanza `codex`; no correrlo (cuesta); solo `node --check`.

## Evidence
- Migración (script de reemplazo sobre las 12 rutas, solo llamadas; los imports de `node:child_process` se reescriben con espacio tras la coma): `spawnSync(` → `spawnSyncSeguro(` y `execFileSync(` → `execFileSyncSeguro(`, import desde `../../tools/spawn/sync-seguro.mjs`. Recuento antes de migrar: `tests/progress/run.mjs` 12 spawnSync; `tests/kit-run/run.mjs` 5; `tests/kit-scope/run.mjs` 1 spawnSync + 1 execFileSync; `tests/kit-close/run.mjs` 2 + 1; `tests/kit-check/run.mjs` 1; `tests/usage/run.mjs` 2; `tests/runs-report/run.mjs` 1; `tests/review-plan/review-plan.test.mjs` 2; `tests/acceptance/{builder-contract,kit-run,usage}.test.mjs` 1 cada uno; `tests/luna-reviewer/measure.mjs` 1.
- $ timeout 120 node tests/progress/run.mjs
```
progress: 44 casos pasaron
```
exit 0 (13 s; tope 120 s, duración no medida antes; el plan dice «segundos»)
- $ timeout 120 node tests/kit-run/run.mjs && timeout 120 node tests/kit-scope/run.mjs && timeout 120 node tests/kit-close/run.mjs && timeout 120 node tests/kit-check/run.mjs
```
kit-run: 45 casos pasaron
ℹ pass 13 / ℹ fail 0 (kit-scope)
ℹ pass 31 / ℹ fail 0 (kit-close)
verify-verde, typecheck ok (kit-check)
```
exit 0 (kit-run 20 s; kit-scope 1 s; kit-close 0 s; kit-check 1 s; topes 120 s)
- $ timeout 120 node tests/usage/run.mjs && timeout 120 node tests/runs-report/run.mjs && timeout 120 node --test tests/review-plan/review-plan.test.mjs
```
pruebas del medidor: 20 de 20 ok
7 casos ok
ℹ pass 15 / ℹ fail 0 (review-plan)
```
exit 0 (usage 2 s; runs-report 0 s; review-plan 1 s).
- $ node --check tests/luna-reviewer/measure.mjs
```
(sin salida)
```
exit 0. `measure.mjs` lanza `codex` real: no se ejecutó (Handoff del tramo); solo sintaxis. Ver Decisions del plan.
- $ timeout 300 node --test tests/acceptance/*.test.mjs
```
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ duration_ms 20175.727475
```
exit 0 (20 s medidos en la primera corrida; tope 300 s). Cubre A9.
- $ grep -n "\bspawnSync\b\|\bexecFileSync\b" <12 archivos del tramo>
```
(sin coincidencias)
```
exit 1 (sin coincidencias). `node --check` exit 0 en los 11 archivos de prueba del tramo.
