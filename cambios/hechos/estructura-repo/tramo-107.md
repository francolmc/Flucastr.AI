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
- [x] Extraer tabla, imprimirSesiones e imprimirTexto, pasando explícitamente constantes requeridas y manteniendo orden y espacios. (A107). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-107.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-107.md` y las pruebas negativas afectadas con fixtures aislados (A107). Comprobación: Comparar byte por byte informes de texto y JSON de la matriz.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A107). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `tools/usage/report.mjs` contiene la tabla alineada y los formateadores de texto y sesiones; `scripts/uso.mjs` les pasa explícitamente `COLUMNAS` y `COLUMNAS_SESIONES`. La inspección del diff confirma que esta edición añade/elimina únicamente formato de informes dentro de este paso (las demás extracciones visibles en el diff pertenecen a tramos previos). `$ node --check scripts/uso.mjs && node --check tools/usage/report.mjs && git diff --check -- scripts/uso.mjs tools/usage/report.mjs`: sin salida; sintaxis y diff check correctos (`exit 0`).
- Paso 2: `$ node pruebas/uso/probar.mjs`: las 19 pruebas dirigidas pasaron, incluidas opciones, robustez, sesiones, cuota, créditos, A5d y negativo de credenciales (`pruebas del medidor: 19 de 19 ok`, `exit 0`). Capturas anteriores y posteriores, generadas con fixtures y fecha fija en `/tmp/flucastr-usage107.Bt3LZe`, comparadas byte por byte: `$ cmp .../texto.txt .../texto-after.txt && cmp .../json.txt .../json-after.txt && cmp .../sesiones-texto.txt .../sesiones-texto-after.txt && cmp .../sesiones-json.txt .../sesiones-json-after.txt && cmp .../cuota-texto.txt .../cuota-texto-after.txt && cmp .../cuota-json.txt .../cuota-json-after.txt`: `6 comparaciones cmp pasaron` (`exit 0`). Cubren informe, sesiones y cuota, en texto y JSON; fixtures sin cambios.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; terminó en aproximadamente 60.4 s (`exit 0`). Se ejecutaron `./verify` y dos simulaciones en la copia aislada del tramo 1; códigos, salidas y efectos coinciden con la referencia y entre repeticiones salvo la excepción autorizada. No se accedió a proyectos reales, secretos ni rutas excluidas.
