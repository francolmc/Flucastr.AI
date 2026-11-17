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
- [x] En `scripts/kit-run.mjs`, Extraer `resolverAgente`, `resolverRevisorKit`, `etiquetaRevisor` y `comprobarPoliticaClaude` mediante factoría que recibe explícitamente la raíz calculada por el entrypoint; conservar rutas, entorno y errores. (A54). Comprobación: revisar diff y registrar contratos y rutas.
- [x] En `cambios/estructura-repo/tramo-48.md`, Comparar perfiles y fallo de política Claude en fixtures desde la raíz y desde otro cwd; no invocar herramientas reales. (A54). Comprobación: registrar resultados y esperar equivalencia con referencia del tramo 48.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A54). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A54). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `$ node --check scripts/kit-run.mjs && node --check tools/run/profiles.mjs && git diff --check -- scripts/kit-run.mjs tools/run/profiles.mjs`: sintaxis y whitespace correctos; `exit 0`.
- `$ node --input-type=module` con fixtures sintéticos de `resolver.mjs` y `permisos-hook.mjs`: se comprobaron rutas bajo la raíz inyectada, argumentos originales, `cwd` distinto, entorno heredado, parseo de perfil, etiqueta, salida y mensajes exactos de error para perfil y política. No se invocaron herramientas reales; `exit 0`.
- `$ node cambios/estructura-repo/capturar-kit-run.mjs && cmp /tmp/kit-run-tramo54-base.jsonl cambios/estructura-repo/kit-run-matriz.jsonl`: ocho escenarios sintéticos; matrices idénticas byte por byte, SHA-256 `ad037ecc589be5e2e5c62ff358015a28ec70a79e509c1151169ccbaa8ac104e4`; `exit 0`.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó `./verify` aislado, que coincide salvo el mensaje exacto autorizado del escenario 9; `exit 0` (45.0 s).
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó dos simulaciones aisladas, repetibles e iguales a la línea base; aplica únicamente la excepción aprobada del escenario 9; `exit 0` (misma corrida, 45.0 s).
- Punto de control tramo 54: producto tocado en `scripts/kit-run.mjs` y nuevo `tools/run/profiles.mjs`; evidencia en `tramo-54.md`, `tramo-48.md` y este índice. Se extrajeron los cuatro resolutores mediante factoría con raíz explícita, conservando argumentos, entorno heredado, rutas y errores. La matriz de ocho escenarios coincide con su referencia byte por byte. `node --check`, fixtures sintéticos, matriz y receta aislada (verify más dos simulaciones) pasaron; no se invocaron herramientas reales ni se accedió a secretos, proyectos reales o áreas excluidas. Detener para revisión.
