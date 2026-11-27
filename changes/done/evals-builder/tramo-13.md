## Steps

### Segment 13 — Story: tramos no reproducibles fuera del corpus
As persona que mide I want excluir lo que no corre en el sandbox de Codex so that no gaste cuota en él.
Dependencies: Segment 12 — registros por tramo.
Contracts to keep: 16 entradas, IDs y hashes del corpus; mínimo de 10 válidos para `correr`; formato de `calibracion.json`.
Paths likely to change: `evals/builder/corpus.json`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/corpus.test.mjs` (solo estado de K-03 y K-05 y conteos 8/6/2, por D-36), `tests/evals-builder/calibrar.test.mjs`.
Concrete example of the expected result: `calibrar` imprime `[3/16] K-03 descartado: excluido` sin crear copia.
Scope: los archivos de *Files* y sus pruebas en `tests/evals-builder/`.
Files: evals/builder/corpus.json, evals/builder/lib/calibrar.mjs
WHEN un tramo está `excluido` THEN `calibrar` no lo ejecuta y queda no válido (A14)
Acceptance:
- A14: K-03 y K-05 tienen `estado: excluido`; `calibrar` los reporta `valido: false`, `motivo: excluido`, sin ejecutarlos (D-36); check with `node --test tests/evals-builder/*.test.mjs`; expect exit 0.
TODO:
- [x] En `evals/builder/corpus.json`, marcar K-03 y K-05 `excluido` (A14). Check: `node --test tests/evals-builder/corpus.test.mjs`; expect 8 calibrados, 6 reservas, 2 excluidos.
- [x] En `evals/builder/lib/calibrar.mjs`, no ejecutar los excluidos (A14). Check: caso en `tests/evals-builder/calibrar.test.mjs`; expect ejecutor sin llamar.
Segment verification: `timeout 300 node --test tests/evals-builder/*.test.mjs` — level 2; exit 0; covers A14.
Handoff: en la corrida real, código antiguo del kit falló con EPERM dentro del sandbox de Codex. No corras el banco sobre los repos reales ni leas `local.json` para la evidencia.

## Evidence

Segmento 13 (builder, 2026-11-27, desde `/home/franco/Codes/flucastr/Flucastr.AI`):

$ timeout 60 node --test tests/evals-builder/corpus.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ timeout 60 node --test tests/evals-builder/calibrar.test.mjs
✔ calibrar: un tramo excluido se reporta sin ejecutarlo (A14, D-36)
ℹ tests 16
ℹ pass 16
ℹ fail 0
exit 0

$ timeout 300 node --test tests/evals-builder/*.test.mjs
ℹ tests 93
ℹ suites 0
ℹ pass 93
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 5470.9377
exit 0 (5 s; tope 300 s fijado por el planner, 2026-11-27)

## Notes

Checkpoint segmento 13 (builder, 2026-11-27, pausa antes de la comprobación de segmento): `evals/builder/corpus.json` marca K-03 y K-05 como `excluido` (D-36); `tests/evals-builder/corpus.test.mjs` acepta el estado `excluido` y cuenta 8 calibrados, 6 reservas y 2 excluidos (7/7); `evals/builder/lib/calibrar.mjs` reporta un tramo `excluido` como `{valido: false, motivo: "excluido"}` sin llamar a `ejecutar` (prueba A14 nueva en `calibrar.test.mjs`, 16/16). Pendientes de `tramo-13.md`: 0 (contado con awk, tras marcar las dos casillas). Falta: el banco completo (segment check, level 2) y la verificación final del cambio; no se corrió porque no hay duración registrada.
Revisar: (1) el planner decide el tope del banco (`timeout 300` como en tramos 9–12, o el que fije) para reanudar. (2) Sin commit; repos fuente no tocados.

Reanudación del segmento 13 (builder, 2026-11-27): tope `timeout 300` fijado por el planner. Comprobación de segmento `timeout 300 node --test tests/evals-builder/*.test.mjs`: 93/93, exit 0, 5 s (muy por debajo del tope). Archivos del tramo: `evals/builder/corpus.json`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/corpus.test.mjs`, `tests/evals-builder/calibrar.test.mjs`. Diff: K-03 y K-05 quedan `estado: excluido`; `calibrar` los reporta `valido: false, motivo: excluido` sin ejecutarlos (A14). Pendientes del tramo: 0. Historia completa; no se abre `tramo-14.md` en esta corrida. Revisar: el planner revisa y reaprueba antes de reanudar en el tramo 14.
