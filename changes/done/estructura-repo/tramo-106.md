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
- [x] Extraer procesarCodex y dependencias compartidas mediante imports explícitos; preservar el acceso exclusivo a sessions/ y no leer credenciales. (A106). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-106.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-106.md` y las pruebas negativas afectadas con fixtures aislados (A106). Comprobación: Comparar filas, sesiones, cuota, advertencias y la prueba negativa auth con la matriz.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A106). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
1. Se extrajo `procesarCodex` a `tools/usage/codex.mjs` como factoría con imports y dependencias explícitos; `scripts/uso.mjs` conserva como raíz Codex únicamente `codexDir/sessions`. Inspección confirmó que el flujo no consulta archivos de credenciales. `node --check scripts/uso.mjs`, `node --check tools/usage/codex.mjs` y `git diff --check` pasaron.
2. `node pruebas/uso/probar.mjs` pasó 19/19 antes y después de la extracción. La matriz cubre filas, sesiones, cuota, advertencias y el negativo auth; incluye A2, A3s, A4i, A5/A5a/A5d, A6, A7 y A2v. El negativo auth confirmó que no se leen ni exponen credenciales; fixtures aislados sin cambios.
3. `timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0 en ~50.4 s: `./verify` y las dos simulaciones de instalación coinciden con `linea-base/`, aplicando solo la excepción textual aprobada del escenario 9. No se accedió a secretos, `.env`, proyectos reales, `old/v1/registro/` ni `pruebas/.temporales/`.
