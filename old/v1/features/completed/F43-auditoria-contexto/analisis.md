# analisis

Fuente: `medicion.md` (task-01): tabla y Top 10. Prompts revisados con `grep -n` sobre `agentes/<rol>.md` (no se leyeron completos). Cifras en KB, tal como salen de la medición; ningún dato `n/d`.

## Top 10

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

## Repetidas

Criterio: `veces` ≥2 o presente en ≥2 roles. Todas las filas del Top 10 cumplen `veces` ≥2. Agrupado por archivo (la ruta relativa y la absoluta se suman como el mismo archivo):

- definitions/BACKLOG.md: 3 roles (planificador 303.1 KB/34; coordinador 142.6 KB/36; desconocido 78.6 KB/7). Total 524.3 KB.
- definitions/WORKFLOW.md: 3 roles (arquitecto 232.5 KB/13; constructor 166.2 KB/6; planificador 73.2 KB/3). Total 471.9 KB.
- agentes/coordinador.md: 3 roles (constructor 212 KB/32, ruta absoluta; coordinador 69.9 KB/10 y arquitecto 46.8 KB/4, ruta relativa). Total 328.7 KB.
- definitions/ARCHITECTURE.md: 2 roles (arquitecto 136.3 KB/13; coordinador 47.6 KB/1, ruta absoluta). Total 183.9 KB.
- agentes/constructor.md, agentes/planificador.md, agentes/arquitecto.md, definitions/STATUS.md: un solo rol cada uno; repetidas dentro de su rol (311, 128, 46 y 56 veces).

Límite: solo se ven las 34 filas de `medicion.md`; las demás están en `--json`, no se re-midió.

## No pedidas por el prompt

Grep usado por fila (rol del lanzamiento como prompt de referencia):

| # | fuente | rol | ¿su prompt la pide? | grep | resultado |
|---|---|---|---|---|---|
| 1 | agentes/constructor.md | constructor | no | `grep -n 'agentes/constructor.md\|agentes/' agentes/constructor.md` | sin coincidencias (es el propio prompt, cargado por el harness) |
| 2 | agentes/planificador.md | planificador | no | `grep -n 'agentes/planificador.md\|agentes/' agentes/planificador.md` | sin coincidencias |
| 3 | definitions/BACKLOG.md | planificador | sí | `grep -n 'BACKLOG\|definitions/' agentes/planificador.md` | `BACKLOG` en líneas 20, 45, 50; `definitions/` también en 3, 51, 56 |
| 4 | definitions/WORKFLOW.md | arquitecto | sí (solo carpeta) | `grep -n 'WORKFLOW\|definitions/' agentes/arquitecto.md` | sin `WORKFLOW`; `definitions/` en líneas 23, 42, 48 (escribir, no leer) |
| 5 | agentes/coordinador.md | constructor | no | `grep -n 'agentes/coordinador.md\|agentes/' agentes/constructor.md` | sin coincidencias |
| 6 | definitions/WORKFLOW.md | constructor | sí (solo carpeta) | `grep -n 'WORKFLOW\|definitions/' agentes/constructor.md` | línea 45, solo como prohibición («No lees `definitions/`») |
| 7 | agentes/arquitecto.md | arquitecto | no | `grep -n 'agentes/arquitecto.md\|agentes/' agentes/arquitecto.md` | sin coincidencias |
| 8 | definitions/BACKLOG.md | coordinador | sí | `grep -n 'BACKLOG\|definitions/' agentes/coordinador.md` | `BACKLOG` en líneas 17, 25, 28, 49 |
| 9 | definitions/ARCHITECTURE.md | arquitecto | sí | `grep -n 'ARCHITECTURE' agentes/arquitecto.md` | líneas 32, 42, 52 |
| 10 | definitions/STATUS.md | coordinador | sí | `grep -n 'STATUS\|definitions/' agentes/coordinador.md` | `STATUS` en líneas 17, 25, 28, 32, 45, 46, 52, 59, 60, 62, 74, 76, 78 |

No pedidas (no): filas 1, 2, 5 y 7. Filas 4 y 6 solo mencionan la carpeta, no el archivo; se cuentan como «sí» por el criterio de carpeta, pero el prompt de `constructor` (fila 6) la menciona como prohibición.

## Candidatos

- definitions/BACKLOG.md: 524.3 KB totales; roles planificador, coordinador y desconocido. Pesa más que cualquier otra fuente repetida entre roles.
- definitions/WORKFLOW.md: 471.9 KB totales; roles arquitecto, constructor y planificador. Lo repiten los tres roles que lo leen.
- agentes/coordinador.md: 328.7 KB totales; roles constructor, coordinador y arquitecto. Es el prompt del coordinador leído por otros roles.

Descartadas por el criterio «se repiten entre roles»: agentes/constructor.md (861.3 KB, un solo rol) y agentes/planificador.md (447 KB, un solo rol).
