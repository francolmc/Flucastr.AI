# Tramo 104 — Separar procesamiento de Claude (borrador)

## Pasos

### Tramo 104 — Historia: Separar procesamiento de Claude
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 103 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/claude.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/claude.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A104).
Aceptación A104: Comparar filas, sesiones, mensajes y errores de fixtures Claude con la matriz. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer procesarClaude y sus dependencias compartidas mediante imports explícitos, manteniendo el orden y los argumentos; no alterar los formatos. (A104). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-104.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-104.md` y las pruebas negativas afectadas con fixtures aislados (A104). Comprobación: Comparar filas, sesiones, mensajes y errores de fixtures Claude con la matriz.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A104). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
