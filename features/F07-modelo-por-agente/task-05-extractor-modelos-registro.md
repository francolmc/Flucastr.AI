# task-05 — Extractor de modelos por actor en el registro estructurado
repo: Flucastr.AI   depende_de: task-03, task-04   estado: aprobada

## Descripción
`registro.mjs` devuelve un solo `model` (el del agente principal). Esta tarea añade `modelosPorActor(source, tool)`, que devuelve qué modelo respondió cada actor (principal y subagentes por nombre) según el formato **observado** en task-03 y task-04, para que cualquier corrida futura con modelo pueda comprobar el modelo realmente usado. Se prueba con las líneas reales pegadas en la *Evidencia* de esas tareas, no con formatos inventados.

## Contexto
- Repo único. Leídos: `pruebas/comprobaciones/registro.mjs` (`parseLines`, `claudeEvents`, `piEvents`, `analyzeRecord`, `analyzeRecordFile`) y `pruebas/comprobaciones/registro.test.mjs` (estilo de las pruebas).
- Archivos a tocar: `pruebas/comprobaciones/registro.mjs` (añadir una exportación) y `pruebas/comprobaciones/registro.test.mjs` (añadir pruebas). Comando: `node --test pruebas/comprobaciones/registro.test.mjs`.
- Entradas: *Evidencia* y *Notas* de `features/F07-modelo-por-agente/task-03-corrida-claude-code.md` y `task-04-corrida-pi.md` (el ejecutor las lee antes de empezar). Si alguna dice que el modelo del subagente no es observable en el registro, el extractor de esa herramienta devuelve solo el principal y la prueba lo documenta.

## Decisiones ya tomadas
- Firma: `export function modelosPorActor(source, tool)` → objeto `{ principal: string|null, subagentes: { [nombre]: string[] } }` (lista sin duplicados, en orden de aparición). `tool` es `claude-code` o `pi`; otra herramienta lanza `Error('Herramienta de registro no soportada: …')`, como `analyzeRecord`.
- El nombre del subagente sale del `subagent_type`/`agent` del `tool_use` correspondiente según lo observado; no se adivina.
- No se cambia el resultado de `analyzeRecord` ni de `analyzeRecordFile`; el campo `model` actual sigue igual.
- Las pruebas usan como entrada líneas copiadas de la *Evidencia* (mínimas) y añaden un caso con registro vacío (`principal: null`, `subagentes: {}`) y otro con la herramienta no soportada.

## Alcance / Fuera de alcance
Alcance: la función y sus pruebas.
Fuera de alcance: conectar la función a `pruebas/ejecutar.sh` o a los lanzadores existentes; nuevas corridas con modelo; escenarios B/M/R.

## Pasos
1. Leer las *Evidencia* de task-03 y task-04. Si falta alguna, detenerse con `BLOQUEO: rol=constructor; motivo=task-03 o task-04 sin evidencia`.
2. Implementar `modelosPorActor` en `registro.mjs` reutilizando `parseLines`. Resultado: la función se importa.
3. Añadir las pruebas descritas a `registro.test.mjs`. Resultado: pasan.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Con las líneas reales de Claude Code, `principal` y cada subagente tienen el modelo de la *Evidencia*. Prueba con datos reales.
2. Ídem con las de Pi, o prueba que documenta «subagente no observable».
3. Registro vacío y herramienta no soportada se comportan como se decidió.
4. Las pruebas existentes de `registro.test.mjs` siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/registro.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

## Notas
