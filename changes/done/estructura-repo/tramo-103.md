# Tramo 103 — Separar cálculo de tarifas (borrador)

## Pasos

### Tramo 103 — Historia: Separar cálculo de tarifas
Como mantenedor quiero aislar esta responsabilidad para mantener el comportamiento previo.
Dependencias: tramo 102 revisado; aislamiento y referencia del tramo 1; matriz específica previa de esta familia y compatibilidad del tramo 82 cuando aplique. Contratos: mantener entradas antiguas, orden, mensajes, códigos, efectos, pruebas negativas y formatos; no usar HOME ni proyectos reales. Parar ante dependencia o consumidor no previsto. Ejemplo: ejecutar el caso representativo de la matriz antes y después produce la misma salida y efectos.
Alcance: scripts/uso.mjs y tools/usage/rates.mjs; pruebas y evidencias pertinentes.
Archivos: scripts/uso.mjs, tools/usage/rates.mjs.
CUANDO se ejecuten los casos del alcance ENTONCES se preserva el resultado de referencia (A103).
Aceptación A103: Tarifas existentes, ausentes e inválidas producen iguales créditos y avisos. Ninguna prueba de aceptación se debilita; las diferencias autorizadas se registran.
TODO:
- [x] Extraer cargarTarifas y creditosSesion; mantener la ruta de tarifas predeterminada calculada desde scripts/uso.mjs y pasarla explícitamente. (A103). Comprobación: inspeccionar el diff de `cambios/estructura-repo/tramo-103.md` y confirmar que solo aborda esta responsabilidad.
- [x] Ejecutar la matriz de la familia en `cambios/estructura-repo/tramo-103.md` y las pruebas negativas afectadas con fixtures aislados (A103). Comprobación: Tarifas existentes, ausentes e inválidas producen iguales créditos y avisos.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A103). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias; detenerse para revisión.

## Evidencia
- Paso 1: `cargarTarifas` y `creditosSesion` se trasladaron sin cambios de cuerpo a `tools/usage/rates.mjs` como exports; `scripts/uso.mjs` las importa. La ruta por defecto sigue calculándose con `dirname(fileURLToPath(import.meta.url))` en `scripts/uso.mjs` y se pasa a `cargarTarifas(o.tarifas, ctx.avisos)`. `node --check` en ambos módulos y `git diff --check` pasaron. La inspección confirmó que los cambios de producto de este paso se limitan a esta extracción e imports.
- Paso 2: `node pruebas/uso/probar.mjs` pasó 19/19 antes y después de extraer. A5a/A5b comprobaron tarifas existentes y créditos; A5c confirmó `null` sin tarifa para el modelo; A5d confirmó aviso y créditos `null` ante archivo ausente. Una prueba adicional con fixture temporal de JSON inválido confirmó código 0, aviso de lectura y créditos `null`. No se cambió ni debilitó ninguna aserción.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 48.0 s; `./verify` coincide salvo el mensaje exacto autorizado del escenario 9, y dos simulaciones de instalación son repetibles y coinciden con la línea base aplicando solo esa excepción.
