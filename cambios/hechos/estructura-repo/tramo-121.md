# Tramo 121 — Trasladar entrada de aceptación uso

## Pasos

### Tramo 121 — Historia: Trasladar entrada de aceptación uso
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 120 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: pruebas/aceptacion/uso.test.mjs, tests/acceptance/uso.test.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: pruebas/aceptacion/uso.test.mjs, tests/acceptance/uso.test.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A121).
Aceptación A121: Ejecutar node --test pruebas/aceptacion/uso.test.mjs y con --test-name-pattern=uso; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
TODO:
- [x] En `pruebas/aceptacion/uso.test.mjs`, Mover el wrapper a tests/acceptance/uso.test.mjs y dejar en la ruta antigua un import del nuevo; ajustar URL de la suite a ../../pruebas/ conservando cwd raíz y nombre de test. (A121). Comprobación: Ejecutar node --test pruebas/aceptacion/uso.test.mjs y con --test-name-pattern=uso; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A121). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1 / A121: creado `tests/acceptance/uso.test.mjs` con el título del test y `cwd` raíz conservados; actualizada la ruta de suite a `../../pruebas/`. La entrada histórica importa la nueva. `node --check` de ambas entradas, `git diff --check`, `node --test pruebas/aceptacion/uso.test.mjs`, el mismo comando con `--test-name-pattern=uso` y `node --test tests/acceptance/uso.test.mjs` pasaron (cada suite 1/1). En copia temporal, con fallo sintético inyectado a la suite real: ejecución directa y wrapper histórico salieron con código 1; el wrapper reportó `flujo uso falló (exit 1)` y preservó `fallo sintético A121`.
- Paso 2 / A121: `timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 45,4 s con código 0. Ejecutó `./verify` y dos simulaciones aisladas; verify coincide salvo el mensaje exacto autorizado del escenario 9 y las simulaciones son repetibles y coinciden con `linea-base/`, con solo esa excepción autorizada.
