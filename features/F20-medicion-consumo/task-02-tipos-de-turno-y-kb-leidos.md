# task-02 — Tipos de turno y KB leídos por archivo (sesión principal de Pi)
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
Amplía `analizarSesionPi` con las dos métricas que explican el costo del `coordinador`: cuántos turnos (y cuánto costo) gasta en cada tipo de acción, y cuántos KB lee por archivo (lo que devuelve cada `read`), con total por categoría (definiciones, tareas, otros). Permite comprobar luego «0 KB de `definitions/`» (`definitions/CONTEXTO.md` §5).

## Contexto
- Leer `scripts/consumo.mjs` y `pruebas/comprobaciones/consumo-fixtures.mjs` (task-01).
- Formato de Pi (confirmado): el turno trae `toolCall {id, name, arguments}`; el resultado es otro registro `{type:"message", message:{role:"toolResult", toolCallId, toolName, isError, content:[{type:"text", text}]}}` y `toolCallId` coincide con el `id` del `toolCall` (191 de 191 en una sesión real). `read` usa `arguments.path` (más `offset`/`limit`, que pueden ser `null`); `write` usa `path` y `content`; `edit` usa `path`.
- Rutas vistas: relativas (`definitions/STATUS.md`) o absolutas. Tareas: `features/Fxx-nombre/task-NN-nombre.md`.
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo.test.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs` (solo si falta algún helper).

## Decisiones ya tomadas
- Tipo de turno = primera coincidencia en este orden, mirando todas las llamadas del turno: `subagents_enable` (llamada a esa herramienta); `delegar` (llamada `subagent`); `reescribir_status` (`write` o `edit` sobre una ruta que termina en `definitions/STATUS.md`); `cambiar_estado` (`edit` sobre una ruta que cumple `/task-\d{2}-[^/]*\.md$/`); `leer_tarea` (`read` de esa misma forma de ruta); `leer_status_backlog` (`read` de ruta que termina en `definitions/STATUS.md` o `definitions/BACKLOG.md`); `leer_definiciones` (`read` de ruta que contiene `definitions/`); `texto` (turno sin llamadas); `otro` (el resto).
- Nuevo campo `tiposDeTurno: { <tipo>: { turnos, costo } }` (solo tipos con al menos un turno).
- KB leídos: bytes de `content[].text` unidos del `toolResult` de cada `read` (con `Buffer.byteLength`), asociado por `toolCallId`; se ignoran los resultados con `isError:true`. Nuevo campo `lecturas: { porArchivo: { <ruta>: { lecturas, kb } }, kbTotal, kbPorCategoria: { definiciones, tareas, otros } }`. `kb` = bytes/1024 con 1 decimal (`Math.round(x*10)/10`).
- Categoría: `definiciones` si la ruta contiene `definitions/`; `tareas` si cumple la forma de tarea de arriba; `otros` el resto. La ruta se guarda tal como aparece en el log.
- Solo cuenta la herramienta `read`; lo que se lea con `bash` (`cat`) queda fuera y se declara en la ayuda del informe (task-05).

## Alcance / Fuera de alcance
Alcance: `tiposDeTurno` y `lecturas` para la sesión principal.
Fuera de alcance: lecturas de subagentes (task-03); distinguir tareas `hecha` o `borrador` (no sale del log); CLI e informe; Claude Code.

## Pasos
1. En `scripts/consumo.mjs`, agregar la clasificación de turnos y `tiposDeTurno` a `analizarSesionPi`.
2. Agregar el emparejado `toolCall`↔`toolResult` y `lecturas`.
3. En `consumo.test.mjs`, agregar: un caso por cada tipo de turno (9 tipos) con `turnos:1`; una sesión con dos `read` de `definitions/ARCHITECTURE.md` (3072 y 1024 bytes) y uno de una tarea (512 bytes) → `porArchivo` con `lecturas:2, kb:4` y `kbPorCategoria.definiciones` 4, `tareas` 0.5; un `read` con `isError:true` no suma; control negativo: sin ninguna lectura de `definitions/`, `kbPorCategoria.definiciones` es 0.
4. Correr las pruebas.

## Criterios de aceptación
1. Cada tipo de turno se clasifica según el orden de Decisiones (9 casos).
2. `lecturas` suma KB por archivo y categoría con los valores de Pasos 3.
3. Resultados con error no suman.
4. Las pruebas de task-01 siguen pasando.
5. Sin red, modelo ni lectura de `~/.pi`.

## Verificación
`node --test pruebas/comprobaciones/consumo.test.mjs` → `fail 0`.

## Evidencia
(lo llena el constructor; solo la cola relevante, ≤1,5 KB)

## Notas
(lo llena el constructor)
