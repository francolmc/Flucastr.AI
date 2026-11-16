# Tramo 75 — Separar sandbox de claude (borrador)

## Pasos

### Tramo 75 — Historia: Separar sandbox de claude
Como mantenedor quiero aislar sandbox de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 74 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-sandbox.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-sandbox.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES sandbox de claude conserva comportamiento y efectos (A75).
Aceptación A75: funciones `instalar_sandbox_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `instalar_sandbox_claude` a `adapters/claude-code/install-sandbox.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A75). Comprobación: revisar el diff; Preservar configuración, avisos, comprobaciones y sus efectos.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A75). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-sandbox.sh` (A75). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A75). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A75). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
