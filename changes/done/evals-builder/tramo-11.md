## Steps

### Segment 11 — Story: calibrar bien y ver el avance
As persona que corre el banco I want ver el tramo en curso so that distinga una corrida larga de una detenida.
Dependencies: Segment 10 — banco documentado.
Contracts to keep: `calibracion.json`, `corrida.json`, `resultados.jsonl`, códigos de salida, stdout actual y huella `kit`; los demás tramos se calibran igual.
Paths likely to change: `evals/builder/lib/calibrar.mjs`, `evals/builder/lib/correr.mjs`, `evals/builder/README.md`, `tests/evals-builder/calibrar.test.mjs`, `tests/evals-builder/correr.test.mjs` (casos nuevos; ninguno existente se debilita).
Concrete example of the expected result: stderr `[3/16] K-03` al empezar y `[3/16] K-03 válido` o `[3/16] K-03 descartado: referencia-roja` al terminar.
Scope: esos tres archivos de producto y sus pruebas.
Files: evals/builder/lib/calibrar.mjs, evals/builder/lib/correr.mjs, evals/builder/README.md
WHEN una prueba citada existe en la referencia THEN `calibrar` no la pisa con `HEAD` (A4)
WHEN empieza o termina un tramo THEN stderr lo dice (A12)
Acceptance:
- A4: una prueba citada en la verificación se toma de `HEAD` solo si no existe en `referencia` (D-30); check with caso en `calibrar.test.mjs` sobre un repo temporal; expect la versión de la referencia, y la de `HEAD` solo para la ausente.
- A12: `calibrar` y `correr` escriben en stderr posición, total e ID al empezar y el resultado al terminar cada tramo (D-31); check with `node --test tests/evals-builder/*.test.mjs`; expect líneas en orden, sin rutas ni salida cruda.
TODO:
- [x] En `evals/builder/lib/calibrar.mjs`, tomar de `HEAD` solo las pruebas citadas ausentes en `referencia` (A4). Check: caso nuevo en `calibrar.test.mjs`; expect falla antes y pasa después.
- [x] En `evals/builder/lib/calibrar.mjs`, avisar inicio y resultado de cada tramo por stderr (A12). Check: caso con ejecutor falso; expect dos líneas por tramo, también con error.
- [x] En `evals/builder/lib/correr.mjs`, avisar cada par con posición, total, ID y repetición; los saltados al reanudar se marcan (A12). Check: caso con ejecutor falso; expect líneas en orden.
- [x] En `evals/builder/README.md`, describir el avance y cuándo se pisa una prueba citada (A4, A12). Check: lectura contra el código; expect sin contradicciones.
Segment verification: `node --test tests/evals-builder/*.test.mjs && ./verify` — level 3; exit 0; covers A4, A12.
Handoff: la calibración real mostró el defecto en K-01: la versión de `HEAD` de una prueba citada importa un módulo que no existía en la referencia. Ejemplo: citada `tests/x.test.mjs` presente en `referencia` → queda como en la superposición normal o la base. No corras el banco sobre los repos reales.

## Evidence

Segmento 11 (`tramo-11.md`), desde `/home/franco/Codes/flucastr/Flucastr.AI` (builder, 2026-11-27):

$ timeout 60 node --test --test-name-pattern="se toma de ella" tests/evals-builder/calibrar.test.mjs   (A4, antes del cambio: se restauró temporalmente el filtro «HEAD para toda citada»; esperado rojo)
✖ calibrar: prueba citada presente en la referencia se toma de ella, no de HEAD; la ausente sí de HEAD (A4)
exit 1
(restaurado el arreglo después)

$ timeout 120 node --test tests/evals-builder/correr.test.mjs tests/evals-builder/calibrar.test.mjs   (segmento, tras A4 y A12)
ℹ tests 37
ℹ pass 37
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs   (banco completo)
ℹ tests 88
ℹ pass 88
ℹ fail 0
ℹ duration_ms 4517.616341
exit 0

$ timeout 398 ./verify   (comprobación de segmento, nivel 3; también corrida 2 de 3 de *Verification* sobre el árbol actual)
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 019b8469cb84
VERIFY OK
exit 0

$ node scripts/kit-verificado.mjs estado --nivel aceptacion
Fingerprint: 019b8469cb84
ya verificado: nivel=aceptacion fase=26
exit 0

Pendientes de `tramo-11.md`: 0 (contado con awk).

## Notes
