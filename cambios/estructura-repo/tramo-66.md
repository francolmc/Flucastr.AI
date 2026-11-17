# Tramo 66 — Separar lanzadores de codex (borrador)

## Pasos

### Tramo 66 — Historia: Separar lanzadores de codex
Como mantenedor quiero aislar lanzadores de codex para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 65 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/codex/install-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/codex/install-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzadores de codex conserva comportamiento y efectos (A66).
Aceptación A66: funciones `generar_lanzador_codex` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_lanzador_codex` a `adapters/codex/install-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A66). Comprobación: revisar el diff; Preservar compactación, argumentos, rutas y texto generado.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A66). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/codex/install-launcher.sh` (A66). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A66). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A66). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 3: `bash -n instalar.sh && bash -n adapters/codex/install-launcher.sh && git diff --check -- instalar.sh adapters/codex/install-launcher.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-66.md` terminó sin errores; salida `A66_SHELL_SYNTAX_AND_DIFF_CHECK=PASS`; `exit 0`.
- Paso 1: comparación con snapshot A65 confirmó igualdad byte a byte de `generar_lanzador_codex`; el único `source` aparece donde estaba la definición, antes de la primera llamada, y la función ya no está en `instalar.sh`. Salida: `A66_EXTRACCION_LITERAL=PASS; source único antes de primera llamada; función retirada del entrypoint`; `exit 0`.
- Paso 2: matriz estricta en Bubblewrap y la misma raíz sintética `/tmp/tramo60-matriz-1/work`: A65 anterior, A66 actual y repetición; `cmp` pasó sobre las capturas íntegras de 32 casos, SHA-256 idéntico `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`. Incluye argumentos, códigos, stdout, stderr y efectos (tipos, permisos, enlaces, tamaños y hashes), sin normalizar ni excluir campos. El primer intento, también conservado íntegro como `matrix-{previous,current,repeat}-first66.txt`, usó `PATH` sin el shim `mktemp` y difirió en rutas aleatorias; la repetición controlada puso `/work/bin` primero en `PATH` y pasó sin omitir esa diferencia del registro. Runner aislado `run-tramo66.sh`; salida `A66_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`; `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0. `./verify` aislado coincide con la línea base salvo el mensaje exacto aprobado del escenario 9. Antes, la aserción estática de `pruebas/permisos-v2.test.mjs` aún buscaba la orden del lanzador en `instalar.sh`; se adaptó al módulo extraído conservando la misma expresión de argumentos y opciones, y el test dirigido pasó 5/5. La receta completa posterior pasó.
- Paso 5: la misma receta aislada ejecutó dos `bash ./instalar.sh --simular`; ambas salidas coinciden con la referencia y entre sí. Resultado final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0`.
