# Tramo 111 — Separar diagnóstico del observador (borrador)

## Pasos

### Tramo 111 — Historia: Separar diagnóstico del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 110 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/diagnose.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/diagnose.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A111).
Aceptación A111: Los fixtures positivos y negativos producen igual diagnóstico y no ejecutan comandos reales externos. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer cmd, debeDiagnosticar y diagnosticar sin alterar argumentos ni efectos; inyectar ruta original cuando corresponda. (A111). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-111.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-111.md` y las pruebas negativas afectadas con fixtures aislados (A111). Comprobación: Los fixtures positivos y negativos producen igual diagnóstico y no ejecutan comandos reales externos.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A111). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
