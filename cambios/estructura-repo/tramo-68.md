# Tramo 68 — Separar reglas de codex (borrador)

## Pasos

### Tramo 68 — Historia: Separar reglas de codex
Como mantenedor quiero aislar reglas de codex para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 67 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/codex/install-rules.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/codex/install-rules.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES reglas de codex conserva comportamiento y efectos (A68).
Aceptación A68: funciones `instalar_deny_codex y refrescar_reglas_codex_registradas` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `instalar_deny_codex y refrescar_reglas_codex_registradas` a `adapters/codex/install-rules.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A68). Comprobación: revisar el diff; Conservar reglas, orden y tratamiento de registros previos.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A68). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/codex/install-rules.sh` (A68). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A68). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A68). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- `bash -n instalar.sh` y `bash -n adapters/codex/install-rules.sh`: ambos código 0. `A68_SOURCE_ORDER=PASS module_lines=53`; el único `source` queda antes de ambas llamadas y el módulo está bajo el límite de 300 líneas. `git diff --check` terminó con código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 45.7 s; `./verify` aislado coincide con línea base salvo el mensaje exacto autorizado del escenario 9. Dos ejecuciones de `bash ./instalar.sh --simular` son repetibles y coinciden con línea base.
- Matriz A68 íntegra, 32 casos anterior/actual/repetición, `cmp` estricto; SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`. Sin normalizar ni excluir efectos; detalle en tramo 56.
- Detener para revisión.
