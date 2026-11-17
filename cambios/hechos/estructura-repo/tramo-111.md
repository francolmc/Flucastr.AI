# Tramo 111 — Separar diagnóstico del observador (borrador)

## Pasos

### Tramo 111 — Historia: Separar diagnóstico del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 110 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/diagnose.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/diagnose.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A111).
Aceptación A111: Los fixtures positivos y negativos producen igual diagnóstico y no ejecutan comandos reales externos. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer cmd, debeDiagnosticar y diagnosticar sin alterar argumentos ni efectos; inyectar ruta original cuando corresponda. (A111). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-111.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-111.md` y las pruebas negativas afectadas con fixtures aislados (A111). Comprobación: Los fixtures positivos y negativos producen igual diagnóstico y no ejecutan comandos reales externos.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A111). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `cmd`, `debeDiagnosticar` y `diagnosticar` quedaron en `tools/observe/diagnose.mjs`; `scripts/observar.mjs` importa las funciones y pasa `DIAGNOSTICOS` como tercer argumento, conservando la ruta relativa original. Inspección del diff de esta extracción; `node --check scripts/observar.mjs`, `node --check tools/observe/diagnose.mjs` y `git diff --check` pasaron (`exit 0`). La referencia aislada previa a editar, `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`, terminó en `exit 0`: verify coincide salvo el mensaje exacto autorizado del escenario 9 y las simulaciones coinciden con la línea base.
- Paso 2: matriz temporal con `docker` falso y directorio diagnóstico temporal: positivos OOM, unhealthy y `die` código 1; negativos `die` códigos 0/143, `create`, código inválido e ID con traversal. Se comprobó el diagnóstico byte por byte, `cmd`/argumentos y que el ID inválido no ejecutó comandos ni escribió archivos. Salida: `diagnóstico sintético positivo/negativo: salida, rutas y llamadas al docker falso coinciden`; `exit 0`. No se ejecutó Docker real ni se usaron datos de proyectos.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 44.7 s, `exit 0`. Salida: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`. La receta ejecutó `./verify` y las dos simulaciones de `bash ./instalar.sh --simular` en aislamiento Bubblewrap contra las capturas de línea base.
