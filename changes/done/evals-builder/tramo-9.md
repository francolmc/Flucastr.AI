## Steps

### Segment 9 — Story: comparar y A/B preparado
As persona dueña del kit I want comparar dos corridas pareadas so that el A/B de contrato solo pida pegar la variante.
Dependencies: Segment 8 — formato de resultados.
Contracts to keep: D-01, D-05.
Paths likely to change: `evals/builder/lib/comparar.mjs`, `evals/builder/variantes/contrato-b.json`, `tests/evals-builder/comparar.test.mjs`.
Concrete example of the expected result: `bench.mjs comparar /tmp/a /tmp/b` imprime filas por ID con diferencias y totales.
Scope: esos tres archivos.
Files: evals/builder/lib/comparar.mjs, evals/builder/variantes/contrato-b.json, tests/evals-builder/comparar.test.mjs
WHEN se comparan dos corridas THEN solo se aceptan si son pareables (A10)
Acceptance:
- A10: distinta semilla, orden, repeticiones, corpus, huella de kit o versión de Codex → exit 2; excluye y lista pares `entorno`, `invalida` o `contaminado`; informa n, tasas y medianas y el desglose por tamaño; con una sola carpeta resume esa corrida; salida solo con IDs y números; `contrato-b.json` trae las dos rutas en null y `correr` lo rechaza; check with `node --test tests/evals-builder/comparar.test.mjs`; expect exit 0.
TODO:
- [x] Escribir casos en `tests/evals-builder/comparar.test.mjs` (A10). Check: la prueba; expect rojo.
- [x] Crear `evals/builder/variantes/contrato-b.json` (A10). Check: la prueba; expect rechazo con 2.
- [x] Implementar `evals/builder/lib/comparar.mjs` (A10). Check: la prueba; expect exit 0.
- [x] Añadir a los resúmenes de `evals/builder/lib/comparar.mjs` las medianas de compactaciones y de razón prueba/producto, y los totales de `muertes_proceso` y `muertes_thrashing`, marcando thrashing no verificable (A10). Check: caso en `tests/evals-builder/comparar.test.mjs`; expect valores en A y B, `-` sin dato.
Segment verification: `node --test tests/evals-builder/comparar.test.mjs` — level 1; exit 0; covers A10.
Handoff: las huellas `contrato` y `modelos` pueden diferir (es la variante) y se informa cuáles; la huella `kit` no (D-26). tamaños por líneas de referencia: hasta 60, 61–150, más de 150.

## Evidence
