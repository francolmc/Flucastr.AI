# Tramo 52 — Separar esquema y validación del veredicto (borrador)

## Pasos

### Tramo 52 — Historia: Separar esquema y validación del veredicto
Como mantenedor quiero separar esquema y validación del veredicto para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 51 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/verdict.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/verdict.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar esquema y validación del veredicto conserva los resultados originales (A52).
Aceptación A52: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/kit-run.mjs`, Extraer `ESQUEMA_VEREDICTO` y `validarVeredicto` sin sustituir la validación manual ni cambiar sus errores o reglas. (A52). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Comparar JSON inválido, claves extra, defectos mal formados y los tres veredictos con la matriz del tramo 48. (A52). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A52). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A52). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `$ node --check scripts/kit-run.mjs && node --check tools/run/verdict.mjs && git diff --check -- scripts/kit-run.mjs tools/run/verdict.mjs`: sin salida, exit 0. El diff muestra importación del módulo nuevo y extracción literal de esquema y función; la validación manual se conserva.
- `$ node cambios/estructura-repo/capturar-kit-run.mjs && cmp /tmp/kit-run-tramo52-base.jsonl cambios/estructura-repo/kit-run-matriz.jsonl`: `captured 8 synthetic scenarios; .../kit-run-matriz.jsonl`, cmp sin diferencias, exit 0.
- `$ node --input-type=module` con referencia manual y casos sintéticos: `veredicto manual: 8 casos coinciden con referencia; esquema idéntico`, exit 0. Incluye JSON inválido, claves extra, defectos mal formados, APROBADO/DEVUELTO/PAUSA y sus reglas de consistencia.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `verify coincide salvo el mensaje exacto autorizado del escenario 9.` `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, exit 0 (45.2 s).
