# Tramo 76 — Separar registro de migración (borrador)

## Pasos

### Tramo 76 — Historia: Separar registro de migración
Como mantenedor quiero aislar registro de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 75 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/manifest.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/manifest.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES registro de migración conserva comportamiento y efectos (A76).
Aceptación A76: funciones `mig_anotar y mig_quitar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `mig_anotar y mig_quitar` a `tools/install/migration/manifest.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A76). Comprobación: revisar el diff; Conservar exactamente formato y argumentos consumidos, incluso comportamientos existentes.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A76). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/manifest.sh` (A76). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A76). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A76). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
