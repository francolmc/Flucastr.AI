# Tramo 75 — Separar sandbox de claude (borrador)

## Pasos

### Tramo 75 — Historia: Separar sandbox de claude
Como mantenedor quiero aislar sandbox de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 74 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-sandbox.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-sandbox.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES sandbox de claude conserva comportamiento y efectos (A75).
Aceptación A75: funciones `instalar_sandbox_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `instalar_sandbox_claude` a `adapters/claude-code/install-sandbox.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A75). Comprobación: revisar el diff; Preservar configuración, avisos, comprobaciones y sus efectos.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A75). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-sandbox.sh` (A75). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A75). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A75). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: extracción byte por byte desde el snapshot A74 a `adapters/claude-code/install-sandbox.sh` (2.067 bytes/38 líneas); `source` único en el lugar de la definición y llamada existente conservada. Configuración, avisos y comprobaciones literales. `A75_EXTRACTION_EXACT=PASS`; módulo dentro del límite de 300 líneas.
- Paso 2: matriz estricta A74/A75/repetición en Bubblewrap sobre la raíz sintética del tramo 56. `cmp` pasó para las tres capturas completas de 32 casos, SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`; argumentos, códigos, stdout, stderr y manifiestos con tipo, permisos, enlaces, tamaño y hash íntegros, sin diferencias, normalizaciones ni exclusiones. Runner: `/tmp/tramo60-matriz-1/work/run-tramo75.sh`.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/claude-code/install-sandbox.sh && git diff --check -- instalar.sh adapters/claude-code/install-sandbox.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-75.md cambios/estructura-repo/plan.md`: sin salida, `exit 0`.
- Paso 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `./verify` aislado terminó con código 0 y coincide con la línea base salvo el mensaje exacto autorizado del escenario 9. La primera ejecución detectó que una prueba estática de permisos solo inspeccionaba `instalar.sh`; se adaptó para revisar también `adapters/claude-code/install-sandbox.sh`, sin retirar comprobaciones, y la repetición pasó.
- Paso 5: la misma receta ejecutó dos veces `bash ./instalar.sh --simular` bajo Bubblewrap; ambas capturas coinciden entre sí y con `linea-base/`. Salida final `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, `exit 0`.
- Prueba pertinente: `pruebas/permisos-v2.test.mjs` conserva sus aserciones de `bwrap`, `socat` y el aviso, y ahora inspecciona el módulo cargado por `instalar.sh` además del propio instalador.
