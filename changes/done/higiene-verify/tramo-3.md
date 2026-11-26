# Tramo 3

## Steps

### Segment 3 — Story: verify limpio y breve
As agente que ejecuta verify I want un resumen corto so that la salida no llene mi contexto.
Dependencies: Segment 2 — `tools/verify/envoltorio.sh`.
Contracts to keep: última línea `VERIFY OK` en verde; código de salida; línea `resultado registrado: Fingerprint: <hex>`; la línea `FALLO:` del paso visible en rojo.
Paths likely to change: `tools/verify/envoltorio.sh`.
Concrete example of the expected result: verde: `verify: 34 pasos; detalle en pruebas/.temporales/verify.log` y `VERIFY OK`.
Scope: `tools/verify/envoltorio.sh`.
Files: tools/verify/envoltorio.sh
WHEN verify pasa THEN imprime como máximo 5 líneas y guarda el detalle en el log (A4)
WHEN verify falla THEN muestra solo la cola del paso que falló y la ruta del log (A5)
Acceptance:
- A4: en verde, stdout y stderr suman ≤ 5 líneas, la última de stdout es `VERIFY OK`, y `pruebas/.temporales/verify.log` tiene toda la salida del cuerpo; check with `node --test tests/temporales/envoltorio.test.mjs`; expect exit 0.
- A5: en rojo se ve el encabezado del paso fallido y su cola (≤ 40 líneas y ≤ 4096 bytes), nada de pasos anteriores, y `VERIFY FALLO: paso <id> (exit <n>); detalle en <log>`; sin pasos, cola del log; check with la misma prueba; expect exit 0.
TODO:
- [x] Añadir casos de verde en `tests/temporales/envoltorio.test.mjs` (A4). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect fallan.
- [x] En `tools/verify/envoltorio.sh`, enviar la salida del cuerpo al log e imprimir el resumen verde (A4). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect pasan A4.
- [x] Añadir casos de rojo (paso largo, línea larga, falla sin paso) en `tests/temporales/envoltorio.test.mjs` (A5). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect fallan.
- [x] En `tools/verify/envoltorio.sh`, imprimir encabezado, cola acotada y línea final (A5). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect exit 0.
Segment verification: `node --test tests/temporales/envoltorio.test.mjs` — level 1; exit 0; covers A4, A5.
Handoff: encabezado de paso: `^== [0-9]+[a-z]*\. ` (formato de `paso`). El resumen no lleva fechas, duraciones ni rutas aleatorias: `kit run` compara fallas por texto (`claveFalloVerificacion`) y clasifica con las últimas 40 líneas. El log se trunca al iniciar y no se borra al salir.
