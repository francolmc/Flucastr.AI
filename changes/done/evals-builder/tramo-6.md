## Steps

### Segment 6 — Story: señal de cada falla
As persona dueña del kit I want la señal de cada intento fallido so that pueda contar muertes por causa.
Dependencies: Not applicable.
Contracts to keep: campos actuales de `runs.jsonl`, decisiones y salidas de `kit run`.
Paths likely to change: `scripts/kit-run.mjs`, `docs/kit-run.md`, `tests/evals-builder/senal.test.mjs`.
Concrete example of the expected result: builder falso que muere con `Autocompact is thrashing` → `"clase":"infra","senal":"thrashing"`.
Scope: esos tres archivos; y el caso R1 de `tests/kit-run/run.mjs` (D-23).
Files: scripts/kit-run.mjs, docs/kit-run.md, tests/evals-builder/senal.test.mjs, tests/kit-run/run.mjs
WHEN un intento falla THEN `runs.jsonl` guarda `senal` (A6)
Acceptance:
- A6: `senal` con la del clasificador o null si no falló; documentado; pruebas de `kit run` verdes, con el único cambio de D-23; check with `node --test tests/evals-builder/senal.test.mjs && node tests/kit-run/run.mjs`; expect exit 0.
TODO:
- [x] Probar thrashing y DONE en `tests/evals-builder/senal.test.mjs` (A6). Check: la prueba; expect rojo.
- [x] Sumar `senal` a `CAMPOS_REGISTRO` y «19 campos» en `tests/kit-run/run.mjs`, solo R1, D-23 (A6). Check: `git diff tests/kit-run/run.mjs`; expect solo esas líneas.
- [x] Añadir `senal` al intento en `scripts/kit-run.mjs` (A6). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Documentar `senal` en `docs/kit-run.md` (A6). Check: `rg -n 'senal' docs/kit-run.md`; expect una línea.
Segment verification: `node --test tests/evals-builder/senal.test.mjs && node tests/kit-run/run.mjs` — level 1; exit 0; covers A6.
Handoff: `intento.clase` se asigna en varios puntos de `scripts/kit-run.mjs`; la señal sale de `cl.senal`. Usar `KIT_RUN_BUILDER` y `KIT_RUN_REVIEWER` falsos.

## Evidence
