# Tramo 98 — Separar desinstalación global (borrador)

## Pasos

### Tramo 98 — Historia: Separar desinstalación global
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 97 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: desinstalar.sh y tools/uninstall/global.sh; pruebas y evidencias pertinentes.
Archivos: desinstalar.sh, tools/uninstall/global.sh.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A98).
Aceptación A98: Cada caso global de la matriz compara salida, código y árbol con su referencia. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [ ] Extraer íntegros el bucle global y limpieza final a un archivo sourced en el mismo shell, preservando las variables, continue, trap y exit originales. (A98). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-98.md` y confirmar que solo aborda esta responsabilidad.
- [ ] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-98.md` y las pruebas negativas afectadas con fixtures aislados (A98). Comprobación: Cada caso global de la matriz compara salida, código y árbol con su referencia.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A98). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
Pendiente.
