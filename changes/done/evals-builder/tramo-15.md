## Steps

### Segment 15 — Story: las pruebas de referencia como señal
As persona que mide I want saber si el resultado pasa las pruebas de referencia so that DONE no sea la única señal.
Dependencies: Segment 14 — copias correctas.
Contracts to keep: líneas y sesiones se miden antes de reaplicar; `resultado` no depende de la señal; invalida por contaminación y contrato sigue; la copia se borra siempre.
Paths likely to change: `evals/builder/lib/correr.mjs`, `evals/builder/lib/metricas.mjs`, `evals/builder/lib/comparar.mjs`, `tests/evals-builder/correr.test.mjs`, `metricas.test.mjs`, `comparar.test.mjs`. Las afirmaciones sobre `pruebas_alteradas` y `oraculo` se sustituyen por `oraculo_pasa` (D-37); ninguna otra se debilita.
Concrete example of the expected result: el builder deja la verificación en rojo con la referencia: línea `resultado: DONE`, `oraculo_pasa: false`.
Scope: los archivos de *Files* y sus pruebas en `tests/evals-builder/`.
Files: evals/builder/lib/correr.mjs, evals/builder/lib/metricas.mjs, evals/builder/lib/comparar.mjs
WHEN termina un par con intentos THEN se corre la verificación con la referencia (A16)
Acceptance:
- A16: tras medir, el banco reescribe las pruebas de referencia y corre la verificación del tramo; `oraculo_pasa` es true, false o null si no se pudo correr, reemplaza `oraculo` y `pruebas_alteradas`, no cambia `resultado`, y su salida va a `<salida>/logs`; `comparar` informa su tasa sobre los pares con dato y la columna por par (D-37); check with `node --test tests/evals-builder/*.test.mjs`; expect exit 0.
TODO:
- [x] En `evals/builder/lib/correr.mjs`, reaplicar y verificar después de medir (A16). Check: casos verde, rojo y excepción en `correr.test.mjs`; expect true, false y null, líneas sin la referencia.
- [x] En `evals/builder/lib/metricas.mjs`, publicar `oraculo_pasa` y quitar los dos campos anteriores (A16). Check: `metricas.test.mjs`; expect `resultado` DONE con señal false.
- [x] En `evals/builder/lib/comparar.mjs`, informar tasa y columna (A16). Check: caso en `comparar.test.mjs`; expect `-` sin dato.
Segment verification: `timeout 300 node --test tests/evals-builder/*.test.mjs` — level 2; exit 0; covers A16.
Handoff: `prepararTramo` ya expone `reaplicarOraculo` y `verificar(paso)`; usa un nombre de paso `oraculo`. No corras el banco sobre los repos reales ni leas `local.json` para la evidencia.

## Evidence

## Notes
