---
plan: plan.md
segment: 2
---

## Steps

### Segment 2 — Story: un informe agrega duración por fase y retrabajo
As a kit user I want `node scripts/runs-report.mjs` so that ver mediana y p90 por fase, tasa de relanzamiento y motivos.
Dependencies: Segment 1 — formato de línea del registro.
Contracts to keep: `scripts/usage.mjs` no cambia; las tres suites de aceptación siguen siendo tres.
Paths likely to change: `scripts/runs-report.mjs`, `tools/run/informe.mjs` (nuevos), `tools/verify/usage-and-run.sh` (paso 14), `tests/runs-report/run.mjs` (nuevo), `tests/README.md`.
Concrete example of the expected result: con 4 líneas de builder_ms 10, 20, 30, 100, el informe muestra builder mediana 25, p90 100; 1 de 4 intentos con relanzamiento (25 %), motivo `verify` ×1.
Scope: `scripts/runs-report.mjs`, `tools/run/informe.mjs`, `tools/verify/usage-and-run.sh`.
Files: scripts/runs-report.mjs, tools/run/informe.mjs, tools/verify/usage-and-run.sh
WHEN el informe lee `changes/**/runs.jsonl` válidos THEN muestra mediana y p90 por fase, tasa de relanzamiento y distribución de motivos (A6)
WHEN el log está vacío o no existe ninguno THEN dice «sin registros» y sale con 0 (A7)
WHEN una línea es corrupta THEN la lista con `archivo:línea` y causa, imprime las estadísticas de las válidas y sale con 1 (A8)
WHEN el plan trae líneas `- Devuelto: <categoría>` en `## Notes` THEN el informe las cuenta por categoría con origen «manual», aparte del `.jsonl` (A9)
Acceptance:
- A6: fixture con 4 intentos → builder mediana 25 / p90 100, tasa 25 %, motivos `verify`:1; check con `node tests/runs-report/run.mjs` (caso con cifras exactas); expect pasa.
- A7: fixture vacío → salida con «sin registros» y exit 0; check caso vacío; expect pasa.
- A8: fixture con una línea corrupta → exit 1, stderr con `archivo:línea`, y estadísticas de las válidas en stdout; check caso corrupto; expect pasa. Sensibilidad: una variante que ignora el error en silencio debe hacer fallar este caso.
- A9: fixture con 2 `Devuelto: defecto` y 1 `Devuelto: omision` → conteos 2/1 con origen manual; una línea mal formada (`Devuelto: cosa`) no se cuenta y se avisa; check caso manual; expect pasa.
- A10: `./verify` ejecuta la suite nueva como paso 14 y no cambia las suites de aceptación; check `grep -c "runs-report" tools/verify/usage-and-run.sh` y `./verify`; expect ≥ 1 y verde.
TODO:
- [x] Crear `tools/run/informe.mjs` con lectura estricta de JSONL (error por línea inválida), `percentil`, y agregación (A6, A8). Check: casos de la suite; expect pasan.
- [x] Crear `scripts/runs-report.mjs` con CLI (`--raiz`, por defecto el repo actual), semántica 0/1/2 y salida de texto (A6, A7, A8). Check: `node scripts/runs-report.mjs` en un repo sin logs; expect «sin registros» y exit 0.
- [x] Contar líneas `Devuelto:` en `## Notes` de cada `plan.md` bajo `changes/` (A9). Check: caso manual; expect conteos 2/1.
- [x] Crear `tests/runs-report/run.mjs` y fixtures (vacío, con relanzamientos con cifras exactas, corrupto, manual) (A6–A9). Check: `node tests/runs-report/run.mjs`; expect verde.
- [ ] Agregar el paso 14 a `tools/verify/usage-and-run.sh` y una línea en `tests/README.md` (A10). Check: `./verify`; expect verde.
Segment verification: `node tests/runs-report/run.mjs` — level 1; exit 0; covers A6–A9; el paso 14 se cubre con `VERIFY_RAPIDO=1 ./verify` (level 2) en la verificación final.
Handoff: no reutilizar `tools/usage/jsonl.mjs` (salta líneas inválidas en silencio). Percentil por rango más cercano. Formato de línea definido en Segment 1.

## Evidence
- Paso 1 (`tools/run/informe.mjs`): `node tests/runs-report/run.mjs` → `ok funciones puras`, `ok A6`, `ok A8`; exit 0.
- Paso 2 (`scripts/runs-report.mjs`): `node scripts/runs-report.mjs` en el repo real (sin `runs.jsonl`) → `sin registros`, exit 0.
- Paso 3 (`Devuelto:` en Notes): `ok A9: devoluciones manuales cuentan 2 defecto y 1 omision; Evidence no cuenta; mal formada se avisa`; `ok lectura de Devuelto`; exit 0.
- Paso 4 (suite y fixtures): `node tests/runs-report/run.mjs` → `7 casos ok`, exit 0.
- Sensibilidad A8: copia de `scripts/runs-report.mjs` sin `corrupta` ni `process.exit(1)` pasada con `--cli` → `FALLO A8: ... 0 !== 1`, `1 caso(s) fallaron`, exit 1 (el caso detecta la variante que ignora el error).
- Paso 5 (paso 14 y README): `grep -c "runs-report" tools/verify/usage-and-run.sh` → 3; `bash -n` exit 0; `node tests/runs-report/run.mjs` directo → exit 0. Check `./verify` NO cumplido: `./verify` sale con 1 (92 s) en el paso 13 por el caso de línea base («las opciones en inglés conservan el recorrido…»), así que el paso 14 no llega a correr dentro de `./verify`. Igual con `VERIFY_RAPIDO=1 ./verify` (72 s, exit 1, mismo caso). Paso 5 queda pendiente.
- Segment verification: `node tests/runs-report/run.mjs` → exit 0.
