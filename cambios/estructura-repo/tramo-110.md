# Tramo 110 — Separar ciclo del observador (borrador)

## Pasos

### Tramo 110 — Historia: Separar ciclo del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 109 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/process.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/process.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A110).
Aceptación A110: Iniciar, consultar y detener en HOME temporal conservan códigos, archivos, PID y limpieza. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer pidDe, vivo, arrancar, parar y estado, pasando la ruta original del entrypoint como argumento para conservar el proceso hijo y SELF. (A110). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-110.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-110.md` y las pruebas negativas afectadas con fixtures aislados (A110). Comprobación: Iniciar, consultar y detener en HOME temporal conservan códigos, archivos, PID y limpieza.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A110). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
