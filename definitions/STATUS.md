# Estado del flujo

## Escalación

## Paso actual

F21 `hecha` (Franco, 2026-11-01; PR y merge a cargo de Franco). F19 y F20 `hecha`. Rol: planificador, `descomponer-feature` de F22 «Lectura acotada de planificador, constructor y arquitecto» (mueve la marca `→` de F21 a F22). Siguiente: puerta 3 (tareas de F22 en `borrador`).
Rama de F22 al pasar a `en curso`: la propondré al aprobar sus tareas.

## Espera a Franco

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
