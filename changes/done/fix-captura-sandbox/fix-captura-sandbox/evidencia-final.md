# Evidencia final

## Controles y pruebas focalizadas

- `node tests/spawn-seguro/run.mjs`: host 23 casos pass, `transporte nativo disponible=true`; Codex nested 0.172.0 workspace-write 23 casos pass, `transporte nativo disponible=false`, ruta Python ejercitada; ambos exit 0. Incluye maxBuffer total exacto/+1, overflow continuo con handler SIGTERM, timeout con handler, temp cleanup, stdio mixto, ENOENT Python, y async escalado SIGKILL a 10 s con comprobación de que no sigue escribiendo.
- `node --test tests/kit-run/pegado.test.mjs`: host 10/10; nested 1/1; exit 0.
- Control matriz nested workspace-write: `spawnSyncMediado` con hijo Node capturó stdout `child-ok`, stderr `err-ok`; `/bin/cat` capturó `cat-ok`; exit 0. Control Python preliminar capturó pipes en la misma sandbox.
- `node tests/progress/run.mjs`: tras cambiar el test A2 para conectar sus fd a archivos temporales y conservar las aserciones, 44 casos pass, exit 0.
- `node tests/kit-check/run.mjs`: después de migrar `tools/check/ejecutar.mjs` a `spawnSyncSeguro`, 7 casos pass en host y 7 en nested workspace-write; exit 0.
- `node tests/spawn-seguro/estatico.mjs`: OK 30 llamadas/161 archivos (5 exentas); `git diff --check`: sin salida; exit 0.

## Puertas completas

- Host, primera corrida completa: acceptance 3/3; `./verify` 36 pasos, Fingerprint `7934d49ddc84`, VERIFY OK. Ocurrió antes de las correcciones finales de contrato.
- Host, segunda corrida completa tras correcciones de status/input/validación: acceptance 3/3 (45.041 s); `./verify` 36 pasos, Fingerprint `b05a2e808791`, VERIFY OK. Corrió antes de adaptar los dos consumidores de pipe crudo; el límite de dos corridas host se alcanzó.
- Nested, primera corrida completa: acceptance 3/3 (79.441 s). `./verify` falló paso 15/A2 progress-watch: el test usaba `spawn` raw con stdout/stderr por pipe y veía 0 líneas; se adaptó a fd temporales sin debilitar aserciones; suite enfocada 44/44.
- Nested, segunda corrida completa: acceptance 3/3 (79.648 s). `./verify` falló paso 16/kit-check porque `tools/check/ejecutar.mjs` usaba `spawnSync` raw y el A2 `contiene «listo»` no recibía salida. Se migró a `spawnSyncSeguro`; `tests/kit-check/run.mjs` pasó 7/7 en host y nested.
- En la pausa anterior no se hizo una tercera corrida nested: `AGENTS.md` ordena `./verify` una vez (segundo fallo: pausa) y `execute-plan` limita a dos. La reanudación D-05 permitió validar el árbol corregido; el gate nested final pasó (detalle abajo).

## Reanudación D-05 y gates del árbol final

- Auditoría de `tools/check/cambios.mjs`: Codex nested 0.172.0, `workspace-write`, ejecutó `node tests/kit-scope/run.mjs` (22/22), que importa y usa `cambiosDelRepo`; `node tests/kit-close/run.mjs` 31/31 y `node --test tests/permissions-contract/hook.test.mjs` 1/1; exit 0. No hubo evidencia de pérdida en ese consumidor, por lo que se conservó sin cambios.
- El primer gate nested del árbol anterior pasó acceptance 3/3 y falló verify en el paso 22: cinco tests de compactación usaban `spawnSync` crudo de Node con pipes y dependían de stdout capturado. Se cambiaron únicamente esas cinco llamadas de prueba por `spawnSyncSeguro`; no cambiaron argumentos, opciones ni aserciones. La suite focal pasó host 93/93 y nested 9/9.
- Auditoría de pasos 23–26 en nested: paso 23 (context-size/after-compact) 6/6, paso 25 (permissions-contract) 3/3, paso 26 (evals-builder) 9/9; exit 0 cada uno.
- Paso 24 falló inicialmente solo en `tests/temporales/barrido.test.mjs`, por las dos invocaciones raw `spawnSync` que comprobaban `stderr`; host suite completa 36/36. Se migraron esas llamadas a `spawnSyncSeguro`, manteniendo las aserciones. Suite final paso 24: host 36/36 y nested 3/3.
- Gate host final, ejecutado secuencialmente antes del nested: `$ node --test tests/acceptance/*.test.mjs && ./verify`; acceptance 3/3 (46.333 s), verify 36 pasos, `VERIFY OK`, Fingerprint `4aa124e6b749`, exit 0; duración total aproximada 239 s.
- Gate Codex nested 0.172.0, `workspace-write`, modelo gpt-6-luna, effort high: mismo comando; acceptance 3/3 (82.621 s), verify 36 pasos, `VERIFY OK`, Fingerprint `4aa124e6b749`, exit 0; duración total 371.141 s. Corrió tras finalizar el host, sin concurrencia sobre `pruebas/.temporales/`.
- La detección real deja Node nativo en host y usa Python mediador en Codex nested; matriz Node y `/bin/cat` nested y casos A1–A3 siguen documentados arriba. Python 3.14.4 fue el disponible; macOS, Windows y Python 3.9–3.13 quedan no verificados.

## Límites de plataforma

Linux con Python 3.14.4 y Codex 0.172.0 es el único entorno verificado. macOS y Windows no se probaron; Python 3.9+ es requerido por la ruta mediada. Fuera del sandbox la sonda usa Node nativo; en workspace-write la sonda indicó pérdida y se comprobó el fallback. `tools/check/cambios.mjs` se auditó en D-05 con `tests/kit-scope/run.mjs` nested (22/22); no se reprodujo fallo y no se modificó.
