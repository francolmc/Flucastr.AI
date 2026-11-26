# Tramo 2

## Steps

### Segment 2 — Story: kit run relanza lo que es infraestructura y devuelve lo que no es tarea
As user I want a free retry or a diagnosis so that no run is wasted.
Dependencies: Segment 1 — `clasificar`.
Contracts to keep: formato de `DONE`/`PAUSED`, códigos 0/1/2, motivos actuales, máximo 2 relanzamientos, `registrar` nunca lanza.
Paths likely to change: `scripts/kit-run.mjs`, `tools/run/escalera.mjs`, `tools/run/informe.mjs`.
Concrete example of the expected result: builder falso que muere una vez con thrashing y luego termina: DONE, 2 líneas en `runs.jsonl`, la primera `clase:"infra"`, `motivo_relanzamiento:"infra"`.
Scope: paso 0, diagnóstico y registro. `tests/kit-run/run.mjs` solo C2 y R1.
Files: scripts/kit-run.mjs, tools/run/escalera.mjs, tools/run/informe.mjs
WHEN builder o revisor mueren por infraestructura THEN se repite ese proceso con contexto nuevo y el mismo modelo (A2)
WHEN la falla es entorno, plan o decisión THEN kit run pausa sin relanzar y muestra diagnóstico sin ofrecer relevo (A3)
Acceptance:
- A2: thrashing, `invalid_request` y tope relanzan; al tercer fallo pausa `access`; el modelo no cambia; check with `node --test tests/escalera/paso0.test.mjs`; expect pass.
- A3: entorno, plan y decisión: 1 corrida, nota `Diagnóstico: clase=…; señal=…; qué hacer=…`, sin la palabra «relevo», `clase` en `runs.jsonl`; check with `node --test tests/escalera/paso0.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/escalera/paso0.test.mjs` con builder, revisor y verificación falsos (variables `KIT_RUN_*`) (A2, A3). Check: `node --test tests/escalera/paso0.test.mjs`; expect rojo. Evidencia: creado; rojo comprobado después (ver Evidence y Notes), 9/9 fallan con el `kit-run.mjs` de HEAD.
- [x] Crear `tools/run/escalera.mjs` con `decidir` y `diagnostico` (A2, A3). Check: `node --check tools/run/escalera.mjs`; expect exit 0. Evidencia: exit 0.
- [x] En `scripts/kit-run.mjs` clasificar cada falla, aplicar `decidir` y registrar `clase`, `paso`, `resuelto_por` (A2, A3). Check: `node --test tests/escalera/paso0.test.mjs`; expect pass. Evidencia: 9/9 pasan.
- [x] En `tools/run/informe.mjs` aceptar motivo `infra` (A2). Check: `node tests/runs-report/run.mjs`; expect exit 0. Evidencia: exit 0, sin cambio de expectativas.
- [x] En `tests/kit-run/run.mjs` actualizar C2 (3 corridas, `access`) y los campos de R1; `scripts/kit-run.mjs` sin otro cambio (A2). Check: `node tests/kit-run/run.mjs`; expect exit 0. Evidencia: exit 0, 50 casos pasan.
- [x] Corrección: en `scripts/kit-run.mjs` el veredicto inválido (señal `veredicto_invalido`) y el árbol modificado por el revisor (señal `arbol_modificado`) son `clase:"entorno"` con diagnóstico, mismos motivos de `PAUSED`; un caso por cada uno en `tests/escalera/paso0.test.mjs` (A3). Check: `node --test tests/escalera/paso0.test.mjs`; expect pass. Evidencia: 11/11 pasan.
Segment verification: `node --test tests/escalera/paso0.test.mjs && node tests/kit-run/run.mjs && node tests/runs-report/run.mjs` — level 1; exit 0; covers A2, A3.
Handoff: `decidir({clase, usados})` → `relanzar` solo si `clase==="infra" && usados<2`; entorno, plan y decision → `devolver`; tarea mantiene en este tramo la conducta actual. Un infra no cuenta como falla de tarea y usa el mismo contador (D3). Campos nuevos en cada línea: `clase` (null si DONE), `paso` (0 en la primera corrida; infra repite el paso), `resuelto_por` (paso en la línea DONE, null en las demás). Revisor muerto por infra: repetir solo el revisor. A `clasificar` pasar solo las últimas 40 líneas de stderr (o de la salida de verify): el stderr del builder puede incluir texto del proyecto. Verificación clasificada entorno: pausa `verify`. Pegado: sin cambios, `clase:"tarea"`.

