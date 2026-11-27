## Steps

### Segment 5 — Story: variantes
As persona dueña del kit I want cambiar contrato, nivel, esfuerzo o ventana por corrida so that compare sin tocar mi instalación.
Dependencies: External — Codex lee skills de `$HOME/.agents/skills` (sin probar; lo comprueba el Segment 8 en cada corrida).
Contracts to keep: D-06; nunca leer el contenido de la carpeta de Codex salvo `sessions/`.
Paths likely to change: `evals/builder/lib/variante.mjs`, `evals/builder/variantes/base.json`, `tests/evals-builder/variante.test.mjs`.
Concrete example of the expected result: `{"nombre":"v","esfuerzo":"medium"}` → copia del kit con `FLUCASTR_MODELOS` temporal; `models.json` del repo igual.
Scope: módulo, variante base y prueba.
Files: evals/builder/lib/variante.mjs, evals/builder/lib/correr.mjs, tests/evals-builder/variante.test.mjs
WHEN se prepara una variante THEN `kit run` corre desde una copia del kit con su contrato y valores (A5)
Acceptance:
- A5: la copia (`core/`, `scripts/`, `tools/`, `models.json` del árbol de trabajo) aplica contrato, `nivel`, `esfuerzo` y `ventana`; `HOME` temporal enlaza `.agents/skills` a la copia y `.codex` a la carpeta real; devuelve huellas separadas de kit y contrato; contrato nulo o igual al base falla con 2; al limpiar, el destino de los enlaces queda intacto; check with `node --test tests/evals-builder/variante.test.mjs`; expect exit 0.
TODO:
- [x] Escribir casos con carpeta de Codex falsa en `tests/evals-builder/variante.test.mjs` (A5). Check: la prueba; expect rojo.
- [x] Crear `evals/builder/variantes/base.json` con solo `nombre` (A5). Check: la prueba; expect sin cambios de configuración.
- [x] Implementar `evals/builder/lib/variante.mjs` (A5). Check: la prueba; expect exit 0.
- [x] Copiar `adapters/` y sacar `models.json` de la huella `kit`, con huella `modelos` aparte, en `evals/builder/lib/variante.mjs` (A5, D-26). Check: caso en `tests/evals-builder/variante.test.mjs`; expect misma huella `kit` y distinta `modelos` entre base y variante de nivel.
- [x] Quitar la copia de `adapters/` de `evals/builder/lib/correr.mjs` (A5, D-26). Check: `node --test tests/evals-builder/correr.test.mjs`; expect exit 0.
Segment verification: `node --test tests/evals-builder/variante.test.mjs` — level 1; exit 0; covers A5.
Handoff: claves: `contrato.builder`, `contrato.execute_plan` (rutas relativas a la variante), `nivel` → `agents.builder.level`, `esfuerzo` → `agents.builder.effort`, `ventana` → `agents.builder.compact_at.codex`. La carpeta real es `CODEX_HOME` o `~/.codex`, resuelta antes de cambiar `HOME`.

## Evidence
