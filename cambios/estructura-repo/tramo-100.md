# Tramo 100 — Documentar excepción de tamaño del bootstrap (borrador)

## Pasos

### Tramo 100 — Historia: Documentar excepción de tamaño del bootstrap
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 99 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: instalar-remoto.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A100).
Aceptación A100: El comando remoto aislado con una sola copia del bootstrap funciona y el documento explica por qué source externo rompería la entrada. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Conservar el bootstrap autocontenido: se descarga y ejecuta como archivo individual antes de disponer del árbol tools; registrar sus líneas reales y justificar la excepción de 300 líneas. (A100). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-100.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de bootstrap registrada en `cambios/estructura-repo/tramo-99.md` y las pruebas negativas afectadas con fixtures aislados (A100). Comprobación: El comando remoto aislado con una sola copia del bootstrap funciona y el documento explica por qué source externo rompería la entrada.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A100). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
