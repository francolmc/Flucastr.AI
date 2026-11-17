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
- [x] Ejecutar pruebas de uso con fixtures sintéticos y capturar CLI --help, JSON, texto, filtros, sesiones, tarifas ausentes y opciones inválidas; fijar fecha y normalizar solo temporales. (A101). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-101.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-101.md` y las pruebas negativas afectadas con fixtures aislados (A101). Comprobación: La matriz compara códigos y salidas y verifica que no se consultan sesiones ni credenciales reales.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A101). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- `$ node pruebas/uso/probar.mjs`: `exit 0`, 19/19 pruebas. Todas las rutas de datos apuntan a `pruebas/uso/fixtures/` o a temporales creados por la propia suite; fecha fijada con `--desde 2026-01-01`, sin normalizar contenido. Se comprobaron salidas JSON y texto, filtros por herramienta/proyecto, `--sesiones` para las tres herramientas, cuotas, tarifas ausentes/ilegibles, y opciones inválidas (códigos 1 y 2). A5 confirma que el marcador secreto sintético no aparece en stdout/stderr; no se consultaron carpetas de sesiones ni credenciales reales.
- `$ node scripts/uso.mjs --help`: `exit 0`; imprimió uso y opciones y terminó antes de leer carpetas de sesiones. Matriz A101: A1, A2, A3, A4a–d, A5, A6, A6b, A3s, A8, A7, A2v, A5a–c, A5d y A4i, todas `ok`; salida resumida `pruebas del medidor: 19 de 19 ok`. La suite compara filas JSON esperadas, estructura/campos de tablas en texto y códigos/mensajes negativos. Sin normalizaciones aparte de temporales.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en 52.2 s. En aislamiento del tramo 1, `./verify` coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; dos ejecuciones de `bash ./instalar.sh --simular` son repetibles y coinciden con la línea base. Runner preserva y compara códigos, salidas y efectos.
