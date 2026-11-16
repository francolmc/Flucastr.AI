# Tramo 50 — Separar ejecución de procesos (borrador)

## Pasos

### Tramo 50 — Historia: Separar ejecución de procesos
Como mantenedor quiero separar ejecución de procesos para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 49 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: `scripts/kit-run.mjs` y `tools/run/process.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/kit-run.mjs` y `tools/run/process.mjs`.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES separar ejecución de procesos conserva los resultados originales (A50).
Aceptación A50: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/kit-run.mjs`, Extraer `correr` y `topeMs` junto con sus constantes necesarias; preservar spawnSync, ambiente heredado, entrada, shell, maxBuffer, timeout, null y errores. (A50). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Comparar ejecutables sustitutos con éxito, salida, fallo y expiración en la matriz del tramo 48. (A50). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A50). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A50). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
