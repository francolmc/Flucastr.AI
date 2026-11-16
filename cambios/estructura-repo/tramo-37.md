# Tramo 37 — Separar cálculo de compactación de Pi (borrador)

## Pasos

### Tramo 37 — Historia: Separar cálculo de compactación de Pi
Como mantenedor quiero separar cálculo de compactación de pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 36 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/pi/compaction-plan.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/pi/compaction-plan.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar cálculo de compactación de pi conserva los resultados y efectos originales (A37).
Aceptación A37: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/pi/compaction-plan.mjs`, Mover `candidatosPi`, `planFijarPi`, `aplicarFijarPi`, `quitarOverridePi` y `RESERVA_MINIMA_PI`; importar predicados compartidos y exportar solo las funciones consumidas por `scripts/resolver.mjs`. (A37). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar orden de modelos, valores preexistentes, reservas bajo el mínimo, configuración inválida y eliminación exacta. (A37). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A37). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A37). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
