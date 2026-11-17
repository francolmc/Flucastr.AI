# Tramo 72 — Separar hook de permisos claude (borrador)

## Pasos

### Tramo 72 — Historia: Separar hook de permisos claude
Como mantenedor quiero aislar hook de permisos claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 71 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-permission-hook.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-permission-hook.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES hook de permisos claude conserva comportamiento y efectos (A72).
Aceptación A72: funciones `instalar_hook_permisos_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `instalar_hook_permisos_claude` a `adapters/claude-code/install-permission-hook.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A72). Comprobación: bloque de 1.972 bytes idéntico al instalador A71, `source` único antes de la llamada; la función y su configuración se preservan. Matriz estricta posterior confirma el comportamiento. `exit 0`.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A72). Comprobación: capturas previa, actual y repetición en misma raíz aislada, `cmp` íntegro de 32 casos, SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`; cero diferencias, sin normalizaciones ni exclusiones. `exit 0`.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-permission-hook.sh` (A72). Comprobación: ambos retornan 0; `git diff --check` y comprobación de aislamiento, unicidad, orden y tamaño del módulo pasaron. `exit 0`.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A72). Comprobación: `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó verify en Bubblewrap; código 0, coincide salvo el mensaje exacto autorizado del escenario 9.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A72). Comprobación: la misma receta ejecutó dos simulaciones aisladas, ambas coinciden entre sí y con la línea base; excepción exacta autorizada del escenario 9. Receta completa: 45.1 s; `exit 0`.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Matriz A72: instalador A71 previo, actual con el hook extraído y repetición actual capturados en Bubblewrap sobre la misma raíz sintética. `cmp` estricto pasó para las tres capturas completas de 32 casos; SHA-256 idéntico `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b` (`A72_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`). Se conservaron argumentos, códigos, stdout, stderr y manifiestos con tipo, permisos, enlaces, tamaño y hash, sin diferencias, normalizaciones ni exclusiones. Capturas y runner: `/tmp/tramo60-matriz-1/work/matrix-{previous,current,repeat}.txt`, `/tmp/tramo60-matriz-1/work/run-tramo72.sh`.
- La función se trasladó byte por byte desde la captura A71: 1.972 bytes, 30 líneas; `source` único en su posición de definición y antes de la primera llamada. Detenerse para revisión al completar controles aislados.
- `$ bash -n instalar.sh && bash -n adapters/claude-code/install-permission-hook.sh`: ambos retornaron 0; `git diff --check` pasó; el control estructural confirmó función aislada, `source` único antes de invocación y módulo de 30 líneas. Salida `A72_MODULE_CHECK=PASS function isolated; source unique and before first invocation; lines=30`, `exit 0`.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, `exit 0` (45.1 s).
