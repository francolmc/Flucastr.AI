# Tramo 11

## Steps

### Segment 11 — Story: AGENTS.md del kit pesa 6144 bytes o menos
As agent I want only repository invariants always loaded so that the floor drops.
Dependencies: Segment 2 y 6 — núcleos cortos que la prueba de tamaño comprueba.
Contracts to keep: secciones «Reglas» y «Límites de las reglas deny» sin cambios; líneas `Aceptación:` y «Comando `verify`» que leen las herramientas.
Paths likely to change: `AGENTS.md`, `docs/como-funciona.md`.
Concrete example of the expected result: `wc -c AGENTS.md` da 4250 y cada viñeta anterior aparece en `docs/como-funciona.md`.
Scope: documento de detalle, `AGENTS.md` y prueba de tamaños.
Files: docs/como-funciona.md, AGENTS.md, tests/context-size/sizes.test.mjs
WHEN se carga el proyecto THEN `AGENTS.md` trae invariantes y puntero, sin perder detalle en el repo (A11)
Acceptance:
- A11: tres tamaños dentro del límite, ninguna viñeta perdida y «Reglas» y «Límites» iguales; check with the segment verification and `git diff AGENTS.md`; expect exit 0.
TODO:
- [x] Crear `docs/como-funciona.md` con todas las viñetas de «Cómo funciona (v2)» y el párrafo final sobre v1, literales (A11). Check: comando de viñetas del Handoff; expect 0.
- [x] Ampliar `tests/context-size/sizes.test.mjs` con `planner.md` ≤ 8192, `AGENTS.md` ≤ 6144 y referencias nombradas existentes (A11). Check: `node --test tests/context-size/sizes.test.mjs`; expect rojo por `AGENTS.md`.
- [x] Reemplazar `AGENTS.md` con `cp changes/piso-planner/borradores/AGENTS.borrador.md` (A11). Check: `node --test tests/context-size/sizes.test.mjs`; expect pass.
- [x] Corrección (a): el borrador ya restaura la línea «Lo de la v1…» de `main`; copiarlo con `cp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md` (A11). Check: `diff <(git show main:AGENTS.md | sed -n '/^## Reglas/,$p') <(sed -n '/^## Reglas/,$p' AGENTS.md)`; expect sin salida, exit 0.
- [x] Corrección (b): en `docs/como-funciona.md`, actualizar el tamaño de `AGENTS.md` («4250 hoy») con el valor de `wc -c AGENTS.md` (A11). Check: `grep -c "$(wc -c < AGENTS.md) hoy" docs/como-funciona.md`; expect 1 o más.
Segment verification: `node --test tests/context-size/sizes.test.mjs && cmp changes/piso-planner/borradores/AGENTS.borrador.md AGENTS.md && diff <(git show main:AGENTS.md | sed -n '/^## Reglas/,$p') <(sed -n '/^## Reglas/,$p' AGENTS.md) && git show main:AGENTS.md > "$TMPDIR/a.md" && sed -n '/^## Cómo/,/^## Reglas/p' "$TMPDIR/a.md" | grep '^- ' > "$TMPDIR/b.txt" && test "$(grep -cvxFf docs/como-funciona.md "$TMPDIR/b.txt")" = 0` — level 1; exit 0; covers A11.
Handoff: comando de viñetas: la parte de la verificación desde `git show`. Generar el documento extrayendo las líneas de `git show main:AGENTS.md` con un script o `sed` hacia el archivo, sin leer ni reescribir el texto a mano; encabezado `# Cómo funciona el kit (v2)`. Las referencias del planner se nombran en `planner.md` como archivos bajo `core/references/planner/`.
