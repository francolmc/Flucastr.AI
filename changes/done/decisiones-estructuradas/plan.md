---
status: done
branch: feature/decisiones-estructuradas
base: main
repos: [.]
executor: builder
segment: 8
continuity: continuous
type: code
---
# Decisiones estructuradas

## Goal
Las decisiones y el avance de cada cambio viven en `decisions.md` y `notes.md`; planner, builder y revisor citan IDs y no reabren debates ni dependen del resumen de compactación.

## Exploration
Evidencia en [hallazgos.md](hallazgos.md). Respuestas del 2026-11-26: D-01, D-02, D-03, D-04.
Formatos redactados: [formatos.md](formatos.md). Registro de este cambio: [decisions.md](decisions.md).

## Evaluation
Recomendado: una sola fuente por decisión, citada por ID, con aviso textual. Costo: 7 tramos. Riesgo alto: toca el contrato del builder (quedan 233 bytes) y `planner.md` (quedan 2). Descartado: copiar el texto de cada decisión en el plan, porque vuelve a permitir contradicciones. Fases omitidas: pantallas (no hay UI).

## Assumptions
- `notes.md` (15 líneas) deja de recibir hallazgos: van a `changes/<nombre>/<tema>.md`. Si no, el límite no se puede cumplir.
- El límite de 15 líneas es instrucción; no se agrega comprobación (no se pidió).
- El handoff de `kit run` no cambia: copia las viñetas con IDs.
- El planner leyó solo líneas puntuales de `execute-plan` y `builder.md`, porque este cambio los edita.
- Las skills instaladas pueden requerir reinstalar el kit tras el merge.
- Los archivos sin seguimiento que el sandbox muestra en la raíz (`.bashrc`, `.gitconfig`, `.idea`, etc.) no son cambios: no se tocan ni detienen el trabajo (`kit-scope` los marcará fuera de Scope).

## Decisions already taken
- D-01, D-02, D-03, D-04, D-05, D-06, D-09
- Executor: builder, porque requisitos, contexto y comprobaciones están definidos y no usa credenciales ni despliegue.

## Decisions
- D-07, D-08

## Validation
Respuestas de Exploration confirmadas el 2026-11-26. Plan aprobado (Gate 1) el 2026-11-26.

## Scope
- `tools/check/decisiones.mjs`
- `scripts/review-plan.mjs`
- `tests/review-plan/decisiones.test.mjs`
- `core/skills/plan-change/SKILL.md`
- `core/skills/plan-change/references/records.md`
- `core/skills/plan-change/references/template.md`
- `core/skills/plan-change/references/segments.md`
- `docs/kit-run.md`
- `core/agents/builder.md`
- `core/skills/execute-plan/SKILL.md`
- `tests/builder-contract.mjs`
- `tools/run/prompts.mjs`
- `scripts/kit-run.mjs`
- `tests/kit-run/run.mjs`
- `core/agents/planner.md`
- `core/references/planner/paused-and-interrupted.md`
- `tools/run/escalera.mjs`
- `scripts/after-compact.mjs`
- `tests/after-compact/after-compact.test.mjs`
- `docs/como-funciona.md`

## Verification
`./verify` — en `main` el 2026-11-26: exit 0 en 181 s (35 pasos). Tope del comando: 600 s.

Mediciones previas (sandbox WSL2, 2026-11-26): revisor 1,2 s; tamaños 0,1 s; contrato del builder 0,3 s; `kit-run` 43 s; tamaños+compactación+escalera 32 s; hook 0,5 s; `grep` < 0,1 s.

## Stop conditions
- `planner.md` supera 8192 bytes, `builder.md` + `execute-plan` supera 13500 o `plan-change/SKILL.md` supera 6144.
- Hay que debilitar o borrar una prueba o una frase literal existente.
- Un archivo fuera de Scope necesita cambios.
- La misma causa falla dos veces.

Revisión: fin de historia

## Steps
1. [Tramo 1](tramo-1.md): el revisor de planes avisa (hecho).
2. [Tramo 2](tramo-2.md): la planificación genera ambos archivos (hecho).
3. [Tramo 3](tramo-3.md): referencias sin la tensión C9 (hecho).
4. [Tramo 4](tramo-4.md): el builder cita IDs (hecho).
5. [Tramo 5](tramo-5.md): el revisor de `kit run` cita IDs (hecho).
6. [Tramo 6](tramo-6.md): el planner revisa y reanuda con IDs (hecho).
7. [Tramo 7](tramo-7.md): punteros tras compactar (hecho).
8. [Tramo 8](tramo-8.md): el builder aplica solo filas activas (hecho).

