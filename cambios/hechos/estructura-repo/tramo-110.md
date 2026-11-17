# Tramo 110 — Separar ciclo del observador (borrador)

## Pasos

### Tramo 110 — Historia: Separar ciclo del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 109 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/process.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/process.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A110).
Aceptación A110: Iniciar, consultar y detener en HOME temporal conservan códigos, archivos, PID y limpieza. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer pidDe, vivo, arrancar, parar y estado, pasando la ruta original del entrypoint como argumento para conservar el proceso hijo y SELF. (A110). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-110.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-110.md` y las pruebas negativas afectadas con fixtures aislados (A110). Comprobación: Iniciar, consultar y detener en HOME temporal conservan códigos, archivos, PID y limpieza.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A110). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: se movieron `pidDe`, `vivo`, `arrancar`, `parar` y `estado` a `tools/observe/process.mjs`; `arrancar` recibe `SELF` como argumento y `PID` se comparte con `correr()` para conservar su escritura y limpieza. Inspección del diff limitado a extracción/import y argumento del entrypoint; `node --check scripts/observar.mjs`, `node --check tools/observe/process.mjs` y `git diff --check -- scripts/observar.mjs` pasaron (`exit 0`). La matriz detectó inicialmente `PID is not defined`; se corrigió exportando y reusando la constante antes de marcar el paso.
- Paso 2: `$ python3` (harness temporal en `/tmp` que carga `tools/verify/docker-observer.sh`): salida `ok 8r A1-A3`, `ok 8r negativa` y `ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe`; `stderr` vacío, HOME/ciclo aislados bajo `/tmp`, `exit 0`. Incluye casos sin datos, fecha inválida, opción desconocida y copia sin OOM.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.`; `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`; duración 47.8 s, `exit 0`.
