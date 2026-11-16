# Tramo 103 — Separar cálculo de tarifas (borrador)

## Pasos

### Tramo 103 — Historia: Separar cálculo de tarifas
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 102 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/rates.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/rates.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A103).
Aceptación A103: Tarifas existentes, ausentes e inválidas producen iguales créditos y avisos. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer cargarTarifas y creditosSesion; mantener la ruta de tarifas predeterminada calculada desde scripts/uso.mjs y pasarla explícitamente. (A103). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-103.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-103.md` y las pruebas negativas afectadas con fixtures aislados (A103). Comprobación: Tarifas existentes, ausentes e inválidas producen iguales créditos y avisos.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A103). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