## Evidence
- `$ node --test tests/escalera/paso0.test.mjs` → `ℹ tests 9`, `ℹ pass 9`, `ℹ fail 0`; exit 0.
- `$ node --check tools/run/escalera.mjs` → exit 0.
- `$ node tests/kit-run/run.mjs` → `kit-run: 50 casos pasaron`; exit 0 (cola de `$TMPDIR/v2.txt`).
- `$ node tests/runs-report/run.mjs` → `7 casos ok`; exit 0.
- `$ node --test tests/escalera/*.test.mjs` → `ℹ tests 36`, `ℹ pass 36`, `ℹ fail 0`; exit 0.
- Rojo (copia temporal con `scripts/kit-run.mjs` de HEAD y el `paso0.test.mjs` actual): `ℹ tests 9`, `ℹ pass 0`, `ℹ fail 9`; exit 1.
- Verificación del segmento: `node --test tests/escalera/paso0.test.mjs && node tests/kit-run/run.mjs && node tests/runs-report/run.mjs` → exit 0.
- Diff: `scripts/kit-run.mjs` 92 líneas; `tests/kit-run/run.mjs` 15; `tools/run/informe.mjs` 4 (3 archivos, 84 inserciones y 27 borrados).
- `$ node --test tests/escalera/paso0.test.mjs && node tests/kit-run/run.mjs && node tests/runs-report/run.mjs` → `ℹ tests 11`, `ℹ pass 11`; `kit-run: 50 casos pasaron`; `7 casos ok`; exit 0 (relanzamiento 1 de 2, tras Devuelto).

## Notes
- Archivos: `tools/run/escalera.mjs` (nuevo: `decidir`, `diagnostico`, `ultimasLineas`); `tests/escalera/paso0.test.mjs` (nuevo, 9 casos: 5 de A2, 4 de A3); `scripts/kit-run.mjs` (clase, paso y resuelto_por en cada línea; escalera de infra con reintento del revisor solo; nota `Diagnóstico` en PAUSED por entorno, plan o decisión); `tools/run/informe.mjs` (`MOTIVOS` incluye `infra`); `tests/kit-run/run.mjs` (solo dos casos).
- `tests/kit-run/run.mjs` C2: de 1 a 3 corridas del builder (`1 + 2 relanzamientos`), sigue `motivo=access` y el mensaje `superó el tope de 500 ms`.
- `tests/kit-run/run.mjs` R1: de 15 a 18 campos (`clase`, `paso`, `resuelto_por`); en una corrida DONE comprueba `clase === null`, `paso === 0` y `resuelto_por === 0`.
- Proceso: el código de `scripts/kit-run.mjs` y `tools/run/escalera.mjs` se escribió antes que `paso0.test.mjs`, así que la fase «expect rojo» no se observó en su orden. El rojo se comprobó después con una copia temporal del `kit-run.mjs` de HEAD: las 9 pruebas fallan; con el cambio, pasan.
- `tests/runs-report/run.mjs`: no cambió ninguna expectativa; pasa tal cual con `infra` en `MOTIVOS`.
- `tests/escalera/paso0.test.mjs` cambió en disco fuera de esta sesión. Se volvió a correr (9/9) y se comprobaron sus nombres de caso en la salida; no se releyó completo. El contador `casos` del archivo se llama `numeroCaso` para no chocar con el `const casos` del bloque A3.
- `tests/progress/run.mjs` (~13 s medidos): no se tocó; se ejecutó aparte como comprobación de no regresión, `progress: 44 casos pasaron`, exit 0. No forma parte de la verificación del segmento.
- Corrección (Devuelto tramo 2): `veredicto_invalido` y `arbol_modificado` pasan a `clase:"entorno"` con señal propia; los motivos de PAUSED (`verify`, `access`) no cambian. Casos nuevos en `paso0.test.mjs`: 9 → 11.
- Sin commit, push, PR, merge ni deploy. No se avanzó al tramo 3.
