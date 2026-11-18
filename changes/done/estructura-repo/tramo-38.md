# Tramo 38 — Separar aplicación de compactación de Pi (borrador)

## Pasos

### Tramo 38 — Historia: Separar aplicación de compactación de Pi
Como mantenedor quiero separar aplicación de compactación de pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 37 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/pi/compaction.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/pi/compaction.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar aplicación de compactación de pi conserva los resultados y efectos originales (A38).
Aceptación A38: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/pi/compaction.mjs`, Mover `fijarCompactacionPi` y `quitarCompactacionPi`, inyectando `leerConfig` del módulo de modelos y usando módulos de bloqueo, escritura, lectura y cálculo ya extraídos; preservar dos lecturas bajo bloqueo y todas las salidas. (A38). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar simulación, repetición, remoción selectiva, archivo modificado durante bloqueo y ejecución concurrente sin perder campos. (A38). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A38). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A38). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `fijarCompactacionPi` y `quitarCompactacionPi` están en `adapters/pi/compaction.mjs`; el despacho de `scripts/resolver.mjs` inyecta `leerConfig` y conserva las líneas del entrypoint. Revisión del diff confirma que el movimiento no añadió ramas ni cambió lógica; `node --check` en ambos archivos y `git diff --check` pasaron. La receta de bloqueo se amplió con dependencias del resolver (`tools/model-resolution/models.mjs`, todos los módulos de `tools/resolver/` y `adapters/pi/agent-tools.mjs`) para reproducir el entrypoint actual en Bubblewrap.
- Paso 2: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` pasó dos ejecuciones aisladas: 101 casos, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; referencia inmutable. Incluye simulación, repetición y remoción selectiva con resultados binarios cotejados. `bash cambios/estructura-repo/ejecutar-bloqueo-pi.sh` pasó los 3 registros concurrentes contra la referencia inmutable, SHA-256 `9043c6ec9f746c8670396d33d7d53a19fdabdc35962ff3dc60e6a84fe7f0c224`, y el caso sintético modificado durante la espera confirmó código 0, stdout `omitido-usuario:fixture/model`, stderr vacío y conservación de los campos ajenos `preserved` y `reserveTokens`.
- Paso 3: `bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0; `./verify` en Bubblewrap coincide con la referencia, salvo el mensaje exacto autorizado del escenario 9.
- Paso 4: la misma receta aislada ejecutó dos veces `bash ./instalar.sh --simular`; ambas simulaciones coinciden entre sí y con la referencia. Resultado: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, código 0.
