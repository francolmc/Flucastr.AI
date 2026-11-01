# Estado del flujo

## Escalación

## Paso actual

F20 `hecha` (Franco, 2026-10-31): las 6 tareas `hecha` en `features/F20-medicion-consumo/`. F19 `hecha` (PR #16 fusionado). Rol: ninguno (esperando a Franco, puerta 4). F21 «`coordinador` con menos turnos» `en curso` (Franco: «dale», 2026-10-31). task-01 y task-02: hecha (en `features/F21-coordinador-menos-turnos/`). task-03 `lista para revisión`; 04 y 05 `aprobada`. F21 se construye encima de la rama de F20 (PR de F20 sin fusionar).
Rama: feature/F21-coordinador-menos-turnos
Rama de F20: feature/F20-medicion-consumo (sin PR todavía). Rama de F21 al pasar a `en curso`: la propondré al aprobar sus tareas.

## Espera a Franco

- **Puerta 4, F21 task-03** (`features/F21-coordinador-menos-turnos/task-03-coordinador-delegacion.md`): revisa su evidencia (40 pruebas pasan; `coordinador.md` mide 17 687 bytes, tope 17 920) y `git diff agentes/coordinador.md` (archivo sensible, tope 17 920 bytes). La rama de F21 arrastra los commits de F20: fusiona primero el PR de F20.
- **Task-05 de F21** (corrida con modelo en Pi): antes de delegarla te confirmaré el gasto.
- Feature F20 completa en feature/F20-medicion-consumo: cierra la rama, haz el PR y despliega.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea). Ya corrido hoy: 368 eventos.
- Feature F20 archivable: `node scripts/archivar.mjs --aplicar F20` (lo corre Franco o, si lo pide, tú, después del PR y en su propio commit `chore/`).
- Feature F19 archivable: `node scripts/archivar.mjs --aplicar F19` (igual, en commit `chore/`).
- Pendiente tuyo: la cifra de la task-05 sobre el log de Cleaner (`node scripts/consumo.mjs --raiz ~/.pi/agent/sessions/--Users-franco-Codes-flucastr-Flucastr.Cleaner-- --hasta 2026-11-01T00:48:34.046Z` → ~216 turnos, 26 llamadas, ~US$2.09).
- Pendiente tuyo: texto de `BACKLOG.md`, viñeta «Siguiente (`→`)» de «Base de la prioridad»: el planificador la actualiza en esta descomposición.
- **Tras instalar F19 (tuyo):** abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** el repo ya es público; revisa secretos en el historial (detalle en `definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-31
