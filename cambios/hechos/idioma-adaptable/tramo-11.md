# Tramo 11 — Informes históricos

## Pasos

### Tramo 11 — Historia: informes históricos sin datos identificativos

Como persona que consulta la historia del proyecto quiero que los informes conserven sus datos pero no identifiquen a la persona anterior ni sus proyectos para que el kit sea reutilizable.

Dependencias: Tramos 9 y 10, para mantener consistencia de seudónimos.

Contratos a conservar: cifras, fechas, estructura y sentido de los informes; las rutas pueden conservarse si no identifican a un proyecto.

Rutas susceptibles de cambio: los archivos indicados conservan su ubicación salvo nombre identificativo; cualquier renombre se registra y sus enlaces se corrigen en el tramo 13.

Ejemplo concreto del resultado esperado: el mismo proyecto usa el mismo seudónimo en los tres informes y sus cifras permanecen intactas.

Alcance: los tres informes históricos listados y enlaces o pruebas que los consuman.

Archivos: old/v1/reporte.txt, old/v1/reporte_finanzas.txt, old/v1/reporte_memoria.txt

CUANDO se leen los informes ENTONCES su información no identifica a la persona ni sus proyectos y conserva cifras y cronología (A11).

Aceptación:
- A11: inspección comparativa de cada informe y referencias; esperar seudónimos coherentes, cifras y fechas intactas, enlaces válidos y `./verify` exitoso.

TODO:
- [x] Anonimizar `old/v1/reporte.txt` (A11). Comprobación: comparar estructura, cifras y fechas; esperar conservación.
- [x] Anonimizar `old/v1/reporte_finanzas.txt` (A11). Comprobación: comparar estructura, cifras y fechas; esperar conservación.
- [x] Anonimizar `old/v1/reporte_memoria.txt` (A11). Comprobación: comparar estructura, cifras y fechas; esperar conservación.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A11.

Handoff: anotar rutas identificativas que requieran cambio y tratarlas con sus enlaces en el tramo 13.

## Evidencia

- `reporte.txt`: comparación automatizada de secuencia de cifras y cantidad de líneas original; ambas coinciden. Se añadió una línea que indica la anonimización.
- `reporte_finanzas.txt`: secuencia de cifras y cantidad de líneas originales conservadas; se añadió una línea informativa.
- `reporte_memoria.txt`: secuencia de cifras y cantidad de líneas originales conservadas; se añadió una línea informativa.
- `$ git diff --check`: sin salida, exit 0. Contador de pendientes del tramo: 0.
- `$ ./verify`: salida final `kit-run: 24 casos pasaron` y `VERIFY OK`, exit 0. La autoprueba offline OpenSpec se omite por ausencia de su carpeta, como documenta el proyecto.

## Notas

- Se usan `usuario`, `organizacion` y seudónimos diferenciados `Proyecto.Kit`, `Proyecto.Limpieza`, `Proyecto.Finanzas` y `Proyecto.Memoria`, preservando el sufijo de versión. Las rutas de informes con abreviaturas identificativas y sus referencias se dejan al tramo 13.
- Punto de control: tres informes modificados, sin renombrar; cifras y líneas originales conservadas con una nota adicional por archivo. Referencias existentes localizadas en `docs/decisions/cleanup.md` y `old/v1/definitions/`; actualizar junto con los nombres en el tramo 13. Verificación completa exitosa. Pendiente revisión independiente en contexto nuevo.
