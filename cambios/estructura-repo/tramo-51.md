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
- [ ] En `scripts/kit-run.mjs`, Extraer `huellaArbol` conservando exactamente comandos Git, orden, rutas, lectura de archivos y resultado null sin Git; no ampliar ni reducir exclusiones. (A51). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Comparar árboles sintéticos limpios, modificados y sin Git; comprobar detección de escritura del revisor. (A51). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A51). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A51). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
