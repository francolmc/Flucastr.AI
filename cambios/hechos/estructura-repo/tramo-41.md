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
- [x] En `scripts/resolver.mjs` y `adapters/claude-code/settings-path.mjs`, Mover `comprobarNombreDenyClaude` sin alterar `basename`, `resolve`, `homedir` ni el mensaje; importarla en `scripts/resolver.mjs` mientras ambos consumidores permanezcan allí. (A41). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar aceptación de settings.json temporal y rechazo de settings.local.json y del settings.json global bajo HOME aislado. (A41). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A41). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A41). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 4: la misma receta ejecutó dos simulaciones de `bash ./instalar.sh --simular`; informó `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9`, código 0.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` informó `verify coincide salvo el mensaje exacto autorizado del escenario 9`; código 0. Ejecutó el `./verify` aislado contra la línea base.
- Paso 2: bajo `HOME` temporal, `settings.json` de proyecto aceptado (código 0, 29 líneas `agregada:...`, stderr vacío); `settings.local.json` y `HOME/.claude/settings.json` rechazados (código 1, stdout vacío y mensaje original exacto); los tres archivos conservaron sus bytes. Harness: Python + `node scripts/resolver.mjs fijar-deny claude <ruta> --simular`; código 0.
- Paso 1: el helper conserva `basename`, `resolve`, `homedir` y el mensaje original; el resolver lo importa y lo invoca en los cuatro consumidores. `node --check` pasó en ambos módulos; diff inspeccionado sin lógica añadida.
