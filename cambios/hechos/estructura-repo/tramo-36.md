# Tramo 36 — Extraer transformación de herramientas de Pi (borrador)

## Pasos

### Tramo 36 — Historia: Extraer transformación de herramientas de Pi
Como mantenedor quiero extraer transformación de herramientas de pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 35 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/pi/agent-tools.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/pi/agent-tools.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES extraer transformación de herramientas de pi conserva los resultados y efectos originales (A36).
Aceptación A36: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/pi/agent-tools.mjs`, Mover `bashPlano` a un módulo Pi e importarlo en `scripts/resolver.mjs`; mantener el análisis de paréntesis, orden y eliminación de duplicados. (A36). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar cabeceras sin Bash, con patrones anidados, múltiples Bash y herramientas ajenas; salida idéntica. (A36). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A36). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A36). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `node --check scripts/resolver.mjs`, `node --check adapters/pi/agent-tools.mjs`, comparación del cuerpo de `bashPlano` contra `git show HEAD:scripts/resolver.mjs`, `bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh`, aserciones de importación/uso único/copia aislada y `git diff --check` pasaron. El cuerpo de la función se conserva literalmente; solo se exporta desde `adapters/pi/agent-tools.mjs`. Se añadieron líneas vacías en el entrypoint para conservar los números de línea de trazas Node que exige la matriz; no se añadió lógica.
- Paso 2: `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: 101 casos comparados byte por byte en dos ejecuciones con la referencia inmutable; cabeceras sin Bash, patrones anidados, Bash múltiples y herramientas ajenas quedan cubiertos en la matriz. SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; referencia intacta; `exit 0`. La primera ejecución reveló un desplazamiento de líneas en las trazas de errores; se corrigió solo el espaciado y se repitió con éxito.
- Pasos 3–4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` aislado y dos `bash ./instalar.sh --simular`; código 0. Verify coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones coinciden entre sí y con la línea base. Salida final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
