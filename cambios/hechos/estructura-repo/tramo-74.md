# Tramo 74 — Separar reglas de claude (borrador)

## Pasos

### Tramo 74 — Historia: Separar reglas de claude
Como mantenedor quiero aislar reglas de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 73 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-rules.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-rules.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES reglas de claude conserva comportamiento y efectos (A74).
Aceptación A74: funciones `instalar_deny_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `instalar_deny_claude` a `adapters/claude-code/install-rules.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A74). Comprobación: revisar el diff; Preservar exactamente la configuración deny y su orden.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A74). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-rules.sh` (A74). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A74). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A74). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: se extrajeron exactamente 1.078 bytes/30 líneas de `instalar_deny_claude` del snapshot A73 a `adapters/claude-code/install-rules.sh`; `instalar.sh` carga el módulo una vez en la posición original de definición y conserva una llamada. La configuración deny y su orden son literales. `A74_EXTRACTION_EXACT=PASS`; módulo de 30 líneas.
- Pasos 2–3: matriz A74 estricta de 32 casos anterior/actual/repetición: SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`; `bash -n` en ambos archivos y `git diff --check` pasaron. Detalle íntegro en `tramo-56.md`.
- Pasos 4–5: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0; verify aislado coincide con la línea base salvo el mensaje exacto autorizado del escenario 9 y las dos simulaciones coinciden entre sí y con la línea base. Salida: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
