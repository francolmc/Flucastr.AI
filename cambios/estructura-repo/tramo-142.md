# Tramo 142 — Auditar limpieza y tamaño

## Pasos

### Tramo 142 — Historia: Auditar limpieza y tamaño
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 141 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/decisions/cleanup.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/decisions/cleanup.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A142).
Aceptación A142: Registrar líneas, motivos y comandos de búsqueda; comprobar que copias de compatibilidad se verifican y que no se ha tocado pruebas/.temporales/.
TODO:
- [ ] En `docs/decisions/cleanup.md`, Inventariar duplicados remanentes, archivos mayores de 300 líneas y excepciones por contrato, clasificando archivos con consumidores e históricos. Eliminar ninguno sin demostrar ausencia de consumidores y conservar historial. (A142). Comprobación: Registrar líneas, motivos y comandos de búsqueda; comprobar que copias de compatibilidad se verifican y que no se ha tocado pruebas/.temporales/.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A142). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
