# F21 task-05: supuestos del coordinador en Pi (orden de llamadas y `Read` con `limit`)

Corrida con modelo en Pi, 2026-11-01, autorizada por Franco («apruebo», 2026-11-01). Se comprueban dos supuestos de `definitions/CONTEXTO.md` §2.4 y §4 (riesgo 5): (a) Pi ejecuta en el orden indicado varias llamadas de un mismo turno; (b) `Read` con `limit` funciona en el `coordinador`.

## Condiciones de la corrida

- Precondiciones sin modelo: `command -v pi-coordinador` → `/Users/franco/.local/bin/pi-coordinador` (EXIT=0); `grep -c 'limit: 3' agentes/coordinador.md` → `1`.
- Fixture: `bash pruebas/fixtures/coordinador.sh "$T/fx"` con `T=$(mktemp -d)` (fuera del repo).
- Lanzador: `FLUCASTR_PI_TOPE=240 FLUCASTR_RECORD_FILE="$T/reg.jsonl" bash pruebas/lanzar-coordinador-pi.sh "<prompt>"`, desde `$T/fx`. Código de salida 0.
- Prompt literal: «Sin delegar a subagentes: en una sola respuesta, (1) lee las 3 primeras líneas de features/F02-otra/task-01-otra.md; (2) con edit, añade bajo `## Activo` de definitions/STATUS.md la línea `orden-1`; (3) en la misma respuesta, con otro edit, añade debajo de `orden-1` la línea `orden-2`. Responde solo: listo.»
- Modelo reportado por el registro: `gpt-6.1-sol`.
- Invocaciones con modelo: **1** (ninguna segunda; no hubo falla de infraestructura).
- Costo: el registro no trae un total explícito. Sumando `usage.cost.total` de los 4 mensajes con uso: **≈ 0,0199 USD** (dato derivado, orientativo).

## Llamadas de herramienta del registro (en orden)

1. `read {"path":"definitions/STATUS.md","offset":null,"limit":null}`
2. `read {"path":"features/F02-otra/task-01-otra.md","offset":1,"limit":3}`
3. `edit {"path":"definitions/STATUS.md","edits":[{"oldText":"## Activo\n","newText":"## Activo\norden-1\norden-2\n"}]}`

Resultados: los tres `tool_execution_end` tienen `isError=false`.

## Condiciones y veredicto

| Condición | Resultado |
| --- | --- |
| (1) `read` de `task-01-otra.md` con `limit` 3 sin error | Cumple: `limit: 3`, `isError=false`. |
| (2) `STATUS.md` contiene `orden-1` y, en la línea siguiente, `orden-2` | Cumple: `orden-1` seguido de `orden-2` bajo `## Activo`. |
| (3) ninguna llamada `edit` terminó en error | Cumple: `isError=false`. |
| (4) canario 0 veces en registro e informe | Cumple: 0 en el registro; este informe no lo contiene. |

**Veredicto: OK** según las condiciones (1) a (4).

**Salvedad importante.** La Verificación esperaba **dos** llamadas `edit`, en ese orden. Hubo **una sola** (el modelo escribió `orden-1` y `orden-2` en un mismo `edit`). Por eso esta corrida **no ejercita el supuesto (a)**: no prueba que Pi ejecute en orden dos llamadas `edit` de un mismo turno. Solo prueba (b) y que el resultado final es el esperado. Si Franco quiere probar (a), hace falta una corrida nueva, que no se reintenta aquí.

## Limitación

Una corrida no prueba el comportamiento general del `coordinador` en Pi. Pi da `bash` completo al coordinador (opción B de §3.1.1), así que este resultado no demuestra confinamiento. Este informe no edita `agentes/coordinador.md`; si Franco decide quitar la regla de agrupación, lo hace él.
