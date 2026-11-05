# task-07 — Corrección: fixture del planificador sin ambigüedad y motivo en el informe con 0 tareas
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Las dos corridas reales de task-10 dieron `Veredicto: FALLA; Tareas: 0` sin explicar por qué. Diagnóstico con evidencia (registro de la corrida de Claude Code, `pruebas/.temporales/planificador-claude-code-20101/registro.jsonl`, sin gastar créditos): el planificador no falló al escribir; respondió `REFINAR: feature=F01; preguntas=4` y no creó tareas, porque la feature del fixture («Medir el tiempo de cada comando en los cinco módulos de `src/` y mostrarlo con `--tiempos`») es ambigua: en `src/` no hay «comandos» ni CLI, y `PROJECT.md`/`BACKLOG.md` no lo resuelven (`descomponer-feature`, paso 0, y el modo yolo piden `REFINAR`). En Pi el último turno quedó esperando aprobación, con el mismo origen probable (*inferido*; el registro de Pi no tiene respuesta final de texto). Esta tarea (1) quita la ambigüedad del fixture, sin tocar prompts, skills ni topes, y (2) hace que el informe muestre la respuesta del planificador cuando hay 0 tareas.

## Contexto
- Tocar: `pruebas/fixtures/planificador.sh`, `pruebas/correr-planificador.sh`, `pruebas/correr-planificador.test.mjs`
- Leer: `pruebas/fixtures/planificador.sh`, `pruebas/correr-planificador.sh`, `pruebas/correr-planificador.test.mjs@1-25`, `pruebas/correr-planificador.test.mjs@60-140`
- Patrón: la prueba (b) de `correr-planificador.test.mjs` (modelo simulado `falso`) y se usa `node` (no `jq`) para leer el registro.
- De `depende_de:` lee solo las *Notas* de task-06.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Fixture: `planificador.sh` añade a `definitions/PROJECT.md` una sección `## Decisiones de alcance` con: un «comando» es cada módulo `src/a.js` … `src/e.js` (cinco); `--tiempos` es una opción de un único punto de entrada nuevo `src/cli.js`, que ejecuta el módulo pedido y escribe `<módulo>: <ms> ms` en la salida estándar; las pruebas van con `node --test` en `pruebas/`; no hay más alcance (sin persistencia ni otros formatos). La fila F01 del `BACKLOG.md` añade en «Por qué en esta posición»: «Alcance resuelto en PROJECT.md (Decisiones de alcance).» El texto de la feature no cambia, y sigue sin existir `features/F01-demo`.
- Informe: tras escribir el informe, si `Tareas: 0`, `correr-planificador.sh` le añade al final la sección `Respuesta del planificador:` con hasta 1500 caracteres del texto final del registro (`$base/registro.jsonl`). Claude Code: el campo `result` del evento `"type":"result"`. Pi: los bloques `type:"text"` del último mensaje `assistant` del evento `agent_end`. Si no se puede extraer, escribe `(sin texto final; registro: <ruta del registro>)`. Con tareas no añade nada.
- No se tocan `planificador-resultado.mjs`, el lanzador, prompts, skills ni topes. Si el planificador sigue respondiendo `REFINAR`, el informe lo mostrará y Franco decide en task-10.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la sección en el fixture, la sección del informe con 0 tareas, y 2 pruebas nuevas: (d) modelo simulado que responde `REFINAR: feature=F01; preguntas=1` sin crear tareas: el informe da `FALLA` y contiene `Respuesta del planificador:` y `REFINAR: feature=F01`; (e) el fixture contiene `Decisiones de alcance` y `src/cli.js` en `PROJECT.md`. Control negativo: la prueba (a) existente comprueba además que, con tareas, el informe no contiene `Respuesta del planificador:`.
Fuera de alcance: corridas reales (task-10), editar el comprobador, el lanzador, agentes o skills, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Añade la sección y la nota de BACKLOG al fixture en `planificador.sh`.
3. Añade en `correr-planificador.sh` la sección `Respuesta del planificador:` cuando `Tareas: 0`.
4. Añade las pruebas (d) y (e) y la aserción de control negativo en (a).
5. Corre la verificación y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. Con modelo simulado que responde `REFINAR` y no crea tareas, el informe contiene `Respuesta del planificador:` y el texto `REFINAR: feature=F01` (prueba d).
2. Con tareas el informe no contiene `Respuesta del planificador:` (control negativo, prueba a).
3. El `PROJECT.md` del fixture contiene `Decisiones de alcance` y `src/cli.js` (prueba e).
4. `node --test pruebas/correr-planificador.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs` termina con `fail 0`.

## Verificación
```
git branch --show-current
bash -n pruebas/fixtures/planificador.sh pruebas/correr-planificador.sh
node --test pruebas/correr-planificador.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; sin salida; `fail 0`.

## Evidencia

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
```

```
$ bash -n pruebas/fixtures/planificador.sh pruebas/correr-planificador.sh
(sin salida)
exit 0
```

```
$ node --test pruebas/correr-planificador.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs
✔ (a) dos tareas válidas dentro de los topes dan OK, con cifras por tarea (422.716709ms)
✔ (b) control negativo: cinco archivos en «Leer» dan FALLA (419.227917ms)
✔ (c) control negativo: siete pasos dan FALLA (456.444917ms)
✔ (d) control negativo: tarea sin «Leer» da FALLA (379.953667ms)
✔ (e) control negativo: un archivo modificado fuera de features/ da FALLA (512.356083ms)
✔ (f) el fixture deja BACKLOG válido, en la rama feature/F01-demo y con bash -n sin salida (293.08225ms)
✔ (a) tareas dentro de los topes con modelo simulado dan Veredicto: OK (660.236542ms)
✔ (b) una tarea con cinco archivos a leer (control negativo) da Veredicto: FALLA (727.95ms)
✔ (c) herramienta inválida sale 2 con uso y sin informe (12.242417ms)
✔ (d) modelo que responde REFINAR sin crear tareas: el informe da FALLA y muestra la respuesta (826.293875ms)
✔ (e) el fixture trae Decisiones de alcance con src/cli.js en PROJECT.md (258.234916ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2653.32625
exit 0
```

Criterios: 1 y 2 cubiertos por (d) y por la aserción de control negativo en (a), ambas en verde. 3 cubierto por (e), en verde. 4: `fail 0` en la pasada final (`tests 11`, `pass 11`).

## Notas
- Huecos menores resueltos:
  1. Extracción de `Respuesta del planificador:` para Pi: se implementó según *Decisiones ya tomadas* (último evento `agent_end`, bloques `type:"text"` del último `assistant`). No hay prueba con Pi ni se leyó un registro de Pi con texto final, así que queda sin verificar hasta task-10.
  2. El extractor vive en `correr-planificador.sh` como heredoc leído con `read -d ''` y se ejecuta con `node --input-type=module -e`. Si node falla, el informe usa `(sin texto final; registro: <ruta>)`.
- La verificación se corrió completa una vez. Después se repitió `node --test` una vez para capturar el código de salida real; no hubo cambios de código entre pasadas. La salida de la *Evidencia* es la de esa repetición.
- Sin tocar: `planificador-resultado.mjs`, el lanzador, prompts, skills, topes ni `STATUS.md`. Sin corridas con modelo real. Rama no cambiada (`feature/F42-tareas-acotadas-topes`). Sin commit, push, PR ni merge.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
