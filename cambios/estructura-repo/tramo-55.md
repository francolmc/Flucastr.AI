# Tramo 55 — Separar construcción del comando (borrador)

## Pasos

### Tramo 55 — Historia: Separar construcción del comando
Como mantenedor quiero separar construcción del comando para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 54 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/commands.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/commands.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar construcción del comando conserva los resultados originales (A55).
Aceptación A55: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/kit-run.mjs`, Extraer `comando` inyectando funciones de perfiles cuando sean necesarias; preservar reemplazos KIT_RUN, argumentos, sandbox, schema, esfuerzo y rechazo actual de herramientas sin mapear. (A55). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Comparar argv y entorno de constructor y revisor para Codex y sustitutos Claude/Pi, incluido error sin sustituto. (A55). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A55). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A55). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
