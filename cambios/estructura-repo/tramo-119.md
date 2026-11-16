# Tramo 119 — Trasladar entrada de aceptación contrato-constructor

## Pasos

### Tramo 119 — Historia: Trasladar entrada de aceptación contrato-constructor
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 118 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: pruebas/aceptacion/contrato-constructor.test.mjs, tests/acceptance/contrato-constructor.test.mjs. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: pruebas/aceptacion/contrato-constructor.test.mjs, tests/acceptance/contrato-constructor.test.mjs.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A119).
Aceptación A119: Ejecutar node --test pruebas/aceptacion/contrato-constructor.test.mjs y con --test-name-pattern=contrato-constructor; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
TODO:
- [ ] En `pruebas/aceptacion/contrato-constructor.test.mjs`, Mover el wrapper a tests/acceptance/contrato-constructor.test.mjs y dejar en la ruta antigua un import del nuevo; ajustar URL de la suite a ../../pruebas/ conservando cwd raíz y nombre de test. (A119). Comprobación: Ejecutar node --test pruebas/aceptacion/contrato-constructor.test.mjs y con --test-name-pattern=contrato-constructor; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A119). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
