# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). F07 `en curso`. task-01 y task-02 `hecha`; task-03 `lista para revisión` (`features/F07-modelo-por-agente/task-03-corrida-claude-code.md`); task-04 a task-06 `aprobada`.
Rama: feature/F07-modelo-por-agente

## Espera a Franco

- **Puerta 4:** revisa la Evidencia («Corridas por fuente») y las Notas de `features/F07-modelo-por-agente/task-03-corrida-claude-code.md`, haz el commit en `feature/F07-modelo-por-agente` y pásala a `hecha`. Resultado informado: las transcripciones de subagentes en `~/.claude/projects/` (sin `--no-session-persistence`) muestran el modelo real: coordinador y planificador `claude-sonnet-5-5`, constructor `claude-haiku-5-5`, igual que `resolver.mjs`. Cambió `pruebas/lanzar-modelos-claude.sh`.
- **Después:** ajustar task-05 (paso 2 y criterio 1) para leer `subagents/agent-*.jsonl` mapeando por `toolUseResult.agentId`; luego task-04 (Pi).
- Pendiente fuera de alcance: `WORKFLOW.md` (líneas 146 y 149), la nota de `BACKLOG.md` (línea 28) aún dicen «máximo de 6»; se alinean con el `arquitecto` o con F08.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- task-04 (Pi) usa modelo real; el modelo del subagente podría no aparecer en el registro.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
