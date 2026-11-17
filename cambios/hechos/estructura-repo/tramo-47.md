# Tramo 47 — Separar ajustes del agente y comparación de modelos (borrador)

## Pasos

### Tramo 47 — Historia: Separar ajustes del agente y comparación de modelos
Como mantenedor quiero separar ajustes del agente y comparación de modelos para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 46 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/resolver/config-commands.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/resolver/config-commands.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar ajustes del agente y comparación de modelos conserva los resultados y efectos originales (A47).
Aceptación A47: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `tools/resolver/config-commands.mjs`, Extraer los bloques `fijar-agente`, `quitar-agente` y `comparar-modelos` a funciones explícitas; conservar sus escrituras directas, orden y predicado local que admite null. Mantener en `scripts/resolver.mjs` el despacho y el mismo texto de uso. (A47). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar creación, sobrescritura, omisión y borrado selectivo; comparar diferencias y orden con modelos nuevos y campos ausentes. (A47). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A47). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A47). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `node --check scripts/resolver.mjs`, `node --check tools/resolver/config-commands.mjs` y `git diff --check` pasaron. El diff revisado mantiene el despacho y el texto de uso en `scripts/resolver.mjs`; las tres funciones trasladan sus bloques, conservan escrituras directas y orden, y `compararModelos` mantiene localmente `hasOwnProperty.call(obj ?? {}, clave)`. Se conservaron las líneas posteriores del resolver para no desplazar ubicaciones. `exit 0`.
- Paso 2: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` comparó dos ejecuciones aisladas con la referencia: 101 casos, código/stdout/stderr/efectos idénticos, incluidos creación, sobrescritura, omisión, borrado selectivo y comparación de modelos/campos; SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`. Sin temporales tras fijar/quitar y sin modificar la referencia; `exit 0`.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`; `exit 0`.
- Paso 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: dos simulaciones repetibles y coincidentes con la línea base; salida final `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; `exit 0`.
