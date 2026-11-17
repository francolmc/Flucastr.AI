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
- [x] Extraer procesarPi y dependencias compartidas mediante imports explícitos, sin cambiar selección ni agregación de eventos. (A105). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-105.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-105.md` y las pruebas negativas afectadas con fixtures aislados (A105). Comprobación: Comparar filas, sesiones, mensajes y errores de fixtures Pi con la matriz.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A105). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Antes de editar, `$ node pruebas/uso/probar.mjs`: `pruebas del medidor: 19 de 19 ok`, `exit 0`; incluyó A3 (filas, error de límite y aviso Pi), A8 (sesiones, esperas/contexto/compactación), A5b/A5c (créditos y sondeos) y A4i (métricas de invasión).
- Paso 1: `procesarPi` se movió a `tools/usage/pi.mjs` como factoría con dependencias compartidas explícitas. Se conservaron firma `(ctx, raiz)`, selección de archivos, lectura y orden de eventos, reglas de agregado, avisos y formatos; no se modificaron pruebas ni fixtures. `node --check scripts/uso.mjs`, `node --check tools/usage/pi.mjs` y `git diff --check -- scripts/uso.mjs tools/usage/pi.mjs`: `exit 0`.
- Paso 2: `$ node pruebas/uso/probar.mjs`: `19 de 19 ok`, `exit 0`; mismas aserciones antes y después para filas Pi, límite de uso, sesiones, créditos/sondeos y métricas por sesión. No se debilitaron pruebas ni se cambiaron fixtures.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` (48.6 s). `./verify` aislado coincide salvo el mensaje exacto autorizado del escenario 9; dos ejecuciones aisladas de `bash ./instalar.sh --simular` son repetibles y coinciden con la línea base, aplicando solo esa excepción autorizada.
