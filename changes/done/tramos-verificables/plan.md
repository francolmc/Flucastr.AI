---
status: approved
branch: feature/tramos-verificables
base: main
repos: [.]
executor: builder
segment: 3
type: code
---
# Tramos juzgables por máquina

## Goal
Cada tramo declara su A#, una comprobación rápida (Nivel 1) y su Handoff con ejemplo; `review-plan` avisa cuando falta. La verificación completa va solo al final de la historia.

## Exploration
- `plan-change` ya exige A#, `Segment verification:` con nivel y `Handoff:`; no obliga a que sea Nivel 1 ni a que cubra cada A#. La regla 9 manda `VERIFY_RAPIDO=1 ./verify` en pasos intermedios: contradice la nueva regla y se corrige.
- `review-plan.mjs` ya avisa >3 archivos, varias pantallas/capas y faltas de campos; no mira nivel ni cobertura. Sin consumidores fuera del planner (`rg review-plan`).
- `tests/builder-contract.mjs` lee `plan-change/SKILL.md` (sale 0 en 0,1 s); `review-plan.test.mjs` corre en 1 s.
- Fixture `story-new-valid.md` usa nivel 2 en su único tramo: debe seguir limpio.
- Red caída en el sandbox: `git fetch` falló; la base se confirma con el último `origin/main` local.

## Evaluation
Opción A (recomendada): reutilizar `Segment verification:` como la comprobación rápida y avisar. Sin campo nuevo, sin romper planes. Opción B: campo `Quick check:` aparte: duplica la verificación y rompe fixtures. Avisos van por stdout y salen 1 (como hoy); formato anterior: una nota por stderr, salida 0.

## Assumptions
- «Unidad funcional distinta» = dos A# cuyos TODO tocan archivos de producto disjuntos. Si prefiere «carpetas distintas», cambia solo el paso 2.4.
- Una historia son los tramos consecutivos con el mismo texto tras `Story:`; el último puede usar nivel 2 y el último del plan, nivel 3.

## Decisions already taken
- Executor: builder, porque el plan es completo, con comprobaciones y sin credenciales (prueba de ejecutabilidad: 4 sí).
- Tres historias, sin `continuity: continuous` (no son una misma historia); el aviso de continuidad de `review-plan` es residual.
- Nota de «cuándo dividir» va en `docs/tamano-de-tramos.md`, no en el prompt operativo.

## Validation
Aprobado por la persona usuaria (Gate 1, 2026-11-25).

## Scope
`core/skills/plan-change/SKILL.md`, `core/agents/planner.md`, `scripts/review-plan.mjs`, `tests/review-plan/**`, `docs/tamano-de-tramos.md`, `tests/README.md`. Nada más.

## Verification
`./verify` — nivel 3, solo al final de la última historia; falla si algo falla.

## Stop conditions
Parar con nota si la misma causa falla dos veces, hay que salir de Scope o falta una decisión.

## Steps

### Segment 1 — Story: regla de tramos verificables
As planner I want one written rule so that each segment is machine-judgeable.
Dependencies: none.
Contracts to keep: `tests/builder-contract.mjs` sigue en 0; plantilla y reglas 1–14 intactas salvo la regla 9.
Paths likely to change: `core/skills/plan-change/SKILL.md`, `core/agents/planner.md`.
Concrete example of the expected result: un tramo con `covers A1`, `level 1` y `Handoff:` con ejemplo cumple; uno con `docker compose` en nivel 1 no.
Scope: `core/skills/plan-change/SKILL.md`, `core/agents/planner.md`
Files: core/skills/plan-change/SKILL.md, core/agents/planner.md
WHEN the planner cuts segments THEN each has A#, a Level 1 check and a Handoff example (A1).
Acceptance:
- A1: rule 15 exists, rule 9 no longer sends intermediate steps to Level 2, and planner step 3 points to rule 15; check with `rg -c "Verifiable segments" core/skills/plan-change/SKILL.md`; expect 1.
TODO:
- [x] Add rule 15 «Verifiable segments» (text below) to `core/skills/plan-change/SKILL.md` (A1). Check: `rg -c "Verifiable segments" core/skills/plan-change/SKILL.md`; expect 1.
- [x] Replace the last sentence of rule 9 in `core/skills/plan-change/SKILL.md` with a pointer to rule 15 (A1). Check: `rg -c "VERIFY_RAPIDO=1 ./verify \(cached" core/skills/plan-change/SKILL.md`; expect 0.
- [x] Add to step 3 of `core/agents/planner.md` one clause: cut segments by plan-change rule 15 (A1). Check: `rg -c "rule 15" core/agents/planner.md`; expect 1.
Segment verification: `node tests/builder-contract.mjs` — level 1; exit 0; covers A1.
Handoff: Rule 15, English: «Each segment is judged by a machine when it ends. It declares (a) the A# it covers (`covers A1`; every A# of the segment is covered); (b) `Segment verification:` = one Level 1 quick check (host, no services, seconds; a targeted test counts) with exact command, `level 1` and expected exit; (c) a `Handoff:` with a concrete example. One functional unit per segment: two A# touching disjoint files are two segments. Level 2 only in the last segment of a story; Level 3 only in the plan's last segment. Split further only if it adds an independently checkable A#; else merge. Explain residual warnings in one line.» Example: story-new-valid.md.

- [Tramo 2 — review-plan avisa tramos no verificables](tramo-2.md) (depende del 1; criterios A2, A3).
- [Tramo 3 — nota de cuándo dividir](tramo-3.md) (depende del 2; criterio A4).

## Evidence

