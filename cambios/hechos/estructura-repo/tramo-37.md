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
- [x] En `scripts/resolver.mjs` y `adapters/pi/compaction-plan.mjs`, Mover `candidatosPi`, `planFijarPi`, `aplicarFijarPi`, `quitarOverridePi` y `RESERVA_MINIMA_PI`; importar predicados compartidos y exportar solo las funciones consumidas por `scripts/resolver.mjs`. (A37). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar orden de modelos, valores preexistentes, reservas bajo el mínimo, configuración inválida y eliminación exacta. (A37). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A37). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A37). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: extraídas las cuatro funciones consumidas por `scripts/resolver.mjs` y la constante privada a `adapters/pi/compaction-plan.mjs` (77 líneas); el módulo importa los predicados compartidos y no contiene otra exportación. El entrypoint conserva despacho y operaciones. `node --check` en ambos módulos, `bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh`, aserciones estructurales y `git diff --check` pasaron; salida: `4 funciones consumidas exportadas; constante y predicados locales; 77 líneas; sin definiciones duplicadas`, `exit 0`. Se conservó el espaciado del entrypoint para mantener ubicaciones de línea; la matriz estricta pasó en el paso 2.
- Paso 2: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` comparó dos ejecuciones aisladas con la referencia inmutable: 101 casos, incluyendo orden, valores preexistentes, reserva bajo el mínimo, configuración inválida y eliminación exacta. Coincidieron código, stdout, stderr y efectos; SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; referencia sin modificar.
- Paso 3: `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` en el aislamiento; código 0 y comparación correcta con la línea base, aplicando únicamente la excepción exacta autorizada del escenario 9.
- Paso 4: la misma receta ejecutó dos veces `bash ./instalar.sh --simular` en el aislamiento; ambos códigos 0 y salidas repetibles, comparadas con `linea-base/` aplicando solo la excepción exacta autorizada del escenario 9.
