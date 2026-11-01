# Estado del flujo

## Escalación

## Paso actual

F22 `en curso`; tareas 01–04 `aprobada` (Franco, 2026-11-01).
task-01: hecha (Franco, 2026-11-01).
task-02: hecha (Franco, 2026-11-01).
task-03: hecha (Franco, 2026-11-01).
task-04: lista para revisión | features/F22-lectura-acotada-roles/task-04-pruebas-contrato-lectura.md
Rama: feature/F22-lectura-acotada-roles

## Espera a Franco

- **Puerta 4 (task-04):** revisa *Evidencia* y *Notas* de la tarea y `git diff pruebas/comprobaciones/`; commitea y pásala a `hecha`. Luego confirma F22 como `hecha`.

- `BACKLOG.md` línea 39 (nota «Siguiente (`→`)») aún dice F21; actualízala (el planificador no pudo).

- Feature F21 completa en feature/F21-coordinador-menos-turnos: cierra la rama, haz el PR y despliega. Antes de F22, corre `bash instalar.sh` para que Pi use el prompt nuevo del coordinador.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- F19, F20 y F21 archivadas (a pedido de Franco): cambios sin commit; revisa y commitea todo junto en un `chore/`.
- Pendiente tuyo: cifra de la task-05 de F20 sobre el log de Cleaner: `node scripts/consumo.mjs --raiz ~/.pi/agent/sessions/--Users-franco-Codes-flucastr-Flucastr.Cleaner-- --hasta 2026-11-01T00:48:34.046Z` (~216 turnos, 26 llamadas, ~US$2.09).
- Pendiente tuyo: tras instalar F19, abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** el repo ya es público; revisa secretos en el historial (detalle en `definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-11-01
