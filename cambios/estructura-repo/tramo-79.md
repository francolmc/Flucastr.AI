# Tramo 79 — Separar inspección de proyecto migrado (borrador)

## Pasos

### Tramo 79 — Historia: Separar inspección de proyecto migrado
Como mantenedor quiero aislar inspección de proyecto migrado para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 78 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/inspect-project.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/inspect-project.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES inspección de proyecto migrado conserva comportamiento y efectos (A79).
Aceptación A79: funciones `mig_workspace, mig_gitignore y mig_aviso_agents` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `mig_workspace, mig_gitignore y mig_aviso_agents` a `tools/install/migration/inspect-project.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A79). Comprobación: revisar el diff; Preservar detección de repos hijos, avisos y modificaciones al fixture.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A79). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/inspect-project.sh` (A79). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A79). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A79). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
