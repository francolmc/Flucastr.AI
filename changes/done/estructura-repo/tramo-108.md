# Tramo 108 — Caracterizar observador (borrador)

## Pasos

### Tramo 108 — Historia: Caracterizar observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 107 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A108).
Aceptación A108: La matriz compara códigos, salida y efectos sin levantar servicios reales ni consultar sesiones personales. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Cubrir iniciar, estado, detener, informe, datos faltantes y errores con fixtures de Docker y HOME temporal; registrar procesos iniciados y asegurar su cierre. (A108). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-108.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-108.md` y las pruebas negativas afectadas con fixtures aislados (A108). Comprobación: La matriz compara códigos, salida y efectos sin levantar servicios reales ni consultar sesiones personales.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A108). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: se amplió `scripts/fixtures-observador/bin/docker` para registrar los PID de sus invocaciones y, solo si se activa `OBSERVER_FIXTURE_HOLD_EVENTS`, mantener el proceso `events` vivo hasta que el observador lo detenga. `tools/verify/docker-observer.sh` usa HOME, `free` y directorio de datos temporales; prueba informe, inicio, estado, segundo inicio, detención, datos ausentes y opciones/fecha inválidas con códigos y mensajes exactos. Comprobación del diff confirma que las modificaciones se limitan al fixture de Docker y al comprobador de esta responsabilidad; `scripts/observar.mjs` no cambió.
- Paso 2: la matriz ejecutada por `./verify` comparó el informe con `LEEME.txt`, conservó el control negativo sin OOM, comprobó salidas de informe vacío y errores (código 2), además del ciclo y ausencia de procesos fixture vivos tras `stop`. Todo corrió con fixtures; sin Docker real ni sesiones personales.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0 en 60.1 s. Ejecutó `./verify` y dos `bash ./instalar.sh --simular` en Bubblewrap: verify coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las simulaciones son repetibles y coinciden con la línea base. Sin diferencias adicionales.
- Archivos del tramo: `scripts/fixtures-observador/bin/docker`, `tools/verify/docker-observer.sh`, este documento y `cambios/estructura-repo/plan.md`. No se modificó lógica de producto ni pruebas de aceptación. No se accedió a secretos, sesiones o proyectos reales, `old/v1/registro/` ni `pruebas/.temporales/`; sin commit.