## Evidence
Tramo 1 — `$ node --test tests/review-plan/*.test.mjs`:
```
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
```
exit 0. Detalle por paso en [tramo-1.md](tramo-1.md).

Tramos 2 y 3 (historia «planning creates both records») — detalle en [tramo-2.md](tramo-2.md) y [tramo-3.md](tramo-3.md):
- `$ grep -c 'decisions.md' core/skills/plan-change/SKILL.md` → 2, exit 0.
- `$ node --test tests/context-size/sizes.test.mjs` (timeout 0.2 s; medido 0.09 s) → pass 7, fail 0, exit 0.
- `$ diff <(sed '1,/^<!-- records -->$/d' changes/decisiones-estructuradas/formatos.md) core/skills/plan-change/references/records.md` → sin diferencias, exit 0.
- `$ grep -c 'as a new row in' core/skills/plan-change/references/segments.md` → 1, exit 0.
- `$ grep -c 'decisions.md' docs/kit-run.md` → 1, exit 0.
- Segment verification de los tramos 2 y 3 → exit 0.

Tramos 4-6 (historia «builder and reviewers cite decision IDs») — detalle en [tramo-4.md](tramo-4.md), [tramo-5.md](tramo-5.md) y [tramo-6.md](tramo-6.md):
- `$ node tests/builder-contract.mjs` → exit 0 (4 frases A5 y mutaciones detectadas); `$ node --test tests/context-size/sizes.test.mjs` → pass 7, fail 0, exit 0; bytes builder.md + execute-plan = 13492 (≤ 13500).
- `$ node --test --test-name-pattern=kit-run tests/acceptance/*.test.mjs` → pass 3, fail 0, exit 0 (43317 ms, previa 43 s).
- `$ node tests/kit-run/run.mjs` → 52 casos pasaron, exit 0 (incluye 3 casos A6).
- `$ node --test tests/context-size/*.test.mjs tests/compaction/*.test.mjs tests/escalera/*.test.mjs` → pass 194, fail 0, exit 0 (31565 ms, previa 32 s); `planner.md` 8192 bytes.

Tramo 7 (historia «resume after compaction includes decisions») — detalle en [tramo-7.md](tramo-7.md):
- `$ node --check scripts/after-compact.mjs` → exit 0 (previa < 1 s).
- `$ node --test tests/after-compact/after-compact.test.mjs` (con `timeout 1`, 2× la previa 0,5 s) → pass 14, fail 0, exit 0 (515 ms).
- `$ grep -c 'decisions.md' docs/como-funciona.md` → 2, exit 0.
- Segment verification (`node --test tests/after-compact/after-compact.test.mjs`) → exit 0.

Verificación final (*Verification*), `./verify` ejecutado con `timeout 362` (2× la previa de 181 s); primera corrida final del tramo, sin relanzamientos:
```
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 2718314026f3
VERIFY OK
```
`$ ./verify` → `Fingerprint: 2718314026f3`, exit 0.

Devolución del tramo 7 (A8, `docs/como-funciona.md:17`), corregida por el builder (2026-11-26):
- `$ timeout 1s node --test tests/after-compact/after-compact.test.mjs` (2× la previa de 0,5 s) → pass 14, fail 0, exit 0 (684 ms).
- `$ grep -rn "solo compara IDs\|avisa de IDs" tests tools scripts core docs` → sin salida (sin frases obsoletas).
- Verificación final, `timeout 362s ./verify` (2× la previa de 181 s; fondo, ~3 min):
```
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 4546a2df161f
VERIFY OK
```
`$ ./verify` → `Fingerprint: 4546a2df161f`, exit 0.

