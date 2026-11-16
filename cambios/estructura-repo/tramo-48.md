# Tramo 48 — Caracterizar kit run (borrador)

## Pasos

Casos y capturas obligatorios: [matrices de caracterización](matrices.md).

### Tramo 48 — Historia: Caracterizar kit run
Como mantenedor quiero caracterizar kit run para mantener el recorrido real de `kit run` sin alterar su comportamiento.
Dependencias: tramo 47 revisado; Node y aislamiento del tramo 1. Contratos: conservar el entrypoint `scripts/kit-run.mjs`, su raíz calculada allí, interfaz, secuencia, argumentos, salidas, códigos y efectos; no usar modelos, proyectos reales ni secretos. Ejemplo: un ejecutable sustituto recibe el mismo prompt y produce el mismo estado del plan que antes.
Alcance: ninguno; pruebas y evidencia de caracterización; pruebas pertinentes y evidencia.
Archivos: ninguno; pruebas y evidencia de caracterización.
CUANDO se ejecute `kit run` en los escenarios caracterizados ENTONCES caracterizar kit run conserva los resultados originales (A48).
Aceptación A48: la responsabilidad indicada queda aislada o caracterizada; la matriz del tramo 48 coincide en código, stdout, stderr, procesos y archivos; no se debilitan pruebas existentes.
TODO:
- [ ] En `scripts/kit-run.mjs`, Capturar en fixtures aislados los flujos de `pruebas/kit-run/probar.mjs`, aceptación, opciones inválidas, constructor y revisor sustitutos, fallo de verificación, reintentos, timeout y rechazo de escritura del revisor. Registrar códigos, stdout, stderr, argumentos, cwd, stdin y contenido final del plan; ejecutar sin modelos ni proyectos reales. (A48). Comprobación: revisar diff y registrar contratos y rutas.
- [ ] En `cambios/estructura-repo/tramo-48.md`, Ejecutar `node --test pruebas/aceptacion/kit-run.test.mjs` y comparar dos capturas reproducibles; registrar cualquier variación no controlada. (A48). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A48). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A48). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
