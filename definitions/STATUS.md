# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). F07 `en curso`. task-01 a task-03 `hecha`; task-04 `lista para revisión` (`features/F07-modelo-por-agente/task-04-corrida-pi.md`); task-05 y task-06 `aprobada`.
Rama: feature/F07-modelo-por-agente

## Espera a Franco

- **Puerta 4:** revisa la Evidencia y las Notas de `features/F07-modelo-por-agente/task-04-corrida-pi.md` y el nuevo `pruebas/lanzar-modelos-pi.sh`, haz el commit en `feature/F07-modelo-por-agente` y pásala a `hecha`. Resultado informado (corrida real, 69 s): coordinador `openai/gpt-6.1-sol`, planificador `openai/gpt-6.1-sol`, constructor `openai/gpt-6-sol`, los tres iguales a lo resuelto. En Pi el modelo del subagente sale de `details.results[].model` de la herramienta `subagent`, presente en el registro principal. Las transcripciones del subagente quedan en una carpeta temporal de `pi-subagents` que puede limpiarse. Nota: el constructor usó `contact_supervisor` pese a «sin herramientas»; no afecta al modelo.
- **Ajuste pendiente de task-05:** su rama Pi asume «subagente no observable», pero task-04 muestra que sí es observable en el registro principal. Hay que reescribir esa rama (extraer `details.results[].model`) antes de ejecutarla; lo delego al planificador y te pido reaprobar.
- Pendiente fuera de alcance: `WORKFLOW.md` (líneas 146 y 149) y la nota de `BACKLOG.md` (línea 28) aún dicen «máximo de 6»; se alinean con el `arquitecto` o con F08.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
