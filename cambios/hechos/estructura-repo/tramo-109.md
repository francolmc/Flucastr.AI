# Tramo 109 — Separar informe del observador (borrador)

## Pasos

### Tramo 109 — Historia: Separar informe del observador
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 108 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/observar.mjs y tools/observe/report.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/observar.mjs, tools/observe/report.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A109).
Aceptación A109: Los informes de fixtures comparan iguales byte por byte. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer informe y auxiliares puros requeridos; pasar dependencias explícitas y conservar formato, orden y tratamiento de datos faltantes. (A109). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-109.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-109.md` y las pruebas negativas afectadas con fixtures aislados (A109). Comprobación: Los informes de fixtures comparan iguales byte por byte.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A109). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `crearInforme` y sus formateadores se trasladaron a `tools/observe/report.mjs`; `leerJsonl`, `join` y los nombres de archivo se pasan explícitamente. `duracionS` se exporta porque el sondeo de build existente también la usa. El diff de `scripts/observar.mjs` solo cambia la importación y delega el bloque del informe. `node --check` en ambos módulos y `git diff --check` pasaron. Salida de referencia del fixture: código 0, stderr vacío, SHA-256 de stdout `1c3a8b25d4987defda9a16bae63b96c2dbd918e454ac28a4330e24072915e4c2`, igual al valor anterior a la extracción.
- Paso 2: matriz aislada `tools/verify/docker-observer.sh` pasó desde harness temporal: informe contra `LEEME.txt`, copia sin OOM, datos faltantes, errores de fecha inválida y opción desconocida con código/mensaje preservados, y ciclo start/status/segundo start/stop con Docker falso. Captura de informe fixture mantiene SHA-256 anterior idéntico; `exit 0`.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: terminó en 46.4 s. `./verify` aislado coincide con la línea base salvo el mensaje exacto aprobado del escenario 9; dos simulaciones coinciden entre sí y con línea base aplicando solo esa excepción.
