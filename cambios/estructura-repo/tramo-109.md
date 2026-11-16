# Tramo 109 — Separar informe del observador (borrador)

## Pasos

### Tramo 109 — Historia: Separar informe del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 108 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/report.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/report.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A109).
Aceptación A109: Los informes de fixtures comparan iguales byte por byte. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer informe y auxiliares puros requeridos; pasar dependencias explícitas y conservar formato, orden y tratamiento de datos faltantes. (A109). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-109.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-109.md` y las pruebas negativas afectadas con fixtures aislados (A109). Comprobación: Los informes de fixtures comparan iguales byte por byte.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A109). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
