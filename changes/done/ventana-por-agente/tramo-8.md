---
segment: 8
---
## Steps

### Segment 8 — Story: Pi y Codex
As persona usuaria I want que `kit run` limite el contexto de Codex so that builder y revisor compacten como en sus lanzadores.
Dependencies: Segment 1 — `compactar-codex reviewer`.
Contracts to keep: argumentos, sandbox y política de aprobación actuales; `KIT_RUN_<ROL>` sin cambios; sin valor no se añade bandera; pruebas de `tests/kit-run/` sin editar.
Paths likely to change: `tools/run/commands.mjs`, `tools/run/profiles.mjs`, `scripts/kit-run.mjs`.
Concrete example of the expected result: el rol BUILDER lleva `-c model_auto_compact_token_limit=150000`; el revisor, 200000.
Scope: los tres archivos de Files y `tests/compaction/kit-run.test.mjs`.
Files: tools/run/commands.mjs, tools/run/profiles.mjs, scripts/kit-run.mjs
WHEN `kit run` lanza Codex THEN pasa el límite del rol (A8).
Acceptance:
- A8: `crearComando` recibe `resolverCompactacion(agente)` opcional; `crearResolutoresPerfil` lo ofrece llamando a `compactar-codex <agente>` (un argumento); `kit-run.mjs` lo conecta; BUILDER usa `builder` y el otro rol `reviewer`; vacío o ausente no añade nada; con `KIT_RUN_<ROL>` no cambia nada.
TODO:
- [x] Añadir la bandera en `tools/run/commands.mjs` (A8). Check: `node --check tools/run/commands.mjs`; salida 0.
- [x] Añadir el resolutor en `tools/run/profiles.mjs` (A8). Check: `node --check tools/run/profiles.mjs`; salida 0.
- [x] Conectarlo en `scripts/kit-run.mjs` (A8). Check: `node --check scripts/kit-run.mjs`; salida 0.
- [x] Crear `tests/compaction/kit-run.test.mjs`: ambos roles con valores reales, sin valor y con `KIT_RUN_BUILDER` (A8). Check: `node --test tests/compaction/kit-run.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/kit-run.test.mjs` — level 1; exit 0; covers A8.
Handoff: Ejemplo: resolutor sustituto `() => ""` deja los argumentos iguales a hoy. Punto de control de la historia al terminar.

## Evidence

$ node --check tools/run/commands.mjs && node --check tools/run/profiles.mjs && node --check scripts/kit-run.mjs
(sin salida)
exit 0

$ node --test tests/compaction/kit-run.test.mjs
ℹ tests 7
ℹ suites 1
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

$ node --test tests/compaction/*.test.mjs   (regresión de la historia 2)
ℹ tests 70
ℹ pass 70
ℹ fail 0
exit 0

## Notes

- Archivos: `tools/run/commands.mjs` (bandera `model_auto_compact_token_limit` tras `model_reasoning_effort`, solo con valor no vacío y sin cambios con `KIT_RUN_<ROL>`), `tools/run/profiles.mjs` (`resolverCompactacion(agente)` con `compactar-codex <agente>`), `scripts/kit-run.mjs` (conexión a `crearComando`), `tests/compaction/kit-run.test.mjs` (nuevo, 7 pruebas).
- Roles: BUILDER → `builder`; revisor → `reviewer`.
