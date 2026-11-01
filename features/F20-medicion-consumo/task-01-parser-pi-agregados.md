# task-01 — Parser de sesión de Pi: turnos, costo y tramos de contexto
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
Primera pieza de `scripts/consumo.mjs` (F20, solo lectura sobre logs): una función pura que, dada la sesión principal de Pi (texto `.jsonl`), devuelve los agregados del `coordinador`: turnos, costo, tokens y costo por tramo de contexto (<30k, 30–60k, >60k), llamadas por herramienta, llamadas a subagentes y `subagents_enable`. Incluye el generador de logs sintéticos que usarán las pruebas de las tareas siguientes (sin modelo ni red).

## Contexto
Formato leído en una sesión real de Pi (`~/.pi/agent/sessions/--Users-franco-Codes-flucastr-Flucastr.Cleaner--/<ts>_<id>.jsonl`; confirmado, solo campos): una línea JSON por registro. Primer registro `{type:"session", id, cwd, timestamp}`. Los turnos son registros `{type:"message", timestamp:"<ISO>", message:{role:"assistant", model, content:[...], usage:{input, output, cacheRead, cacheWrite, totalTokens, cost:{total}}}}`. `content` mezcla elementos `{type:"text"}`, `{type:"thinking"}` y `{type:"toolCall", id, name, arguments:{...}}`. Nombres de herramienta vistos: `read`, `write`, `edit`, `grep`, `bash`, `subagent`, `subagents_enable`, `subagent_supervisor`. Hay además registros `model_change`, `compaction`, `custom_message`, que se ignoran.
- Leer para el estilo: `scripts/archivar.mjs` (encabezado de uso, `export` de funciones puras, `RUTA_ESTE`, ejecución solo si es el script principal) y `pruebas/comprobaciones/archivar.test.mjs` (`node:test`, `assert/strict`, raíces temporales con `fs.mkdtempSync(path.join(os.tmpdir(), ...))`).
- Tocar: `scripts/consumo.mjs` (nuevo), `pruebas/comprobaciones/consumo-fixtures.mjs` (nuevo), `pruebas/comprobaciones/consumo.test.mjs` (nuevo). `pruebas/rapida.sh` ya incluye todo `pruebas/comprobaciones/*.test.mjs`.
- Node v25.8.1 (verificado con `node --version`); solo módulos `node:*`.

## Decisiones ya tomadas
- Módulo ESM con encabezado de uso como `archivar.mjs`. Esta tarea exporta `analizarSesionPi(texto, { hasta } = {})`; no hay CLI todavía (`consumo.mjs` no hace nada al ejecutarse directo en esta tarea).
- Un turno = un registro `message` con `role:"assistant"`. `hasta` (ISO, opcional) descarta los registros con `timestamp` posterior (comparación con `Date.parse`).
- Contexto de un turno = `usage.input + usage.cacheRead + usage.cacheWrite`. Tramos: `menos30k` (<30000), `de30a60k` (30000–60000), `mas60k` (>60000).
- Resultado (nombres fijos): `{ herramienta:"pi", turnos, costo, tokens:{input,output,cacheRead,cacheWrite}, tramos:{menos30k:{turnos,costo}, de30a60k:{turnos,costo}, mas60k:{turnos,costo}}, herramientas:{<nombre>:n}, llamadasSubagente, subagentsEnable }`. `llamadasSubagente` = llamadas `toolCall` con `name:"subagent"`; `subagentsEnable` = las de `name:"subagents_enable"`.
- Línea no JSON: se ignora sin fallar.
- El generador de fixtures exporta `registroSesionPi({id, cwd})`, `turnoPi({ts, model, contexto, output, costo, llamadas:[{id,name,arguments}], texto})` y `resultadoPi({ts, id, name, texto, error})`, y `unirJsonl(registros)`; con `contexto` reparte `input`/`cacheRead` y arma `usage` completo. El texto de mensajes que pone el generador es siempre un centinela (`CENTINELA_TEXTO`, exportado) para que task-05 pruebe que no sale.

## Alcance / Fuera de alcance
Alcance: función pura de agregados de Pi y su generador de fixtures.
Fuera de alcance: clasificación de turnos por tipo, KB leídos (task-02); subagentes (task-03); Claude Code (task-04); CLI e informe (task-05); documentación (task-06). No se lee ningún log real en las pruebas.

## Pasos
1. Crear `pruebas/comprobaciones/consumo-fixtures.mjs` con `CENTINELA_TEXTO`, `registroSesionPi`, `turnoPi`, `resultadoPi`, `unirJsonl` (formas de Contexto).
2. Crear `scripts/consumo.mjs` con el encabezado y `analizarSesionPi` según Decisiones.
3. Crear `pruebas/comprobaciones/consumo.test.mjs` con: (a) 3 turnos (20k, 45k, 70k de contexto; costos 0.01/0.02/0.03) → `turnos:3`, `costo` 0.06, un turno por tramo; (b) límites 29999/30000/60000/60001 caen en el tramo esperado; (c) 2 `subagent` + 1 `subagents_enable` + 1 `read` → conteos exactos; (d) `hasta` entre el turno 2 y el 3 deja `turnos:2`; (e) línea corrupta y registros `compaction` no alteran el resultado; (f) control negativo: un fixture con costo distinto da un `costo` distinto (la prueba falla si la función devolviera una constante).
4. Correr las pruebas.

## Criterios de aceptación
1. `analizarSesionPi` devuelve la forma exacta de Decisiones (se comprueba con `assert.deepEqual` en la prueba (a)).
2. Los límites de tramo se respetan (prueba (b)).
3. `hasta` corta por `timestamp` (prueba (d)).
4. Registros ajenos o corruptos no alteran el resultado (prueba (e)).
5. Las pruebas pasan sin red ni modelo y no leen `~/.pi`.

## Verificación
`node --test pruebas/comprobaciones/consumo.test.mjs` → todas las pruebas `pass`, `fail 0`.
`node --check scripts/consumo.mjs` → sin salida, código 0.

## Evidencia
```
$ node --test pruebas/comprobaciones/consumo.test.mjs   (exit 0)
✔ (a) tres turnos: forma exacta, costo total y un turno por tramo
✔ (b) límites de tramo: 29999 y 30000 / 60000 y 60001
✔ (c) conteos de herramientas, subagent y subagents_enable
✔ (d) hasta corta por timestamp: entre el turno 2 y el 3 deja dos turnos
✔ (e) líneas corruptas, compaction y resultados de herramientas no alteran el resultado
✔ (f) control negativo: otro costo produce otro costo agregado
✔ el texto de los mensajes no aparece en el resultado
ℹ tests 7
ℹ pass 7
ℹ fail 0

$ node --check scripts/consumo.mjs   (exit 0, sin salida)
```
Criterios: 1 (deepEqual en (a)) cumple; 2 (b) cumple; 3 (d) cumple; 4 (e) cumple; 5: las pruebas no leen archivos ni red (solo fixtures en memoria).

## Notas
- Hueco menor 1: `turnoPi` y `resultadoPi` no aceptan `texto`; el texto siempre es `CENTINELA_TEXTO`, como exige la tarea. Decisión conservadora.
- Hueco menor 2: `costo` se redondea a 1e-10 al sumar, para evitar ruido de coma flotante (la prueba (a) compara `0.06`).
- `hasta` se aplica a cualquier registro con `timestamp`, no solo a turnos.
- Creada la rama `feature/F20-medicion-consumo` con `git switch -c` (no existía); el working tree con cambios ajenos quedó sin tocar y sin commit.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
