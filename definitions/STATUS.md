# Estado del flujo

## Escalación

## Paso actual

Modo yolo: terminado — alcance F25 completo; 3 tareas hechas; rama main (sin commit)
task-01: hecha | features/F25-evidencia-comprobable/task-01-nucleo-evidencia.md
task-02: hecha | features/F25-evidencia-comprobable/task-02-cli-evidencia.md
task-03: hecha | features/F25-evidencia-comprobable/task-03-reglas-coordinador-constructor.md

## Espera a Franco

- Yolo en main, sin commits: crea `feature/F25-evidencia-comprobable`, revisa `git diff scripts/ agentes/ skills/` y commitea.
- Reinstala (`./instalar.sh`) para que ~/.claude tenga la regla nueva. Que `*` acepte `--evidencia` es inferido, no probado.
- coordinador.md: 17887 de 17920 bytes (33 libres). Siguiente: F26.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F24 archivable: `node scripts/archivar.mjs --aplicar F24` (lo corre Franco o, si lo pide, tú, tras el PR, en commit `chore/`).
- Tuyo: quita «borrador por aprobar» de ARCHITECTURE.md («Raíz del kit…») y suma `validar-tarea` a WORKFLOW.md §3.1 (o pídelo al arquitecto).
- Aparte: WORKFLOW.md mide 31298 car. (tope 30720): causa 6 fallos de higiene-contexto. F29 requiere al arquitecto.
- Corrige la nota de `BACKLOG.md` línea 39 (revisa que no diga F23 `pendiente`).
- Pendiente tuyo: abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** repo público; revisa secretos en el historial (`definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-11-01
