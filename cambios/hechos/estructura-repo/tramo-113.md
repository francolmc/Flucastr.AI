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
- [x] Crear `skills/diagnosticar/fingerprint.mjs` con las funciones y dependencias estrictamente necesarias; no cambiar todavía `diagnosticar.mjs` (A113). Comprobación: verificar recorrido esperado de árbol vacío, archivos, exclusiones y enlaces; comparar huellas con el cálculo independiente de `pruebas/diagnostico-sugiere/huella.test.mjs` en repositorios sintéticos con y sin HEAD.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A113). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además las pruebas del módulo y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: antes del cambio `$ node --test pruebas/diagnostico-sugiere/huella.test.mjs`: 2/2 pruebas previas pasaron (`exit 0`). Se añadió `skills/diagnosticar/fingerprint.mjs` con las funciones `recorrer` y `huellaActual` y solo sus dependencias Node; `diagnosticar.mjs` y ambos entrypoints quedaron intactos. El cálculo independiente se comparte desde `pruebas/diagnostico-sugiere/huella-reference.mjs`; las pruebas nuevas de importación sin salida/ejecución, recorrido (árbol vacío, archivos, exclusiones, enlaces) y huella con/sin HEAD están en `tools/verify/fingerprint-module.test.mjs`, fuera del glob de línea base. Suite anterior: 2/2; pruebas del módulo: 3/3; `exit 0`.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 41.4 s con `exit 0`. En Bubblewrap, `./verify` aislado coincidió con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos ejecuciones aisladas de `bash ./instalar.sh --simular` fueron repetibles y coincidieron con sus referencias. Después de separar las pruebas nuevas, el glob original de diagnóstico conserva su salida 2/2. Sintaxis, pruebas dirigidas y `git diff --check` pasaron.
