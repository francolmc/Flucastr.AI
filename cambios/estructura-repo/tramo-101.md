# Tramo 101 — Caracterizar medidor de uso (borrador)

## Pasos

### Tramo 101 — Historia: Caracterizar medidor de uso
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 100 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A101).
Aceptación A101: La matriz compara códigos y salidas y verifica que no se consultan sesiones ni credenciales reales. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Ejecutar pruebas de uso con fixtures sintéticos y capturar CLI --help, JSON, texto, filtros, sesiones, tarifas ausentes y opciones inválidas; fijar fecha y normalizar solo temporales. (A101). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-101.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-101.md` y las pruebas negativas afectadas con fixtures aislados (A101). Comprobación: La matriz compara códigos y salidas y verifica que no se consultan sesiones ni credenciales reales.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A101). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
