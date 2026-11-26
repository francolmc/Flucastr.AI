---
segment: 7
---
## Steps

### Segment 7 — Story: Pi y Codex
As persona usuaria I want que Pi compacte según la ventana del modelo so that no dispare a 100000.
Dependencies: Segment 1 — `compact_reserve` y ventana de terra.
Contracts to keep: la compactación global propia y los overrides propios se respetan; sin `compact_reserve` vale el cálculo antiguo; se quita solo el override exacto del kit.
Paths likely to change: `adapters/pi/compaction-plan.mjs`.
Concrete example of the expected result: modelo de 272000 → `reserveTokens` 92000 (dispara en 180000).
Scope: `adapters/pi/compaction-plan.mjs` y `tests/compaction/pi.test.mjs`.
Files: adapters/pi/compaction-plan.mjs
WHEN se fija Pi THEN la reserva es 92000 y se reemplaza el 172000 antiguo (A7).
Acceptance:
- A7: con `perfil.compact_reserve`, reserva = ese valor si es ≥16384 y menor que la ventana; si no, `omitido-umbral`. Un override sin registrar exactamente `{"reserveTokens":172000}` se reemplaza: sale `fijado:<modelo>=92000` y una línea «reemplazado 172000 en <modelo>». Cualquier otro override: `omitido-usuario`. La simulación no escribe.
TODO:
- [x] Implementar la reserva y el reemplazo en `adapters/pi/compaction-plan.mjs` (A7). Check: `node --check adapters/pi/compaction-plan.mjs`; salida 0.
- [x] Crear `tests/compaction/pi.test.mjs` con los casos de A7 y el cálculo antiguo, vía `fijar-compactacion pi` de `scripts/resolver.mjs` (A7). Check: `node --test tests/compaction/pi.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/pi.test.mjs` — level 1; exit 0; covers A7.
Handoff: Ejemplo: `{"reserveTokens":150000}` no cambia. `adapters/pi/install-compaction.sh` ya imprime líneas desconocidas; no lo edites.

## Evidence

$ node --check adapters/pi/compaction-plan.mjs
(sin salida)
exit 0

$ node --test tests/compaction/pi.test.mjs
ℹ tests 12
ℹ suites 3
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 545.904838
exit 0

## Notes
