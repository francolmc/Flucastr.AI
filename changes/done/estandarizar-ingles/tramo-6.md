# Segment 6

## Steps

### Segment 6 — Story: documentación con los nombres nuevos
As a user I want the documentation (in Spanish) to cite the new names, paths, commands and markers so that I do not follow instructions that no longer exist.
Dependencies: Segment 5.
Contracts to keep: el texto de la documentación sigue en español; no se reescribe la prosa, solo nombres, rutas, comandos, claves y marcadores; `old/` y el texto de `changes/done/` no se tocan.
Paths likely to change: `README.md`, `AGENTS.md`, `tests/README.md`, `TODO.md`, `friction.md`, `evals/README.md`, `docs/guide.md`, `docs/kit-run.md`, `docs/mejoras.md`, `docs/practicas-por-tecnologia.md`, `docs/reglas-deny.md`, `docs/decisions/`, `docs/evaluaciones/`, `docs/investigaciones/`.
Concrete example of the expected result: `README.md` explica `bash install.sh --project <proyecto>`, `changes/<name>/plan.md`, `status: approved` y `DONE`/`PAUSED`; ningún enlace de `docs/` apunta a una ruta que ya no existe.
Scope: solo nombres, rutas y comandos dentro de documentos; supera tres archivos por ser una pasada mecánica (ver Decisiones del plan).
Files: README.md, AGENTS.md, docs/guide.md
WHEN the document sweep ends THEN the documents cite only current names, paths and commands (A1).
Acceptance:
- A1: `git grep -nE 'cambios/|pruebas/|agentes/|nucleo/|instalar\.sh|desinstalar\.sh|COMPLETADO|PAUSA\b|APROBADO|DEVUELTO|modelos\.json|PENDIENTES\.md|friccion\.md|\bprincipal\b|\bconstructor\b' -- README.md AGENTS.md TODO.md friction.md evals docs tests/README.md` no devuelve resultados, salvo citas literales de contratos históricos marcadas como tales; comprobar además que cada enlace relativo de esos documentos apunta a un archivo existente con `node -e` sobre sus enlaces `](ruta)` (esperar 0 rotos).

TODO:
- [x] En `./README.md` y `./AGENTS.md`, actualizar nombres, rutas, comandos, claves y marcadores sin reescribir la prosa (A1). Comprobación: `git grep -nE 'cambios/|pruebas/|instalar\.sh|COMPLETADO|modelos\.json' -- README.md AGENTS.md`; sin resultados. Nota del principal (opción a, excepciones documentadas): `AGENTS.md:43` y `:45` (`old/v1/` con `pruebas/` y `pruebas/.temporales/`, nombres reales) se aceptan; `AGENTS.md:17` (`auditoria-servicios-constructor.md`) también, por ser nombre real de archivo.
- [x] En `docs/guide.md`, `docs/kit-run.md`, `docs/reglas-deny.md`, `docs/mejoras.md`, `docs/practicas-por-tecnologia.md` y `tests/README.md`, actualizar nombres, rutas y comandos (A1). Comprobación: el `git grep` de la aceptación sobre esos archivos; sin resultados. Nota del principal (opción a, excepciones documentadas): `docs/guide.md:53` (`docs/evaluaciones/constructor.md`) se acepta como nombre real de archivo.
- [x] En `TODO.md`, `friction.md`, `evals/README.md`, `docs/decisions/`, `docs/evaluaciones/` y `docs/investigaciones/`, actualizar solo rutas y enlaces rotos; las citas históricas literales se dejan y se listan en Notas (A1). Comprobación: `node -e` sobre los enlaces `](ruta)` de esos documentos; 0 rotos.
- [x] Correr `./verify` (A1). Comprobación: `./verify`; exit 0 y VERIFY OK.

Segment verification: `./verify` — level 3; exit 0; covers A1.
Handoff: no reescribir prosa ni traducir texto; no tocar `old/` ni `changes/done/`; si un nombre aparece como cita histórica de un contrato antiguo, dejarlo y anotarlo.
