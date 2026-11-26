# Tramo 5

## Steps

### Segment 5 — Story: Pi ignora la lista de herramientas excluidas de Claude Code
As Pi user I want my agent header unchanged by Claude-only keys so that installation keeps working.
Dependencies: ninguna; debe hacerse antes del tramo 6.
Contracts to keep: `bashPlano` sigue aplanando `tools:`; Claude Code conserva `disallowedTools:`; Codex no cambia.
Paths likely to change: `adapters/pi/agent-tools.mjs`.
Concrete example of the expected result: un agente con `disallowedTools: Artifact` sale sin esa línea en `agente-pi` y con ella en `agente-claude`.
Scope: adaptador de Pi y su prueba.
Files: adapters/pi/agent-tools.mjs, tests/context-size/frontmatter.test.mjs
WHEN se genera un agente para Pi THEN la cabecera no contiene `disallowedTools` (A5)
Acceptance:
- A5: Pi la quita y Claude Code la conserva; check with the segment verification; expect pass.
TODO:
- [x] Crear `tests/context-size/frontmatter.test.mjs` con un `planner.md` temporal que declare `disallowedTools:` (A5). Check: `node --test tests/context-size/frontmatter.test.mjs`; expect rojo en Pi.
- [x] En `adapters/pi/agent-tools.mjs`, hacer que `bashPlano` elimine la línea `disallowedTools:` de la cabecera (A5). Check: `node --test tests/context-size/frontmatter.test.mjs`; expect pass.
Segment verification: `node --test tests/context-size/frontmatter.test.mjs` — level 1; exit 0; covers A5.
Handoff: la prueba copia `core/agents/planner.md` a un directorio temporal, inserta tras `name:` la línea `disallowedTools: Artifact` y ejecuta `node scripts/resolver.mjs agente-pi <copia>` y `agente-claude <copia>`; el nombre del archivo debe ser `planner.md`. Lanzar procesos con `tools/spawn/sync-seguro.mjs`.
