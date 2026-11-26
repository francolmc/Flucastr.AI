# Tramo 3

## Steps

### Segment 3 — Story: una falla de tarea sube de a un paso
As user I want a handoff and then advice so that the cheap builder gets a real second chance.
Dependencies: Segment 2 — `decidir` y campos del registro.
Contracts to keep: máximo 2 relanzamientos automáticos por tramo contados desde `runs.jsonl`; parada de continuidad por causa repetida; formato de retorno.
Paths likely to change: `tools/run/handoff.mjs`, `tools/run/escalera.mjs`, `scripts/kit-run.mjs`.
Concrete example of the expected result: verificación siempre roja: 2 corridas, `PAUSED … motivo=verify` con nota `paso 2: escribe «Consejo (tramo 1): …» y vuelve a lanzar`.
Scope: pasos 1 y 2. `tests/kit-run/run.mjs` solo A2, A3d, A6, M1, `puerta-fuera-de-alcance`, `puerta-tercer-fallo`.
Files: scripts/kit-run.mjs, tools/run/escalera.mjs, tools/run/handoff.mjs
WHEN falla la tarea por primera vez THEN relanza solo con un handoff cronológico (A4)
WHEN falla por segunda vez THEN pausa y pide consejo; con consejo válido relanza (A5)
Acceptance:
- A4: el segundo prompt trae, en orden, Hecho, Pendiente, Decisiones usadas, Archivos tocados, Último error (≤ 10 líneas) y Próxima acción; check with `node --test tests/escalera/pasos12.test.mjs`; expect pass.
- A5: sin consejo o con más de 2000 caracteres: exit 2 y plan intacto; con consejo: una corrida `paso:2` que lo incluye; si falla, pausa ofreciendo `--paso 3`; check with `node --test tests/escalera/pasos12.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/escalera/pasos12.test.mjs` (A4, A5). Check: `node --test tests/escalera/pasos12.test.mjs`; expect rojo.
- [x] Crear `tools/run/handoff.mjs` con la función `handoff` (A4). Check: `node --check tools/run/handoff.mjs`; expect exit 0.
- [x] En `tools/run/escalera.mjs` añadir `historial` y los pasos 1 y 2 de `decidir` (A4, A5). Check: `node --check tools/run/escalera.mjs`; expect exit 0.
- [x] En `scripts/kit-run.mjs` usar historial, handoff y consejo para verificación, puerta, revisor y `PAUSED motivo=verify` (A4, A5). Check: `node --test tests/escalera/pasos12.test.mjs`; expect pass.
- [x] En `tests/kit-run/run.mjs` ajustar los casos de Scope sin quitar aserciones de estado, motivo ni revisor; `scripts/kit-run.mjs` sin otro cambio (A5). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Corrección (a): en `scripts/kit-run.mjs`, `PAUSED motivo=verify` del builder entra en la escalera como falla de tarea (paso 1, consejo, agotada), motivo `verify`; caso en `tests/escalera/pasos12.test.mjs` (A4). Check: `node --test tests/escalera/pasos12.test.mjs`; expect pass.
- [x] Corrección (b): en `scripts/kit-run.mjs`, pedir consejo si `fallasTarea >= 2`, `paso < 2` y `usados < 2`; caso con dos fallas y 0 usados (líneas `runs.jsonl` previas) en `tests/escalera/pasos12.test.mjs` (A5). Check: `node --test tests/escalera/pasos12.test.mjs`; expect pass.
- [x] Corrección (c): en `scripts/kit-run.mjs`, salir con 2 solo si `usados >= 2` y `fallasTarea >= 1`; caso con cupo gastado solo por infra en `tests/escalera/pasos12.test.mjs`: corre una vez sin relanzar (A5). Check: `node --test tests/escalera/pasos12.test.mjs`; expect pass.
Segment verification: `node --test tests/escalera/*.test.mjs && node tests/kit-run/run.mjs && node tests/progress/run.mjs` — level 1; exit 0; covers A4, A5.
Handoff: `historial(lineas, plan, tramo)` toma las líneas con `clase` posteriores al último DONE y devuelve `{usados, fallasTarea}`. Falla de tarea 1 → paso 1 automático. Falla 2 → pausa; la siguiente invocación exige la última nota `Consejo (tramo N):` y corre `paso:2` (relanzamiento 2). Conservar en el prompt el texto actual del error y añadir el handoff. El handoff sale de casillas, `## Decisions already taken`, `git status --porcelain` y `progress.jsonl`; sin datos escribe «ninguno». Escalera agotada: ver Assumptions de `plan.md`. `nuevoIntento` fija `paso: 0`: usar el paso en curso, también al repetir por infra. Registro ilegible: contar en memoria. M1 se detecta por la nota, no por el conteo.

