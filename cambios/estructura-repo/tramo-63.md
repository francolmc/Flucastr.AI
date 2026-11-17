# Tramo 63 — Separar lanzadores de pi (borrador)

## Pasos

### Tramo 63 — Historia: Separar lanzadores de pi
Como mantenedor quiero aislar lanzadores de pi para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 62 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/pi/install-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/pi/install-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzadores de pi conserva comportamiento y efectos (A63).
Aceptación A63: funciones `generar_lanzador_pi` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_lanzador_pi` a `adapters/pi/install-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A63). Comprobación: revisar el diff; Preservar argumentos, rutas, permisos y texto generado.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A63). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-launcher.sh` (A63). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A63). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A63). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: comparación estructural contra `/tmp/tramo60-matriz-1/work/instalar-current62.sh`: función trasladada byte por byte; `source` único y antes de su primera llamada; se conservan argumentos, rutas, `chmod +x`, registro y texto generado. Comprobación Python imprimió `generar_lanzador_pi idéntica al snapshot A62; source único antes de primera llamada; argumentos, rutas, permisos, texto y registro preservados`, `exit 0`.
- Paso 2: `$ bwrap --unshare-all --die-with-parent --ro-bind /usr /usr --ro-bind /bin /bin --ro-bind /lib /lib --ro-bind /lib64 /lib64 --proc /proc --dev /dev --tmpfs /tmp --dir /home --dir /home/test --dir /Users --bind /tmp/tramo60-matriz-1/work /work --chdir /work --clearenv --setenv HOME /home/test --setenv PATH /work/bin:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC /bin/bash /work/run-tramo63.sh`: matriz completa del instalador A62/A63 y repetición actual; `cmp` estricto pasó para anterior/actual y actual/repetición, 32 casos, SHA-256 idéntico `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`; `A63_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`, `exit 0`. Se conservaron argumentos, códigos, stdout, stderr y manifiestos con tipos, permisos, enlaces, tamaños y hashes, sin normalizar ni excluir efectos. El primer intento no usó el shim `mktemp` determinista y solo difirió en las rutas temporales; se conservó íntegro y se repitió con el shim del fixture.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/pi/install-launcher.sh`: sin salida, `exit 0`; el módulo tiene 26 líneas. `$ git diff --check -- instalar.sh adapters/pi/install-launcher.sh cambios/estructura-repo/plan.md cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-63.md`: sin salida, `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 37.8 s; `./verify` dentro de Bubblewrap coincide con la línea base salvo el mensaje exacto autorizado del escenario 9. Diagnóstico del primer intento: `tools/verify/agent-resolution.sh` buscaba el texto del lanzador únicamente en `instalar.sh`; se actualizó esa aserción equivalente para revisar `adapters/pi/install-launcher.sh`. La cobertura sigue exigiendo `modelo-esfuerzo` en la invocación del lanzador. Salida: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`
- Paso 5: en la misma receta aislada, ambas ejecuciones `bash ./instalar.sh --simular` terminaron en código 0 y coincidieron byte por byte con línea base y entre sí; salida final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
