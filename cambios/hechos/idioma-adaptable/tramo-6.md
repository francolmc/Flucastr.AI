# Tramo 6 — Consulta de uso

## Pasos

### Tramo 6 — Historia: consultar uso con opciones inglesas

Como persona que consulta el uso quiero comandos y opciones ingleses con los mismos resultados existentes para que el kit sea reutilizable.

Dependencias: ninguna funcional; se ejecuta después del tramo 5. Node disponible.

Contratos a conservar: salida española y JSON existente, cálculo, filtros, errores, códigos y `scripts/uso.mjs`; pruebas con datos sintéticos y directorios temporales, sin leer historiales reales.

Rutas susceptibles de cambio: se agrega `scripts/usage.mjs`; se conservan `scripts/uso.mjs` y las rutas de fixtures.

Ejemplo concreto del resultado esperado: `node scripts/usage.mjs --since 2026-01-01 --sessions` equivale a `node scripts/uso.mjs --desde 2026-01-01 --sesiones` sobre los mismos datos aislados.

Alcance: `scripts/uso.mjs`, `scripts/usage.mjs` y `pruebas/uso/`.

Archivos: scripts/uso.mjs, scripts/usage.mjs

CUANDO se consultan datos de uso con opciones inglesas ENTONCES filtros, resultados, errores y formato coinciden con los alias españoles (A6).

Aceptación:
- A6: comparar `--since`, `--tool`, `--project`, `--sessions`, `--threshold`, `--rates` y sus equivalentes españoles con fixtures no vacíos, mezcla de idiomas, valores inválidos o ausentes y JSON; esperar mismo estado y resultado. `./verify` pasa.

TODO:
- [x] Añadir a `scripts/uso.mjs` los alias ingleses del índice (A6). Comprobación: comparar cada par con fixtures; esperar mismos filtros y errores.
- [x] Crear `scripts/usage.mjs` delegando con argumentos y código de salida intactos (A6). Comprobación: ejecutar ambos puntos con fixtures y ruta con espacios; esperar resultados iguales.
- [x] Ampliar `pruebas/uso/probar.mjs` con casos equivalentes, errores y sensibilidad (A6). Comprobación: `node pruebas/uso/probar.mjs`; esperar éxito y detección de un alias retirado temporalmente.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A6.

Handoff: no acceder a sesiones reales; mantener el contrato JSON exactamente igual y registrar la prueba de sensibilidad.

## Evidencia

- `node pruebas/uso/probar.mjs`: 20 de 20 pruebas pasaron fuera del sandbox; incluye equivalencia, errores, rutas con espacios y mutación del alias. Dentro del sandbox los procesos hijos fallaron con EPERM.
- `./verify`: terminó con `VERIFY OK`, exit 0.

## Notas
