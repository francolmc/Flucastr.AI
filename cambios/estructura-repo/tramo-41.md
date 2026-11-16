# Tramo 41 — Separar validación de ruta de ajustes Claude (borrador)

## Pasos

### Tramo 41 — Historia: Separar validación de ruta de ajustes Claude
Como mantenedor quiero separar validación de ruta de ajustes claude para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 40 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/claude-code/settings-path.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/claude-code/settings-path.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar validación de ruta de ajustes claude conserva los resultados y efectos originales (A41).
Aceptación A41: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/claude-code/settings-path.mjs`, Mover `comprobarNombreDenyClaude` sin alterar `basename`, `resolve`, `homedir` ni el mensaje; importarla en `scripts/resolver.mjs` mientras ambos consumidores permanezcan allí. (A41). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar aceptación de settings.json temporal y rechazo de settings.local.json y del settings.json global bajo HOME aislado. (A41). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A41). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A41). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
