---
status: partial
format: 2
branch: chore/P00-bootstrap
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Retirar corrección transversal para reanudar P00

## Goal
Restituir los cinco archivos modificados por fix-captura-sandbox al contenido de HEAD, por decisión explícita de la persona usuaria, conservando los registros de ambos planes.

## Scope
Solo `tools/spawn/sync-seguro.mjs`, `tools/run/process.mjs`, `tests/spawn-seguro/run.mjs`, `tests/kit-run/run.mjs`, `tests/progress/run.mjs` y registros de este plan. No tocar `old/`, `changes/done/` ni `pruebas/.temporales/`. No usar comandos Git que escriban; no modificar otras rutas.

## Verification
`git diff --exit-code -- tools/spawn/sync-seguro.mjs tools/run/process.mjs tests/spawn-seguro/run.mjs tests/kit-run/run.mjs tests/progress/run.mjs` — exit 0. No correr `./verify`: la línea base previa ya quedó registrada y P00 lo controlará.

## Decisions already taken
- Executor: builder; la persona aprobó explícitamente descartar los cinco cambios de la corrección transversal para centrarse en P00.

## Steps
### Segment 1 — Story: retirar cambios ajenos a P00
Files: `tools/spawn/sync-seguro.mjs`, `tools/run/process.mjs`, `tests/spawn-seguro/run.mjs`, `tests/kit-run/run.mjs`, `tests/progress/run.mjs`.
WHEN se termina la limpieza THEN los cinco archivos coinciden con HEAD (A1).
Acceptance:
- A1: los cinco archivos coinciden con HEAD; check `git diff --exit-code -- tools/spawn/sync-seguro.mjs tools/run/process.mjs tests/spawn-seguro/run.mjs tests/kit-run/run.mjs tests/progress/run.mjs`; expect exit 0.
TODO:
- [x] Restituir los cinco archivos de Scope al contenido exacto de HEAD con `git show` de solo lectura, sin comandos Git de escritura (A1). Check: `git diff --exit-code -- tools/spawn/sync-seguro.mjs tools/run/process.mjs tests/spawn-seguro/run.mjs tests/kit-run/run.mjs tests/progress/run.mjs`; exit 0.
Segment verification: `git diff --exit-code -- tools/spawn/sync-seguro.mjs tools/run/process.mjs tests/spawn-seguro/run.mjs tests/kit-run/run.mjs tests/progress/run.mjs` — level 1; exit 0; covers A1.

## Evidence
$ git diff --exit-code -- tools/spawn/sync-seguro.mjs tools/run/process.mjs tests/spawn-seguro/run.mjs tests/kit-run/run.mjs tests/progress/run.mjs
Corrida real del 2026-11-27: sin salida; todos los archivos coinciden con HEAD.
exit 0
Fingerprint: no emitido; el comando es `git diff`.

## Notes
- Segment 1: A1 verificado otra vez con el comando declarado; exit 0. El comando `git diff` no emite Fingerprint.
- Pausa: kit-scope reportó archivos en `changes/P00-bootstrap/` y `changes/fix-captura-sandbox/`, fuera del Scope aprobado de este plan. El builder contract prohíbe cambiarlos.
- Reanudación exacta: planner debe aprobar un plan cuyo Scope incluya esos registros; luego corregirlos y volver a ejecutar kit-check, kit-scope y kit-close.
- kit run: PAUSED (scope): PAUSED: plan=changes/retirar-fix-sandbox/plan.md; segment=1; motivo=scope; hecho=1/1; siguiente=aprobar un plan cuyo Scope incluya los registros señalados; no_intentado=editarlos está prohibido por el Scope aprobado actual; revisor=gpt-6.1-terra:low.
- kit run: Diagnóstico: clase=plan; señal=motivo=scope; qué hacer=revisar el alcance o el plan con la persona antes de volver a correr kit run; el builder no lo puede resolver solo
- Cierre por decisión de la persona: los cinco archivos coinciden con HEAD (A1, exit 0); la puerta mecánica quedó pausada por los registros de otros planes. Se archiva como partial, conservando ese resultado.
