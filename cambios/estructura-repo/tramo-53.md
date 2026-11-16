# Tramo 53 — Separar prompts de ejecución y revisión (borrador)

## Pasos

### Tramo 53 — Historia: Separar prompts de ejecución y revisión
Como mantenedor quiero separar prompts de ejecución y revisión para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 52 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/prompts.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/prompts.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar prompts de ejecución y revisión conserva los resultados originales (A53).
Aceptación A53: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/kit-run.mjs`, Extraer `promptConstructor`, `promptRevisor`, `claveFalloVerificacion` y `cola` con su constante, conservando cadenas, longitud, espacios y serialización. (A53). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Comparar bytes de stdin y de las notas para reintento, diff y verificación fallida. (A53). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A53). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A53). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
