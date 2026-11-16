# Tramo 64 — Separar lanzadores de claude (borrador)

## Pasos

### Tramo 64 — Historia: Separar lanzadores de claude
Como mantenedor quiero aislar lanzadores de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 63 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzadores de claude conserva comportamiento y efectos (A64).
Aceptación A64: funciones `generar_lanzador_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `generar_lanzador_claude` a `adapters/claude-code/install-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A64). Comprobación: revisar el diff; Preservar argumentos, rutas, permisos y texto generado.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A64). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-launcher.sh` (A64). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A64). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A64). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