Tramo 8 (historia «the builder applies only active decisions») — detalle en [tramo-8.md](tramo-8.md):
- Paso 1 (A9, `core/skills/execute-plan/SKILL.md`): dos ediciones aplicadas («apply it if `active`; do not ask again.» y «add decisions as new rows there instead»).
- `$ node --test tests/context-size/sizes.test.mjs` → pass 7, fail 0, exit 0 (62 ms); `builder.md` + `execute-plan/SKILL.md` = 13495 bytes (≤ 13500).
- Paso 2 (A9, `tests/builder-contract.mjs`): frase de filas cambiada a «add decisions as new rows there instead» y entrada nueva «apply it if `active`» en la lista de A5.
- `$ node tests/builder-contract.mjs` → ok A1, A2, A3, A5, A4; exit 0.
- Segment verification del tramo 8 (`node tests/builder-contract.mjs && node --test tests/context-size/sizes.test.mjs`, con `timeout 0.6s` = 2× la previa de 0,3 s) → pass 7, fail 0, exit 0 (169 ms). Cubre A9.
- Verification final del plan, `timeout 362s ./verify` (2× la previa de 181 s; primera corrida sobre este árbol, sin relanzamientos; salida en fondo, ~3 min):
```
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 8affc3fabf7c
VERIFY OK
```
`$ ./verify` → `Fingerprint: 8affc3fabf7c`, exit 0.

