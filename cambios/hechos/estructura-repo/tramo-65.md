# Tramo 65 — Separar agentes de codex (borrador)

## Pasos

### Tramo 65 — Historia: Separar agentes de codex
Como mantenedor quiero aislar agentes de codex para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 64 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/codex/install-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/codex/install-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agentes de codex conserva comportamiento y efectos (A65).
Aceptación A65: funciones `generar_agente_codex` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `generar_agente_codex` a `adapters/codex/install-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A65). Comprobación: revisar el diff; Preservar contenido, modelo y esfuerzo generados.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A65). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/codex/install-agent.sh` (A65). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A65). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A65). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: comparación literal con el snapshot A64 comprobó igualdad byte a byte de `generar_agente_codex`; un único `source` en el mismo punto precede a la primera llamada y la definición ya no está en `instalar.sh`. Salida: `A65_EXTRACCION_LITERAL=PASS; source único antes de primera llamada; función retirada del entrypoint`; `exit 0`.
- Paso 2: runner temporal aislado con Bubblewrap, raíz sintética `/tmp/tramo60-matriz-1/work`, instalador A64 previo, instalador A65 y repetición actual. `cmp` estricto pasó para las tres capturas completas de 32 casos; SHA-256 idéntico `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`. Se conservan argumentos, códigos, stdout, stderr y efectos con tipos, permisos, enlaces, tamaños y hashes; sin normalizar ni excluir campos. Salida: `A65_MATRIX_STRICT_EQUIVALENCE=PASS cases=32`; `exit 0`.
- Paso 3: `$ bash -n instalar.sh && bash -n adapters/codex/install-agent.sh && git diff --check -- instalar.sh adapters/codex/install-agent.sh cambios/estructura-repo/tramo-56.md cambios/estructura-repo/tramo-65.md`: sin errores; `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` dentro de Bubblewrap; coincidió con la línea base salvo el mensaje exacto aprobado del escenario 9. Código 0; salida `verify coincide salvo el mensaje exacto autorizado del escenario 9.` La receta terminó en aproximadamente 42.9 s.
- Paso 5: la misma receta ejecutó dos `bash ./instalar.sh --simular` aislados; ambas salidas y efectos coincidieron con la línea base y entre sí. Código 0; salida final `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
