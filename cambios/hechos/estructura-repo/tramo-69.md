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
- [x] Extraer `instalar_compactacion_pi` a `adapters/pi/install-compaction.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A69). Comprobación: revisar el diff; Preservar lectura y actualización de ajustes en el fixture.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A69). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-compaction.sh` (A69). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A69). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A69). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- La extracción coincide byte por byte con el bloque de `instalar-current68.sh`; `A69_EXTRACTION_AND_SOURCE_ORDER=PASS module_lines=41`. Un único `source` precede a la primera llamada. `bash -n instalar.sh` y `bash -n adapters/pi/install-compaction.sh` terminaron con código 0; `git diff --check` terminó con código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 44.7 s; `./verify` aislado coincide con línea base salvo el mensaje exacto autorizado del escenario 9. Dos ejecuciones de `bash ./instalar.sh --simular` son repetibles y coinciden con línea base.
- Matriz A69 íntegra, 32 casos anterior/actual/repetición, `cmp` estricto; SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`. Sin normalizar ni excluir efectos; detalle en tramo 56.
- Detener para revisión.
