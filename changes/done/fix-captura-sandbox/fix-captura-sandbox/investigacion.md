# Captura en sandbox: hallazgos

- En Codex CLI 0.172.0 `workspace-write`, `spawnSync` y `spawn` con pipe devuelven stdout vacío y status 0; fuera del sandbox, el mismo control devuelve `child-ok`.
- El hijo creó y escribió un archivo testigo: sí se ejecuta. Con stdout conectado a un fd de archivo se capturó `child-ok`. Es una prueba diagnóstica, no una solución completa.
- `tools/spawn/sync-seguro.mjs` evita pipe en stdin, pero usa pipe en stdout/stderr. Los wrappers de aceptación y el arnés de kit-run lo usan; `tools/run/process.mjs` también usa `spawn` asíncrono con pipe, así que reparar solo el helper síncrono no cubre todo.
- Node termina al hijo cuando rebasa `maxBuffer`; revisar el archivo solo tras la salida no preserva esa semántica y puede llenar disco. Es necesaria una estrategia acotada con supervisión durante la ejecución o una solución upstream, con pruebas de compatibilidad.
- OpenAI tiene reportes públicos similares: https://github.com/openai/codex/issues/18473 y https://github.com/openai/codex/issues/50642. Node: https://nodejs.org/api/child_process.html.
- En Claude, `acceptEdits` aprueba ediciones, no todos los comandos Bash: https://code.claude.com/docs/en/permissions. La sesión no interactiva denegó ejecuciones `node` que pedían aprobación. El hook del proyecto denegó borrar `changes/fix-captura-sandbox/probe.mjs` como acción protegida. No se debe intentar saltar estos controles.
- Propuesta: corregir upstream o diseñar un supervisor acotado que use archivos para stdout/stderr y detenga al proceso al alcanzar los límites; probar synchronous y asynchronous, timeout, señales, encoding, stdio explícito, limpieza y aceptación entera dentro de Codex. Antes de implementarlo revisar la compatibilidad real y el alcance del plan aprobado; la solución definitiva del sandbox de Codex no se ha verificado.
- Control adicional en Codex sandbox: Python `subprocess.run(..., stdout=PIPE, stderr=PIPE)` lanzando Node con `process.stdout.write`/`process.stderr.write` devolvió `child-ok`, `err-ok` y exit 0. Es una alternativa prometedora basada en pipes reales, no un arreglo implementado ni una prueba de `maxBuffer`, señales o propagación de errores; añadir dependencia Python requeriría decisión explícita y comprobación multiplataforma.

## Reanudación autorizada
Control `python3 changes/fix-captura-sandbox/control-python.py`: fuera del sandbox y en `codex exec --sandbox workspace-write -m gpt-6-luna -c model_reasoning_effort=high --ephemeral`, exit 0, stdout del control `{status: 0, stdout: child-ok, stderr: err-ok}`. Python captura pipes reales del hijo Node. No demuestra todavía maxBuffer ni señales. Alternativas descartadas por ahora: archivo directo no supervisa bytes; sondeo deja crecimiento sin límite entre lecturas; worker Node no cambia el transporte afectado; supervisor compilado exige toolchain y distribución adicional. Se elige evaluar Python incremental con archivos acotados solo para transporte de resultados (D-04).

## Control independiente de la implementación

El planner ejecutó `node changes/fix-captura-sandbox/control-matriz.mjs` fuera del sandbox (exit 0) y dentro de `codex exec --sandbox workspace-write -m gpt-6-luna -c model_reasoning_effort=high --ephemeral` (sesión 01a2206d-3928-7143-a889-ebfbcd135eab, exit 0). El script invoca explícitamente `spawnSyncMediado`, sin depender de detección automática. En ambos entornos:

```json
{"name":"node","status":0,"signal":null,"stdout":"child-ok","stderr":"err-ok"}
{"name":"cat","status":0,"signal":null,"stdout":"cat-ok","stderr":""}
```

Comprueba Node escribiendo ambos flujos y `/bin/cat` recibiendo input no vacío, con timeout de 5000 ms. No sustituye suite focalizada, aceptación ni verify.

Fuentes primarias para contrastar contrato: [Node child_process](https://nodejs.org/api/child_process.html), [Python subprocess](https://docs.python.org/3/library/subprocess.html). Se comprobó además Node local v24.22.1: maxBuffer 1024 permite exactamente 1024 bytes, falla con 1025; stdout700 + stderr700 también falla ENOBUFS, por límite agregado síncrono. Python local 3.14.4.
