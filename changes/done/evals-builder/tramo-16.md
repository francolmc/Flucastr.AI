## Steps

### Segment 16 — Story: pruebas de referencia ocultas
As persona que compara contratos I want que el builder escriba sus pruebas so that la razón prueba/producto mida algo.
Dependencies: Segment 15 — señal con la referencia.
Contracts to keep: `calibrar` sigue con las pruebas visibles; pruebas del oráculo no nombradas, previos y citadas ausentes en la referencia siguen visibles.
Paths likely to change: `evals/builder/lib/plan.mjs`, `evals/builder/lib/calibrar.mjs`, `evals/builder/lib/correr.mjs`, `tests/evals-builder/plan.test.mjs`, `calibrar.test.mjs`, `correr.test.mjs`.
Concrete example of the expected result: oráculo `test/a.test.mjs` (nombrada en un paso) y `test/b.test.mjs` (no): al correr, `a` queda como en la base o no existe y entra en *Scope*; `b` es la de la referencia y no entra.
Scope: los archivos de *Files* y sus pruebas en `tests/evals-builder/`.
Files: evals/builder/lib/plan.mjs, evals/builder/lib/calibrar.mjs, evals/builder/lib/correr.mjs
WHEN `correr` prepara un tramo THEN oculta las pruebas de referencia que el tramo nombra (A17)
Acceptance:
- A17: son ocultas las rutas del oráculo que el bloque del tramo nombra por ruta, o por nombre de archivo si solo una del oráculo lo tiene; en `correr` no se superponen (tampoco como citadas), entran en *Scope* con la convención de `Files:` (también con repo hijo) sin que `kit-scope` las marque, y la señal de A16 las reaplica; `calibrar` no cambia (D-34); check with `node --test tests/evals-builder/*.test.mjs`; expect exit 0.
TODO:
- [x] En `evals/builder/lib/plan.mjs`, admitir rutas extra de *Scope* (A17). Check: caso en `plan.test.mjs`; expect `Files:` más las extra y `Files:` sin cambios.
- [x] En `evals/builder/lib/calibrar.mjs`, ocultar bajo opción de `prepararTramo` (A17). Check: casos raíz e hijo en `calibrar.test.mjs`; expect archivo ausente o de la base, en *Scope*, árbol limpio.
- [x] En `evals/builder/lib/correr.mjs`, pedir la opción al preparar (A17). Check: caso con builder falso que crea la prueba; expect sin falla de alcance, líneas de prueba mayores que 0 y `oraculo_pasa` con la de referencia.
Segment verification: `timeout 300 node --test tests/evals-builder/*.test.mjs` — level 2; exit 0; covers A17.
Handoff: con las pruebas visibles el builder pausó por tener que editar una fuera de *Scope* y casi no escribió pruebas. Sustituye D-04 solo en `correr`. No corras el banco sobre los repos reales ni leas `local.json` para la evidencia. (D-04: en `correr` rige D-34)

## Evidence

## Notes
