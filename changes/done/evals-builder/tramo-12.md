## Steps

### Segment 12 — Story: tiempo y motivo de cada tramo
As persona que decide con datos I want el tiempo de los tramos relanzados y su registro so that la línea base sirva para comparar.
Dependencies: Segment 11 — calibración y avance.
Contracts to keep: campos de `resultados.jsonl` y `corrida.json`, stdout y stderr actuales, códigos de salida, huella `kit`, calibración existente válida.
Paths likely to change: `evals/builder/lib/metricas.mjs`, `evals/builder/lib/correr.mjs`, `evals/builder/README.md`, `tests/evals-builder/metricas.test.mjs`, `tests/evals-builder/correr.test.mjs` (si un caso afirma el total nulo anterior, cambia solo esa afirmación según D-32; ninguno más se debilita).
Concrete example of the expected result: intento 1 `builder_ms` 1000, `verify_ms` 10, sin revisor; intento 2 `builder_ms` 2000, `verify_ms` 10, `revisor_ms` 500 → `segundos` total 3.52, builder 3, verify 0.02, revisor 0.5.
Scope: esos tres archivos de producto y sus pruebas.
Files: evals/builder/lib/metricas.mjs, evals/builder/lib/correr.mjs, evals/builder/README.md
WHEN un intento no llega a una fase THEN el tiempo suma las fases que sí corrieron (A7)
WHEN termina `kit run` en un par THEN su registro queda en `<salida>/logs` (A13)
Acceptance:
- A7: cada fase suma los intentos donde se registró y es null si no se registró en ninguno; `total` suma las fases registradas y es null solo sin ninguna (D-32); check with casos en `metricas.test.mjs`; expect el ejemplo anterior y un PAUSED sin revisor con total.
- A13: por par se guardan `logs/<ID>-r<rep>-runs.jsonl` y `logs/<ID>-r<rep>-kit-run.log` antes de borrar la copia, también si `kit run` falla o no deja intentos (D-33); check with `node --test tests/evals-builder/*.test.mjs` con `kit run` falso; expect ambos archivos y ninguna ruta nueva en `resultados.jsonl`.
TODO:
- [x] En `evals/builder/lib/metricas.mjs`, sumar solo las fases registradas (A7). Check: caso del ejemplo en `tests/evals-builder/metricas.test.mjs`; expect falla antes y pasa después.
- [x] En `evals/builder/lib/correr.mjs`, guardar en `<salida>/logs` el registro y la salida de `kit run` (A13). Check: caso con `kit run` falso en `tests/evals-builder/correr.test.mjs`; expect los dos archivos, también sin intentos.
- [x] En `evals/builder/README.md`, describir el tiempo, los dos registros y que `--salida` va fuera del repo porque trae salida cruda (A7, A13). Check: lectura contra el código; expect sin contradicciones.
Segment verification: `node --test tests/evals-builder/*.test.mjs && ./verify` — level 3; exit 0; covers A7, A13.
Handoff: `kit run` deja `revisor_ms` null cuando la puerta o la verificación cortan el intento, y `builder_ms` null cuando solo se repite el revisor. El humo real perdió el total por eso. No corras el banco sobre los repos reales.

## Evidence

## Notes
