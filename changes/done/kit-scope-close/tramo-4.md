## Steps

### Segment 4 — Story: integrar y calibrar con planes reales
As planner I want both checks in `./verify`, documented, and calibrated on real plans, so that they stay green and are trusted.
Dependencies: Segment 2 y Segment 3 — ambos scripts y sus suites.
Contracts to keep: pasos 1–16 de `tools/verify/usage-and-run.sh` sin cambios; lo demás de `README.md` y `AGENTS.md`.
Paths likely to change: `tools/verify/usage-and-run.sh`, `tests/README.md`, `README.md`, `AGENTS.md` (documentos no cuentan para el límite de tres archivos de producto).
Concrete example of the expected result: `./verify` imprime «paso 17 kit-scope» y «paso 18 kit-close» en verde; `node scripts/kit-scope.mjs changes/done/kit-check/plan.md` da una tabla sin falsos errores.
Scope: `tools/verify/usage-and-run.sh`, `tools/check/cierre.mjs`, `tests/kit-close/run.mjs`, `tests/README.md`, `README.md`, `AGENTS.md`.
Files: tools/verify/usage-and-run.sh, tools/check/cierre.mjs, tests/kit-close/run.mjs, tests/README.md, README.md, AGENTS.md
WHEN corre `./verify` THEN ejecuta las suites `tests/kit-scope/run.mjs` y `tests/kit-close/run.mjs` como pasos 17 y 18 (A1).
WHEN se leen README, `tests/README.md` y AGENTS.md THEN describen ambos comandos, exit 0/1/2/3 y los casos «no verificable» (A2).
WHEN se corre `kit-close` sobre 3 planes archivados reales THEN ningún error se debe a formato: etiqueta antes de `$` se acepta, plan v1 sin `status:` es `no_verificable` (A3).

#### Calibración (sin cambiar planes)
Planes de prueba: `changes/done/kit-check/plan.md`, `changes/done/permisos-v2/plan.md` y el plan más reciente de `changes/done/`. `kit-scope` sobre ellos no puede comparar git útil (ya mergeados): se corre con `--base` a su rama o se documenta «no verificable». Lo que se pide es que `kit-close` y el parser de Scope no den falso «error» por formato; los «no verificable» legítimos se listan en Notes. Los formatos de etiqueta y v1 ya se corrigen en un paso (ver TODO); la evidencia solo en prosa sigue siendo error por contrato. Otro formato que rompa el parser: parar con nota.

Acceptance:
- A1: `./verify` ejecuta ambas suites; check with `./verify`; expect exit 0 y líneas «paso 17» y «paso 18» (≈ medir; tope 60 s extra sobre la base).
- A2: la documentación coincide con el comportamiento; check with `rg -n "kit-scope|kit-close" README.md tests/README.md AGENTS.md`; expect al menos una mención en cada archivo y los códigos 0/1/2/3.
- A3: (reformulado y confirmado el 2026-11-24) `kit-check` da exit 0 o 3; `permisos-v2` (plan v1) da exit 3; `progreso-en-vivo` puede dar exit 1 solo por evidencia en prosa, que se documenta como error detectado, no como falso; check with `node scripts/kit-close.mjs changes/done/<plan>/plan.md` en los tres; expect esos códigos y un test nuevo por cada formato.

TODO:
- [x] Añadir pasos 17 (`node tests/kit-scope/run.mjs`) y 18 (`node tests/kit-close/run.mjs`) en `tools/verify/usage-and-run.sh`. Check: `bash -n tools/verify/usage-and-run.sh`; expect exit 0 (A1).
- [x] Documentar ambos en `tests/README.md` (tabla de suites) y `README.md` (uso, códigos, `--json`, no verificable). Check: `rg -n "kit-scope|kit-close" README.md tests/README.md`; expect menciones (A2).
- [x] Añadir una línea en `./AGENTS.md` (patrón de «Comprobación de criterios A#»). Check: `rg -n "kit-scope" AGENTS.md`; expect una línea (A2).
- [x] En `tools/check/cierre.mjs` aceptar `etiqueta: $ cmd` como línea de evidencia y devolver `no_verificable` global si falta `status:` (formato v1); añadir ambos casos y su sensibilidad a `tests/kit-close/run.mjs`. Check: `node tests/kit-close/run.mjs`; expect exit 0 (A3).
- [x] Calibrar sobre los tres planes reales y anotar en `## Notes` cada «no verificable» y su motivo. Check: `node scripts/kit-close.mjs changes/done/kit-check/plan.md`; expect exit 0 o 3 (A3).
- [x] Correr `node scripts/review-plan.mjs changes/kit-scope-close/plan.md`; expect sin avisos nuevos (el plan no se edita aquí). Check: mismo comando; expect exit 0 (A3). Aceptado por el planner: único aviso residual «supera 8192 bytes» (Evidence del builder), no aplica.
- [x] Correr `./verify` completo una vez (≈ minutos; medir). Check: `./verify`; expect exit 0 (A1).
Segment verification: `./verify` — level 3; exit 0; covers A1, A2, A3.
Handoff: es el último tramo; al terminar, resumen de cinco líneas en Notes, sin commit; la persona usuaria decide el commit en Gate 2. Sin red: `git fetch` no funciona en el sandbox. Si `./verify` falla en un paso ajeno a 17–18, anotar y parar.
