# Tramo 96 — Caracterizar desinstalación (borrador)

## Pasos

### Tramo 96 — Historia: Caracterizar desinstalación
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 95 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: desinstalar.sh; pruebas y evidencias pertinentes.
Archivos: sin cambios de producto.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A96).
Aceptación A96: La matriz contiene casos positivos y negativos y nunca usa HOME o proyectos reales. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Capturar salidas, códigos y árbol resultante para manifiesto ausente, instalación repo y copia, --simular, --todo, --proyecto, --conservar-ajustes y rutas ajenas; incluir errores y reinstalación. (A96). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-96.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-96.md` y las pruebas negativas afectadas con fixtures aislados (A96). Comprobación: La matriz contiene casos positivos y negativos y nunca usa HOME o proyectos reales.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A96). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `$ bash -n cambios/estructura-repo/capturar-desinstalacion.sh`; `$ bash cambios/estructura-repo/capturar-desinstalacion.sh cambios/estructura-repo/tramo-96-captura.txt` (código 0); captura repetida en raíz sintética estable comparada con `cmp` (código 0). 18 casos: 16 positivos y 2 errores con código 1; árbol incluye modo, SHA-256 y bytes; stdout/stderr, argumentos y códigos. Captura completa en `tramo-96-captura.txt` (SHA-256 `86a7dbc97dff2a998c9d58ea6dca234991e60a99b5b6f2a115e2e89e03b52c6d`). Los únicos errores son opción desconocida y `--proyecto` sin carpeta; la ruta ajena se omite porque carece de marca de archivo generado. La reinstalación termina con la misma configuración; `--conservar-ajustes` conserva ambos JSON de configuración del proyecto. El harness usa HOME y proyectos sintéticos, normaliza rutas del repo/fixture en texto y mantiene íntegros los hashes.
- Paso 2: `$ node --test --test-name-pattern='instalar, reinstalar y desinstalar' pruebas/permisos-v2.test.mjs`: 1/1 integración positiva, 0 fallos, código 0 (3.2 s); crea HOME y proyecto temporales y confirma reinstalación idempotente, retiro de reglas del kit y conservación de ajustes ajenos. La matriz del paso 1 contiene 16 salidas exitosas, opción desconocida y argumento `--proyecto` ausente (ambos código 1), además del rechazo inocuo de ruta ajena sin marca generada.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 42.5 s. En Bubblewrap, `./verify` coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; dos `bash ./instalar.sh --simular` son repetibles y coinciden con la línea base. La receta usa HOME sintético y copia aislada.
