# Tramo 8 — Opciones de kit run

## Pasos

### Tramo 8 — Historia: invocar kit run con opciones inglesas

Como persona que ejecuta un plan quiero usar opciones inglesas sin cambiar el protocolo de ejecución para que el kit sea reutilizable.

Dependencias: Tramo 2, que establece los prompts y pruebas de reintentos de kit run.

Contratos a conservar: `--herramienta`, `--raiz`, salidas `COMPLETADO` y `PAUSA`, mensajes en español, validación, límites de reintento, revisión y verificación. Las pruebas usan ejecutores falsos aislados.

Rutas susceptibles de cambio: `scripts/kit-run.mjs` y `pruebas/kit-run/probar.mjs` conservan su ubicación.

Ejemplo concreto del resultado esperado: `node scripts/kit-run.mjs plan.md --tool codex --root '/tmp/mi repo'` selecciona las mismas opciones que los alias españoles.

Alcance: `scripts/kit-run.mjs` y pruebas `pruebas/kit-run/probar.mjs`.

Archivos: scripts/kit-run.mjs

CUANDO se usa `--tool` o `--root` ENTONCES el recorrido conserva resultados y errores de los alias españoles (A8).

Aceptación:
- A8: comparar ambos pares y opciones mezcladas con constructor y revisor simulados, incluidos argumentos ausentes y raíz con espacios; esperar mismos estados, invocaciones y mensajes; `./verify` pasa.

TODO:
- [x] Añadir alias `--tool` y `--root` a `scripts/kit-run.mjs` (A8). Comprobación: comparar invocaciones con simuladores; esperar equivalencia.
- [x] Ampliar `pruebas/kit-run/probar.mjs` con equivalencia, errores y sensibilidad (A8). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar éxito y fallo cuando se desactiva un alias temporalmente.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A8.

Handoff: mantener protocolos y pruebas de reintento previos; no invocar agentes o servicios reales.

## Evidencia
- `node pruebas/kit-run/probar.mjs`: 24 casos pasaron, incluidos alias, mezclas, raíz con espacios, argumentos ausentes y mutación negativa; constructor y revisor simulados.
- `./verify`: exit 0, `VERIFY OK`; la autoprueba offline OpenSpec se omitió por ausencia de su carpeta, como declara el proyecto.
- La prueba dentro del sandbox quedó detenida con `EPERM`; ambas verificaciones pasaron fuera del sandbox.

## Notas
- Revisión independiente: A8 cumplido; alias, mezclas, errores y raíz con espacios equivalentes con ejecutores simulados; prueba negativa sensible. `./verify`: exit 0, VERIFY OK. Veredicto: APROBADO; se habilita el tramo 9.
