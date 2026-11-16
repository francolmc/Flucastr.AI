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
- [ ] En `pruebas/aceptacion/uso.test.mjs`, Mover el wrapper a tests/acceptance/uso.test.mjs y dejar en la ruta antigua un import del nuevo; ajustar URL de la suite a ../../pruebas/ conservando cwd raíz y nombre de test. (A121). Comprobación: Ejecutar node --test pruebas/aceptacion/uso.test.mjs y con --test-name-pattern=uso; en copia temporal hacer fallar la suite real y comprobar que el wrapper también falla.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A121). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
