# Tramo 96 — Caracterizar desinstalación (borrador)

## Pasos

### Tramo 96 — Historia: Caracterizar desinstalación
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 95 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: desinstalar.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A96).
Aceptación A96: La matriz contiene casos positivos y negativos y nunca usa HOME o proyectos reales. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Capturar salidas, códigos y árbol resultante para manifiesto ausente, instalación repo y copia, --simular, --todo, --proyecto, --conservar-ajustes y rutas ajenas; incluir errores y reinstalación. (A96). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-96.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-96.md` y las pruebas negativas afectadas con fixtures aislados (A96). Comprobación: La matriz contiene casos positivos y negativos y nunca usa HOME o proyectos reales.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A96). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
