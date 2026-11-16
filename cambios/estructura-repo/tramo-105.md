# Tramo 105 — Separar procesamiento de Pi (borrador)

## Pasos

### Tramo 105 — Historia: Separar procesamiento de Pi
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 104 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/pi.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/pi.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A105).
Aceptación A105: Comparar filas, sesiones, mensajes y errores de fixtures Pi con la matriz. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer procesarPi y dependencias compartidas mediante imports explícitos, sin cambiar selección ni agregación de eventos. (A105). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-105.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-105.md` y las pruebas negativas afectadas con fixtures aislados (A105). Comprobación: Comparar filas, sesiones, mensajes y errores de fixtures Pi con la matriz.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A105). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
