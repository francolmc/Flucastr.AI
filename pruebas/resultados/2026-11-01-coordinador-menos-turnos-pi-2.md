# F21 task-05 (segunda corrida): orden de dos `edit` dependientes del `coordinador` en Pi

Corrida con modelo en Pi, 2026-11-01, autorizada por Franco para esta segunda corrida (una sola invocación con modelo). Se comprueba solo el supuesto (a) de `definitions/CONTEXTO.md` §2.4 y §4 (riesgo 5): Pi ejecuta en el orden indicado varias llamadas de un mismo turno. El supuesto (b) no se prueba aquí. Este informe no sobrescribe el de la primera corrida (`pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md`).

## Condiciones de la corrida

- Precondición sin modelo: `command -v pi-coordinador` → `/Users/franco/.local/bin/pi-coordinador` (EXIT=0).
- Fixture: `bash pruebas/fixtures/coordinador.sh "$T/fx"` con `T=$(mktemp -d)` (fuera del repo). `STATUS.md` inicial: `# Estado`, `## Activo`, `## Historial`.
- Lanzador: `FLUCASTR_PI_TOPE=240 FLUCASTR_RECORD_FILE="$T/reg.jsonl" bash pruebas/lanzar-coordinador-pi.sh "<prompt>"`, desde `$T/fx`. Código de salida 0.
- Prompt literal: «Sin delegar a subagentes y sin leer ningún archivo: en una sola respuesta, emite dos llamadas edit seguidas sobre definitions/STATUS.md, sin responder entre ellas. Primer edit: oldText `## Activo`, newText `## Activo` + salto de línea + `marca-1`. Segundo edit: oldText `marca-1` + salto de línea + línea vacía + `## Historial`, newText ese mismo texto + salto de línea + `marca-2`. No las unas en un solo edit; el segundo depende de que el primero ya se haya aplicado. Responde solo: listo.»
- Modelo reportado por el registro: `gpt-6.1-sol` (proveedor `openai`).
- Invocaciones con modelo: **1** (ninguna segunda; no hubo falla de infraestructura).
- Costo: el registro no trae total explícito. Sumando `usage.cost.total` de los 3 mensajes del asistente con uso: **≈ 0,0328 USD** (dato derivado, orientativo).

## Llamadas de herramienta del registro (en orden)

1. `edit {"path":"definitions/STATUS.md","edits":[{"oldText":"## Activo","newText":"## Activo\nmarca-1"}]}` (inicio y fin, `isError=false`), en el mensaje del asistente del turno 1.
2. `edit {"path":"definitions/STATUS.md","edits":[{"oldText":"marca-1\n\n## Historial","newText":"marca-1\n\n## Historial\nmarca-2"}]}` (inicio y fin, `isError=false`), en el mensaje del asistente del turno 2.

Estado final de `definitions/STATUS.md`: `marca-1` bajo `## Activo` y `marca-2` bajo `## Historial`.

## Condiciones y veredicto

| Condición | Resultado |
| --- | --- |
| (1) hay exactamente dos `edit` sobre `definitions/STATUS.md`, inicio del primero antes del inicio del segundo | Cumple en el registro. |
| (2) ambos `edit` con `isError=false` | Cumple. |
| (3) archivo final con `marca-1` bajo `## Activo` y `marca-2` bajo `## Historial` | Cumple. |
| (4) los dos `edit` salen en un mismo turno del modelo (condición de NO CONCLUYENTE: «en turnos separados») | **No cumple**: cada `edit` va en un mensaje del asistente distinto (turno 1 y turno 2, con `stopReason=toolUse` en cada uno). |
| (5) valor canario del `.env` del fixture 0 veces en registro e informe | Cumple: 0 en el registro; 0 en este informe. |

**Veredicto: NO CONCLUYENTE.**

Razón: el archivo final y el orden de ejecución son correctos (condiciones 1 a 3), pero la tarea pedía comprobar que Pi ejecuta en orden dos llamadas de **un mismo turno**. El modelo emitió el segundo `edit` en un turno aparte, después de ver el resultado del primero. Según la definición de la tarea, eso es NO CONCLUYENTE, no PROBADO. Esta corrida no demuestra el supuesto (a). Según la misma definición, no se repite la corrida.

Nota para Franco: las condiciones 1 a 3 leídas por separado cumplen el texto de PROBADO. Lo que impide PROBADO es la condición 4. Si quiere tratar el resultado de otra forma, es su decisión; aquí se informa tal cual.

## Limitación

Una corrida no prueba el comportamiento general del `coordinador` en Pi. Pi da `bash` completo al coordinador (opción B de §3.1.1), así que este resultado no demuestra confinamiento. Este informe no edita `agentes/coordinador.md`.
