# Tramo 106 — Separar procesamiento de Codex (borrador)

## Pasos

### Tramo 106 — Historia: Separar procesamiento de Codex
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 105 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/codex.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/codex.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A106).
Aceptación A106: Comparar filas, sesiones, cuota, advertencias y la prueba negativa auth con la matriz. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer procesarCodex y dependencias compartidas mediante imports explícitos; preservar el acceso exclusivo a sessions/ y no leer credenciales. (A106). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-106.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-106.md` y las pruebas negativas afectadas con fixtures aislados (A106). Comprobación: Comparar filas, sesiones, cuota, advertencias y la prueba negativa auth con la matriz.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A106). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
