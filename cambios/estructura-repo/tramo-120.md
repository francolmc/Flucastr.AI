# Tramo 120 — Trasladar entrada de aceptación kit-run

## Pasos

### Tramo 120 — Historia: Trasladar entrada de aceptación kit-run
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 119 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: pruebas/aceptacion/kit-run.test.mjs, tests/acceptance/kit-run.test.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: pruebas/aceptacion/kit-run.test.mjs, tests/acceptance/kit-run.test.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A120).
Aceptación A120: Ejecutar node --test pruebas/aceptacion/kit-run.test.mjs y con --test-name-pattern=kit-run; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
TODO:
- [x] En `pruebas/aceptacion/kit-run.test.mjs`, Mover el wrapper a tests/acceptance/kit-run.test.mjs y dejar en la ruta antigua un import del nuevo; ajustar URL de la suite a ../../pruebas/ conservando cwd raíz y nombre de test. (A120). Comprobación: Ejecutar node --test pruebas/aceptacion/kit-run.test.mjs y con --test-name-pattern=kit-run; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A120). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Paso 1: `node --test pruebas/aceptacion/kit-run.test.mjs` pasó 1/1 (`exit 0`); `node --test --test-name-pattern=kit-run pruebas/aceptacion/kit-run.test.mjs` pasó 1/1 (`exit 0`); `node --test tests/acceptance/kit-run.test.mjs` pasó 1/1 (`exit 0`). En copia temporal aislada se inyectó un fallo en el cierre de la suite real: ejecución directa y wrapper histórico terminaron `exit 1`; el wrapper reportó `flujo kit-run falló (exit 1)` y conservó `fallo sintético A120`. La copia incluyó dependencias de scripts/tools/adapters, modelos y agentes/skills; no accedió a áreas excluidas.
Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 47.3 s, `exit 0`; salida: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.` El runner aislado comprobó códigos, salidas y efectos de `./verify` y dos `bash ./instalar.sh --simular` frente a la línea base.
