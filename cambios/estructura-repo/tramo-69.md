# Tramo 69 — Separar compactación de pi (borrador)

## Pasos

### Tramo 69 — Historia: Separar compactación de pi
Como mantenedor quiero aislar compactación de pi para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 68 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/pi/install-compaction.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/pi/install-compaction.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES compactación de pi conserva comportamiento y efectos (A69).
Aceptación A69: funciones `instalar_compactacion_pi` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `instalar_compactacion_pi` a `adapters/pi/install-compaction.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A69). Comprobación: revisar el diff; Preservar lectura y actualización de ajustes en el fixture.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A69). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-compaction.sh` (A69). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A69). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A69). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
