# Estado del flujo

## Escalación

## Paso actual

Modo yolo: terminado — alcance F29 completo; 6 tareas hechas en features/F29-control-de-consumo/; rama main (sin commit)
F28 y F29 sin commit (último commit F27: a5fd477). Backlog: F24-F29 hechas.
Tamaños: coordinador 6977 B (era 17897), planificador 3581, constructor 2945, arquitecto 3581; skills: modo-yolo, ramas-feature, comandos-coordinador, control-consumo.

## Espera a Franco

- Sin commits, en main: crea una rama (F28+F29), revisa `git diff scripts/ agentes/ skills/` y commitea.
- Reinstala (`./instalar.sh`): ~/.claude no tiene aún las reglas de F25-F29.
- Mide: `node scripts/consumo.mjs --raiz …Cleaner--` en una sesión nueva; metas en CONTRATOS.md §6 y CONSUMO.md.
- Puerta 1 (definitions/): enlazar y aprobar CONTRATOS.md y CONSUMO.md; WORKFLOW.md §9.3 a puntero de `modo-yolo`, §6 `Fuente:`, §3.1, §4.
- Puerta 1: quitar «borrador por aprobar» en ARCHITECTURE.md; escapar las barras `|` de la fila F26 del BACKLOG (baja un fallo).
- Features F24-F29 archivables: `node scripts/archivar.mjs --aplicar Fxx` (a pedido tuyo, en commit `chore/`).
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Pendiente tuyo: abre un Pi nuevo y confirma que compacta al pasar de ~100 k.
- **Urgente (tuyo):** repo público; revisa secretos en el historial (`definitions/PENDIENTES.md`).

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-11-02
