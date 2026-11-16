# Tramo 99 — Caracterizar bootstrap remoto (borrador)

## Pasos

Casos y capturas obligatorios: [matrices de caracterización](matrices.md).

### Tramo 99 — Historia: Caracterizar bootstrap remoto
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 98 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: instalar-remoto.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A99).
Aceptación A99: La matriz distingue cada rechazo y comprueba el estado anterior tras fallar. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Cubrir offline FLUCASTR_ORIGEN: urls, estado, instalación, actualización, sha inválido, tar ilegible, ruta absoluta, .. y enlaces; comparar mensajes, códigos, efectos y recuperación. (A99). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-99.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-99.md` y las pruebas negativas afectadas con fixtures aislados (A99). Comprobación: La matriz distingue cada rechazo y comprueba el estado anterior tras fallar.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A99). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
