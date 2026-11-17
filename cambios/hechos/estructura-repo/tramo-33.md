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
- [x] En `scripts/resolver.mjs` y `adapters/pi/file-lock.mjs`, Mover `antiguo`, `conBloqueo` y sus tres constantes de intentos, espera y caducidad; importar `fallar` y primitivas Node sin variar los tiempos ni el `finally`. (A33). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar fijación concurrente, bloqueo ocupado y huérfano; conservar mensajes, resultados y liberación incluso si la operación falla. (A33). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A33). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A33). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `adapters/pi/file-lock.mjs` contiene únicamente `antiguo`, `conBloqueo`, sus tres constantes y sus dependencias (`fallar`, `mkdirSync`, `rmdirSync`, `statSync`). `scripts/resolver.mjs` importa el módulo y conserva el punto de llamada; la revisión confirmó que el cuerpo extraído mantiene el mismo flujo, tiempos y `finally`. Se mantuvo la numeración del entrypoint para las trazas de la matriz.
- Paso 2: `bash cambios/estructura-repo/ejecutar-bloqueo-pi.sh` terminó con código 0: tres escenarios del arnés (fijación concurrente, lock ocupado y lock huérfano) coinciden byte por byte con `bloqueo-pi.jsonl`, SHA-256 `9043c6ec9f746c8670396d33d7d53a19fdabdc35962ff3dc60e6a84fe7f0c224`. Un cuarto caso sintético lanza una excepción dentro de la operación y confirma que se propaga y el lock se libera. `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` pasó dos ejecuciones y la referencia inmutable: 101 casos, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`.
- Paso 3: `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` aislado con código 0; coincide con la línea base salvo el mensaje exacto autorizado del escenario 9.
- Paso 4: la misma receta ejecutó dos `bash ./instalar.sh --simular` aislados con código 0; sus salidas y efectos coinciden entre sí y con la referencia. Resultado final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
- Sintaxis: `node --check` en `scripts/resolver.mjs`, `adapters/pi/file-lock.mjs` y el arnés; `bash -n` en las recetas de bloqueo y matriz; `git diff --check`: código 0.
- Punto de control del tramo 33: archivos de producto `scripts/resolver.mjs` y `adapters/pi/file-lock.mjs`; evidencia actualizada en `cambios/estructura-repo/{comprobar-bloqueo-pi.mjs,ejecutar-bloqueo-pi.sh,tramo-33.md,plan.md}`. El primer cotejo de matriz detectó el desplazamiento de una línea en trazas; se ajustó el espacio de importación y luego la matriz quedó idéntica en dos ejecuciones, 101 casos. El arnés de bloqueo y la receta completa de verify e instalación pasaron; `git diff --check` pasó. No se tocaron proyectos ni áreas excluidas. Detener para revisión del tramo.
