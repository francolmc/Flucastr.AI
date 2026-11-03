# task-07 — Prueba de punta a punta: `informe.mjs --consumo <dir> --pistas` con lecturas extra
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Se comprueba, con la CLI real y logs sintéticos de Pi y de Claude Code, que el conteo, la promoción (pista 7), la alerta (pista 8) y el cumplimiento (pista 9) salen juntos, y que ni el motivo ni el texto de los mensajes llegan a la salida. Sin código de producto.

## Contexto
- Tocar: `pruebas/comprobaciones/informe-lectura-cli.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-06.
- Modelo a copiar de `pruebas/comprobaciones/informe-pistas.test.mjs`: `raizCon` (línea 128), `correr` (línea 136), `carpetaSesionesPi` (línea 255) y `ev`/`estado` (líneas 14 a 22). Fixtures: `pruebas/comprobaciones/consumo-fixtures.mjs` (`registroSesionPi`, `turnoPi`, `metaSubagentePi`, `transcriptSubagentePi({ lecturas, textoFinal })`, `registroAgentSettingClaude`, `turnoClaude({ texto })`, `resultadoReadClaude`, `registroPromptClaude`, `metaSubagenteClaude`).
- Las corridas de Pi se emparejan por `parentSessionId` con el `id` de la sesión; las de Claude Code viven en `<nombre-de-sesión>/subagents/agent-<id>.meta.json` y `.jsonl` junto a la sesión (`descubrirSesiones`, `consumo.mjs` línea 616).
- Los formatos de log de Pi y Claude Code son inferidos: todos los datos son sintéticos, sin logs reales ni `registro/` real.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- Escenario Pi: sesión `sesion-lectura`; tres corridas de `planificador` (meta con `parentSessionId: 'sesion-lectura'`) cuyos encargos son `Lee: features/F31-a/task-01-b.md\nEvita leer: \`definitions/\`\nDisparó: puerta 3`, ídem con `F32-a/task-01-b.md` y ídem con `F32-a/task-02-b.md`; las tres leen `definitions/WORKFLOW.md` (1024 bytes); solo la primera la declara (`textoFinal`: `Lectura extra: definitions/WORKFLOW.md; motivo=SECRETO-MOTIVO`).
- Esperado del escenario: pista 7 (`planificador lee de más \`definitions/WORKFLOW.md\` en 3 corridas y 2 features`), la pista 8 NO dispara (3 extras en 3 corridas = 1,0 por llamada, no es > 1; la prueba afirma que no aparece `lecturas extra por llamada`), pista 9 (`1 de 3 lecturas extra declaradas (33 %)`).
- Eventos de `registro/eventos.jsonl`: un solo `tarea_estado` válido (como `estado('F32','01','aprobada')` del modelo); con `--minimo 1` el informe es suficiente (`tareas >= minimo`, `informe.mjs` línea 124) y el bloque Consumo sale.
- Tres pruebas: (1) Markdown con las pistas 7 y 9 y la línea `Lectura extra: 3 en 3 corrida(s) · declaradas 1 · cumplimiento 33 %` (bloque Consumo con `--minimo 1`; el valor `--minimo` lo acepta `leerArgumentos`); (2) `--json` con `pistas` que incluye `n: 7` y `n: 9` y ninguna con `n: 8`; (3) no-contenido: ni `SECRETO-MOTIVO` ni `CENTINELA_TEXTO` aparecen en stdout ni stderr de Markdown ni de JSON, y el escenario Claude Code equivalente (una corrida con `Read` declarado) también da `declaradas` 1 en `--json`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el archivo de pruebas nuevo.
Fuera de alcance: cualquier cambio en `scripts/`; si una prueba revela un defecto, la tarea queda `bloqueada` con el motivo (no se arregla aquí).

## Pasos
1. Crea el archivo con helpers copiados y limpieza con `after` (raíces temporales en `os.tmpdir()`, como el modelo).
2. Arma las carpetas de sesiones Pi y Claude Code sintéticas.
3. Escribe las 3 pruebas descritas.
4. Corre la verificación; si una cifra difiere por el redondeo, ajusta la expectativa solo si coincide con la regla de task-05 y anótalo en *Notas*.

## Criterios de aceptación
1. El Markdown contiene las pistas 7 y 9 y la línea de lectura extra del escenario; prueba (1).
2. El JSON trae `pistas` con 7 y 9 y sin 8; prueba (2).
3. El motivo y el centinela no salen por stdout ni stderr; prueba (3).

## Verificación
```
node --test pruebas/comprobaciones/informe-lectura-cli.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 3`, `ℹ pass 3`, `ℹ fail 0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/informe-lectura-cli.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 3
ℹ pass 3
ℹ fail 0
exit 0
```

Nota: la primera pasada de verificación dio `ℹ pass 0`, `ℹ fail 3` (tareas = 0 en la CLI, consumo null); se corrigió con un evento `ejecucion` de la misma tarea (ver Notas). La segunda pasada es la del bloque de arriba. El `exit 0` es el estado de `grep`, que encontró las tres líneas.

## Notas
- Hueco menor: la tarea supone que un solo `tarea_estado` basta para `--minimo 1`, pero `informe.mjs` cuenta `tareas` solo con tareas que tienen un evento `ejecucion` (`conEjec`, línea 122). Se añadió un `ejecucion` de F32/01 (copiado del modelo `informe-pistas.test.mjs`) al `eventos.jsonl` sintético. No se tocó `scripts/`.
- Escenario Pi: `sesion-lectura` con tres corridas de planificador (F31-a/task-01-b, F32-a/task-01-b, F32-a/task-02-b); solo la r1 declara `Lectura extra: definitions/WORKFLOW.md; motivo=SECRETO-MOTIVO`.
- Escenario Claude Code: una corrida de planificador con un `Read` de `/ws/definitions/WORKFLOW.md` (1024 bytes) y la declaración en el turno final; prueba (3).
- Las raíces temporales van con `os.tmpdir()` y se borran con `after`, como el modelo.
- Registro: la tarea no se escribe `hecha`; queda para revisión de Franco.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
