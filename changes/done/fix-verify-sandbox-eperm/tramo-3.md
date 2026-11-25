---
segment: 3
---
# Segment 3

Plan: [plan.md](plan.md)

## Steps

### Segment 3 — Story: `tools/check` y `tools/observe`
As mantenedor I want `kit-check`, la comparación de cambios y el observador sin stdin pipe so that corran en Codex.
Dependencies: Segment 1.
Contracts to keep: política del hook de `kit-check` (sin shell); códigos de salida 0/1/3/2.
Paths likely to change: `tools/check/ejecutar.mjs`, `tools/check/cambios.mjs`, `tools/observe/diagnose.mjs`.
Concrete example of the expected result: `node tests/kit-check/run.mjs` pasa igual que antes.
Scope: `tools/check/ejecutar.mjs`, `tools/check/cambios.mjs`, `tools/observe/diagnose.mjs`
Files: tools/check/ejecutar.mjs, tools/check/cambios.mjs, tools/observe/diagnose.mjs
WHEN estos módulos lanzan hijos síncronos THEN stdin no es pipe (A5)
Acceptance:
- A5: sin stdin pipe en los 3 archivos; check with `node tests/kit-check/run.mjs && node tests/kit-scope/run.mjs`; expect exit 0.
TODO:
- [x] En `tools/check/ejecutar.mjs` (línea ~74) fijar stdin en `ignore` conservando el resto de opciones (A5). Check: `node tests/kit-check/run.mjs`; expect exit 0.
- [x] En `tools/check/cambios.mjs` (línea ~12) usar el helper o `stdio` literal (A5). Check: `node tests/kit-scope/run.mjs`; expect exit 0.
- [x] En `tools/observe/diagnose.mjs` migrar los 2 `spawnSync` de docker (A5). Check: `node --check tools/observe/diagnose.mjs`; expect exit 0.
Segment verification: `node tests/kit-check/run.mjs && node tests/kit-scope/run.mjs` — level 1; exit 0; covers A5.
Handoff: `ejecutar.mjs` es la política del hook sin shell; no cambiar qué comandos se permiten, solo el stdio.

## Evidence
- Paso 1 (`ejecutar.mjs`, stdin `ignore`): `$ node tests/kit-check/run.mjs` → `ok verify-verde`, `ok typecheck` (7 casos `ok`, 0 fallos) `exit 0`. Duración medida 0 s.
- Paso 2 (`cambios.mjs`): ya cumplía A5 antes del tramo (`execFileSync` con `stdio: ["ignore", "pipe", "pipe"]`, línea 14); sin cambios. `$ node tests/kit-scope/run.mjs` → `ℹ duration_ms 1112.95`, `exit 0`.
- Paso 3 (`diagnose.mjs`, 2 `spawnSync` de docker → `spawnSyncSeguro`): `$ node --check tools/observe/diagnose.mjs` → sin salida `exit 0`. Grep: no queda `spawnSync(` crudo en el archivo.
- Segment verification: `$ node tests/kit-check/run.mjs && node tests/kit-scope/run.mjs` → `ok typecheck` / `ℹ todo 0` `exit 0`.
- Pendientes: `$ awk '/^- \[ \]/ { n++ } END { print n+0 }' tramo-3.md` → `0`.
- Diff: `git diff --stat -- tools/check tools/observe` → `tools/check/ejecutar.mjs | 1 +`, `tools/observe/diagnose.mjs | 7 ++++---`; 2 archivos, 5 inserciones y 3 eliminaciones.
