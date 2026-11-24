## Steps

### Segment 3 — Story: cierre mecánico del plan
As planner I want `kit-close` to verify checkboxes, evidence, A# runs and status before I review, so that I return incomplete work without reading everything.
Dependencies: Segment 1 — `informe.mjs`; `tools/check/parse.mjs` (A# y tramos linkeados, solo importar).
Contracts to keep: contador canónico (`awk '/^- \[ \]/ {n++} END {print n+0}'`, `core/skills/execute-plan/SKILL.md`); formato de evidencia `$ <cmd>`, salida, `exit N`; marcadores `DONE:`/`PAUSED:` de `core/agents/builder.md`.
Paths likely to change: `tools/check/cierre.mjs` (nuevo), `scripts/kit-close.mjs` (nuevo), `tests/kit-close/run.mjs` (nuevo; puede moverse dentro de `tests/kit-close/`).
Concrete example of the expected result: plan con un paso `[x]` cuyo `Check:` es `node --test x.mjs` y sin línea `$ node --test x.mjs` + `exit 0` en Evidence → `error  paso marcado sin evidencia`, exit 1.
Scope: `tools/check/cierre.mjs`, `scripts/kit-close.mjs`, `tests/kit-close/run.mjs`.
Files: tools/check/cierre.mjs, scripts/kit-close.mjs, tests/kit-close/run.mjs
WHEN quedan casillas `- [ ]` en el alcance del plan THEN `error` con el conteo (A1).
WHEN un paso `[x]` no tiene `$ <cmd>` seguido de `exit N` en Evidence THEN `error` con el paso (A2).
WHEN un A# no figura en ninguna corrida de Evidence THEN `error` con el A# (A3).
WHEN `status` no cuadra con el resultado del builder THEN `error`; si no se indica resultado THEN `no_verificable` (A4).
WHEN todo cuadra THEN exit 0 (A5).

#### Reglas de cierre
- Casillas: se cuenta con la misma regex del contador canónico sobre `plan.md` y los `tramo-N.md` con N ≤ `segment:`; en plan sin tramos, todo el archivo. Sin sección `Steps`/casillas → `no_verificable`.
- Evidencia de un paso: el comando entre acentos graves de su `Check:` debe aparecer como subcadena en una línea `$ ` de `## Evidence` (índice o tramo) con un `exit N` posterior antes del siguiente `$`. Sin comando entre acentos graves (revisión manual, `rg`, texto) → `no_verificable` por paso; el formato antiguo `evidencia:` sin `$` no cuenta como evidencia nueva. `exit N` distinto de 0 no es error por sí mismo si el paso lo esperaba; se informa como aviso.
- A#: debe aparecer `A<n>` en alguna línea de Evidence con `$` y `exit`; se ignoran A# de segmentos > `segment:`.
- Status: `DONE` ⇒ `status: done`, 0 casillas pendientes y A# cubiertos; `PAUSED` ⇒ `status: partial` y una nota `Blocked:`/«Notes» no vacía; sin `--resultado` ⇒ solo se verifica que `status` ∈ {in progress, done, partial} y se marca `no_verificable` la coherencia. `status: draft` o `approved` con casillas marcadas → `error`.
- Plan sin `## Evidence` parseable → `no_verificable`.

Acceptance:
- A1: casillas pendientes dan `error` con conteo igual al del `awk` canónico; check with `node tests/kit-close/run.mjs`; expect exit 0 y caso «pendientes» (se compara contra `awk` real).
- A2: paso `[x]` sin `$`/`exit N` da `error`; check with el mismo comando; expect caso «sin evidencia».
- A3: A# sin corrida da `error`; check with el mismo comando; expect caso «A# sin corrida».
- A4: status incoherente da `error`; sin resultado da `no_verificable`; check with el mismo comando; expect casos «status» y «sin resultado».
- A5: plan completo da exit 0; check with el mismo comando; expect caso «completo» y caso «no escribe» (el plan queda byte a byte igual).

TODO:
- [x] Crear `tools/check/cierre.mjs` con `revisarCierre(textoPlan, tramos, {resultado})` que devuelve filas para `informe.mjs`. Check: `node --check tools/check/cierre.mjs`; expect exit 0 (A1–A5).
- [x] Crear `scripts/kit-close.mjs <plan> [--resultado DONE|PAUSED] [--json]` con los mismos códigos 0/1/2/3. Check: `node scripts/kit-close.mjs changes/kit-scope-close/plan.md --json`; expect JSON válido y exit 1 o 3 (plan aún sin hacer) (A1).
- [x] Crear `tests/kit-close/run.mjs` con planes de ejemplo (en `$TMPDIR`) para: pendientes, sin evidencia, A# sin corrida, status incoherente, completo, formato antiguo y plan sin Evidence. Check: `node tests/kit-close/run.mjs`; expect exit 0 (A1–A5).
- [x] Comparar el conteo con `awk '/^- \[ \]/ {n++} END {print n+0}'` sobre el mismo fixture dentro del test. Check: `node tests/kit-close/run.mjs`; expect igualdad (A1).
- [x] Sensibilidad: marcar `[x]` un paso sin evidencia en el fixture «completo» y comprobar que el test pasa a error. Check: `node tests/kit-close/run.mjs`; expect fallo del caso mutado (A2).
Segment verification: `node tests/kit-close/run.mjs` — level 1; exit 0; covers A1, A2, A3, A4, A5. Medir la primera corrida y anotarla.
Handoff: no hay git en este tramo; solo lectura de archivos del plan. Heurística de enlace paso↔evidencia: subcadena del comando; si dos pasos comparten comando, una corrida basta para ambos y se anota. No modificar `core/skills/execute-plan/SKILL.md`.
