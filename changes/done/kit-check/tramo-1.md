## Steps

### Segment 1 — Story: extraer la tabla de aceptación (3 formatos)

As a planner, I want a parser that turns a plan into rows `{id, resultado, comprobacion, esperado, comando, cwd}` so that a tool, not the model, knows what must be checked.

Dependencies: ninguna (primer tramo).
Scope: solo `tools/check/parse.mjs` y `tests/kit-check/`. No tocar `kit run`, `review-plan.mjs` ni `tools/run/plan.mjs` (se importa `frontmatter`).
Files: `tools/check/parse.mjs`, `tests/kit-check/parse.test.mjs`, `tests/kit-check/fixtures/tabla.md`, `tests/kit-check/fixtures/historia.md`, `tests/kit-check/fixtures/lista.md`, `tests/kit-check/fixtures/malformada.md` (planes sintéticos anonimizados).

Contract: `parsearPlan(rutaPlan, { segmento })` devuelve `{ filas, error }`. Cada fila: `id` (A#), `resultado`, `comprobacion`, `esperado`, `comando` (un único span entre acentos graves que empiece por un ejecutable conocido o `./`; si hay 0 o 2+, `null`), `formato` (`tabla`|`historia`|`lista`), `segmento`, `cwd`. `cwd`: raíz del proyecto (dos niveles sobre `changes/<n>/`, tres si está en `done/`); si `repos:` tiene una sola carpeta distinta de `.`, esa; si varias, la raíz. No escribe en el plan.

Example: fila `| A1 | Receta | \`grep -c x f\` | exit 0 |` → `{id:"A1", comando:"grep -c x f", esperado:"exit 0"}`. Línea `- A2: lista; check with \`node t.mjs\`; expect exit 0.` → igual, formato `historia`. Línea `- A3: texto libre` → `comando:null`, formato `lista`.

WHEN el plan trae tabla de 4 columnas (cabeceras ES o EN) THEN se extraen todas las filas A1 (A1).
WHEN el plan trae historias con `Acceptance:` en `plan.md` o en `tramo-N.md` enlazados y se pasa `segmento` THEN solo salen las filas de ese tramo (A2).
WHEN la tabla está mal formada (menos de 4 columnas, A# repetido o sin filas) THEN `error` descriptivo y ninguna fila (A3).
WHEN se pasa `segmento` y el plan solo tiene tabla global THEN `error` («tabla global, no filtrable») (A4).
WHEN una fila no es automatizable de forma inequívoca (lista antigua, 0 o 2+ comandos) THEN `comando:null` y el motivo (A5).

Acceptance:
- A1: la tabla se extrae completa; check with `node --test tests/kit-check/parse.test.mjs`; expect exit 0.
- A2: `segmento` filtra historias y tramos enlazados; check with `node --test --test-name-pattern=segmento tests/kit-check/parse.test.mjs`; expect exit 0.
- A3: tabla mal formada da error y cero filas; check with `node --test --test-name-pattern=malformada tests/kit-check/parse.test.mjs`; expect exit 0.
- A4: `segmento` sobre tabla global da error; check with `node --test --test-name-pattern=global tests/kit-check/parse.test.mjs`; expect exit 0.
- A5: lista antigua y comandos ambiguos dan `comando:null`; check with `node --test --test-name-pattern=ambiguo tests/kit-check/parse.test.mjs`; expect exit 0.

TODO:
- [x] Crear `tests/kit-check/fixtures/` con planes sintéticos (tabla, historia, tramo enlazado, lista antigua, tabla malformada); sin contenido de proyectos reales. Check: `ls tests/kit-check/fixtures`.
- [x] Escribir `tests/kit-check/parse.test.mjs` con un caso por A1–A5 (A1, A2, A3, A4, A5); deben fallar antes de implementar. Check: `node --test tests/kit-check/parse.test.mjs` (falla).
- [x] Implementar `tools/check/parse.mjs` (ESM, sin dependencias, importa `frontmatter` de `tools/run/plan.mjs`). Check: `node --test tests/kit-check/parse.test.mjs`.
- [x] Confirmar que el plan fixture no cambia tras parsear (hash antes/después en la prueba). Check: `node --test --test-name-pattern=solo-lee tests/kit-check/parse.test.mjs`.

Segment verification: `node --test tests/kit-check/parse.test.mjs` (nivel 1; sin `./verify` completo).
Handoff: `parsearPlan` y la forma de fila quedan fijas; el tramo 2 las usa sin cambiarlas. Anotar en Notes la duración medida de la prueba.
