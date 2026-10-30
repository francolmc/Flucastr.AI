# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). «Pasos» de task-03 condensados a 7; falta tu commit y la confirmación para volver task-05 a `aprobada`. task-05 `bloqueada` (`features/F07-modelo-por-agente/task-05-extractor-modelos-registro.md`): extractor y 14 pruebas listos, pero `bash pruebas/rapida.sh` falla por el formato de task-03. task-06 con ajuste pendiente para Pi. F07 `en curso`. task-01 a task-04 `hecha`; task-05 y task-06 `aprobada`.
Rama: feature/F07-modelo-por-agente

## Espera a Franco

- **Commit + confirmación:** haz el commit del cambio en `features/F07-modelo-por-agente/task-03-corrida-claude-code.md` (Pasos de 10 a 7; sigue `hecha`) y confirma que vuelva task-05 a `aprobada` para reintentar `rapida.sh`. Nota menor: los pasos de task-03 quedaron numerados 1, 5, 6, 7, 8, 9, 10 para no desfasar referencias en Criterios y Evidencia; los criterios 1 y 4 dicen «paso 2» (precondición), que ahora vive dentro del paso 1 (¿lo ajusto?).
- **Decisión pendiente (task-06):** ajustar su texto sobre Pi (viñeta: en Pi el modelo del subagente sale del registro `--mode json`, `details.results[].model`).

- **Ajuste pendiente de task-06:** su texto sobre Pi («depende de lo que halle task-04») ya no vale; propuesta: viñeta que diga que en Pi el modelo del subagente sale del propio registro `--mode json` (`details.results[].model`), sin transcripciones ni variable equivalente. Confirma y lo delego.
- Pendiente fuera de alcance: `WORKFLOW.md` (líneas 146 y 149) y la nota de `BACKLOG.md` (línea 28) aún dicen «máximo de 6»; se alinean con el `arquitecto` o con F08.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

- task-05 de F07 (constructor): rol requerido `planificador`; motivo: `features/F07-modelo-por-agente/task-03-corrida-claude-code.md` (ya `hecha` y commiteada) tiene 10 líneas en «Pasos» y el formato permite de 1 a 8 (la reescritura de task-03 añadió los pasos 5-9). Salida completa de `rapida.sh` en el scratchpad (`rapida.out`).

## Última actualización

2026-10-30