## Evidence
- Rojo previo: `$ node --test tests/escalera/pasos12.test.mjs` → 6 fallos (`$TMPDIR/pasos12-rojo.txt`).
- `$ node --check tools/run/handoff.mjs && node --check tools/run/escalera.mjs && node --check scripts/kit-run.mjs` → exit 0.
- `$ node --test tests/escalera/pasos12.test.mjs` → tests 6, pass 6, fail 0.
- `$ node tests/kit-run/run.mjs` → exit 0, «kit-run: 50 casos pasaron».
- `$ node tests/progress/run.mjs` → exit 0, «progress: 44 casos pasaron».
- `$ node --test tests/escalera/*.test.mjs` → tests 44, pass 44, fail 0.
- Segmento: `$ node --test tests/escalera/*.test.mjs && node tests/kit-run/run.mjs && node tests/progress/run.mjs` → exit 0 (`$TMPDIR/segmento-3.txt`).
- Corrección (a)-(c): `$ node --test tests/escalera/pasos12.test.mjs` → tests 11, pass 11, fail 0; `$ node --test tests/escalera/*.test.mjs` → tests 49, pass 49, fail 0; exit 0.
- Relanzamiento 1 de 2: `$ node tests/kit-run/run.mjs` → exit 0, «kit-run: 50 casos pasaron» (42 s; un intento previo se cortó a 30 s, exit 124, sin fallos en 46 `ok`); `$ node tests/progress/run.mjs` → exit 0, «progress: 44 casos pasaron» (`$TMPDIR/kitrun-corr2.txt`, `$TMPDIR/progress-corr.txt`).

## Notes
- Checkpoint: `scripts/kit-run.mjs` (puerta de historial y consejo antes de `mkdtempSync`, `fallaTarea` para verificación, puerta y revisor, `nuevoIntento` con `paso` en curso); `tools/run/handoff.mjs` (nuevo); `tools/run/escalera.mjs` (`historial`, `decidir` pasos 1 y 2); `tests/escalera/pasos12.test.mjs` (nuevo, 6 casos).
- `consejoDelPlan` se corrigió: contaba la instrucción de la propia nota de pausa; ahora exige una línea que empiece por «Consejo (tramo N):» con texto distinto de «…».
- Expectativas cambiadas en `tests/kit-run/run.mjs` (solo D5): A2, A3d, A6, `puerta-fuera-de-alcance` y `puerta-tercer-fallo` pasan de 3 a 2 corridas del builder; M1 ahora comprueba la nota «repitió la misma causa» (la mutación deja 2 corridas). Sin cambios en `tests/progress` ni `tests/runs-report`.
- Abierto (per Assumptions): el mensaje de escalera agotada cita `--paso 3`, que no existe hasta el tramo 4.
- Relanzamiento 1 de 2 (correcciones a, b, c): `scripts/kit-run.mjs` (PAUSED motivo=verify entra en `fallaTarea`; `pideConsejo` con `fallasTarea >= 2`, `paso < 2`, `usados < 2`; salida 2 solo con `usados >= 2` y `fallasTarea >= 1`); `tests/escalera/pasos12.test.mjs` (+5 casos; el builder falso acepta `pausa-verify`). Sin cambios en `tests/kit-run/run.mjs` ni `tests/progress/run.mjs`.
