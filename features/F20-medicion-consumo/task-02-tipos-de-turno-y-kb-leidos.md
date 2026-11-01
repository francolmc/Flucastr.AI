# task-02 — Tipos de turno y KB leídos por archivo (sesión principal de Pi)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

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
`node --test pruebas/comprobaciones/consumo.test.mjs` (cola de la salida real):
```
✔ tipos de turno (1): subagents_enable (0.251708ms)
✔ tipos de turno (2): delegar (llamada subagent) (0.608042ms)
✔ tipos de turno (3): reescribir_status (write sobre definitions/STATUS.md) (0.356459ms)
✔ tipos de turno (4): cambiar_estado (edit sobre una tarea) (3.840125ms)
✔ tipos de turno (5): leer_tarea (read de una tarea) (0.576333ms)
✔ tipos de turno (6): leer_status_backlog (read de BACKLOG.md) (3.14725ms)
✔ tipos de turno (7): leer_definiciones (read de definitions/ARCHITECTURE.md) (3.886541ms)
✔ tipos de turno (8): texto (turno sin llamadas) (4.915875ms)
✔ tipos de turno (9): otro (bash) (0.131167ms)
✔ tipos de turno (orden): delegar gana a leer_definiciones en el mismo turno (0.077667ms)
✔ lecturas: KB por archivo y por categoría (3072 + 1024 bytes en definitions/, 512 en una tarea) (0.185416ms)
✔ lecturas: dos lecturas de definitions/ARCHITECTURE.md de 3072 y 1024 bytes suman lecturas:2, kb:4 (0.095459ms)
✔ lecturas: un read con isError:true no suma (0.09525ms)
✔ lecturas, control negativo: sin lecturas de definitions/, kbPorCategoria.definiciones es 0 (0.057208ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
Criterios: 1 (9 tipos + orden) pasa; 2 (lecturas 4 KB / 0.5 KB, definiciones 4) pasa; 3 (isError no suma) pasa; 4 (task-01 a, b, c, d, e, f y centinela) pasa; 5 (sin red, modelo ni `~/.pi`: solo funciones puras sobre texto) cumplido por diseño, el módulo no importa nada ni lee archivos.

## Notas
- Hueco menor 1: la prueba (a) fija la forma exacta con `deepEqual`; le añadí los campos nuevos (`tiposDeTurno` con `texto`, y `lecturas` vacío). Sus valores de task-01 no cambian.
- Hueco menor 2: `resultadoPi` (fixtures) acepta un `texto` opcional, con el centinela por defecto. Es el único helper tocado (permitido por la tarea).
- Hueco menor 3: añadí un caso extra de orden (`delegar` gana a `leer_definiciones` en el mismo turno) y un control negativo de lecturas. Los KB se suman en bytes y se redondean una sola vez al final, para que 3072 + 1024 dé 4 exacto.
- Una llamada `read` sin `path` de texto cuenta como ruta `""`: categoría `otros` y tipo `otro`.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
