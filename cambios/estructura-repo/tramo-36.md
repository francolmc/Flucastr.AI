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
- [ ] En `scripts/resolver.mjs` y `adapters/pi/agent-tools.mjs`, Mover `bashPlano` a un módulo Pi e importarlo en `scripts/resolver.mjs`; mantener el análisis de paréntesis, orden y eliminación de duplicados. (A36). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar cabeceras sin Bash, con patrones anidados, múltiples Bash y herramientas ajenas; salida idéntica. (A36). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A36). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A36). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
