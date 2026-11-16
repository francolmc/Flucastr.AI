# Tramo 58 — Separar enlaces de instalación (borrador)

## Pasos

### Tramo 58 — Historia: Separar enlaces de instalación
Como mantenedor quiero aislar enlaces de instalación para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 57 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/links.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/links.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES enlaces de instalación conserva comportamiento y efectos (A58).
Aceptación A58: funciones `enlazar y liberar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `enlazar y liberar` a `tools/install/links.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A58). Comprobación: revisar el diff; Conservar las condiciones de simulación, enlaces existentes y mensajes.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A58). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/links.sh` (A58). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A58). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A58). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
