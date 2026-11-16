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
- [ ] Extraer `generar_lanzador_kit_run` a `tools/install/kit-run-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A67). Comprobación: revisar el diff; Preservar el entrypoint público y contenido del lanzador generado.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A67). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/kit-run-launcher.sh` (A67). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A67). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A67). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
