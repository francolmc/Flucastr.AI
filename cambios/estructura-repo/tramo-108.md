# Tramo 108 — Caracterizar observador (borrador)

## Pasos

### Tramo 108 — Historia: Caracterizar observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 107 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A108).
Aceptación A108: La matriz compara códigos, salida y efectos sin levantar servicios reales ni consultar sesiones personales. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Cubrir iniciar, estado, detener, informe, datos faltantes y errores con fixtures de Docker y HOME temporal; registrar procesos iniciados y asegurar su cierre. (A108). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-108.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-108.md` y las pruebas negativas afectadas con fixtures aislados (A108). Comprobación: La matriz compara códigos, salida y efectos sin levantar servicios reales ni consultar sesiones personales.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A108). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
