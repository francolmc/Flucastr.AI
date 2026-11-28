# Inventario de captura en sandbox para P00

## Resultado
La pérdida de stdout/stderr de hijos no se limita al auxiliar síncrono. Con workspace-write un hijo mínimo devuelve salidas vacías tanto con pipes síncronos como asíncronos; con descriptores a archivos devuelve OUT y ERR. La causa de fondo sigue sin verificarse. No se ejecutó `./verify` en esta investigación.

## Fallos y comprobaciones observadas
- Paso 6b: `tests/permissions-v2.test.mjs` falló por stdout vacío de `resolver`; la corrección síncrona del builder hizo pasar esta prueba en sandbox.
- Paso 13: `tools/run/process.mjs` capturaba el builder asíncrono por pipes; 53 casos de `tests/kit-run/run.mjs` pasaron después del cambio del builder.
- Paso 15: `tests/progress/run.mjs` capturaba un vigilante por pipes; 44 casos pasaron tras el cambio del builder.
- Paso 16: `tools/check/ejecutar.mjs:74` usa `spawnSync` con captura; el fixture de `tests/kit-check/run.mjs` falló por stdout vacío. No corregido.
- Paso 22: `codex sandbox -c 'sandbox_mode="workspace-write"' -- node --test tests/compaction/*.test.mjs` salió 1: fallaron 5 de 9 archivos (agents, kit-run, pi, settings y windows). Sus llamadas nativas con pipes son candidatas; no se ha probado la causa individual de cada fallo.
- Paso 24: el mismo sandbox con `node --test tests/temporales/*.test.mjs` salió 1: fallaron barrido y estatico; envoltorio pasó. Fuera del sandbox, `node tests/temporales/estatico.test.mjs` identificó una excepción obsoleta de `tools/run/process.mjs:dir` causada por el cambio actual; hay que revisarla sin debilitar la prueba. Causa exacta del fallo de barrido no verificada.
- Paso 25: `codex sandbox -c 'sandbox_mode="workspace-write"' -- node --test tests/permissions-contract/hook.test.mjs tests/permissions-contract/hook-shell.test.mjs tests/permissions-contract/hook-decision.test.mjs` pasó 3/3 archivos, exit 0. Esto no demuestra que todos los usos de `scripts/permissions-hook.mjs` funcionen en sandbox.

## Otros candidatos por lectura, sin reproducción individual
- `tools/check/cambios.mjs`, `scripts/permissions-hook.mjs`, `core/skills/diagnose/fingerprint.mjs` y `tests/diagnosis-suggests/`: Git con captura mediante pipes. Sus rutas de ejecución y comportamiento requieren comprobarse antes de tocarlas.
- `tools/observe/diagnose.mjs`, `scripts/observe.mjs`: salida asíncrona; el flujo de eventos puede requerir salida en vivo y no es equivalente a capturar un archivo al finalizar. No verificado como bloqueante para P00.
- `tests/temporales/envoltorio.test.mjs`, `tests/permissions-contract/hook.test.mjs` y otras pruebas tienen capturas directas, pero una presencia textual no demuestra fallo. Clasificar según comprobación real y no tocar por inventario solamente.
- El escaneo es textual en `tools/`, `scripts/`, `tests/`, `core/` y `adapters/`; puede omitir alias, wrappers, código generado o ejecuciones indirectas. No es un límite superior garantizado.

## Decisión pendiente
Las opciones para desbloquear P00 son ejecutar las verificaciones finales del builder fuera del sandbox o ampliar la corrección transversal con criterios y límites concretos. En cualquier opción conservar los cinco archivos modificados hasta decidir; no repetir verify con la huella fallida `8ee6d963835d`.
