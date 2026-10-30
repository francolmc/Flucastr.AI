# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). task-01 `lista para revisión` (`features/F07-modelo-por-agente/task-01-tope-features-pendientes.md`); task-02 `aprobada`, espera a que task-01 sea `hecha`. F07 `en curso`, rama `feature/F07-modelo-por-agente` (sin commit). Las tareas se renumeraron a task-01…task-06 (bloqueo por numeración resuelto). La nueva task-01 (tope de features pendientes) y task-02 (modelos instalados) están `bloqueada` con su trabajo ya hecho; task-03 a task-06 siguen `aprobada`.
Rama: feature/F07-modelo-por-agente

## Espera a Franco

- **Puerta 4:** revisa la Evidencia de `features/F07-modelo-por-agente/task-01-tope-features-pendientes.md` (`rapida.sh`: 149 pass, 0 fail), haz el commit en `feature/F07-modelo-por-agente` y pásala a `hecha`. Luego ejecuto task-02.
- Pendiente fuera de alcance: `WORKFLOW.md` (líneas 146 y 149), la nota de `BACKLOG.md` (línea 28) y este archivo aún dicen «máximo de 6»; se alinean con el `arquitecto` o con F08.

- **Confirmación necesaria:** volver a `aprobada` las dos tareas `bloqueada` para reintentarlas, en este orden, en `features/F07-modelo-por-agente/`:
  - `task-01-tope-features-pendientes.md` (sin dependencias; su código ya está hecho, falta que `rapida.sh` quede verde con la numeración corregida)
  - `task-02-modelos-instalados.md` (depende de task-01)
- **Reaprobación pedida:** el renombrado cambió los nombres de las 6 tareas (contenido igual, salvo numeración); revísalas si quieres: task-03-corrida-claude-code, task-04-corrida-pi, task-05-extractor-modelos-registro, task-06-documentar-modelos.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- Las tareas de corrida (task-03, task-04) usan modelo real; en Pi el modelo del subagente podría no aparecer en el registro.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
