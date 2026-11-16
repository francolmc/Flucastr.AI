# Tramo 54 — Separar resolución de perfiles y política (borrador)

## Pasos

### Tramo 54 — Historia: Separar resolución de perfiles y política
Como mantenedor quiero separar resolución de perfiles y política para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 53 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/profiles.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/profiles.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar resolución de perfiles y política conserva los resultados originales (A54).
Aceptación A54: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/kit-run.mjs`, Extraer `resolverAgente`, `resolverRevisorKit`, `etiquetaRevisor` y `comprobarPoliticaClaude` mediante factoría que recibe explícitamente la raíz calculada por el entrypoint; conservar rutas, entorno y errores. (A54). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Comparar perfiles y fallo de política Claude en fixtures desde la raíz y desde otro cwd; no invocar herramientas reales. (A54). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A54). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A54). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
