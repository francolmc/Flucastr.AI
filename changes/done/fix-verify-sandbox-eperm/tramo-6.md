---
segment: 6
---
# Segment 6

Plan: [plan.md](plan.md)

## Steps

### Segment 6 — Story: pruebas B (permisos y migración)
As mantenedor I want las pruebas de permisos y migración sin stdin pipe so that corran en Codex.
Dependencies: Segment 1.
Contracts to keep: las pruebas de permisos siguen comprobando el hook y las reglas deny tal cual; no se debilita ninguna.
Paths likely to change: `tests/permissions-v2.test.mjs`, `tests/permissions-contract/{hook,structure,generation}.test.mjs`, `tests/migration/names.test.mjs`.
Concrete example of the expected result: `hook.test.mjs:120` (que pasa `input: "{"` al hook) usa el helper con `input` (archivo como stdin).
Scope: los 5 archivos de prueba nombrados
Files: tests/permissions-v2.test.mjs, tests/permissions-contract/hook.test.mjs, tests/permissions-contract/structure.test.mjs, tests/permissions-contract/generation.test.mjs, tests/migration/names.test.mjs
WHEN corren THEN sus hijos síncronos no usan stdin pipe (A8)
Acceptance:
- A8: sin stdin pipe; las pruebas del hook y las reglas deny siguen con las mismas aserciones; check with `node --test tests/permissions-v2.test.mjs tests/permissions-contract/*.test.mjs tests/migration/names.test.mjs`; expect exit 0.
TODO:
- [x] Migrar `tests/permissions-contract/hook.test.mjs` (incluye el caso `input: "{"`) (A8). Check: `node --test tests/permissions-contract/hook.test.mjs`; expect exit 0.
- [x] Migrar `tests/permissions-contract/structure.test.mjs` y `tests/permissions-contract/generation.test.mjs` (A8). Check: `node --test tests/permissions-contract/*.test.mjs`; expect exit 0.
- [x] Migrar `tests/permissions-v2.test.mjs` y `tests/migration/names.test.mjs` (A8). Check: `node --test tests/permissions-v2.test.mjs tests/migration/names.test.mjs`; expect exit 0.
Segment verification: `node --test tests/permissions-v2.test.mjs tests/permissions-contract/*.test.mjs tests/migration/names.test.mjs` — level 1; exit 0; covers A8.
Handoff: son pruebas de seguridad: revisar `git diff` para que no desaparezca ninguna aserción deny.

## Evidence
- Paso 1 (`hook.test.mjs`): `$ node --test tests/permissions-contract/hook.test.mjs` → `tests 6, pass 6, fail 0`, exit 0.
- Paso 2 (`tests/permissions-contract/*.test.mjs`): `$ node --test tests/permissions-contract/*.test.mjs` → `tests 11, pass 11, fail 0`, exit 0.
- Paso 3 (`permissions-v2` + `names`): `$ node --test tests/permissions-v2.test.mjs tests/migration/names.test.mjs` → `tests 8, pass 8, fail 0`, exit 0.
- Segment verification: `$ node --test tests/permissions-v2.test.mjs tests/permissions-contract/*.test.mjs tests/migration/names.test.mjs` → `tests 19, pass 19, fail 0`, exit 0 (≈5,4 s).
- `node --check` exit 0 en los 5 archivos.
- Handoff (aserciones deny): `git diff -U0` muestra 1 línea `assert` eliminada y 1 añadida (la aserción de `comprobar` → `ausente`, migrada en el sitio, mismo valor esperado). Ninguna aserción retirada.
- Espacio tras la coma: corregido en `hook.test.mjs` (`instalar`) y `names.test.mjs` (`conAgente`) antes del cierre.
