# Tramo 67 — Separar lanzador de kit run (borrador)

## Pasos

### Tramo 67 — Historia: Separar lanzador de kit run
Como mantenedor quiero aislar lanzador de kit run para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 66 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/kit-run-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/kit-run-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzador de kit run conserva comportamiento y efectos (A67).
Aceptación A67: funciones `generar_lanzador_kit_run` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_lanzador_kit_run` a `tools/install/kit-run-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A67). Comprobación: revisar el diff; Preservar el entrypoint público y contenido del lanzador generado.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A67). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/kit-run-launcher.sh` (A67). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A67). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A67). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 3: `bash -n instalar.sh && bash -n tools/install/kit-run-launcher.sh && git diff --check -- instalar.sh tools/install/kit-run-launcher.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-67.md` terminó sin errores; `exit 0`.
- Paso 1: comparación literal con `instalar-current66.sh` confirmó que la función extraída coincide byte por byte; `source "$RAIZ/tools/install/kit-run-launcher.sh"` quedó en el punto original de la definición y antes de la llamada en línea 850. Salida: `A67_EXTRACCION_LITERAL=PASS; función idéntica a A66`; `exit 0`.
- Paso 2: matriz estricta A66/A67/repetición dentro de Bubblewrap y la misma raíz sintética `/tmp/tramo60-matriz-1/work`: `cmp` pasó en las capturas completas de 32 casos; SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`. Se conservan argumentos, códigos, stdout, stderr y manifiestos con tipos, permisos, enlaces, tamaños y hashes, sin normalización ni exclusiones. Runner `/tmp/tramo60-matriz-1/work/run-tramo67.sh`; salida `A67_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`; `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0 en aproximadamente 44.7 s. `./verify` aislado coincide con la línea base salvo el mensaje exacto aprobado del escenario 9.
- Paso 5: la misma receta aislada ejecutó dos `bash ./instalar.sh --simular`; ambas salidas coinciden con la referencia y entre sí. Resultado: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0`.