## Notes
- Tramo 1 (historia completa): rama `feature/decisiones-estructuradas` creada desde `main`. Archivos: `tools/check/decisiones.mjs` (nuevo), `scripts/review-plan.mjs` (+11/-1), `tests/review-plan/decisiones.test.mjs` (nuevo), `decisions.md` (filas D-07 y D-08 para decisiones menores).
- Decisiones menores tomadas (D-07, D-08): reemplazo inexistente se avisa; la prueba del repo llama a la función sin lanzar el CLI por plan.
- Límite de lectura: leí `scripts/review-plan.mjs` completo (220 líneas), contra la regla de la persona usuaria; los tramos siguientes leen por rangos.
- `status` queda en `in progress`: faltan tramos 2 a 7; cierre lo decide el planner.
- Retomar: revisión del planner; luego `segment: 2` y `tramo-2.md`.
- Revisión del planner, tramo 1 (2026-11-26): APPROVED. 35/35 pruebas; 90 planes sin diferencias con `main`; `./verify` exit 0, `Fingerprint: 515d46db3df8`; ninguna prueba existente alterada.
- Checkpoint tramo 2 (builder, 2026-11-26): `core/skills/plan-change/references/records.md` nuevo (52 líneas, igual a `formatos.md` tras `<!-- records -->`); `core/skills/plan-change/SKILL.md` +3 líneas (párrafo tras la plantilla y viñeta en *References*), 4366 bytes antes, dentro de 6144. Check: pasa.
- Checkpoint tramo 3 (builder, 2026-11-26): `references/template.md` (4 líneas: IDs, continuidad en `decisions.md`, «closed decision IDs»), `references/segments.md` (1 línea, ítem 11), `docs/kit-run.md` (1 fila `decision`). Check: pasa.
- Fin de historia «planning creates both records»: se detiene para la revisión del planner en contexto nuevo. `status` queda `in progress`; `segment: 3` es el último tramo cerrado.
- Retomar: revisión del planner; luego `segment: 4` (tramo 4, otra historia). Sin `Revisión: por tramo`, no hay revisión entre tramos 2 y 3.
- Revisión del planner, tramos 2-3 (2026-11-26): APPROVED. `records.md` idéntico a `formatos.md`; tamaños 7/7; `./verify` exit 0, `Fingerprint: c1501817a42c`; ninguna prueba existente alterada.
- Checkpoint tramo 4 (builder, 2026-11-26): `core/agents/builder.md` y `core/skills/execute-plan/SKILL.md` (frases exactas del tramo; retirada «When a segment ends, record its checkpoint;»), `tests/builder-contract.mjs` (+bloque A5). Check: pasa; 13492 bytes.
- Checkpoint tramo 5 (builder, 2026-11-26): `tools/run/prompts.mjs` (`decisionesRel`; sin él, prompt idéntico), `scripts/kit-run.mjs` (pasa `decisions.md` solo si existe; línea 431), `tests/kit-run/run.mjs` (+3 casos A6). Check: pasa; suite 52 casos.
- Checkpoint tramo 6 (builder, 2026-11-26): `core/agents/planner.md` (8192 bytes, límite exacto), `core/references/planner/paused-and-interrupted.md`, `tools/run/escalera.mjs` (mensaje `decision`). Check: pasa; 194 pruebas.
- Fin de historia «builder and reviewers cite decision IDs»: se detiene para la revisión del planner en contexto nuevo (`Revisión: fin de historia`). `status` queda `in progress`; `segment: 6` es el último tramo cerrado.
- Retomar: revisión del planner; luego `segment: 7` y `tramo-7.md` (otra historia: punteros tras compactar). `./verify` completo queda para el tramo final.
- Checkpoint tramo 7 (builder, 2026-11-26): `scripts/after-compact.mjs` (línea `Decisions: <ruta>` tras la de notas, solo si existe `decisions.md`; línea 107-108), `tests/after-compact/after-compact.test.mjs` (+2 casos: presente con marcador secreto que no sale; ausente), `docs/como-funciona.md` (bullet de salida del hook y bullet de registros, checker y límite). Diff: 3 archivos, +27/-1. Check: pasa (`node --check` exit 0; 14 pruebas; `grep` 2); `./verify` exit 0, `Fingerprint: 2718314026f3`.
- Fin de historia «resume after compaction includes decisions» y del plan (último tramo): `status: done` porque `verify` pasó; se detiene para la revisión del planner (`Revisión: fin de historia`). Cierre y mover a `changes/done/` lo decide el planner.
- Retomar: revisión del planner. Pendiente para Gate 2: dos precisiones de redacción en `execute-plan` (fila `active`; «add them»).
- Revisión del planner, tramos 4-6 (2026-11-26): APPROVED (D-02, D-05). Textos exactos aplicados; pruebas existentes solo con líneas agregadas; `./verify` exit 0, `Fingerprint: 3384fc4d3d0f`. Pendiente para Gate 2: dos precisiones de redacción en `execute-plan` (fila `active`; «add them»).
- Devuelto: defecto — tramo 7 — docs/como-funciona.md:17, A8 (D-06): el texto dice que el revisor solo avisa de IDs ausentes y que «solo compara IDs»; es falso. `tools/check/decisiones.mjs` avisa además de: registro mal formado, ID revocado o reemplazado sin su reemplazo en la línea, viñeta o `Resuelto:` sin ID, texto distinto al de la fila y cita sin `decisions.md`; ignora el código en línea y las cercas. El límite es que es textual y no detecta contradicciones de sentido.
- Checkpoint devolución tramo 7 (builder, 2026-11-26): `docs/como-funciona.md` línea 17 reescrita para listar lo que avisa `tools/check/decisiones.mjs` y su límite; sin otros archivos. Segment check exit 0; `./verify` exit 0 (`4546a2df161f`). Se deja `status: done` para la revisión del planner.
- Revisión final del planner (2026-11-26): APPROVED. A1-A2 (D-03, D-05, D-06), A3-A4 (D-02), A5-A7 (D-02, D-05) y A8 (D-04, D-06) cumplidos; defecto del tramo 7 corregido; `./verify` exit 0, `Fingerprint: 4546a2df161f`; pruebas existentes solo con líneas agregadas. Gate 2 pendiente.
- Gate 2 (2026-11-26): la persona aprobó la evidencia de los tramos 1-7 y pidió corregir y cerrar (D-09); se agrega el tramo 8.
- Checkpoint tramo 8 (builder, 2026-11-26): `core/skills/execute-plan/SKILL.md` (2 ediciones de frase; 13495 bytes con `builder.md`) y `tests/builder-contract.mjs` (frase de filas actualizada; entrada nueva «apply it if `active`» en A5). Diff: 2 archivos. Check: pasa (segment verification 169 ms; `builder-contract` ok A1-A5). `./verify` exit 0, `Fingerprint: 8affc3fabf7c`.
- Fin de historia «the builder applies only active decisions» y del plan (último tramo): `status: done` porque `verify` pasó; se detiene para la revisión del planner (`Revisión: fin de historia`). Cierre y mover a `changes/done/` lo decide el planner.
- Revisión del planner, tramo 8 (A9, D-09, 2026-11-26): APPROVED; 13495 bytes; `./verify` exit 0, `Fingerprint: 8affc3fabf7c`.
- Cierre: `kit-close` marca corridas sin registrar en *Evidence* (tramos 6-7 y varios A#). El planner repitió con exit 0: `node --test tests/escalera/*.test.mjs`, `node --check scripts/after-compact.mjs`, `node --test tests/after-compact/after-compact.test.mjs`; `grep -c` en `docs/como-funciona.md` da 2 o más.
