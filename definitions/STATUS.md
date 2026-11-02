# Estado del flujo

## Escalación

## Paso actual

Modo yolo: terminado — alcance F27 completo; 4 tareas hechas; rama main (sin commit)
task-01: hecha | features/F27-arquitecto-una-pasada/task-01-texto-arquitecto-y-definir.md
task-02: hecha | features/F27-arquitecto-una-pasada/task-02-texto-skills-arquitectura-y-revisar.md
task-03: hecha | features/F27-arquitecto-una-pasada/task-03-control-frases-una-pasada.md
task-04: hecha | features/F27-arquitecto-una-pasada/task-04-script-crecimiento-definiciones.md

## Espera a Franco

- Yolo en main, sin commits: crea `feature/F27-arquitecto-una-pasada`, revisa `git diff scripts/ agentes/ skills/` y commitea. Siguiente: F28 y F29 (piden arquitecto).
- Reinstala (`./instalar.sh`): ~/.claude no tiene aún las reglas de F25 ni F26. Que `*` acepte `--evidencia` es inferido, no probado.
- coordinador.md: 17897 de 17920 bytes (23 libres). Siguiente: F27; F28 y F29 piden al arquitecto.
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
