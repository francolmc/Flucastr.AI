# Tramo 5

## Steps

### Segment 5 — Story: el planner usa la misma escalera con un subagente
As planner I want one command to get the next step so that subagent runs follow the same rules.
Dependencies: Segment 4 — escalera completa.
Contracts to keep: mismas funciones y límite que `kit run`; no lanza procesos de modelos.
Paths likely to change: `scripts/kit-escalera.mjs`, `docs/como-funciona.md`.
Concrete example of the expected result: `node scripts/kit-escalera.mjs changes/x/plan.md --salida error.txt` con thrashing imprime `clase=infra; accion=relanzar; paso=0` y agrega una línea a `runs.jsonl`.
Scope: comando para el planner.
Files: scripts/kit-escalera.mjs, docs/como-funciona.md
WHEN el planner entrega el retorno o error de un subagente THEN recibe clase, paso y acción y queda registrado (A8)
Acceptance:
- A8: infra, entorno, paso 1 con handoff, paso 2, paso 3 con el modelo superior, paso 4 con estimación y `--resuelto` (línea DONE con `resuelto_por`) desde fixtures; check with `node --test tests/escalera/cli.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/escalera/cli.test.mjs` con fixtures de retornos en `tests/escalera/fixtures/` (A8). Check: `node --test tests/escalera/cli.test.mjs`; expect rojo.
- [x] Crear `scripts/kit-escalera.mjs` reutilizando `tools/run/` (A8). Check: `node --test tests/escalera/cli.test.mjs`; expect pass.
- [x] Describir el comando en una entrada de `docs/como-funciona.md` (A8). Check: `git diff --check`; expect exit 0.
- [x] Corrección: en `scripts/kit-escalera.mjs`, `--resuelto --paso 3` (condiciones de `--paso 3`) y `--resuelto --paso 4` (exige `pasoTresTarea`) registran ese `resuelto_por`; la propuesta, la nota paso 4 y `docs/como-funciona.md` lo indican; casos en `tests/escalera/cli.test.mjs` (A8). Check: `node --test tests/escalera/cli.test.mjs`; expect pass.
Segment verification: `node --test tests/escalera/*.test.mjs` — level 1; exit 0; covers A8.
Handoff: uso `<plan> (--salida <archivo> | --resuelto) [--herramienta claude|pi|codex] [--tokens e,c,s] [--raiz <dir>]`. `--salida` contiene la línea `DONE`/`PAUSED` o el texto del error; texto sin `DONE`/`PAUSED` se trata como proceso muerto. Registro con los campos de `runs.jsonl` y tiempos null; `resultado` `devuelto` o `PAUSED`. El modelo superior sale de `tools/run/nivel.mjs`. Salida 0 con acción, 2 por uso. El paso 3 se imprime como propuesta que exige el sí explícito de la persona; paso 4 (pregunta de relevo) solo tras un paso 3 fallido por `tarea`; infra, entorno, plan y decisión nunca mencionan relevo; `--paso 3` se puede repetir salvo `pasoTresTarea`. Reutilizar `decidir`, `historial`, `handoff`, `notaPaso4`, no copiar sus reglas.

## Evidence
- Paso 1 (test antes del código): `$ node --test tests/escalera/cli.test.mjs`
  `ℹ tests 6` · `ℹ pass 0` · `ℹ fail 6`; error: `Error: Cannot find module '…/scripts/kit-escalera.mjs'`
  exit 1
- Paso 2: `$ node --test tests/escalera/cli.test.mjs`
  `ℹ tests 6` · `ℹ pass 6` · `ℹ fail 0`
  exit 0
- Paso 3: `$ git diff --check` (sin salida)
  exit 0
- Verificación del segmento: `$ node --test tests/escalera/*.test.mjs`
  `ℹ tests 74` · `ℹ pass 74` · `ℹ fail 0` (6 s)
  exit 0
- Regresión de kit run (tocado `scripts/kit-run.mjs`): `$ node tests/kit-run/run.mjs`
  `kit-run: 50 casos pasaron`
  exit 0
- Corrección (relanzamiento 1 de 2): `$ node --test tests/escalera/cli.test.mjs` — `ℹ tests 9` · `ℹ pass 9` · `ℹ fail 0`; exit 0. Antes del cambio, el caso de cierre del paso 4 falló (exit 1).
- Verificación del segmento (tras la corrección): `$ node --test tests/escalera/*.test.mjs` — `ℹ tests 77` · `ℹ pass 77` · `ℹ fail 0` (6 s); exit 0. `$ git diff --check` exit 0.

## Notes
- Checkpoint tramo 5. Archivos: `scripts/kit-escalera.mjs` (nuevo); `tests/escalera/cli.test.mjs` y `tests/escalera/fixtures/` (`plan-subagente.md`, `escalera-modelos.json`, `salida-*.txt`, nuevos); `tools/run/escalera.mjs` (exporta `MAX_RELANZAMIENTOS`, `MAX_CONSEJO` y `consejoDelPlan`, movidos desde `scripts/kit-run.mjs`); `scripts/kit-run.mjs` (importa esas funciones, sin cambio de conducta); `docs/como-funciona.md` (sección «Escalera de recuperación con subagentes»).
- Decisión menor: el consejo pendiente no registra intento; el paso 2 cuenta como relanzamiento al concederse, y la siguiente falla de tarea se agota.
- Decisión menor: `--paso 3` es el sí explícito de la persona, con las mismas condiciones que `kit run --paso 3`; no se combina con `--resuelto`.
- Registro: los campos de `runs.jsonl`, tiempos y huellas en null, `builder_modelo` null y un campo extra `senal` para el diagnóstico.
- `models.json` no cambió; los modelos se leen con `FLUCASTR_MODELOS` en las pruebas.
- Pendiente para el planner: revisar este tramo en una sesión nueva y decidir el tramo 6.
- Corrección: `--resuelto --paso 3|4` atribuye el DONE a ese paso con las condiciones de su paso; reemplaza la decisión menor previa de no combinarlos. `notaPaso4` gana `cierre` opcional (kit run no lo pasa; su nota no cambia). Archivos: `scripts/kit-escalera.mjs`, `tools/run/estimar.mjs`, `tests/escalera/cli.test.mjs`, `docs/como-funciona.md`.
