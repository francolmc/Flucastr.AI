---
segment: 2
---
## Steps

### Segment 2 — Story: Claude Code con margen
As persona usuaria I want cada agente de Claude Code con su ventana so that planner y builder compacten a tiempo.
Dependencies: Segment 1 — `compactarEn`.
Contracts to keep: comandos actuales del resolver; el lanzador conserva `--agent` y `--effort`; ningún cambio de modelo.
Paths likely to change: `adapters/shared/markdown-agent.mjs`, `scripts/resolver.mjs`, `adapters/claude-code/install-launcher.sh`.
Concrete example of the expected result: `claude-planner` contiene `--autocompact 300000`; el agente builder generado contiene `autoCompactWindow: 200000`.
Scope: los tres archivos de Files y `tests/compaction/agents.test.mjs`.
Files: adapters/shared/markdown-agent.mjs, scripts/resolver.mjs, adapters/claude-code/install-launcher.sh
WHEN se generan agentes y lanzadores THEN llevan la ventana de su agente (A2).
Acceptance:
- A2: nuevo `ventana-claude <agente>` imprime `compactarEn(..., "claude-code") + 33000`; fuera de 100000–1000000 o sin valor no imprime nada y sale 0. `agente-claude` escribe `autoCompactWindow: N` en el frontmatter solo si planner tiene ventana y la del agente es menor (builder sí; planner no; Pi sin cambios). El lanzador añade `--autocompact N` cuando hay ventana (planner 300000, builder 200000). Con planner antiguo en 60000 no hay bandera.
TODO:
- [x] Añadir `ventana-claude` a `scripts/resolver.mjs` y a su cabecera de uso (A2). Check: `node scripts/resolver.mjs ventana-claude planner`; imprime 300000.
- [x] Aceptar una ventana opcional en `adapters/shared/markdown-agent.mjs` y pasarla desde `agente-claude` (A2). Check: `node scripts/resolver.mjs agente-claude core/agents/builder.md`; contiene `autoCompactWindow: 200000`.
- [x] Añadir `--autocompact` en `adapters/claude-code/install-launcher.sh` (A2). Check: `bash -n adapters/claude-code/install-launcher.sh`; salida 0.
- [x] Crear `tests/compaction/agents.test.mjs` con HOME temporal, siguiendo `tools/verify/launchers.sh`, y el caso antiguo 60000 (A2). Check: `node --test tests/compaction/agents.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/agents.test.mjs` — level 1; exit 0; covers A2.
Handoff: Ejemplo: `exec claude --agent builder --effort high --autocompact 200000 "$@"`. El frontmatter no actúa con `claude --agent`; por eso van ambos. `tools/verify/launchers.sh` busca `--effort low` en `claude-builder` con su propio models.json: no lo rompas.

## Evidence

$ node scripts/resolver.mjs ventana-claude planner
300000
exit 0

$ node scripts/resolver.mjs ventana-claude builder
200000
exit 0

$ node scripts/resolver.mjs agente-claude core/agents/builder.md | grep autoCompactWindow
autoCompactWindow: 200000
exit 0

$ node scripts/resolver.mjs agente-claude core/agents/planner.md | grep -c autoCompactWindow
0
exit 0

$ bash -n adapters/claude-code/install-launcher.sh
(sin salida)
exit 0

$ node --test tests/compaction/agents.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

## Notes

Tramo 2 (segmento 2) — checkpoint:
- Archivos: `scripts/resolver.mjs` (import de `compactarEn`, función `ventanaClaude`, `ventanaAutoCompact`, orden `ventana-claude`, cabecera de uso), `adapters/shared/markdown-agent.mjs` (parámetro `ventana`, línea `autoCompactWindow` solo en Claude Code), `adapters/claude-code/install-launcher.sh` (`ventana` y `--autocompact` tras `--effort`), `tests/compaction/agents.test.mjs` (nuevo, HOME temporal, 7 pruebas).
- Diff: 4 archivos con cambios acotados; sin cambios en modelos, esfuerzos ni restricciones.
- Decisión: la ventana fuera de 100000–1000000 se trata como «sin ventana» en `ventana-claude` y en el lanzador (sin bandera).
- Check: `node --test tests/compaction/agents.test.mjs` salida 0 (7 pruebas); `bash -n` salida 0; las comprobaciones manuales de la tabla de Evidence coinciden con lo esperado.
- Pendiente de este tramo: nada.
