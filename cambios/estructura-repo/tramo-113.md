# Tramo 113 — Preparar módulo de huella de diagnóstico (borrador)

## Pasos

### Tramo 113 — Historia: preparar el módulo sin conectarlo
Como mantenedor quiero preparar la separación de la huella para conservar las skills instaladas.
Dependencias: tramo 112 revisado y matriz de diagnóstico. Contratos: este módulo todavía no es importado; su ruta es interna a la skill para funcionar en instalaciones por copia. Ejemplo: importar el módulo en un fixture temporal no ejecuta el diagnóstico.
Alcance: crear `skills/diagnosticar/fingerprint.mjs` y pruebas; los dos entrypoints permanecen intactos.
Archivos: `skills/diagnosticar/fingerprint.mjs`.
CUANDO se llame el módulo con un fixture ENTONCES la huella coincide con la implementación original (A113).
Aceptación A113: `recorrer` y `huellaActual` y sus dependencias locales se copian sin cambiar lógica y se exportan; no hay efectos al importar; se conservan las pruebas anteriores. El entrypoint existente no exporta estas funciones: no asumir que se puede importarlas de él para compararlas directamente.
TODO:
- [ ] Crear `skills/diagnosticar/fingerprint.mjs` con las funciones y dependencias estrictamente necesarias; no cambiar todavía `diagnosticar.mjs` (A113). Comprobación: verificar recorrido esperado de árbol vacío, archivos, exclusiones y enlaces; comparar huellas con el cálculo independiente de `pruebas/diagnostico-sugiere/huella.test.mjs` en repositorios sintéticos con y sin HEAD.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A113). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además las pruebas del módulo y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
