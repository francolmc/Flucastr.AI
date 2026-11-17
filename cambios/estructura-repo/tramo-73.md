# Tramo 73 — Separar hook de tareas claude (borrador)

## Pasos

### Tramo 73 — Historia: Separar hook de tareas claude
Como mantenedor quiero aislar hook de tareas claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 72 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-task-hook.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-task-hook.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES hook de tareas claude conserva comportamiento y efectos (A73).
Aceptación A73: funciones `instalar_hook_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `instalar_hook_claude` a `adapters/claude-code/install-task-hook.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A73). Comprobación: revisar el diff; Conservar la función aunque el recorrido actual no la invoque; no activar el hook.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A73). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-task-hook.sh` (A73). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A73). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A73). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: se extrajeron exactamente 1.101 bytes/21 líneas de `instalar_hook_claude` del snapshot A72 a `adapters/claude-code/install-task-hook.sh`; `instalar.sh` carga el módulo una vez en la ubicación de la antigua definición. Se conserva la función, no se añadió llamada ni se activó el hook. Comparación byte por byte y comprobación estructural `A73_EXTRACTION_EXACT=PASS`.
- Pasos 2–3: matriz A73 estricta de 32 casos anterior/actual/repetición: SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`; `bash -n` en ambos archivos y `git diff --check` pasaron. Detalle íntegro en `tramo-56.md`.
- Pasos 4–5: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0 en 44.9 s; verify aislado coincide salvo el mensaje exacto autorizado del escenario 9, y dos simulaciones coinciden entre sí y con la línea base.
