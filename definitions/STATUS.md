# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 3). task-06 ajustada (`features/F07-modelo-por-agente/task-06-documentar-modelos.md`), a la espera de reaprobación de Franco. F07 `en curso`. task-01 a task-05 `hecha`; task-06 `aprobada` (última de F07).
Rama: feature/F07-modelo-por-agente

## Espera a Franco

- **Commit pendiente (tuyo):** lo que quede sin commitear de task-05 (Evidencia y Notas del reintento).
- **Puerta 3:** reaprueba `features/F07-modelo-por-agente/task-06-documentar-modelos.md` (viñeta ≤ 6 líneas en `pruebas/README.md` que cubre Claude Code y Pi; 3 pasos; verificación con 7 `grep -cF --` y `fail 0`).
- Limitación aceptada de task-05: el extractor de Pi no se repitió con datos reales (el registro de task-04 ya no existe); lo cubren las pruebas con líneas reales copiadas antes.
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
