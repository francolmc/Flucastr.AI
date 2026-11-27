## Steps

### Segment 7 — Story: métricas por tramo
As persona dueña del kit I want un registro por tramo so that decida con números.
Dependencies: Segment 6 — `senal`.
Contracts to keep: salida de `scripts/usage.mjs`; D-05.
Paths likely to change: `evals/builder/lib/metricas.mjs`, `tests/evals-builder/metricas.test.mjs`.
Concrete example of the expected result: dos intentos y DONE → `relanzamientos: 1`, `lineas: {prueba: 20, producto: 80, razon: 0.25}`.
Scope: módulo y prueba.
Files: evals/builder/lib/metricas.mjs, tests/evals-builder/metricas.test.mjs
WHEN termina una corrida THEN se calcula el registro completo sin inventar datos (A7)
Acceptance:
- A7: campos de «Métricas» (abajo) con sesiones y `runs.jsonl` ficticios; dato ausente o sin tarifa = null, nunca 0; check with `node --test tests/evals-builder/metricas.test.mjs`; expect exit 0.
TODO:
- [x] Escribir fixtures y valores esperados en `tests/evals-builder/metricas.test.mjs` (A7). Check: la prueba; expect rojo.
- [x] Implementar `evals/builder/lib/metricas.mjs` (A7). Check: la prueba; expect exit 0.
Segment verification: `node --test tests/evals-builder/metricas.test.mjs` — level 1; exit 0; covers A7.
Handoff: Métricas — `id`, `rep`, `variante`; `resultado` (`DONE`, `PAUSED`, `entorno`, `invalida`); `done_sin_intervencion`; `oraculo`; `pruebas_alteradas`; `relanzamientos` y `motivos`; `muertes_proceso`; `muertes_thrashing` y `thrashing_verificable` (false en Codex); `compactaciones`; `tokens` (entrada, cache_leida, salida, `por_modelo`); `creditos` y `sin_tarifa`; `segundos` (total, builder, verify, revisor); `lineas` prueba/producto (diff y archivos nuevos contra la base, sin `changes/`, `docs/`, `.md` ni lockfiles); `contaminado` (una sesión cita la ruta de un repo fuente); `contrato_ok` (las sesiones citan el `SKILL.md` de la copia y ninguno de la instalación viva); `referencia` (archivos, líneas). Uso: `usage.mjs --json --sessions --tool codex --project <carpeta> --codex-dir <real>`. Si builder y revisor comparten modelo, la separación es null.

## Evidence
