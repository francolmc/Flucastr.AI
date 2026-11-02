# Estado del flujo

## Escalación

## Paso actual

Modo yolo: terminado — alcance F24 completo; 7 tareas hechas; rama feature/F24-puerta-previa-tarea (sin commit)
task-01: hecha | features/F24-puerta-previa-tarea/task-01-chequeos-nuevos.md
task-02: hecha | features/F24-puerta-previa-tarea/task-02-nucleo-en-scripts.md
task-03: hecha | features/F24-puerta-previa-tarea/task-03-validar-tarea-cli.md (Esperado «6» obsoleto; real 7)
task-04: hecha | features/F24-puerta-previa-tarea/task-04-raiz-del-kit.md
task-05: hecha | features/F24-puerta-previa-tarea/task-05-permiso-coordinador.md
task-06: hecha | features/F24-puerta-previa-tarea/task-06-prueba-real-permiso.md (B no aísla el permiso)
task-07: hecha | features/F24-puerta-previa-tarea/task-07-reglas-puerta-previa.md

## Espera a Franco

- Yolo sin commits: revisa `git diff scripts/` y commitea scripts/, pruebas/, instalar.sh, desinstalar.sh, agentes/, features/F24-*/, BACKLOG.md.
- Aparte: WORKFLOW.md (31298 car., tope 30720) causa 6 fallos de higiene-contexto; y §3.1 sin `validar-tarea`. Siguiente: F25.
- Riesgo: Claude Code puede rechazar el permiso Bash con `$(cat …)` (task-05). Rápida ya falla 8 pruebas antes de F24.
- Registro de eventos corrido por Franco (437 eventos). Siguiente opcional: `node scripts/informe.mjs`.
- F11 archivada (`--aplicar`, a pedido tuyo): sin commit; commitea en un `chore/`.
- Corrige la nota de `BACKLOG.md` línea 39 (revisa que no diga F23 `pendiente`).
- ARCHITECTURE.md: la subsección «Raíz del kit…» aún dice «borrador por aprobar»; pide al arquitecto quitarlo o edítalo tú.
- Pendiente tuyo: WORKFLOW.md §3.1 no lista `validar-tarea` entre los comandos del coordinador; pide al arquitecto sumarlo o edítalo.
- Coordinador en nivel bajo desde 19:53 (1-nov). F29 requiere al arquitecto antes de descomponer.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Pendiente tuyo: abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** repo público; revisa secretos en el historial (`definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-11-01
