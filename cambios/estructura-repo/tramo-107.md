# Tramo 107 — Separar formato de informe de uso (borrador)

## Pasos

### Tramo 107 — Historia: Separar formato de informe de uso
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 106 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/report.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/report.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A107).
Aceptación A107: Comparar byte por byte informes de texto y JSON de la matriz. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer tabla, imprimirSesiones e imprimirTexto, pasando explícitamente constantes requeridas y manteniendo orden y espacios. (A107). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-107.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-107.md` y las pruebas negativas afectadas con fixtures aislados (A107). Comprobación: Comparar byte por byte informes de texto y JSON de la matriz.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A107). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
