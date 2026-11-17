# Tramo 40 — Separar hook de Claude Code (borrador)

## Pasos

### Tramo 40 — Historia: Separar hook de Claude Code
Como mantenedor quiero separar hook de claude code para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 39 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/claude-code/hook.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/claude-code/hook.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar hook de claude code conserva los resultados y efectos originales (A40).
Aceptación A40: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/claude-code/hook.mjs`, Mover constantes del hook y funciones `comprobarNombreHookClaude`, `tieneNuestroHook`, `esSoloNuestraHookClaude`, `fijarHookClaude` y `quitarHookClaude`; usar módulos compartidos sin alterar el nombre de archivo permitido. (A40). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comprobar settings.local.json válido, ruta rechazada, hook compartido, repetición y borrado selectivo; ningún archivo ajeno cambia. (A40). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A40). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A40). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `$ node --check scripts/resolver.mjs && node --check adapters/claude-code/hook.mjs && bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh && git diff --check -- scripts/resolver.mjs adapters/claude-code/hook.mjs cambios/estructura-repo/ejecutar-matriz-resolver.sh`; las comprobaciones terminaron con `exit 0`. El resolver conserva el despacho existente y el nuevo módulo usa `errors.mjs`, `object.mjs`, `json-settings.mjs` y `atomic-write.mjs`; se trasladaron constantes y funciones sin cambios de cuerpo; matriz aislada actualizada para copiar el adaptador.
- Paso 2: `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`; 101 casos comparados con la referencia inmutable y entre dos ejecuciones, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`. Casos de fijar/quitar compararon hashes binarios y no dejaron temporales; la ruta rechazada y hook compartido/repetición/borrado selectivo coinciden con la referencia; `exit 0`. Primera ejecución expuso desplazamiento de líneas del resolver en el stack del caso ausente; se conservó la posición con líneas vacías y la repetición pasó.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`; `./verify` corrió en Bubblewrap, código 0, y coincidió con la línea base salvo el mensaje exacto autorizado del escenario 9; `exit 0`.
- Paso 4: el mismo control aislado ejecutó dos `bash ./instalar.sh --simular`; ambas salidas coinciden entre sí y con la línea base, exceptuando solo el mensaje exacto autorizado del escenario 9; `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, `exit 0`.
