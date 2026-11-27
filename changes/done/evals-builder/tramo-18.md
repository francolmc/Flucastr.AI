## Steps

### Segment 18 — Story: límites declarados antes de cerrar
As persona dueña del kit I want los defectos conocidos a la vista so that no gaste cuota en una corrida que no sirve.
Dependencies: Segment 17 — documentación del banco.
Contracts to keep: comandos y secciones existentes; ningún nombre, ruta ni texto de proyectos privados.
Paths likely to change: `evals/builder/README.md`, `TODO.md`; ninguna prueba.
Concrete example of the expected result: el README empieza avisando que la línea base del 2026-11-27 no sirve para decidir un A/B y enlaza `changes/done/evals-builder/linea-base.md`.
Scope: esos dos documentos.
Files: evals/builder/README.md, TODO.md
WHEN alguien abre el banco o los pendientes THEN ve los defectos que impiden decidir (A18)
Acceptance:
- A18: README con aviso inicial, los defectos 1 a 4 de `linea-base.md` en sus límites y las rutas a este cambio bajo `changes/done/evals-builder/`; `TODO.md` con una entrada breve de esos pendientes (D-43); check with `rg -n 'changes/evals-builder' evals/builder/README.md`; expect sin resultados (exit 1).
TODO:
- [x] En `evals/builder/README.md`, avisar al inicio, actualizar límites y rutas (A18). Check: `rg -n 'changes/done/evals-builder/linea-base.md' evals/builder/README.md`; expect al menos una.
- [x] En `TODO.md`, anotar los pendientes del banco (A18). Check: `rg -n 'evals/builder' TODO.md`; expect al menos una.
Segment verification: `timeout 60 node --test tests/evals-builder/corpus.test.mjs` — level 1; exit 0; covers A18.
Handoff: la carpeta del cambio se mueve a `changes/done/` después, lo hace el planner. El planner corre `./verify` tras el cierre: no hace falta aquí. Fuente de los defectos: `changes/evals-builder/linea-base.md`.

## Evidence

## Notes
