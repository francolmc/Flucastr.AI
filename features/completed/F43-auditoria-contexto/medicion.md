# Medición de contexto por fuente y rol (F43, task-01)

Fuente: `node scripts/contexto-fuentes.mjs --raiz ~/.claude/projects/-Users-franco-Codes-flucastr-Flucastr-AI`, corrida sobre los logs reales de Claude Code (29 sesiones).

## Tabla

| fuente | KB único | veces leída | KB totales | rol |
|---|---:|---:|---:|---|
| agentes/constructor.md | 2.8 | 311 | 861.3 | constructor |
| agentes/planificador.md | 3.5 | 128 | 447 | planificador |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/BACKLOG.md | 8.9 | 34 | 303.1 | planificador |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/WORKFLOW.md | 17.9 | 13 | 232.5 | arquitecto |
| /Users/franco/Codes/flucastr/Flucastr.AI/agentes/coordinador.md | 6.6 | 32 | 212 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/WORKFLOW.md | 27.7 | 6 | 166.2 | constructor |
| agentes/arquitecto.md | 3.5 | 46 | 161 | arquitecto |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/BACKLOG.md | 4 | 36 | 142.6 | coordinador |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/ARCHITECTURE.md | 10.5 | 13 | 136.3 | arquitecto |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/STATUS.md | 2 | 56 | 112.4 | coordinador |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/PROJECT.md | 12.2 | 8 | 97.6 | arquitecto |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/CONTEXTO.md | 15.8 | 6 | 95 | planificador |
| /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/comprobaciones/contrato-roles.test.mjs | 8.3 | 11 | 91.5 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/BACKLOG.md | 11.2 | 7 | 78.6 | desconocido |
| /Users/franco/Codes/flucastr/Flucastr.AI/README.md | 4.3 | 18 | 77.3 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/comprobaciones/contrato-roles.mjs | 7 | 11 | 76.7 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/WORKFLOW.md | 24.4 | 3 | 73.2 | planificador |
| agentes/coordinador.md | 7 | 10 | 69.9 | coordinador |
| /Users/franco/Codes/flucastr/Flucastr.AI/scripts/consumo.mjs | 4.7 | 14 | 65.6 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/scripts/registrar.mjs | 4.5 | 13 | 58.8 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/features/F12-coordinador-ejecuta-scripts/task-05-prueba-modelo-claude-code.md | 14 | 4 | 55.8 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/scripts/resolver.mjs | 3.3 | 17 | 55.3 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/features/F07-modelo-por-agente/task-03-corrida-claude-code.md | 18.2 | 3 | 54.7 | planificador |
| /Users/franco/Codes/flucastr/Flucastr.AI/definitions/ARCHITECTURE.md | 47.6 | 1 | 47.6 | coordinador |
| /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/capa1/registrar.test.mjs | 6.7 | 7 | 47 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/agentes/coordinador.md | 11.7 | 4 | 46.8 | arquitecto |
| /Users/franco/Codes/flucastr/Flucastr.AI/scripts/archivar.mjs | 5.8 | 8 | 46.4 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/comprobaciones/consumo.test.mjs | 4 | 11 | 43.8 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/scripts/formato-tarea.mjs | 4 | 11 | 43.5 | constructor |
| /Users/franco/Codes/flucastr/Flucastr.AI/instalar.sh | 4.1 | 10 | 41.4 | constructor |
… 624 filas más (ver --json)

Top 10
1. agentes/constructor.md (constructor): 861.3 KB totales, 311 veces
2. agentes/planificador.md (planificador): 447 KB totales, 128 veces
3. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/BACKLOG.md (planificador): 303.1 KB totales, 34 veces
4. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/WORKFLOW.md (arquitecto): 232.5 KB totales, 13 veces
5. /Users/franco/Codes/flucastr/Flucastr.AI/agentes/coordinador.md (constructor): 212 KB totales, 32 veces
6. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/WORKFLOW.md (constructor): 166.2 KB totales, 6 veces
7. agentes/arquitecto.md (arquitecto): 161 KB totales, 46 veces
8. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/BACKLOG.md (coordinador): 142.6 KB totales, 36 veces
9. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/ARCHITECTURE.md (arquitecto): 136.3 KB totales, 13 veces
10. /Users/franco/Codes/flucastr/Flucastr.AI/definitions/STATUS.md (coordinador): 112.4 KB totales, 56 veces

## Notas

- Límite: las llamadas `Skill` de Claude Code no aparecen como lecturas; las skills cargadas por Claude no se miden (`n/d`).
- Unidad: KB (1 decimal), no bytes, porque `consumo.mjs` ya entrega KB.
- La salida de texto cabe en 4096 bytes: muestra 34 de 658 filas; la tabla completa sale con `--json`.
- Roles tal como vienen en el log: `desconocido` (sesión principal sin rol identificable), `coordinador`, `arquitecto`, `constructor`, `planificador`.
- La fila `agentes/<rol>.md` mide el tamaño actual del archivo en el repo, no el que tenía en cada corrida.
- La columna «¿su prompt dice que la necesita?» no se incluye (task-02).
