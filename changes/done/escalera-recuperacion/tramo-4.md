# Tramo 4

## Steps

### Segment 4 — Story: subir de nivel un solo tramo y ofrecer el relevo con costo
As user I want a one-off upgrade and a cost estimate so that I decide with numbers.
Dependencies: Segment 3 — historial y pasos.
Contracts to keep: `models.json` intacto byte a byte; nunca se ejecuta un relevo desde `kit run`.
Paths likely to change: `tools/run/nivel.mjs`, `tools/run/estimar.mjs`, `scripts/kit-run.mjs`.
Concrete example of the expected result: `--paso 3` con builder `low` lanza una corrida con modelo de nivel `medium` y borra la copia temporal.
Scope: pasos 3 y 4.
Files: scripts/kit-run.mjs, tools/run/nivel.mjs, tools/run/estimar.mjs
WHEN se pide `--paso 3` tras fallar el paso 2 THEN corre una vez ese tramo en el nivel superior (A6)
WHEN falla el paso 3 THEN pausa con la pregunta de relevo y la estimación, sin ejecutar nada (A7)
Acceptance:
- A6: una corrida con modelo superior, copia vía `FLUCASTR_MODELOS` borrada, `models.json` igual; sin escalera agotada o con nivel `high`: exit 2; check with `node --test tests/escalera/pasos34.test.mjs`; expect pass.
- A7: nota `paso 4` con créditos de paso 3 y relevo para `--tokens`, o «sin tarifa» / «sin tokens medidos»; ninguna corrida extra; check with `node --test tests/escalera/pasos34.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/escalera/pasos34.test.mjs` (A6, A7). Check: `node --test tests/escalera/pasos34.test.mjs`; expect rojo.
- [x] Crear `tools/run/nivel.mjs` con `conNivelSuperior` (A6). Check: `node --check tools/run/nivel.mjs`; expect exit 0.
- [x] Crear `tools/run/estimar.mjs` con `estimar` (A7). Check: `node --check tools/run/estimar.mjs`; expect exit 0.
- [x] En `scripts/kit-run.mjs` añadir `--paso 3`, `--tokens e,c,s` y la nota de paso 4 (A6, A7). Check: `node --test tests/escalera/pasos34.test.mjs`; expect pass.
- [x] Corrección (a): en `scripts/kit-run.mjs`, nota `paso 4` solo si `final.clase` es `tarea`; casos de entorno y decisión en `--paso 3`: diagnóstico sin «relevo» (A7). Check: `node --test tests/escalera/pasos34.test.mjs`; expect pass.
- [x] Corrección (b): en `tools/run/escalera.mjs` y `scripts/kit-run.mjs`, `--paso 3` se niega solo si ya hay una línea `paso:3` con `clase:"tarea"`; caso que lo repite tras entorno (A6). Check: `node --test tests/escalera/pasos34.test.mjs`; expect pass.
Segment verification: `node --test tests/escalera/*.test.mjs && node tests/kit-run/run.mjs` — level 1; exit 0; covers A6, A7.
Handoff: `conNivelSuperior(fn)` copia el archivo que resuelve `FLUCASTR_MODELOS` o `models.json`, sube `agents.builder.level` (low→medium→high), fija la variable solo mientras corre el builder y limpia en `finally`; el revisor usa la configuración original. `--paso 3` es la autorización explícita (D1) y vale con la escalera agotada (`usados >= 2` y `fallasTarea >= 1`), aunque infra haya consumido el cupo del paso 2; antes de eso sale con 2. `estimar({tokens, modelos, tarifas})` usa `scripts/rates.json` (créditos por millón: entrada, caché, salida), supone el mismo volumen y lo rotula «estimación». No usar la cifra 6,6 de A4.

## Evidence
- `node --test tests/escalera/*.test.mjs && node tests/kit-run/run.mjs`: exit 0. Escalera 65/65 (incluye `pasos34` 16/16); kit-run 50 casos pasaron.
- `node --test tests/escalera/pasos34.test.mjs` (A6, A7): 16/16 pasan. Antes de crear los módulos, en rojo: `ERR_MODULE_NOT_FOUND` de `tools/run/nivel.mjs`.
- `node --check tools/run/nivel.mjs` y `node --check tools/run/estimar.mjs`: exit 0.
- `node tests/progress/run.mjs`: 44 casos pasaron. `node tests/runs-report/run.mjs`: 7 casos ok. Sin cambios en esos casos.
- `node --test tests/escalera/pasos34.test.mjs` (Corrección a y b): `ℹ tests 19`, `ℹ pass 19`, `ℹ fail 0`; exit 0.
- `node --test tests/escalera/*.test.mjs` (verificación del segmento): `ℹ tests 68`, `ℹ pass 68`, `ℹ fail 0`; exit 0. `node tests/kit-run/run.mjs`: `kit-run: 50 casos pasaron`; exit 0.

## Notes
- Checkpoint: nuevos `tests/escalera/pasos34.test.mjs`, `tools/run/nivel.mjs`, `tools/run/estimar.mjs`; `scripts/kit-run.mjs` suma `--paso 3`, `--tokens e,c,s` y la nota de paso 4. El diff de `scripts/kit-run.mjs` (214 y 46 líneas) incluye también los pasos 1 y 2 de tramos previos.
- Check: `pasos34` 16/16; segmento exit 0.
- Prueba propia: el builder falso de `pasos34` escribe `creado.txt` y pone `status: done` en el plan, porque la puerta mecánica (A1) y la verificación de estado lo exigen. Dos fallos previos eran del harness, no de casos existentes.
- Sin cambios en casos existentes de `tests/kit-run`, `tests/progress` ni `tests/runs-report`. `models.json` intacto. Sin commit ni push.
- Relanzamiento 1 de 2 (devuelto en tramo 4). Corrección (a): `scripts/kit-run.mjs` escribe la nota paso 4 solo si `final.clase === "tarea"`; entorno, decisión o infra dejan el diagnóstico sin «relevo». Corrección (b): `tools/run/escalera.mjs` devuelve `pasoTresTarea` y `--paso 3` se niega solo si ese flag es true. Casos nuevos en `tests/escalera/pasos34.test.mjs` (3); sin cambios en casos existentes.
