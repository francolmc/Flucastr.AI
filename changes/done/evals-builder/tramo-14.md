## Steps

### Segment 14 — Story: el contrato de la variante también en los tramos del kit
As persona que compara contratos I want que en tramos K el builder no lea un contrato antiguo so that la variante sea la medida.
Dependencies: Segment 13 — corpus vigente.
Contracts to keep: repos fuente intactos; árbol de la copia limpio tras prepararla; tramos P sin cambios; leer el contrato vivo sigue invalidando.
Paths likely to change: `evals/builder/lib/copia.mjs`, `evals/builder/lib/calibrar.mjs`, `evals/builder/lib/correr.mjs` y sus tres pruebas.
Concrete example of the expected result: copia de un tramo K: `core/skills/execute-plan/SKILL.md` es igual al de la variante y `git status` sale vacío.
Scope: los archivos de *Files* y sus pruebas en `tests/evals-builder/`.
Files: evals/builder/lib/copia.mjs, evals/builder/lib/calibrar.mjs, evals/builder/lib/correr.mjs
WHEN se prepara un tramo K THEN su contrato es el de la variante (A15)
Acceptance:
- A15: en copias del alias K, `core/agents/builder.md` y `core/skills/execute-plan/SKILL.md`, si existen en la base, entran en el commit sintético con el contenido de la variante (`correr`) o del kit actual (`calibrar`); `contrato_ok` acepta en K la ruta relativa de la copia y sigue falso si se cita la viva (D-35); check with `node --test tests/evals-builder/*.test.mjs`; expect exit 0.
TODO:
- [x] En `evals/builder/lib/copia.mjs`, admitir superponer un archivo local antes del commit sintético (A15). Check: caso en `tests/evals-builder/copia.test.mjs`; expect contenido nuevo y árbol limpio.
- [x] En `evals/builder/lib/calibrar.mjs`, aplicar el contrato recibido en copias K, por omisión el del kit (A15). Check: caso K y caso P en `calibrar.test.mjs`; expect solo K cambia.
- [x] En `evals/builder/lib/correr.mjs`, pasar el contrato de la variante y aceptar la ruta relativa en K (A15). Check: caso falso con `cat core/skills/execute-plan/SKILL.md`; expect `contrato_ok` true.
Segment verification: `timeout 300 node --test tests/evals-builder/*.test.mjs` — level 2; exit 0; covers A15.
Handoff: en la corrida real el builder hizo `cat core/skills/execute-plan/SKILL.md` en la copia (el histórico) y `contrato_ok` salió falso o, con otra sesión, verdadero. No corras el banco sobre los repos reales ni leas `local.json` para la evidencia.

## Evidence

## Notes
