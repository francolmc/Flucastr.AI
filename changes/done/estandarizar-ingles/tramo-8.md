# Tramo 8

## Steps

### Segment 8 — Story: nombres de archivo restantes
Como persona usuaria quiero que no queden archivos con nombre en español para que el proyecto esté estandarizado en inglés.
Dependencias: Tramo 7.
Contratos a conservar: No se toca `old/`, `changes/done/` ni `docs/evaluaciones/`; el comportamiento no cambia; `./verify` pasa.
Rutas susceptibles de cambio: `scripts/`, `tests/`, `core/skills/diagnose/`, `core/agents/`, `core/skills/plan-change/`, `adapters/claude-code/`, `tools/`, `docs/`, `AGENTS.md`, `README.md`.
Ejemplo concreto del resultado esperado: `scripts/revisar-plan.mjs`→`scripts/review-plan.mjs`, `scripts/permisos-hook.mjs`→`scripts/permissions-hook.mjs`, `core/skills/diagnose/diagnosticar.mjs`→`diagnose.mjs`, `tests/acceptance/uso.test.mjs`→`usage.test.mjs`, `probar.mjs`→`run.mjs`, `medir.mjs`→`measure.mjs`, `huella*`→`fingerprint*`, `estructura.test.mjs`→`structure.test.mjs`, `generacion.test.mjs`→`generation.test.mjs`, `protocolo.mjs`→`protocol.mjs`, `hook.test.mjs` sin cambio. Lista completa: `find . -path ./old -prune -o -path ./changes/done -prune -o -path ./.git -prune -o -type f -print` y juzga los nombres en español; otro nombre en español que aparezca se renombra igual.
Alcance: renombre mecánico con `mv` (nunca `git mv`) y actualizar todas las referencias (agentes, skills, instaladores, verify, tests, README, AGENTS.md, docs; en `docs/` solo rutas); supera tres archivos de producto (ver Decisiones del plan). Sin renombrar los datos históricos de `tests/luna-reviewer/` ni `tests/continuity/evidencia-real.md`.
Archivos: scripts/*, tests/*, core/skills/diagnose/*, referencias en core/, adapters/, tools/, docs/, AGENTS.md, README.md
CUANDO se corre `./verify` ENTONCES pasa y `git grep -nE "revisar-plan|permisos-hook|diagnosticar|probar\.mjs|medir\.mjs|huella|protocolo\.mjs|uso\.test" -- . ':!old' ':!changes/done' ':!docs/evaluaciones' ':!docs/investigaciones' ':!docs/decisions'` no devuelve nada (A1).
Aceptación:
- A1: `./verify` exit 0 y el `git grep` anterior sin resultados; el script del revisor responde en `node scripts/review-plan.mjs changes/estandarizar-ingles/plan.md`.
TODO:
- [x] Renombrar scripts y tests listados y actualizar referencias (A1). Comprobación: el `git grep` anterior; sin resultados salvo la lectura heredada de `huella` aprobada por el principal (`core/skills/diagnose/result.mjs:8,10`). Evidencia: plan, Evidencia del tramo 8, «Corrección tras la resolución del principal».
- [x] Barrido de nombres de archivo en español con el `find` anterior; anotar en Notas lo que quede (A1). Comprobación: el `find`; solo excepciones aprobadas. Evidencia: plan, Evidencia del tramo 8 (excepciones: datos de prueba, `evals/`, carpetas de planes en curso, `pruebas/` vacía).
- [x] Añadir `tests/migration/names.test.mjs` a `./verify` y corregir `docs/guide.md:18` (`### Segment N`, `continuity: continuous`) (A1). Comprobación: `./verify`; VERIFY OK ejecuta la prueba.
- [x] Correr `./verify` (A1). Comprobación: `./verify`; exit 0 y VERIFY OK.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1.
Handoff: sin commit ni `git mv`/`git rm`; sin migrar proyectos reales.
