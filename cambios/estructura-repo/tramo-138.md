# Tramo 138 — Documentar decisiones de estructura

## Pasos

### Tramo 138 — Historia: Documentar decisiones de estructura
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 137 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/decisions/structure.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/decisions/structure.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A138).
Aceptación A138: Comprobar que cada ruta mencionada existe o está indicada expresamente como histórica o propuesta.
TODO:
- [ ] En `docs/decisions/structure.md`, Describir estructura implementada, copias regulares y sus verificaciones, rutas heredadas, límite de 300 líneas y excepciones justificadas, y no traslado de históricos. (A138). Comprobación: Comprobar que cada ruta mencionada existe o está indicada expresamente como histórica o propuesta.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A138). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
