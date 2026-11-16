# Tramo 57 — Separar registro de instalación (borrador)

## Pasos

### Tramo 57 — Historia: Separar registro de instalación
Como mantenedor quiero aislar registro de instalación para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 56 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/manifest.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/manifest.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES registro de instalación conserva comportamiento y efectos (A57).
Aceptación A57: funciones `guardar_manifiesto y registrar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `guardar_manifiesto y registrar` a `tools/install/manifest.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A57). Comprobación: revisar el diff; Conservar la asignación de NUEVO y la instalación del trap en sus posiciones originales; no alterar formato ni orden del manifiesto.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A57). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/manifest.sh` (A57). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A57). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A57). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
