# Tramo 3

## Steps

### Segment 3 — Story: casos raros del planner fuera del núcleo
As planner I want rare cases in reference files so that they cost nothing until needed.
Dependencies: ninguna.
Contracts to keep: `core/agents/planner.md` no cambia en este tramo; texto igual al original.
Paths likely to change: `core/references/planner/progress-report.md`, `core/references/planner/paused-and-interrupted.md`, `core/references/planner/codex-waits.md`.
Concrete example of the expected result: `grep -c "yield_time_ms: 300000" core/references/planner/codex-waits.md` da 1.
Scope: tres referencias nuevas.
Files: core/references/planner/progress-report.md, core/references/planner/paused-and-interrupted.md, core/references/planner/codex-waits.md
WHEN el planner informa avance, retoma una pausa o espera en Codex THEN tiene el texto completo en una referencia (A3)
Acceptance:
- A3: las tres referencias son copia exacta de los borradores; check with `cmp`; expect exit 0.
TODO:
- [x] Copiar con `cp` el borrador a `core/references/planner/progress-report.md` (A3). Check: `cmp changes/piso-planner/borradores/references/planner/progress-report.md core/references/planner/progress-report.md`; expect exit 0.
- [x] Copiar con `cp` el borrador a `core/references/planner/paused-and-interrupted.md` (A3). Check: `cmp changes/piso-planner/borradores/references/planner/paused-and-interrupted.md core/references/planner/paused-and-interrupted.md`; expect exit 0.
- [x] Copiar con `cp` el borrador a `core/references/planner/codex-waits.md` (A3). Check: `cmp changes/piso-planner/borradores/references/planner/codex-waits.md core/references/planner/codex-waits.md`; expect exit 0.
Segment verification: `cmp changes/piso-planner/borradores/references/planner/progress-report.md core/references/planner/progress-report.md && cmp changes/piso-planner/borradores/references/planner/paused-and-interrupted.md core/references/planner/paused-and-interrupted.md && cmp changes/piso-planner/borradores/references/planner/codex-waits.md core/references/planner/codex-waits.md` — level 1; exit 0; covers A3.
Handoff: crear la carpeta con `mkdir -p core/references/planner`; copiar con `cp` sin editar. El instalador no la copia: se lee desde la raíz del kit.
