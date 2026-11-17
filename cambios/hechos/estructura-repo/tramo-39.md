# Tramo 39 — Separar compactación de Claude Code (borrador)

## Pasos

### Tramo 39 — Historia: Separar compactación de Claude Code
Como mantenedor quiero separar compactación de claude code para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 38 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/claude-code/compaction.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/claude-code/compaction.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar compactación de claude code conserva los resultados y efectos originales (A39).
Aceptación A39: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/claude-code/compaction.mjs`, Mover `valorClaude`, `fijarCompactacionClaude`, `quitarCompactacionClaude` y sus constantes; inyectar `leerConfig`, reutilizar lectura, predicados y escritura atómica preservando la escritura directa original donde corresponde. (A39). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar límites de ventana, valores ajenos, simulación, repetición, eliminación exacta y bytes del JSON. (A39). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A39). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A39). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `node --check scripts/resolver.mjs`, `node --check adapters/claude-code/compaction.mjs`, `bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh`, `git diff --check` sobre las rutas del tramo y aserciones estructurales pasaron (`exit 0`). `resolver` conserva el despacho e inyecta `leerConfig`; las tres funciones y constantes Claude están en el adaptador, que reutiliza lectura, predicados y escritura atómica. El cambio de producto no añade lógica.

- Paso 2: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` pasó; 101 casos, dos ejecuciones comparadas byte a byte con la referencia inmutable, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; sin temporales residuales (`exit 0`).
- Pasos 3–4: `bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0` en Bubblewrap: `./verify` coincide salvo el mensaje exacto autorizado del escenario 9; dos ejecuciones de `bash ./instalar.sh --simular` comparan con la línea base y son repetibles.
