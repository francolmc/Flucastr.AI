# Tramo 1

## Steps

### Segment 1 — Story: verify limpio y breve
As persona usuaria I want que los temporales huérfanos se borren solos so that `/tmp` no se llene.
Dependencies: Not applicable.
Contracts to keep: argumentos, salida y códigos de salida de `scripts/kit-run.mjs`.
Paths likely to change: `scripts/kit-run.mjs` (lo prueba `tests/kit-run/run.mjs`, que no se edita; copia `tools/` entero).
Concrete example of the expected result: con `base/flucastr-verify.aaaaaa` de hace 3 horas, `kit run` lo borra al arrancar.
Scope: `tools/temporales/barrido.mjs`, `scripts/kit-run.mjs`.
Files: tools/temporales/barrido.mjs, scripts/kit-run.mjs
WHEN arranca kit run o se invoca el barrido THEN solo desaparecen los `flucastr-verify.*` con más de 120 minutos (A1)
Acceptance:
- A1: se borran directorios propios `flucastr-verify.*` con mtime de más de 120 min; quedan recientes, otros nombres, archivos y enlaces simbólicos (y su destino); `kit run` lo hace al iniciar; check with `node --test tests/temporales/barrido.test.mjs`; expect exit 0.
TODO:
- [x] Crear `tests/temporales/barrido.test.mjs` con base temporal propia (`utimesSync`), casos de A1 y limpieza en `after` (A1). Check: `node --test tests/temporales/barrido.test.mjs`; expect falla por módulo ausente.
- [x] Crear `tools/temporales/barrido.mjs`: `barrer(base, { minutos = 120 })` que nunca lanza, más CLI `<base>` (A1). Check: `node --test tests/temporales/barrido.test.mjs`; expect pasan los casos del módulo.
- [x] En `scripts/kit-run.mjs`, llamar `barrer(tmpdir())` tras `leerArgs` en `main` (A1). Check: `node --test tests/temporales/barrido.test.mjs`; expect exit 0.
- [x] Confirmar que kit run sigue igual en `scripts/kit-run.mjs` (A1). Check: `node tests/kit-run/run.mjs > "${TMPDIR:-/tmp}/kr.log" 2>&1` (≈1 min); expect exit 0.
Segment verification: `node --test tests/temporales/barrido.test.mjs` — level 1; exit 0; covers A1.
Handoff: caso de `kit run`: lanzar `kit-run.mjs no-existe.md --tool codex --root <tmp>` con `TMPDIR=<base>`; sale 2 y el viejo ya no está. La detección de CLI usa `fileURLToPath` (rutas con espacios). El CLI sale 0 siempre que reciba una base. Nunca barrer el `/tmp` real en pruebas.
