# Tramo 32 — Extraer escritura atómica (borrador)

## Pasos

### Tramo 32 — Historia: Extraer escritura atómica
Como mantenedor quiero extraer escritura atómica para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 31 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/resolver/atomic-write.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/resolver/atomic-write.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES extraer escritura atómica conserva los resultados y efectos originales (A32).
Aceptación A32: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `tools/resolver/atomic-write.mjs`, Mover `escribirAtomico` sin cambiar el sufijo temporal, serialización, salto final ni orden de escritura y rename; importar en `scripts/resolver.mjs`. (A32). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Fijar y quitar compactación, hook y permisos en fixtures; comparar contenido binario y ausencia de temporales tras éxito. (A32). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A32). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A32). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: se extrajo `escribirAtomico` conservando literalmente el sufijo `.flucastr-${process.pid}.tmp`, `JSON.stringify(objeto, null, 2) + "\n"` y el orden `writeFileSync` → `renameSync`; el entrypoint lo importa y mantiene las llamadas. `node --check` en entrypoint y módulo, `bash -n` del runner de matriz, `git diff --check` y aserciones estáticas de la extracción pasaron (`exit 0`).
- Paso 2: `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: 101 casos ejecutados en Bubblewrap, coincidencia con la referencia inmutable y entre dos capturas, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`, `exit 0`. Aserción explícita sobre compactación Pi/Claude, hook y deny Claude: todos los fijar/quitar terminan exitosos, los hashes SHA-256 de archivos binarios coinciden con la referencia y no queda nombre temporal `.flucastr-*.tmp` en los árboles después de cada operación. Referencia sin modificar.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` en Bubblewrap y comparó la salida con la referencia; `verify coincide salvo el mensaje exacto autorizado del escenario 9.`, código 0.
- Paso 4: el mismo comando ejecutó dos `bash ./instalar.sh --simular` aislados; las dos simulaciones fueron repetibles e iguales a la referencia. Resultado total `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, `exit 0`.
