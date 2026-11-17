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
- [x] En `tests/README.md`, Crear mapa de cada suite vigente en pruebas/, su comando, fixtures y motivo para conservar su ruta; enlazar los tres wrappers nuevos. No copiar el fixture auth.json. (A122). Comprobación: Ejecutar node --test pruebas/aceptacion/*.test.mjs y comprobar que se descubren los tres flujos, sin duplicar ejecución.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A122). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `tests/README.md` cataloga las suites vigentes, comandos, datos de prueba y razones para conservar las rutas bajo `pruebas/`; enlaza los tres flujos en `tests/acceptance/` y describe `pruebas/aceptacion/` como entradas de compatibilidad. No se copió ningún fixture. `$ node --test pruebas/aceptacion/*.test.mjs`: se descubrieron exactamente los flujos `contrato-constructor`, `kit-run` y `uso`; `tests 3`, `pass 3`, `fail 0`, `exit 0`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en aproximadamente 46,4 s, `exit 0`. El runner aislado comparó código, salida y efectos de `./verify` y dos ejecuciones de `bash ./instalar.sh --simular`: verify coincide salvo el mensaje exacto autorizado del escenario 9; las simulaciones son repetibles y coinciden con la línea base, aplicando solo esa excepción.
