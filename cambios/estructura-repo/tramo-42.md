# Tramo 42 — Separar reglas deny de Claude Code (borrador)

## Pasos

### Tramo 42 — Historia: Separar reglas deny de Claude Code
Como mantenedor quiero separar reglas deny de claude code para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 41 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/claude-code/deny.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/claude-code/deny.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar reglas deny de claude code conserva los resultados y efectos originales (A42).
Aceptación A42: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/claude-code/deny.mjs`, Mover `REGLAS_DENY_CLAUDE`, `denyDeAjustes`, `fijarDenyClaude` y `quitarDenyClaude`, importando el validador de ruta y utilidades existentes. Conservar exactamente reglas, orden y podado. (A42). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar JSON y salida en vacío, reglas ajenas, tipos inválidos, simulación y reversión de una sola regla; verificar ruta global rechazada. (A42). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A42). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A42). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
