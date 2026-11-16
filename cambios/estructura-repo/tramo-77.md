# Tramo 77 — Separar agente y hook de migración (borrador)

## Pasos

### Tramo 77 — Historia: Separar agente y hook de migración
Como mantenedor quiero aislar agente y hook de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 76 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/migrate-agent-hook.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/migrate-agent-hook.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agente y hook de migración conserva comportamiento y efectos (A77).
Aceptación A77: funciones `mig_agente y mig_hook` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `mig_agente y mig_hook` a `adapters/claude-code/migrate-agent-hook.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A77). Comprobación: revisar el diff; Preservar cambios a ajustes de Claude en proyecto sintético.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A77). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/migrate-agent-hook.sh` (A77). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A77). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A77). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
