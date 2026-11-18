# Tramo 49 — Separar lectura y edición del plan (borrador)

## Pasos

### Tramo 49 — Historia: Separar lectura y edición del plan
Como mantenedor quiero separar lectura y edición del plan para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 48 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/plan.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/plan.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar lectura y edición del plan conserva los resultados originales (A49).
Aceptación A49: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/kit-run.mjs`, Extraer `frontmatter`, `fijarEstado`, `anotarNotas`, `progreso` y `comandoVerificacion`; mantener sus expresiones, orden de escritura y contenido byte a byte; importar desde el entrypoint. (A49). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Comparar plan aprobado, no aprobado, sin sección, casillas, estado y notas con la matriz del tramo 48. (A49). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A49). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A49). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `scripts/kit-run.mjs` importa las cinco funciones desde `tools/run/plan.mjs`; sus implementaciones fueron trasladadas sin cambiar expresiones, orden de escritura ni contenido. `node --check scripts/kit-run.mjs`, `node --check tools/run/plan.mjs` y `git diff --check -- scripts/kit-run.mjs tools/run/plan.mjs` terminaron con código 0.
- Prueba sintética con `node --input-type=module`: frontmatter aprobado/no aprobado/sin encabezado, verificación presente/ausente, casillas raíz, actualización de estado y anexado de notas; todas las aserciones pasaron. La matriz generada por `node cambios/estructura-repo/capturar-kit-run.mjs` conservó sus 8 escenarios byte a byte (`cmp /tmp/kit-run-tramo49-base.jsonl cambios/estructura-repo/kit-run-matriz.jsonl`, código 0). `node --test pruebas/aceptacion/kit-run.test.mjs`: 1/1 pasó; `node pruebas/kit-run/probar.mjs`: 20 casos pasaron.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 46.7 s. `./verify` coincide salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones son repetibles y coinciden con la línea base, aplicando solo esa excepción exacta.
