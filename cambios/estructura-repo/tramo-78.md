# Tramo 78 — Separar políticas de migración (borrador)

## Pasos

### Tramo 78 — Historia: Separar políticas de migración
Como mantenedor quiero aislar políticas de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 77 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/migrate-policy.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/migrate-policy.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES políticas de migración conserva comportamiento y efectos (A78).
Aceptación A78: funciones `mig_deny y mig_sandbox` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `mig_deny y mig_sandbox` a `adapters/claude-code/migrate-policy.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A78). Comprobación: revisar el diff; Preservar registros, reglas y comportamiento actual sin corregirlo.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A78). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/migrate-policy.sh` (A78). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A78). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A78). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
