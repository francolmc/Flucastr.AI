# Tramo 122 — Catalogar pruebas y fixtures

## Pasos

### Tramo 122 — Historia: Catalogar pruebas y fixtures
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 121 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: tests/README.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: tests/README.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A122).
Aceptación A122: Ejecutar node --test pruebas/aceptacion/*.test.mjs y comprobar que se descubren los tres flujos, sin duplicar ejecución.
TODO:
- [ ] En `tests/README.md`, Crear mapa de cada suite vigente en pruebas/, su comando, fixtures y motivo para conservar su ruta; enlazar los tres wrappers nuevos. No copiar el fixture auth.json. (A122). Comprobación: Ejecutar node --test pruebas/aceptacion/*.test.mjs y comprobar que se descubren los tres flujos, sin duplicar ejecución.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A122). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
