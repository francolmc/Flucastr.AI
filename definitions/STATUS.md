# Estado del flujo

## Escalación

## Paso actual

F19 `hecha` (Franco, 2026-10-31; PR #16 ya fusionado en `main`, `da1c075`). Backlog con F20–F23 aprobado (puerta 2). Rol: ninguno (esperando a Franco, puerta 4). F20 «Medición de consumo desde logs» `en curso`. task-01 `lista para revisión`; 02 a 06 `aprobada`, en cadena por `depende_de:`.
Rama: feature/F20-medicion-consumo
Sin commits de agentes: los cambios de contexto (CONTEXTO, PENDIENTES, WORKFLOW, ARCHITECTURE, AGENTS.md, BACKLOG, STATUS) están sin commitear en `main`.

## Espera a Franco

- **Puerta 4, F20 task-01:** revisa la evidencia (7 pruebas pasan según el constructor) y `scripts/consumo.mjs` (`git status`; la tarea toca `scripts/`) de `features/F20-medicion-consumo/task-01-parser-pi-agregados.md` y commitea. Ojo: el constructor crea la rama desde `main` con los cambios de definiciones aún sin commitear; al commitear separa por archivo (definiciones de contexto aparte de `scripts/`).
- **Texto de `BACKLOG.md` sin actualizar:** la viñeta «Siguiente (`→`)» de «Base de la prioridad» aún dice F19. Pide al planificador que la corrija (no la edito yo).
- **Rama:** estás en `main` con cambios sin commitear. Antes de commitear, crea rama (`chore/` para la definición de contexto) o confirma que commiteas en `main`.
- **Revisa y commitea:** `definitions/CONTEXTO.md`, `definitions/PENDIENTES.md`, `definitions/WORKFLOW.md`, `definitions/ARCHITECTURE.md`, `definitions/BACKLOG.md`, `AGENTS.md`.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F19 archivable: `node scripts/archivar.mjs --aplicar F19` (lo corre Franco o, si lo pide, tú, en su propio commit `chore/`).
- **Tras instalar F19 (tuyo):** abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** el repo ya es público; revisa secretos en el historial (detalle en `definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-31
