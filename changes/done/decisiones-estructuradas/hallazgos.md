# Hallazgos de exploración (2026-11-26)

## Base
- `main` al día (`git fetch`; 0 commits detrás). `feature/decisiones-estructuradas` no existe: la crea el builder (si ya existe, pausa por `access`: `execute-plan` línea 16).
- `./verify` en `main`: `VERIFY OK`, exit 0 (más de 120 s en el sandbox).

## Dónde viven hoy las decisiones
- `execute-plan/SKILL.md` líneas 30, 44 y 85: continuidad anota en *Decisions*; sin continuidad en *Notes*; antes de pausar se busca `Resuelto:` en *Decisions already taken*.
- `plan-change/references/segments.md` manda `Resuelto:` a `## Decisions`: tercer lugar (C9, `changes/done/reducir-contrato-builder/inventario.md:181`).
- `plan-change/references/template.md` define ambas secciones; `rules.md:23` exige la línea `Executor:`.
- `tools/run/handoff.mjs`: copia las líneas «- …» de *Decisions already taken* al handoff (con IDs sigue sirviendo).
- `tools/run/escalera.mjs:10` y `docs/kit-run.md:67` piden `Resuelto:` en el plan.

## Revisor
- Interactivo: el planner (`planner.md`). `kit run`: `promptRevisor` en `tools/run/prompts.mjs`, llamado en `scripts/kit-run.mjs:431`.
- `tests/kit-run/run.mjs:286-292,737-746`: sin argumentos nuevos el prompt debe quedar idéntico.

## Límites (bytes actuales / máximo)
- `planner.md` 8190/8192. `builder.md` + `execute-plan` 13267/13500. `plan-change/SKILL.md` 4366/6144. `AGENTS.md` 5483/6144.

## Compatibilidad y pruebas
- Frases literales: `tools/verify/segment-contract.sh` exige `Resuelto:` en `plan-change/SKILL.md` y `execute-plan`; `tests/builder-contract.mjs:65,77` exige las frases sobre *Decisions*.
- `scripts/after-compact.mjs` busca la última cabecera `## Next action` o `## Próxima acción`.
- `kit-scope.mjs:102`: `changes/<nombre>/` siempre permitido.
- 90 `plan.md` entre activos y cerrados; ninguno usa `D-NN` (sin falsos positivos).
- `scripts/review-plan.mjs` (219 líneas) no importa nada propio; `tests/review-plan/*.test.mjs` corre entero en `verify` (paso 10b).
