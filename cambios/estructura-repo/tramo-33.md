# Tramo 33 — Extraer bloqueo de Pi (borrador)

## Pasos

### Tramo 33 — Historia: Extraer bloqueo de Pi
Como mantenedor quiero extraer bloqueo de pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 32 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/pi/file-lock.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/pi/file-lock.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES extraer bloqueo de pi conserva los resultados y efectos originales (A33).
Aceptación A33: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/resolver.mjs` y `adapters/pi/file-lock.mjs`, Mover `antiguo`, `conBloqueo` y sus tres constantes de intentos, espera y caducidad; importar `fallar` y primitivas Node sin variar los tiempos ni el `finally`. (A33). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [ ] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar fijación concurrente, bloqueo ocupado y huérfano; conservar mensajes, resultados y liberación incluso si la operación falla. (A33). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A33). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A33). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
