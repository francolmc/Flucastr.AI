# Tramo 64 — Separar lanzadores de claude (borrador)

## Pasos

### Tramo 64 — Historia: Separar lanzadores de claude
Como mantenedor quiero aislar lanzadores de claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 63 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzadores de claude conserva comportamiento y efectos (A64).
Aceptación A64: funciones `generar_lanzador_claude` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_lanzador_claude` a `adapters/claude-code/install-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A64). Comprobación: revisar el diff; Preservar argumentos, rutas, permisos y texto generado.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A64). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-launcher.sh` (A64). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A64). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A64). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: `python3 -B` comparó la función extraída byte por byte con `instalar-current63.sh`; además confirmó un único `source` antes de la primera llamada y ausencia de la definición en `instalar.sh`. Salida: `A64_EXTRACCION_LITERAL=PASS; source único antes de primera llamada; función retirada del entrypoint`; `exit 0`.
- Paso 2: runner temporal aislado con Bubblewrap, raíz sintética `/tmp/tramo60-matriz-1/work`, instalador A63 previo, instalador A64 y repetición actual. `cmp` estricto pasó para las tres capturas completas de 32 casos; hashes idénticos `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`. La captura conserva argumentos, códigos, stdout, stderr y efectos con tipos, permisos, enlaces, tamaños y hashes; no se normalizó ni excluyó ningún campo. Salida: `A64_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`; `exit 0`.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/claude-code/install-launcher.sh && git diff --check -- instalar.sh adapters/claude-code/install-launcher.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-64.md`: sin errores; `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`; `exit 0` (41.1 s).
- Paso 5: la misma receta ejecutó dos `bash ./instalar.sh --simular`; salida `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; código 0 y simulaciones idénticas a la línea base y entre sí.