Segment 1 (regla de tramos verificables), 2026-11-25:

- `$ rg -c "Verifiable segments" core/skills/plan-change/SKILL.md` → `1`, exit 0.
- `$ rg -c "VERIFY_RAPIDO=1 ./verify \(cached" core/skills/plan-change/SKILL.md` → sin salida, 0 coincidencias, exit 1.
- `$ rg -c "rule 15" core/agents/planner.md` → `1`, exit 0.
- `$ node tests/builder-contract.mjs` → `ok A1`, `ok A2`, `ok A3`, `ok A5`, `ok A4`; exit 0.

Segment 2 (review-plan avisa tramos no verificables), 2026-11-25:

- `$ node scripts/review-plan.mjs tests/review-plan/fixtures/segment-mixed.md` → `tests/review-plan/fixtures/segment-mixed.md:7: historia nueva: A1 y A2 mezcla unidades: sus TODO tocan archivos de producto disjuntos`; exit 1.
- `$ node scripts/review-plan.mjs tests/review-plan/fixtures/plan-correct.md` → stderr `nota: formato anterior; las comprobaciones de tramos verificables (Segment verification, level, mezcla de unidades) no se aplican.`, stdout vacío; exit 0.
- `$ node --test tests/review-plan/review-plan.test.mjs` → `ℹ tests 21`, `ℹ pass 21`, `ℹ fail 0`; exit 0. Los 15 tests previos siguen intactos.
- Mutación (regla quitada en una copia temporal de `scripts/review-plan.mjs`, luego restaurada y comprobada con `cmp`): quitar el aviso de mezcla unidades → falla «mezcla unidades»; quitar el aviso de sin A# → falla «sin A#»; quitar la comprobación de Segment verification → falla «sin quick check»; quitar el aviso de marca de servicio en nivel 1 → falla «marca de servicio».

Segment 3 (nota de cuándo dividir), 2026-11-25:

- `$ rg -c "falsos positivos" docs/tamano-de-tramos.md` → `1`, exit 0.
- `$ rg -c "nivel" tests/README.md` → `2`, exit 0.
- `$ git diff --check` → sin salida, exit 0 (Segment verification, nivel 1).

## Notes

- Segment 3 (done): `docs/tamano-de-tramos.md` nuevo (28 líneas, en español; cuándo ayuda dividir, cuándo solo suma costo, falsos positivos conocidos de `review-plan`, ejemplo del Handoff). Fila de `review-plan` en `tests/README.md` con los casos nuevos y referencia a la nota. Sin commit. Frontmatter de `plan.md` (`status: approved`, `segment: 3`) sin cambios, como pidió el planner. Archivos del tramo: `docs/tamano-de-tramos.md` (nuevo), `tests/README.md`, `changes/tramos-verificables/tramo-3.md` (casillas), `changes/tramos-verificables/plan.md` (Evidence y Notes).
- Segment 3 (nota): el primer intento de la comprobación `falsos positivos` falló porque el encabezado tenía mayúscula; se cambió el encabezado a minúscula en la frase, sin cambiar el contenido. Causa resuelta en el mismo intento.
- Segment 3: `git status` sigue mostrando archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, etc.) que no se tocaron.

- Segment 1 (done): regla 15 «Verifiable segments» añadida al final de `core/skills/plan-change/SKILL.md` (en inglés, como el resto de reglas); la última frase de la regla 9 ahora apunta a la regla 15 y deja la verificación final en Nivel 3 sin caché. Paso 3 de `core/agents/planner.md`: cláusula «cut its segments by plan-change rule 15» en el bloque «For any multi-step change».
- Esta sección `## Evidence` y `## Notes` no existían en el plan; se crearon al cerrar el tramo 1.
- Git: la rama `feature/tramos-verificables` ya estaba activa y no se crearon ramas ni commits. `git status` muestra archivos sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, etc.) que no se tocaron y no pertenecen al tramo.
- Tramos 2 y 3 sin tocar, como se pidió.
- Segment 2 (done): `scripts/review-plan.mjs` aplica en historias nuevas las comprobaciones de cobertura de A#, comando y `level`, reglas de nivel (2 solo al final de historia, 3 solo al final del plan), marcas de servicio en nivel 1 y mezcla de unidades; imprime la nota de formato anterior por stderr; HELP lista los falsos positivos conocidos. `tests/review-plan/fixtures/segment-mixed.md` nuevo. `tests/review-plan/review-plan.test.mjs`: 6 tests nuevos (valido, sin A#, sin quick check, mezcla, cobertura/nivel/servicio y formato anterior); el tramo pedía 4, los 2 extra cubren cobertura, marca de servicio y A3. Ningún assert previo editado.
- Decisión menor fuera del tramo: el script avisa también un `level` distinto de 1, 2 o 3 («nivel N no existe»). No estaba en el tramo, pero es coherente con la regla 15.
- Sin commit. Frontmatter de `plan.md` (`status: approved`, `segment: 2`) sin cambios, como se pidió; lo actualiza el planner. Tramo 3 sin tocar.
- Archivos del tramo: `scripts/review-plan.mjs`, `tests/review-plan/review-plan.test.mjs`, `tests/review-plan/fixtures/segment-mixed.md` (nuevo), `changes/tramos-verificables/tramo-2.md` (casillas), `changes/tramos-verificables/plan.md` (Evidence y Notes).

- Revisión planner tramo 2: APPROVED. Observaciones: la nota «formato anterior» también sale en `story-new-valid.md` (sin encabezado `### Segment N — Story:`); `plan.md` supera 8192 bytes por el Evidence del builder (residual, no de producto).
