# Tramo 51 — Separar huella del árbol (borrador)

## Pasos

### Tramo 51 — Historia: Separar huella del árbol
Como mantenedor quiero separar huella del árbol para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 50 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/tree-fingerprint.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/tree-fingerprint.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar huella del árbol conserva los resultados originales (A51).
Aceptación A51: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/kit-run.mjs`, Extraer `huellaArbol` conservando exactamente comandos Git, orden, rutas, lectura de archivos y resultado null sin Git; no ampliar ni reducir exclusiones. (A51). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Comparar árboles sintéticos limpios, modificados y sin Git; comprobar detección de escritura del revisor. (A51). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A51). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A51). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `scripts/kit-run.mjs` importa `huellaArbol` desde `tools/run/tree-fingerprint.mjs`. La implementación conserva comandos y orden de Git, maxBuffer, rutas y lectura de los archivos listados, y devuelve null si `rev-parse` falla. `node --check` para ambos módulos y `git diff --check` terminaron con código 0.
- `$ node --input-type=module` con Git sustituto sintético: árboles limpios y modificados produjeron los SHA-256 esperados; sin Git se obtuvo `null`; salida `huella sintética limpia/modificada/sin Git: OK`, código 0. `$ node cambios/estructura-repo/capturar-kit-run.mjs && cmp /tmp/kit-run-tramo51-base.jsonl cambios/estructura-repo/kit-run-matriz.jsonl`: 8 escenarios idénticos byte a byte, incluida la detección de escritura del revisor; código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0 en 44.3 s. `verify coincide salvo el mensaje exacto autorizado del escenario 9.` Las simulaciones son repetibles y coinciden con `linea-base/`, con solo la excepción exacta aprobada del escenario 9.
