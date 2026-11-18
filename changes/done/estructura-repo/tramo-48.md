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
- [x] En `scripts/kit-run.mjs`, Capturar en fixtures aislados los flujos de `pruebas/kit-run/probar.mjs`, aceptación, opciones inválidas, constructor y revisor sustitutos, fallo de verificación, reintentos, timeout y rechazo de escritura del revisor. Registrar códigos, stdout, stderr, argumentos, cwd, stdin y contenido final del plan; ejecutar sin modelos ni proyectos reales. (A48). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Ejecutar `node --test pruebas/aceptacion/kit-run.test.mjs` y comparar dos capturas reproducibles; registrar cualquier variación no controlada. (A48). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A48). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A48). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `$ node --check cambios/estructura-repo/capturar-kit-run.mjs && node cambios/estructura-repo/capturar-kit-run.mjs`: sintaxis válida; arnés captura ocho escenarios sintéticos (aprobación, constructor fallido, verify fallido, revisor devuelve y reintenta, timeout, intento de escritura del revisor, plan inválido y opción inválida). Registra código, stdout/stderr, invocaciones con args/cwd/stdin y árbol final; fake processes heredan solo PATH, HOME sintético, LANG, TZ y variables KIT_RUN explícitas. No consulta modelos ni proyectos reales.
- `$ node --test pruebas/aceptacion/kit-run.test.mjs`: 1 prueba pasó, 0 fallaron, código 0. Dos capturas posteriores a la normalización de rutas temporales fueron idénticas byte por byte (`cmp`, código 0), con los ocho casos.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0. Dentro de Bubblewrap, `./verify` coincidió con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos ejecuciones de `bash ./instalar.sh --simular` coincidieron entre sí y con la línea base, aplicando solo esa excepción autorizada.
- Tramo 54: fixtures sintéticos de `tools/run/profiles.mjs` contrastaron argumentos, rutas bajo la raíz del kit, ejecución desde un `cwd` diferente, entorno heredado, perfil y etiqueta, y errores de resolución/política Claude; no se invocaron herramientas reales. La matriz de ocho escenarios volvió a capturarse y coincidió byte por byte con la referencia (`cmp`, SHA-256 `ad037ecc589be5e2e5c62ff358015a28ec70a79e509c1151169ccbaa8ac104e4`); código 0.
- Tramo 55: fixture sintético de `tools/run/commands.mjs` comparó argv de constructor y revisor para Codex, además de sustitutos Claude/Pi seleccionados por `KIT_RUN_CONSTRUCTOR`/`KIT_RUN_REVISOR`; verificó los entornos declarados, los argumentos, sandbox, modelo/esfuerzo y schema, y el error por rol cuando falta sustituto. Ninguna herramienta real fue ejecutada. `node cambios/estructura-repo/capturar-kit-run.mjs` conserva idéntica la matriz de ocho escenarios del tramo 48 (SHA-256 `ad037ecc589be5e2e5c62ff358015a28ec70a79e509c1151169ccbaa8ac104e4`), `exit 0`.
